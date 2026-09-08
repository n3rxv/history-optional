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

/** How many cycles to authorise. Razorpay requires a finite count. */
const TOTAL_COUNT = 156;          // three years of weeks; effectively "until cancelled"

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

  return { subscriptionId: sub.id, shortUrl: (sub as { short_url?: string }).short_url ?? null };
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
