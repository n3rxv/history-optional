import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  // Verify signature
  const body        = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const { error: upsertErr } = await db
    .from("subscriptions")
    .upsert({
      user_id:            user.id,
      email:              user.email,
      status:             "active",
      plan:               "yearly",
      razorpay_order_id,
      razorpay_payment_id,
      expires_at:         expiresAt.toISOString(),
      created_at:         new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (upsertErr) {
    console.error("Subscription upsert error:", upsertErr);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, expiresAt: expiresAt.toISOString() });
}
