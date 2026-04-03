import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// Owner-only endpoint — signs out every user by revoking all refresh tokens
// Call once from your terminal:
//   curl -X POST https://your-domain.com/api/admin/signout-all \
//        -H "x-admin-secret: YOUR_ADMIN_SECRET"

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use service role client — bypasses RLS
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } }
  );

  // List all users and sign each out (revoke all sessions)
  let page = 1;
  let revoked = 0;
  let errors  = 0;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 50 });
    if (error || !data?.users?.length) break;

    for (const user of data.users) {
      const { error: signOutErr } = await adminClient.auth.admin.signOut(user.id, "global");
      if (signOutErr) { errors++; console.error(`Failed to sign out ${user.id}:`, signOutErr); }
      else revoked++;
    }

    if (data.users.length < 50) break;
    page++;
  }

  return NextResponse.json({ ok: true, revoked, errors });
}
