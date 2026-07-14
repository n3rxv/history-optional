import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // All 3 DB calls parallel
  const [{ data: sub }, { data: topperSub }, { data: tracking }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("status, expires_at")
      .eq("firebase_uid", user.uid)
      .eq("status", "active")
      .single(),
    supabase
      .from("topper_subscriptions")
      .select("expires_at")
      .eq("firebase_uid", user.uid)
      .single(),
    supabase
      .from("usage_tracking")
      .select("topper_clicks")
      .eq("firebase_uid", user.uid)
      .single(),
  ]);

  // Premium check
  if (sub && new Date(sub.expires_at) > new Date()) {
    return NextResponse.json({ allowed: true, clicks: 0, isPremium: true });
  }

  // Topper subscription check
  if (topperSub && new Date(topperSub.expires_at) > new Date()) {
    return NextResponse.json({ allowed: true, clicks: 0, hasTopperAccess: true });
  }

  // Free user — check first, then increment
  const currentClicks = tracking?.topper_clicks ?? 0;

  if (currentClicks >= 5) {
    return NextResponse.json({ allowed: false, clicks: currentClicks });
  }

  const newClicks = currentClicks + 1;

  await supabase
    .from("usage_tracking")
    .update({ topper_clicks: newClicks })
    .eq("firebase_uid", user.uid);

  return NextResponse.json({ allowed: true, clicks: newClicks });
}
