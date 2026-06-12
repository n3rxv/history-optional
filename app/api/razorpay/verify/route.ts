import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
  const db = createServerClient();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, fingerprint, plan } = await req.json();

  // Verify signature
  const body        = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSig !== razorpay_signature)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });



  // Extend or start subscription
  const { data: existingSub } = await supabaseAdmin
    .from("subscriptions")
    .select("expires_at")
    .eq("user_id", user.id)
    .single();

  const base = existingSub?.expires_at && new Date(existingSub.expires_at) > new Date()
    ? new Date(existingSub.expires_at) : new Date();
  const expiresAt = new Date(base);
  const activePlan = plan || "yearly";

  // Auto-capture payment
  const captureRes = await fetch(
    `https://api.razorpay.com/v1/payments/${razorpay_payment_id}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString("base64"),
      },
      body: JSON.stringify({
        amount: activePlan === "daily"   ? 4900
              : activePlan === "weekly"  ? 29900
              : activePlan === "monthly" ? 99900
              : 599900,
        currency: "INR"
      }),
    }
  );
  if (!captureRes.ok) {
    const captureErr = await captureRes.json();
    console.error("Capture failed:", captureErr);
  }
  if (activePlan === "daily")        expiresAt.setDate(expiresAt.getDate() + 1);
  else if (activePlan === "weekly")  expiresAt.setDate(expiresAt.getDate() + 7);
  else if (activePlan === "monthly") expiresAt.setMonth(expiresAt.getMonth() + 1);
  else                               expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const { error: upsertErr } = await supabaseAdmin
    .from("subscriptions")
    .upsert({
      user_id: user.id, email: user.email,
      status: "active", plan: activePlan,
      razorpay_order_id, razorpay_payment_id,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (upsertErr) return NextResponse.json({ error: "DB error" }, { status: 500 });



  // Reset fingerprint usage limits if provided
  if (fingerprint) {
    await supabaseAdmin
      .from("usage_tracking")
      .update({ eval_count: 0, chat_count: 0 })
      .eq("fingerprint", fingerprint);
  }

  return NextResponse.json({ ok: true, expiresAt: expiresAt.toISOString() });
}
