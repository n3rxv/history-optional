import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ access: false, clicks: 0 });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ access: false, clicks: 0 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // Premium check
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, expires_at")
    .eq("firebase_uid", user.uid)
    .eq("status", "active")
    .single();

  if (sub && new Date(sub.expires_at) > new Date()) {
    return NextResponse.json({ access: true, isPremium: true, clicks: 0 });
  }

  // Topper subscription check
  const { data: topperSub } = await supabase
    .from("topper_subscriptions")
    .select("expires_at")
    .eq("firebase_uid", user.uid)
    .single();

  if (topperSub && new Date(topperSub.expires_at) > new Date()) {
    return NextResponse.json({ access: true, hasTopperAccess: true, clicks: 0 });
  }

  // Free user — return click count
  const { data: tracking } = await supabase
    .from("usage_tracking")
    .select("topper_clicks")
    .eq("firebase_uid", user.uid)
    .single();

  const clicks = tracking?.topper_clicks ?? 0;
  return NextResponse.json({ access: false, clicks });
}
