import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyFirebaseToken } from "@/lib/verifyFirebaseToken";

function normalizePhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-().]/g, "");
  const match = cleaned.match(/^(\+?)(\d{10,15})$/);
  if (!match) return null;
  return match[1] === "+" ? cleaned : "+" + cleaned;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

  const { phone: rawPhone } = await req.json();
  const phone = normalizePhone(rawPhone ?? "");
  if (!phone) return NextResponse.json({ error: "Invalid phone number. Use format: +91XXXXXXXXXX" }, { status: 400 });

  const { data: existing } = await db
    .from("user_profiles")
    .select("firebase_uid")
    .eq("phone", phone)
    .neq("firebase_uid", user.uid)
    .single();

  if (existing) return NextResponse.json({ error: "This phone number is already linked to another account." }, { status: 409 });

  const { error: upsertErr } = await db
    .from("user_profiles")
    .upsert({ firebase_uid: user.uid, phone, updated_at: new Date().toISOString() }, { onConflict: "firebase_uid" });

  if (upsertErr) {
    console.error("Profile upsert error:", upsertErr);
    return NextResponse.json({ error: "Failed to save phone" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, phone });
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ phone: null });

  const user = await verifyFirebaseToken(token);
  if (!user) return NextResponse.json({ phone: null });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

  const { data: profile } = await db
    .from("user_profiles")
    .select("phone")
    .eq("firebase_uid", user.uid)
    .single();

  return NextResponse.json({ phone: profile?.phone ?? null });
}
