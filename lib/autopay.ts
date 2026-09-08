/**
 * Recurring weekly billing through Razorpay Subscriptions.
 *
 * This is a different Razorpay product from the one-time plans. Those use the
 * Orders API: one order, one payment, one grant. A subscription instead binds
 * a *mandate* — UPI Autopay, a card e-mandate or e-NACH — and Razorpay debits
 * it on a schedule without anyone being present.
 *
 * The design keeps the blast radius small: `expires_at` on the subscriptions
 * row stays the single access gate that every premium check in the app reads.
 * Each `subscription.charged` webhook pushes it seven days further out.
 * Nothing else in the codebase has to learn that recurring billing exists.
 *
 * What is genuinely new is that money now moves with nobody watching, so the
 * webhook is load-bearing rather than a backstop. If it stops working people
 * are debited and get nothing.
 */
import Razorpay from 'razorpay';
import { razorpayClient, supabaseAdminClient } from '@/lib/subscriptionGrant';
import { PLANS } from '@/lib/plans';

/** The only plan sold on a mandate. Created once; the id lives in env. */
export const AUTOPAY_PLAN_ID = 'weekly' as const;
export const AUTOPAY_AMOUNT_PAISE = PLANS.weekly.amountPaise;

/**
 * How many weekly cycles the mandate authorises. Razorpay has no "until
 * cancelled" — a finite count is required — and it shows the resulting end
 * date on its own checkout sheet.
 *
 * This was 156, meaning three years, on the reasoning that a longer mandate
 * is fewer re-authorisations. But Razorpay renders that as "will charge Rs 99
 * every week until 1 Sep 2029", which reads as a three-year, Rs 15,444
 * commitment at the exact moment someone is deciding whether to spend Rs 99.
 *
 * 52 ends a week after the Mains it is bought for, so the sheet reads as one
 * exam cycle. Anyone still subscribed when it completes is handled: the
 * subscription.completed webhook clears auto_renew and they keep the days
 * already paid for, then re-subscribe.
 */
const TOTAL_COUNT = 52;

export function razorpayPlanId(): string {
  const id = process.env.RAZORPAY_WEEKLY_PLAN_ID;
  if (!id) throw new Error('RAZORPAY_WEEKLY_PLAN_ID is not set');
  return id;
}

/**
 * Creates a Razorpay subscription for this user, or returns the one they
 * already have pending authorisation.
 *
 * Deliberately does NOT grant access. Access is granted when Razorpay reports
 * the first charge, not when the mandate is created, because a mandate can be
 * authorised and then fail to debit.
 */
export async function createAutopaySubscription(opts: {
  uid: string;
  email: string | null;
}): Promise<{ subscriptionId: string; shortUrl: string | null }> {
  const rzp = razorpayClient() as Razorpay;

  const sub = await rzp.subscriptions.create({
    plan_id: razorpayPlanId(),
    total_count: TOTAL_COUNT,
    quantity: 1,
    customer_notify: 1,
    // Read back by the webhook to decide whose access to extend. Notes are
    // written under our own key and are not client-reachable.
    notes: { firebase_uid: opts.uid, email: opts.email ?? '', plan: AUTOPAY_PLAN_ID },
  } as Parameters<Razorpay['subscriptions']['create']>[0]);

  // Recorded before anything can go wrong with it. Someone who opens the
  // sheet and never authorises leaves no trace in Razorpay's order list, and
  // this is the row that says who they were.
  await supabaseAdminClient().from('autopay_attempts').upsert(
    {
      razorpay_subscription_id: sub.id,
      firebase_uid: opts.uid,
      email: opts.email,
      status: 'started',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'razorpay_subscription_id' }
  );

  return { subscriptionId: sub.id, shortUrl: (sub as { short_url?: string }).short_url ?? null };
}

/**
 * Moves an attempt to its next state. Never throws: this is a record of what
 * happened, and losing it must not fail the webhook that grants access.
 */
export async function recordAttempt(
  subscriptionId: string,
  status: 'active' | 'failed' | 'cancelled' | 'completed',
  opts: { uid?: string; email?: string | null; charged?: boolean } = {}
): Promise<void> {
  try {
    const db = supabaseAdminClient();
    const now = new Date().toISOString();

    const patch: Record<string, unknown> = { status, updated_at: now };
    if (opts.charged) {
      const { data: prior } = await db
        .from('autopay_attempts')
        .select('charge_count, first_charged_at')
        .eq('razorpay_subscription_id', subscriptionId)
        .maybeSingle();
      patch.last_charged_at = now;
      patch.first_charged_at = prior?.first_charged_at ?? now;
      patch.charge_count = (prior?.charge_count ?? 0) + 1;
    }

    // Upsert rather than update: a subscription authorised before this table
    // existed, or one whose create-time write failed, still gets recorded.
    await db.from('autopay_attempts').upsert(
      {
        razorpay_subscription_id: subscriptionId,
        firebase_uid: opts.uid ?? 'unknown',
        email: opts.email ?? null,
        ...patch,
      },
      { onConflict: 'razorpay_subscription_id' }
    );
  } catch (e) {
    console.warn('[autopay] could not record attempt:', (e as Error).message);
  }
}

/**
 * Stops future debits. Leaves `expires_at` untouched: the person keeps the
 * days they have already paid for, which is what "cancel" has to mean when
 * billing runs a week ahead of use.
 */
export async function cancelAutopaySubscription(uid: string): Promise<
  { ok: true; expiresAt: string | null } | { ok: false; error: string }
> {
  const db = supabaseAdminClient();

  const { data: row } = await db
    .from('subscriptions')
    .select('razorpay_subscription_id, expires_at')
    .eq('firebase_uid', uid)
    .eq('auto_renew', true)
    .maybeSingle();

  if (!row?.razorpay_subscription_id) return { ok: false, error: 'No active autopay subscription' };

  try {
    // cancel_at_cycle_end = 0: stop now. The access already paid for is not
    // clawed back, because expires_at is left where it is.
    await (razorpayClient() as Razorpay).subscriptions.cancel(row.razorpay_subscription_id, false);
  } catch (e) {
    const msg = (e as { error?: { description?: string } })?.error?.description ?? 'Cancel failed';
    // Already cancelled at Razorpay is not an error for us: fall through and
    // make our own state agree with theirs.
    if (!/cancel/i.test(msg)) return { ok: false, error: msg };
  }

  await db
    .from('subscriptions')
    .update({ auto_renew: false, cancelled_at: new Date().toISOString() })
    .eq('firebase_uid', uid)
    .eq('razorpay_subscription_id', row.razorpay_subscription_id);

  return { ok: true, expiresAt: row.expires_at ?? null };
}
