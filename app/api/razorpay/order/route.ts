import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await razorpay.orders.create({
    amount:   99900,       // ₹999 in paise
    currency: "INR",
    receipt:  `ho_${user.id.slice(0, 8)}_${Date.now()}`,
    notes: {
      user_id: user.id,
      email:   user.email ?? "",
      plan:    "yearly",
    },
  });

  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
}
