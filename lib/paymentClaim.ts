import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';

/**
 * Claims a one-off Razorpay payment exactly once.
 *
 * The subscription flow got this in 10327ad; the two one-off products did not.
 * `topper-verify` re-upserted a fresh one-year expiry on every replay, and
 * `map-verify` re-ran a Claude Sonnet call over a whole PDF — so replaying a
 * single ₹49 signature cost real money each time.
 *
 * Same shape as lib/subscriptionGrant: read what was bought from the order
 * rather than the request body, claim the payment in `payment_events` BEFORE
 * doing anything, and release the claim if the work then fails.
 *
 * NOTE: lib/subscriptionGrant still has its own copy of this logic. It is
 * verified against a real payment in production, so it was left alone rather
 * than refactored in the same change. Migrating it onto this function is the
 * remaining half of the job.
 */

export const TOPPER_AMOUNT_PAISE = 36500;
export const MAP_AMOUNT_PAISE = 4900;

export type ClaimResult =
  | { ok: true; status: 'claimed'; uid: string; release: () => Promise<void> }
  | { ok: true; status: 'already_applied'; uid: string }
  | { ok: false; status: number; error: string };

function db(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );
}

function razorpayClient(): Razorpay {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

export async function claimPayment(opts: {
  orderId: string;
  paymentId: string;
  /** The signed-in caller. The order's notes must name the same person. */
  expectedUid: string;
  /** Distinguishes this payment's purpose in the ledger. */
  kind: 'topper' | 'map';
  expectedAmountPaise: number;
}): Promise<ClaimResult> {
  const { orderId, paymentId, expectedUid, kind, expectedAmountPaise } = opts;
  const log = (msg: string, ...rest: unknown[]) =>
    console.error(`[claim:${kind}] ${paymentId} ${msg}`, ...rest);

  const razorpay = razorpayClient();
  const supabase = db();

  // ── What was actually bought ────────────────────────────────────────────
  let order;
  try {
    order = await razorpay.orders.fetch(orderId);
  } catch (err) {
    log('order fetch failed:', err);
    return { ok: false, status: 502, error: 'Could not verify order' };
  }

  const notes = (order.notes ?? {}) as Record<string, unknown>;
  if (String(notes.user_id ?? '') !== expectedUid) {
    log(`order belongs to ${notes.user_id}, presented by ${expectedUid}`);
    return { ok: false, status: 403, error: 'Order does not belong to this account' };
  }

  const orderAmount = Number(order.amount);
  if (orderAmount !== expectedAmountPaise) {
    log(`amount ${orderAmount} != expected ${expectedAmountPaise}`);
    return { ok: false, status: 400, error: 'Order amount does not match' };
  }

  // ── Claim before doing anything ─────────────────────────────────────────
  const { error: claimErr } = await supabase.from('payment_events').insert({
    payment_id: paymentId,
    order_id: orderId,
    firebase_uid: expectedUid,
    kind,
    // The ledger's plan column is NOT NULL; for one-off products the kind is
    // the whole description.
    plan: kind,
    amount_paise: orderAmount,
  });

  if (claimErr) {
    if (claimErr.code === '23505') {
      return { ok: true, status: 'already_applied', uid: expectedUid };
    }
    log('ledger insert failed:', claimErr);
    return { ok: false, status: 500, error: 'DB error' };
  }

  const release = async () => {
    await supabase.from('payment_events').delete().eq('payment_id', paymentId);
  };

  // ── Confirm the money ───────────────────────────────────────────────────
  try {
    try {
      await razorpay.payments.capture(paymentId, orderAmount, 'INR');
    } catch {
      // Expected when Razorpay auto-capture already ran; the status check below
      // is what decides.
    }

    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.order_id !== orderId) {
      await release();
      return { ok: false, status: 400, error: 'Payment does not match order' };
    }
    if (payment.status !== 'captured') {
      await release();
      log(`status is ${payment.status}, not captured`);
      return { ok: false, status: 402, error: 'Payment not captured' };
    }
    if (Number(payment.amount) !== orderAmount) {
      await release();
      return { ok: false, status: 400, error: 'Payment amount does not match order' };
    }
  } catch (err) {
    await release();
    log('capture check failed:', err);
    return { ok: false, status: 500, error: 'Verification failed' };
  }

  return { ok: true, status: 'claimed', uid: expectedUid, release };
}
