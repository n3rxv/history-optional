import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const db = createServerClient();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get slot count to determine price
  const { data: slotData } = await supabaseAdmin
    .from("subscription_slots")
    .select("subscribers, max_slots")
    .eq("id", 1)
    .single();

  const remaining = slotData ? Math.max(0, slotData.max_slots - slotData.subscribers) : 45;
  const amount = remaining > 0 ? 199900 : 999900; // ₹1999 or ₹9999

  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt:  `ho_${user.id.slice(0, 8)}_${Date.now()}`,
    notes: { user_id: user.id, email: user.email ?? "", plan: "yearly" },
  });

  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, slots: remaining });
}
