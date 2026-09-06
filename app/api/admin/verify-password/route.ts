import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { generateAdminToken } from '@/lib/admin-auth';
import { checkRateLimit, resetRateLimit, clientIp } from '@/lib/rateLimit';

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const key = `admin-login:${clientIp(req)}`;

  // failClosed: this is the only brute-force protection on the admin
  // password, so a database outage must not hand out unlimited guesses.
  const { allowed } = await checkRateLimit(key, {
    limit: 5,
    windowSeconds: 15 * 60,
    failClosed: true,
  });
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
  }

  const body = await req.json();
  const password: string = body?.password ?? '';

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (timingSafeCompare(password, process.env.ADMIN_PASSWORD)) {
    // A correct password forgives earlier failed attempts, as before.
    await resetRateLimit(key);
    const token = await generateAdminToken(req);
    // No token means no ADMIN_PASSWORD or no session row; either way there is
    // nothing to hand back, and pretending otherwise gives a token that every
    // subsequent request would reject.
    if (!token) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, token });
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}
