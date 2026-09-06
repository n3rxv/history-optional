import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import { TOPPER_AMOUNT_PAISE } from "@/lib/paymentClaim";

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
    // notes are written under our own key and are the only trustworthy record
    // of who this order is for. Without them topper-verify had nothing to
    // check a presented payment against.
    const order = await razorpay.orders.create({
      amount: TOPPER_AMOUNT_PAISE,
      currency: "INR",
      receipt: `tp_${user.uid.slice(0, 20)}_${Date.now().toString().slice(-8)}`,
      notes: { user_id: user.uid, email: user.email ?? "", kind: "topper" },
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
