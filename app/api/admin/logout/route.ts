import { NextRequest, NextResponse } from 'next/server';
import { revokeAdminSession } from '@/lib/admin-auth';

/**
 * Ends the calling admin session server-side.
 *
 * Signing out used to clear sessionStorage and nothing else, so the token
 * stayed valid for the rest of its eight hours — signing out on a shared or
 * borrowed machine did not actually close the session.
 *
 * No auth guard: the only thing this can do is revoke the session whose id is
 * in the presented token, and a caller holding that token could use it for
 * far more than logging it out.
 */
export async function POST(req: NextRequest) {
  await revokeAdminSession(req);
  return NextResponse.json({ ok: true });
}
