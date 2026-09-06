import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

const CHAT_FREE_LIMIT = 3;
const OWNER_EMAIL     = process.env.OWNER_EMAIL!;
const OWNER_PHONE     = process.env.OWNER_PHONE!;

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ allowed: false, reason: "unauthenticated" }, { status: 401 });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ allowed: false, reason: "unauthenticated" }, { status: 401 });

  if (user.email === OWNER_EMAIL) {
    return NextResponse.json({ allowed: true, used: 0, limit: Infinity, owner: true });
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

  const { data: profile } = await db.from("user_profiles").select("phone").eq("firebase_uid", user.uid).maybeSingle();
  const phone = profile?.phone ?? "";
  if (!phone) return NextResponse.json({ allowed: false, reason: "no_phone" });

  if (phone === OWNER_PHONE) {
    return NextResponse.json({ allowed: true, used: 0, limit: Infinity, owner: true });
  }

  const now = new Date().toISOString();
  const { data: sub } = await db
    .from("subscriptions").select("status, expires_at")
    .eq("firebase_uid", user.uid).eq("status", "active").gt("expires_at", now)
    .maybeSingle();

  if (sub) return NextResponse.json({ allowed: true, used: 0, limit: Infinity, subscribed: true });

  const today = new Date().toISOString().split("T")[0];
  const { data: usage } = await db
    .from("chat_usage").select("count").eq("phone", phone).eq("date", today).maybeSingle();

  const used    = usage?.count ?? 0;
  const allowed = used < CHAT_FREE_LIMIT;
  return NextResponse.json({ allowed, used, limit: CHAT_FREE_LIMIT });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  if (user.email === OWNER_EMAIL) return NextResponse.json({ ok: true });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

  const { data: profile } = await db.from("user_profiles").select("phone").eq("firebase_uid", user.uid).maybeSingle();
  const phone = profile?.phone ?? "";
  if (!phone || phone === OWNER_PHONE) return NextResponse.json({ ok: true });

  const today = new Date().toISOString().split("T")[0];
  const { data: existing } = await db
    .from("chat_usage").select("count").eq("phone", phone).eq("date", today).maybeSingle();

  if (existing) {
    await db.from("chat_usage")
      .update({ count: existing.count + 1 })
      .eq("phone", phone).eq("date", today);
  } else {
    await db.from("chat_usage")
      .insert({ firebase_uid: user.uid, phone, date: today, count: 1 });
  }

  return NextResponse.json({ ok: true });
}
