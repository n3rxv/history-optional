/**
 * Recurring weekly billing through Razorpay Subscriptions.
 *
 * The weekly plan is no longer sold: no new mandate is created. What is left
 * here serves the mandates bought before it was withdrawn, which renew until
 * the reader cancels or the 52 cycles run out.
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
