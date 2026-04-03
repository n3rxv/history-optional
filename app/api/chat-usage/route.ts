import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const CHAT_FREE_LIMIT = 5;
const OWNER_EMAIL     = "nirxv03@gmail.com";
const OWNER_PHONE     = "+917976570494";

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ allowed: false, reason: "unauthenticated" }, { status: 401 });

  const db = createServerClient();
  const { data: { user }, error: userErr } = await db.auth.getUser(token);
  if (userErr || !user) return NextResponse.json({ allowed: false, reason: "unauthenticated" }, { status: 401 });

  // Owner bypass
  if (user.email === OWNER_EMAIL) {
    return NextResponse.json({ allowed: true, used: 0, limit: Infinity, owner: true });
  }

  // Check phone
  const { data: profile } = await db.from("user_profiles").select("phone").eq("user_id", user.id).single();
  const phone = profile?.phone ?? "";
  if (!phone) return NextResponse.json({ allowed: false, reason: "no_phone" });

  // Owner phone bypass
  if (phone === OWNER_PHONE) {
    return NextResponse.json({ allowed: true, used: 0, limit: Infinity, owner: true });
  }

  // Check subscription
  const now = new Date().toISOString();
  const { data: sub } = await db
    .from("subscriptions").select("status, expires_at")
    .eq("user_id", user.id).eq("status", "active").gt("expires_at", now)
    .single();
  if (sub) return NextResponse.json({ allowed: true, used: 0, limit: Infinity, subscribed: true });

  // Check daily usage
  const today = new Date().toISOString().split("T")[0];
  const { data: usage } = await db
    .from("chat_usage").select("count").eq("phone", phone).eq("date", today).single();

  const used    = usage?.count ?? 0;
  const allowed = used < CHAT_FREE_LIMIT;
  return NextResponse.json({ allowed, used, limit: CHAT_FREE_LIMIT });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const db = createServerClient();
  const { data: { user }, error: userErr } = await db.auth.getUser(token);
  if (userErr || !user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  if (user.email === OWNER_EMAIL) return NextResponse.json({ ok: true });

  const { data: profile } = await db.from("user_profiles").select("phone").eq("user_id", user.id).single();
  const phone = profile?.phone ?? "";
  if (!phone || phone === OWNER_PHONE) return NextResponse.json({ ok: true });

  const today = new Date().toISOString().split("T")[0];

  // Upsert: insert with count=1, on conflict increment
  const { data: existing } = await db
    .from("chat_usage").select("count").eq("phone", phone).eq("date", today).single();

  if (existing) {
    await db.from("chat_usage")
      .update({ count: existing.count + 1 })
      .eq("phone", phone).eq("date", today);
  } else {
    await db.from("chat_usage")
      .insert({ user_id: user.id, phone, date: today, count: 1 });
  }

  return NextResponse.json({ ok: true });
}
