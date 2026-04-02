import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const OWNER_EMAIL = "nirxv03@gmail.com";
const FREE_LIMIT  = 5;

export async function GET(req: NextRequest) {
  const db = createServerClient();

  // Get session from Authorization header (we'll send it from the client)
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ allowed: false, reason: "unauthenticated" });

  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ allowed: false, reason: "unauthenticated" });

  const email = user.email ?? "";

  // Owner exception — always allowed
  if (email === OWNER_EMAIL) {
    return NextResponse.json({ allowed: true, owner: true, used: 0, limit: Infinity });
  }

  // Check active subscription
  const { data: sub } = await db
    .from("subscriptions")
    .select("expires_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (sub && new Date(sub.expires_at) > new Date()) {
    return NextResponse.json({ allowed: true, subscribed: true, used: 0, limit: Infinity });
  }

  // Check daily usage
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const { data: usage } = await db
    .from("eval_usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const used = usage?.count ?? 0;
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
  if (email === OWNER_EMAIL) return NextResponse.json({ ok: true });

  const today = new Date().toISOString().slice(0, 10);

  // Upsert usage count
  const { data: existing } = await db
    .from("eval_usage")
    .select("id, count")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (existing) {
    await db
      .from("eval_usage")
      .update({ count: existing.count + 1 })
      .eq("id", existing.id);
  } else {
    await db
      .from("eval_usage")
      .insert({ user_id: user.id, date: today, count: 1 });
  }

  return NextResponse.json({ ok: true });
}
