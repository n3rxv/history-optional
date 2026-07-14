import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ access: false });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ access: false });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data } = await supabase
    .from("topper_subscriptions")
    .select("expires_at")
    .eq("firebase_uid", user.uid)
    .single();

  if (!data) return NextResponse.json({ access: false });

  const active = new Date(data.expires_at) > new Date();
  return NextResponse.json({ access: active, expiresAt: data.expires_at });
}
