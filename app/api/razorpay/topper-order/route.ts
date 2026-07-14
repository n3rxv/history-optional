import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const order = await razorpay.orders.create({
      amount: 9900,
      currency: "INR",
      receipt: `tp_${user.uid.slice(0, 20)}_${Date.now().toString().slice(-8)}`,
    });
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err: any) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json({ error: err?.message || "Order creation failed" }, { status: 500 });
  }
}
