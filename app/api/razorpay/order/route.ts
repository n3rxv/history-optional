import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import Razorpay from "razorpay";
import { planAmountPaise, toPlanId } from "@/lib/plans";
import { supabaseAdminClient } from "@/lib/subscriptionGrant";

export async function POST(req: NextRequest) {
  const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // A one-time plan bought on top of a live weekly mandate pushes expires_at
  // months out while the mandate carries on debiting Rs 99 every seven days,
  // and the charge webhook then extends from that far-future date. Cancel
  // first. The pricing page disables these buttons for the same reason; this
  // is the half that actually enforces it.
  const db = supabaseAdminClient();
  const { data: mandate } = await db
    .from("subscriptions")
    .select("expires_at")
    .eq("firebase_uid", user.uid)
    .eq("status", "active")
    .eq("auto_renew", true)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (mandate) {
    return NextResponse.json(
      {
        error: "autopay_active",
        message:
          "You are on the weekly subscription. Cancel it from your profile menu, and one-time plans open up once your paid days run out.",
      },
      { status: 409 }
    );
  }

  const reqBody = await req.json().catch(() => ({}));

  // An unrecognised plan falls back to the most expensive one rather than the
  // cheapest, so a malformed request can never underbill.
  const plan = toPlanId(reqBody.plan);
  const amount = planAmountPaise(plan);

  // These notes are the only trustworthy record of who this order is for and
  // what they selected — /api/razorpay/verify reads the plan back from here
  // rather than from the browser. They are written under our own key and are
  // not client-reachable.
  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt:  `ho_${user.uid.slice(0, 8)}_${Date.now()}`,
    notes: { user_id: user.uid, email: user.email ?? "", plan },
  });

  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
}
