import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import { getSlotInfo } from "@/lib/slots";
import Razorpay from "razorpay";
import { planAmountPaise, toPlanId } from "@/lib/plans";

export async function POST(req: NextRequest) {
  const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Same source as /api/slots. This used to read
  // subscription_slots.subscribers, a stored counter nothing ever wrote, so
  // the two routes reported different numbers of remaining slots.
  const { slots: remaining } = await getSlotInfo();
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

  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, slots: remaining });
}
