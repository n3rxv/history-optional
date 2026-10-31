import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import { MAP_AMOUNT_PAISE } from "@/lib/paymentClaim";
import Razorpay from "razorpay";
import { claudeReadsPdf } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // The check reads the whole PDF, which DeepSeek, standing in for Claude
  // (lib/claude.ts), cannot. Stop before taking any money.
  if (!claudeReadsPdf()) {
    return NextResponse.json(
      { error: "Map checks are paused for a few days, so nothing has been charged. Please try again soon." },
      { status: 503 }
    );
  }

  const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const order = await razorpay.orders.create({
    amount:   MAP_AMOUNT_PAISE,
    currency: "INR",
    receipt:  `map_${user.uid.slice(0, 8)}_${Date.now()}`,
    notes:    { user_id: user.uid, email: user.email ?? "", kind: "map" },
  });

  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
}
