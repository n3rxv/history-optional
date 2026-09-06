import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import { claimPayment, TOPPER_AMOUNT_PAISE } from "@/lib/paymentClaim";

/**
 * Grants a year of topper-copy access for a completed ₹365 payment.
 *
 * This previously granted on a valid signature alone. A signature is a static
 * value the browser already holds, so replaying the same request re-upserted a
 * fresh one-year expiry every time — the same hole 10327ad closed for
 * subscriptions, left open here. It also never checked that the order belonged
 * to the caller or that ₹365 had actually been paid.
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

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    await req.json().catch(() => ({}));

  if (
    typeof razorpay_order_id !== "string" ||
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_signature !== "string"
  ) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
  }

  // Proves the order/payment pair came from Razorpay. It says nothing about
  // who bought it or for how much — claimPayment reads that from the order.
  if (!signatureMatches(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const claim = await claimPayment({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    expectedUid: user.uid,
    kind: "topper",
    expectedAmountPaise: TOPPER_AMOUNT_PAISE,
  });

  if (!claim.ok) {
    return NextResponse.json({ error: claim.error }, { status: claim.status });
  }

  // A replay. Access already exists; do not extend it by another year.
  if (claim.status === "already_applied") {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );

  // A genuine second purchase extends from the current expiry; replays never
  // reach here, so extending is safe.
  const { data: existing } = await supabase
    .from("topper_subscriptions")
    .select("expires_at")
    .eq("firebase_uid", user.uid)
    .maybeSingle();

  const now = new Date();
  const base =
    existing?.expires_at && new Date(existing.expires_at) > now
      ? new Date(existing.expires_at)
      : now;
  const expiresAt = new Date(base);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const { error } = await supabase.from("topper_subscriptions").upsert(
    {
      firebase_uid: user.uid,
      email: user.email ?? "",
      razorpay_order_id,
      razorpay_payment_id,
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: "firebase_uid" }
  );

  if (error) {
    await claim.release();
    console.error("[topper-verify] upsert failed:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, expiresAt: expiresAt.toISOString() });
}
