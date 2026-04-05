import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory rate limiting (per-IP brute-force protection)
const attempts = new Map<string, { count: number; ts: number }>();

// Short-lived session tokens — issued on successful login, used by all admin routes
// Token → expiry timestamp (ms). Tokens expire after 8 hours.
export const adminTokens = new Map<string, number>();
const TOKEN_TTL = 8 * 60 * 60 * 1000;

function purgeExpiredTokens() {
  const now = Date.now();
  for (const [tok, exp] of adminTokens) {
    if (now > exp) adminTokens.delete(tok);
  }
}

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const now = Date.now();

  const entry = attempts.get(ip);
  if (entry && now - entry.ts > 15 * 60 * 1000) attempts.delete(ip);

  const current = attempts.get(ip);
  if (current && current.count >= 5) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
  }

  const body = await req.json();
  const password: string = body?.password ?? '';

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (timingSafeCompare(password, process.env.ADMIN_PASSWORD)) {
    attempts.delete(ip);
    purgeExpiredTokens();
    const token = crypto.randomBytes(32).toString('hex');
    adminTokens.set(token, Date.now() + TOKEN_TTL);
    return NextResponse.json({ ok: true, token });
  }

  attempts.set(ip, { count: (current?.count ?? 0) + 1, ts: current?.ts ?? now });
  return NextResponse.json({ ok: false }, { status: 401 });
}
