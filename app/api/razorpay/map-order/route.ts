import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const order = await razorpay.orders.create({
    amount:   4900, // ₹49 in paise
    currency: "INR",
    receipt:  `map_${user.uid.slice(0, 8)}_${Date.now()}`,
    notes:    { user_id: user.uid, email: user.email ?? "", type: "map_eval" },
  });

  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
}
