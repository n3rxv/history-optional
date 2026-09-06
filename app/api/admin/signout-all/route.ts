import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";

/**
 * Owner-only: signs out every reader by revoking their refresh tokens.
 *
 * This imported isAdminAuthed and then never called it, comparing the
 * x-admin-token header against ADMIN_SECRET instead — an env var that is set
 * nowhere. So the admin UI's token could never open this door, and no other
 * token existed to open it with. It failed closed, which is why nobody
 * noticed, but it was not the check it appeared to be.
 *
 * Call it from the admin page's session, or with a token from
 * /api/admin/verify-password.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed(req))) {
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
