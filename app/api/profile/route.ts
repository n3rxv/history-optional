import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// Normalize phone: strip spaces/dashes, ensure + prefix
function normalizePhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-().]/g, "");
  // Must be E.164-ish: +<digits>, 10-15 digits total
  const match = cleaned.match(/^(\+?)(\d{10,15})$/);
  if (!match) return null;
  return match[1] === "+" ? cleaned : "+" + cleaned;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phone: rawPhone } = await req.json();
  const phone = normalizePhone(rawPhone ?? "");

  if (!phone) {
    return NextResponse.json({ error: "Invalid phone number. Use format: +91XXXXXXXXXX" }, { status: 400 });
  }

  // Check if phone is already used by another account
  const { data: existing } = await db
    .from("user_profiles")
    .select("user_id")
    .eq("phone", phone)
    .neq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({
      error: "This phone number is already linked to another account."
    }, { status: 409 });
  }

  // Upsert profile
  const { error: upsertErr } = await db
    .from("user_profiles")
    .upsert({ user_id: user.id, phone, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

  if (upsertErr) {
    console.error("Profile upsert error:", upsertErr);
    return NextResponse.json({ error: "Failed to save phone" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, phone });
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ phone: null });

  const db = createServerClient();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return NextResponse.json({ phone: null });

  const { data: profile } = await db
    .from("user_profiles")
    .select("phone")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ phone: profile?.phone ?? null });
}
