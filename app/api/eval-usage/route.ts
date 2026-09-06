import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

const OWNER_EMAIL  = process.env.OWNER_EMAIL!;
const FREE_LIMIT   = 1;

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  const user = await verifyFirebaseToken(token ?? null);
  if (!user) return NextResponse.json({ allowed: false, reason: "unauthenticated" });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

  if (user.email === OWNER_EMAIL) {
    return NextResponse.json({ allowed: true, owner: true, used: 0, limit: Infinity });
  }

  const { data: sub } = await db
    .from("subscriptions")
    .select("expires_at")
    .eq("firebase_uid", user.uid)
    .eq("status", "active")
    .maybeSingle();

  if (sub && new Date(sub.expires_at) > new Date()) {
    return NextResponse.json({ allowed: true, subscribed: true, used: 0, limit: Infinity });
  }

  const { data: usage } = await db
    .from("usage_tracking")
    .select("eval_count")
    .eq("fingerprint", req.nextUrl.searchParams.get("fp") ?? "")
    .maybeSingle();

  const used = usage?.eval_count ?? 0;
  return NextResponse.json({ allowed: used < FREE_LIMIT, used, limit: FREE_LIMIT, subscribed: false });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  const user = await verifyFirebaseToken(token ?? null);
  if (!user) return NextResponse.json({ ok: false });

  if (user.email === OWNER_EMAIL) return NextResponse.json({ ok: true });

  return NextResponse.json({ ok: true });
}
