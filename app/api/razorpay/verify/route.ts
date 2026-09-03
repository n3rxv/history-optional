import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import crypto from "crypto";
import { applySubscriptionPayment } from "@/lib/subscriptionGrant";

/**
 * The browser reporting a payment it just completed.
 *
 * This is the fast path only. /api/razorpay/webhook grants the same payment
 * independently, so a user who closes the tab before this fires still gets
 * what they paid for. Both funnel into applySubscriptionPayment, and the
 * payment_events ledger makes whichever arrives second a no-op.
 */

function signatureMatches(orderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  if (expected.length !== signature.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, fingerprint } =
    await req.json().catch(() => ({}));

  if (
    typeof razorpay_order_id !== "string" ||
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_signature !== "string"
  ) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
  }

  // Proves the order/payment pair came from Razorpay. It says nothing about
  // what was bought — applySubscriptionPayment reads that from the order.
  if (!signatureMatches(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const result = await applySubscriptionPayment({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    expectedUid: uid,
    fingerprint: typeof fingerprint === "string" ? fingerprint : null,
    source: "verify",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (result.status === "ignored") {
    return NextResponse.json({ error: "Not a subscription order" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    plan: result.plan,
    expiresAt: result.expiresAt,
    ...(result.status === "already_applied" ? { alreadyProcessed: true } : {}),
  });
}
