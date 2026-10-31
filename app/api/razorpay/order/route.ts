import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import Razorpay from "razorpay";
import { planChargeNow, toPlanId } from "@/lib/plans";
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

  // The weekly plan is withdrawn. It was only ever sold as a mandate, and a
  // one-time order for it would otherwise still be accepted here.
  if (reqBody.plan === 'weekly') {
    return NextResponse.json({ error: 'plan_withdrawn', message: 'The weekly plan is no longer offered.' }, { status: 410 });
  }

  // An unrecognised plan falls back to the most expensive one rather than the
  // cheapest, so a malformed request can never underbill.
  const plan = toPlanId(reqBody.plan);
  // The sale price while an offer runs. Its id goes in the notes, so the
  // grant accepts the lower amount even if the payment lands after it ends.
  const { amountPaise: amount, offer } = planChargeNow(plan);

  // These notes are the only trustworthy record of who this order is for and
  // what they selected — /api/razorpay/verify reads the plan back from here
  // rather than from the browser. They are written under our own key and are
  // not client-reachable.
  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt:  `ho_${user.uid.slice(0, 8)}_${Date.now()}`,
    notes: { user_id: user.uid, email: user.email ?? "", plan, ...(offer ? { offer: offer.id } : {}) },
  });

  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
}
