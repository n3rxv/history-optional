import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // Increment click count in usage table
  const { data: usage } = await supabase
    .from("usage_tracking")
    .select("topper_clicks, subscribed")
    .eq("firebase_uid", user.uid)
    .single();

  // Premium users — no gate needed
  if (usage?.subscribed) {
    return NextResponse.json({ allowed: true, clicks: 0, isPremium: true });
  }

  // Check topper_subscriptions
  const { data: topperSub } = await supabase
    .from("topper_subscriptions")
    .select("expires_at")
    .eq("firebase_uid", user.uid)
    .single();

  if (topperSub && new Date(topperSub.expires_at) > new Date()) {
    return NextResponse.json({ allowed: true, clicks: 0, hasTopperAccess: true });
  }

  const currentClicks = usage?.topper_clicks ?? 0;
  const newClicks = currentClicks + 1;

  // Update click count
  await supabase
    .from("usage_tracking")
    .update({ topper_clicks: newClicks })
    .eq("firebase_uid", user.uid);

  const allowed = newClicks <= 5;
  return NextResponse.json({ allowed, clicks: newClicks });
}
