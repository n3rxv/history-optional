import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { adminAuth } from "@/lib/firebaseAdmin";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let firebaseUser: { uid: string; email?: string };
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    firebaseUser = { uid: decoded.uid, email: decoded.email };
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  const body        = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");
  if (expectedSig !== razorpay_signature)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const captureRes = await fetch(
    `https://api.razorpay.com/v1/payments/${razorpay_payment_id}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64"),
      },
      body: JSON.stringify({ amount: 9900, currency: "INR" }),
    }
  );
  if (!captureRes.ok) {
    const err = await captureRes.json();
    console.error("[topper-verify] capture failed:", err);
  }

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { error: dbErr } = await supabase.from("topper_subscriptions").upsert(
    {
      firebase_uid:        firebaseUser.uid,
      email:               firebaseUser.email ?? "",
      razorpay_payment_id,
      razorpay_order_id,
      expires_at:          expiresAt.toISOString(),
      created_at:          new Date().toISOString(),
    },
    { onConflict: "firebase_uid" }
  );

  if (dbErr) {
    console.error("[topper-verify] DB error:", dbErr);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, expiresAt: expiresAt.toISOString() });
}
