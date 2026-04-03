import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const OWNER_EMAIL  = "nirxv03@gmail.com";
const OWNER_PHONE  = "+917976570494";
const FREE_LIMIT   = 2;

export async function GET(req: NextRequest) {
  const db = createServerClient();

  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ allowed: false, reason: "unauthenticated" });

  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ allowed: false, reason: "unauthenticated" });

  const email = user.email ?? "";

  // Fetch stored phone
  const { data: profile } = await db
    .from("user_profiles")
    .select("phone")
    .eq("user_id", user.id)
    .single();

  const phone = profile?.phone ?? "";

  // Owner exception: both email AND phone must match
  if (email === OWNER_EMAIL && phone === OWNER_PHONE) {
    return NextResponse.json({ allowed: true, owner: true, used: 0, limit: Infinity });
  }

  // No phone yet — must complete profile
  if (!phone) {
    return NextResponse.json({ allowed: false, reason: "no_phone", used: 0, limit: FREE_LIMIT });
  }

  // Active subscription
  const { data: sub } = await db
    .from("subscriptions")
    .select("expires_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (sub && new Date(sub.expires_at) > new Date()) {
    return NextResponse.json({ allowed: true, subscribed: true, used: 0, limit: Infinity });
  }

  // Daily usage keyed on phone (blocks multi-account bypass)
  const today = new Date().toISOString().slice(0, 10);
  const { data: usage } = await db
    .from("eval_usage")
    .select("count")
    .eq("phone", phone)
    .eq("date", today)
    .single();

  const used    = usage?.count ?? 0;
  const allowed = used < FREE_LIMIT;

  return NextResponse.json({ allowed, used, limit: FREE_LIMIT, subscribed: false });
}

export async function POST(req: NextRequest) {
  const db = createServerClient();

  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ ok: false });

  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ ok: false });

  const email = user.email ?? "";

  const { data: profile } = await db
    .from("user_profiles")
    .select("phone")
    .eq("user_id", user.id)
    .single();

  const phone = profile?.phone ?? "";

  if (email === OWNER_EMAIL && phone === OWNER_PHONE) return NextResponse.json({ ok: true });
  if (!phone) return NextResponse.json({ ok: false, reason: "no_phone" });

  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await db
    .from("eval_usage")
    .select("id, count")
    .eq("phone", phone)
    .eq("date", today)
    .single();

  if (existing) {
    await db.from("eval_usage").update({ count: existing.count + 1 }).eq("id", existing.id);
  } else {
    await db.from("eval_usage").insert({ user_id: user.id, phone, date: today, count: 1 });
  }

  return NextResponse.json({ ok: true });
}
