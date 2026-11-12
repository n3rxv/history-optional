import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import Razorpay from "razorpay";
import { planChargeNow, toPlanId } from "@/lib/plans";
import { createServerClient } from "@/lib/supabase";
import { FREE_BALANCE_CAP_PAISE, REFERRAL_PLAN, REFERRAL_REWARD_PAISE } from "@/lib/referral";
import { friendDiscountFor, referralBalance } from "@/lib/referralServer";

export async function POST(req: NextRequest) {
  const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reqBody = await req.json().catch(() => ({}));

  // An unrecognised plan falls back to the most expensive one rather than the
  // cheapest, so a malformed request can never underbill.
  const plan = toPlanId(reqBody.plan);
  // The sale price while an offer runs. Its id goes in the notes, so the
  // grant accepts the lower amount even if the payment lands after it ends.
  const { amountPaise: price, offer } = planChargeNow(plan);

  // A yearly order can come down twice: ₹100 off for a friend's first yearly
  // plan through someone's link, and the reader's own invite balance unless
  // they switched it off. Both are worked out here from the database, never
  // taken from the request, and written into the notes, which the grant checks.
  let friend: { code: string; paise: number } | null = null;
  let balanceSpend = 0;
  if (plan === REFERRAL_PLAN) {
    const db = createServerClient();
    friend = await friendDiscountFor(db, user.uid, reqBody.ref);
    if (reqBody.useBalance !== false) {
      const balance = await referralBalance(db, user.uid);
      balanceSpend = Math.max(0, Math.min(balance, price - (friend?.paise ?? 0)));
    }
  }
  const amount = price - (friend?.paise ?? 0) - balanceSpend;

  // The balance covers it all: nothing to charge, so no Razorpay order. The
  // plan is granted here, in one transaction with taking the money out.
  if (amount === 0) {
    const db = createServerClient();
    const orderId = `bal_${crypto.randomUUID()}`;
    const { data: granted, error: grantErr } = await db.rpc("grant_plan_from_balance", {
      p_uid: user.uid,
      p_email: user.email ?? "",
      p_plan: plan,
      p_spend_paise: balanceSpend,
      p_friend_discount_paise: friend?.paise ?? 0,
      p_order_id: orderId,
    });
    if (grantErr || granted?.result !== "granted") {
      console.error("[razorpay/order] balance grant failed:", grantErr?.message ?? granted?.result);
      return NextResponse.json({ message: "Your balance changed. Refresh the page and try again." }, { status: 409 });
    }
    if (friend) {
      const { error: refErr } = await db.rpc("credit_referral", {
        p_code: friend.code,
        p_order_id: orderId,
        p_buyer_uid: user.uid,
        p_reward_paise: REFERRAL_REWARD_PAISE,
        p_free_cap_paise: FREE_BALANCE_CAP_PAISE,
      });
      if (refErr) console.error("[razorpay/order] referral credit failed:", refErr.message);
    }
    return NextResponse.json({ granted: true, plan, expiresAt: granted.expires_at });
  }

  // These notes are the only trustworthy record of who this order is for and
  // what they selected — /api/razorpay/verify reads the plan back from here
  // rather than from the browser. They are written under our own key and are
  // not client-reachable.
  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt:  `ho_${user.uid.slice(0, 8)}_${Date.now()}`,
    notes: {
      user_id: user.uid,
      email: user.email ?? "",
      plan,
      ...(offer ? { offer: offer.id } : {}),
      ...(friend ? { ref: friend.code, friend_discount: String(friend.paise) } : {}),
      ...(balanceSpend > 0 ? { balance_spend: String(balanceSpend) } : {}),
    },
  });

  return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
}
