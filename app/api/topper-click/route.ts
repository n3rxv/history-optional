import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";
import { consumeUsage } from "@/lib/usageQuota";

const FREE_TOPPER_CLICKS = 5;

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // Entitlement checks run in parallel; neither mutates anything.
  const [{ data: sub }, { data: topperSub }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status, expires_at")
      .eq("firebase_uid", user.uid)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("topper_subscriptions")
      .select("expires_at")
      .eq("firebase_uid", user.uid)
      .maybeSingle(),
  ]);

  if (sub && new Date(sub.expires_at) > new Date()) {
    return NextResponse.json({ allowed: true, clicks: 0, isPremium: true });
  }

  if (topperSub && new Date(topperSub.expires_at) > new Date()) {
    return NextResponse.json({ allowed: true, clicks: 0, hasTopperAccess: true });
  }

  // Free preview. Previously this read the count, compared it, then issued an
  // .update() -- which matched no rows at all for a user who had never been
  // written to usage_tracking, so their counter never moved and the five free
  // previews were unlimited. consume_usage creates the row when it is missing
  // and does the compare-and-increment in one statement.
  const fingerprint = req.headers.get("x-fingerprint") ?? "";
  const { allowed, used } = await consumeUsage(
    user.uid,
    fingerprint || null,
    "topper_clicks",
    FREE_TOPPER_CLICKS
  );

  return NextResponse.json({ allowed, clicks: used });
}
