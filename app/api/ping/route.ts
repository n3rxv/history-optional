import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-user-token");
  if (!token) return NextResponse.json({ ok: false });
  const db = createServerClient();
  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return NextResponse.json({ ok: false });
  await db.from("user_sessions").insert({ user_id: user.id, visited_at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
