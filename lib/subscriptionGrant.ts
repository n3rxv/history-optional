import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";
import { addPlanDuration, isPlanId, orderAmountOk, planAmountPaise, type PlanId } from "@/lib/plans";
import { isRefCode, isReferralPlan, REFERRED_DAYS, REFERRER_DAYS } from "@/lib/referral";

/**
 * The one place a Razorpay payment turns into subscription access.
 *
 * Two callers reach it, and they must not drift apart:
 *   - /api/razorpay/verify — the browser reporting a payment it just made
 *   - /api/razorpay/webhook — Razorpay reporting the same payment
 *
 * Whichever arrives first wins; the second is recognised by the payment_events
 * ledger and becomes a no-op. That is the whole point of having both: the
 * browser path is fast, and the webhook path is the one that still runs when
 * the user closes the tab on the payment screen.
 *
 * Nothing here trusts a caller-supplied plan or amount. Both are read from the
 * order as Razorpay holds it, using notes that /api/razorpay/order wrote under
 * our own key.
 */

export type GrantResult =
  | { ok: true; status: "granted"; uid: string; plan: PlanId; expiresAt: string }
  | { ok: true; status: "already_applied"; uid: string; plan: PlanId; expiresAt: string | null }
  | { ok: true; status: "ignored"; reason: string }
  | { ok: false; status: number; error: string };

export function razorpayClient(): Razorpay {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

export function supabaseAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function applySubscriptionPayment(opts: {
  orderId: string;
  paymentId: string;
  /**
   * Present on the browser path, where we know who is asking. The order's
   * notes must name the same uid, or someone is redeeming a payment that is
   * not theirs. Absent on the webhook path, where the order's notes are the
   * only statement of ownership — and are trustworthy, since we wrote them.
   */
  expectedUid?: string;
  /** Reset the free-tier counters for this device after a successful grant. */
  fingerprint?: string | null;
  source: "verify" | "webhook";
}): Promise<GrantResult> {
  const { orderId, paymentId, expectedUid, fingerprint, source } = opts;
  const log = (msg: string, ...rest: unknown[]) =>
    console.error(`[grant:${source}] ${paymentId} ${msg}`, ...rest);

  const razorpay = razorpayClient();
  const db = supabaseAdminClient();

  // ── What was actually bought ────────────────────────────────────────────
  let order;
  try {
    order = await razorpay.orders.fetch(orderId);
  } catch (err) {
    log("order fetch failed:", err);
    return { ok: false, status: 502, error: "Could not verify order" };
  }

  const notes = (order.notes ?? {}) as Record<string, unknown>;
  const uid = String(notes.user_id ?? "");
  const email = notes.email ? String(notes.email) : null;

  if (!uid) {
    // Orders from /topper-order and /map-order do not carry a plan. They are
    // not subscriptions and are not this function's business.
    return { ok: true, status: "ignored", reason: "order has no user_id in notes" };
  }

  if (expectedUid && uid !== expectedUid) {
    log(`order belongs to ${uid}, presented by ${expectedUid}`);
    return { ok: false, status: 403, error: "Order does not belong to this account" };
  }

  if (!isPlanId(notes.plan)) {
    return { ok: true, status: "ignored", reason: `not a subscription order (plan=${String(notes.plan)})` };
  }
  const plan: PlanId = notes.plan;

  // The list price, or the sale price of the offer the order route wrote in
  // the notes, which holds after the offer ends for an order made during it.
  const orderAmount = Number(order.amount);
  if (!orderAmountOk(plan, orderAmount, notes.offer)) {
    log(`order amount ${orderAmount} != ${plan} price ${planAmountPaise(plan)} (offer ${String(notes.offer ?? "none")})`);
    return { ok: false, status: 400, error: "Order amount does not match plan" };
  }

  // ── Claim ───────────────────────────────────────────────────────────────
  // Before any state change, so neither a replayed verify nor a redelivered
  // webhook can reach the code that extends expires_at.
  const { error: claimErr } = await db.from("payment_events").insert({
    payment_id: paymentId,
    order_id: orderId,
    firebase_uid: uid,
    email,
    kind: "subscription",
    plan,
    amount_paise: orderAmount,
  });

  if (claimErr) {
    if (claimErr.code === "23505") {
      const { data: existing } = await db
        .from("subscriptions")
        .select("expires_at, plan")
        .eq("firebase_uid", uid)
        .maybeSingle();
      return {
        ok: true,
        status: "already_applied",
        uid,
        plan: (isPlanId(existing?.plan) ? existing.plan : plan),
        expiresAt: existing?.expires_at ?? null,
      };
    }
    log("ledger insert failed:", claimErr);
    return { ok: false, status: 500, error: "DB error" };
  }

  const releaseClaim = async () => {
    await db.from("payment_events").delete().eq("payment_id", paymentId);
  };

  try {
    // ── Confirm the money ─────────────────────────────────────────────────
    // Capture at the order's amount, never at an amount a caller supplied.
    // Razorpay auto-capture makes this call redundant and it errors; the
    // status check below is what actually decides.
    try {
      await razorpay.payments.capture(paymentId, orderAmount, "INR");
    } catch {
      // Expected when already captured. Fall through to the authoritative read.
    }

    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.order_id !== orderId) {
      await releaseClaim();
      return { ok: false, status: 400, error: "Payment does not match order" };
    }
    if (payment.status !== "captured") {
      await releaseClaim();
      log(`payment status is ${payment.status}, not captured`);
      return { ok: false, status: 402, error: "Payment not captured" };
    }
    if (Number(payment.amount) !== orderAmount) {
      await releaseClaim();
      return { ok: false, status: 400, error: "Payment amount does not match order" };
    }

    // ── Grant ─────────────────────────────────────────────────────────────
    // A genuine second purchase extends from the current expiry. Replays and
    // redeliveries never reach here, so extending is safe.
    const { data: existingSub } = await db
      .from("subscriptions")
      .select("expires_at, razorpay_payment_id")
      .eq("firebase_uid", uid)
      .maybeSingle();

    // Read before the upsert below overwrites the row. A referral pays out
    // only on a first purchase: none on the row (which predates the ledger
    // for older readers) and none in the ledger besides this one.
    let firstPurchase = false;
    if (isRefCode(notes.ref) && isReferralPlan(plan) && !existingSub?.razorpay_payment_id) {
      const { count } = await db
        .from("payment_events")
        .select("payment_id", { count: "exact", head: true })
        .eq("firebase_uid", uid)
        .neq("payment_id", paymentId);
      firstPurchase = count === 0;
    }

    const now = new Date();
    const base =
      existingSub?.expires_at && new Date(existingSub.expires_at) > now
        ? new Date(existingSub.expires_at)
        : now;
    let expiresAt = addPlanDuration(base, plan);

    const { error: upsertErr } = await db.from("subscriptions").upsert(
      {
        firebase_uid: uid,
        email,
        status: "active",
        plan,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        expires_at: expiresAt.toISOString(),
        created_at: now.toISOString(),
      },
      { onConflict: "firebase_uid" }
    );

    if (upsertErr) {
      await releaseClaim();
      log("subscription upsert failed:", upsertErr);
      return { ok: false, status: 500, error: "DB error" };
    }

    // Never fails the grant: the reader has paid for their plan whatever
    // happens to the invite bonus.
    if (firstPurchase) {
      const { data: ref, error: refErr } = await db.rpc("apply_referral", {
        p_code: String(notes.ref),
        p_order_id: orderId,
        p_buyer_uid: uid,
        p_plan: plan,
        p_referrer_days: REFERRER_DAYS,
        p_referred_days: REFERRED_DAYS,
      });
      if (refErr) log("referral failed:", refErr);
      else if (ref?.result === "applied" && ref.expires_at) expiresAt = new Date(ref.expires_at);
      else log(`referral not applied: ${ref?.result}`);
    }

    await db
      .from("payment_events")
      .update({ expires_at: expiresAt.toISOString() })
      .eq("payment_id", paymentId);

    if (fingerprint) {
      await db
        .from("usage_tracking")
        .update({ eval_count: 0, chat_count: 0 })
        .eq("fingerprint", fingerprint);
    }

    return { ok: true, status: "granted", uid, plan, expiresAt: expiresAt.toISOString() };
  } catch (err) {
    await releaseClaim();
    log("unexpected failure:", err);
    return { ok: false, status: 500, error: "Verification failed" };
  }
}
