import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { applySubscriptionPayment, supabaseAdminClient } from "@/lib/subscriptionGrant";
import { addPlanDuration } from "@/lib/plans";

export const maxDuration = 30;
// The signature covers the exact bytes Razorpay sent. Anything that re-encodes
// the body before we hash it breaks verification, so this route must stay
// dynamic and read the raw text itself.
export const dynamic = "force-dynamic";

/**
 * Razorpay's own report that a payment happened.
 *
 * Before this route existed, a subscription was only created if the browser
 * survived long enough to call /api/razorpay/verify. Closing the tab on the
 * payment screen meant money captured and no access granted — a support
 * ticket, and eventually a chargeback. Razorpay retries this endpoint for
 * hours, so it is the path that actually guarantees delivery.
 *
 * Contract with Razorpay:
 *   - 2xx means "handled, stop retrying". Return it for events we grant AND
 *     for events we deliberately ignore, or they are redelivered forever.
 *   - non-2xx means "retry later". Reserve it for a bad signature and for
 *     genuinely transient failures.
 *
 * Setup: Razorpay Dashboard → Settings → Webhooks → add
 *   URL:    https://historyoptional.xyz/api/razorpay/webhook
 *   Events: payment.captured, subscription.charged, subscription.cancelled,
 *           subscription.halted, subscription.completed
 *   Secret: must equal RAZORPAY_WEBHOOK_SECRET
 *
 * The subscription events are not optional the way payment.captured is. A
 * one-time payment is also confirmed by /api/razorpay/verify with the buyer
 * sitting there; a weekly autopay debit happens with nobody present, so if
 * this endpoint stops working people are charged and get nothing.
 */

const PAYMENT_EVENTS = new Set(["payment.captured"]);
const SUBSCRIPTION_EVENTS = new Set([
  "subscription.charged",    // money moved: extend access
  "subscription.cancelled",  // stop future debits
  "subscription.halted",     // retries exhausted; stop future debits
  "subscription.completed",  // ran to total_count; stop future debits
]);

function signatureMatches(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

type RazorpayEvent = {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string } };
    subscription?: {
      entity?: {
        id?: string;
        status?: string;
        current_end?: number;
        notes?: { firebase_uid?: string; email?: string };
      };
    };
  };
};

/**
 * A weekly autopay event.
 *
 * `subscription.charged` is the one that grants: it means Razorpay actually
 * debited the mandate. Access is extended by pushing `expires_at` seven days
 * past whichever is later, now or the current expiry, so a charge that
 * arrives early never shortens access and one that arrives late never
 * silently swallows the gap.
 *
 * The other three all mean the same thing operationally: no more money is
 * coming, so stop promising more time. None of them revoke the days already
 * paid for.
 */
async function handleSubscriptionEvent(eventName: string, event: RazorpayEvent) {
  const entity = event.payload?.subscription?.entity;
  const subscriptionId = entity?.id;
  const uid = entity?.notes?.firebase_uid;

  if (!subscriptionId || !uid) {
    // Not one of ours: every subscription we create carries firebase_uid in
    // notes, written under our own key.
    return NextResponse.json({ ok: true, ignored: "subscription without owner" });
  }

  const db = supabaseAdminClient();

  if (eventName !== "subscription.charged") {
    const { error } = await db
      .from("subscriptions")
      .update({ auto_renew: false, cancelled_at: new Date().toISOString() })
      .eq("razorpay_subscription_id", subscriptionId);
    if (error) {
      console.error(`[razorpay/webhook] ${eventName} update failed:`, error.message);
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.log(`[razorpay/webhook] ${eventName}: autopay stopped for ${uid}`);
    return NextResponse.json({ ok: true, status: eventName });
  }

  const { data: existing } = await db
    .from("subscriptions")
    .select("expires_at")
    .eq("firebase_uid", uid)
    .maybeSingle();

  const now = new Date();
  const base =
    existing?.expires_at && new Date(existing.expires_at) > now
      ? new Date(existing.expires_at)
      : now;
  const expiresAt = addPlanDuration(base, "weekly");

  const { error } = await db.from("subscriptions").upsert(
    {
      firebase_uid: uid,
      email: entity?.notes?.email ?? null,
      plan: "weekly",
      status: "active",
      auto_renew: true,
      cancelled_at: null,
      razorpay_subscription_id: subscriptionId,
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: "firebase_uid" }
  );

  if (error) {
    // 5xx asks Razorpay to retry. Money has already moved, so failing to
    // record it is the one case that must not be acknowledged.
    console.error("[razorpay/webhook] subscription.charged upsert failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  console.log(`[razorpay/webhook] weekly charge granted to ${uid} until ${expiresAt.toISOString()}`);
  return NextResponse.json({ ok: true, status: "charged", expiresAt: expiresAt.toISOString() });
}

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    // Failing closed: without the secret we cannot tell a real event from a
    // forged one, and granting on a forged one hands out free subscriptions.
    console.error("[razorpay/webhook] RAZORPAY_WEBHOOK_SECRET is not set — rejecting");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Raw bytes, before any JSON parsing — the signature is over these.
  const rawBody = await req.text();

  if (!signatureMatches(rawBody, signature, secret)) {
    console.error("[razorpay/webhook] signature mismatch — dropping event");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: RazorpayEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    // Signed but unparseable. Retrying will not help.
    console.error("[razorpay/webhook] signed body was not valid JSON");
    return NextResponse.json({ ok: true, ignored: "unparseable" });
  }

  const eventName = event.event ?? "";

  if (SUBSCRIPTION_EVENTS.has(eventName)) {
    return handleSubscriptionEvent(eventName, event);
  }

  if (!PAYMENT_EVENTS.has(eventName)) {
    // Acknowledged so Razorpay stops retrying an event we have no use for.
    return NextResponse.json({ ok: true, ignored: eventName || "unnamed" });
  }

  const entity = event.payload?.payment?.entity;
  const paymentId = entity?.id;
  const orderId = entity?.order_id;

  if (!paymentId || !orderId) {
    // A payment with no order is not one of ours — we only create order-backed
    // payments. Nothing to do, and retrying will not change that.
    return NextResponse.json({ ok: true, ignored: "payment without order" });
  }

  // No expectedUid: there is no signed-in user on this path. The order's notes
  // name the owner, and we wrote those ourselves under our own key.
  const result = await applySubscriptionPayment({
    orderId,
    paymentId,
    source: "webhook",
  });

  if (!result.ok) {
    // 5xx from us asks Razorpay to retry, which is right for a database blip
    // or a Razorpay API timeout. A 4xx here means the event is permanently
    // unprocessable, so acknowledge it rather than collect retries forever.
    if (result.status >= 500) {
      return NextResponse.json({ error: result.error }, { status: 503 });
    }
    console.error(`[razorpay/webhook] ${paymentId} permanently rejected: ${result.error}`);
    return NextResponse.json({ ok: true, rejected: result.error });
  }

  if (result.status === "granted") {
    console.log(`[razorpay/webhook] granted ${result.plan} to ${result.uid} until ${result.expiresAt}`);
  }

  return NextResponse.json({ ok: true, status: result.status });
}
