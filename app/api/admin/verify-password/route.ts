import { NextRequest, NextResponse } from 'next/server';

const attempts = new Map<string, { count: number; ts: number }>();

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const now = Date.now();
  const entry = attempts.get(ip);

  // Reset if 15 minutes have passed
  if (entry && now - entry.ts > 15 * 60 * 1000) attempts.delete(ip);

  const current = attempts.get(ip);
  if (current && current.count >= 5) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
  }

  const { password } = await req.json();

  if (password === process.env.ADMIN_PASSWORD) {
    attempts.delete(ip);
    return NextResponse.json({ ok: true });
  }

  attempts.set(ip, { count: (current?.count ?? 0) + 1, ts: current?.ts ?? now });
  return NextResponse.json({ ok: false }, { status: 401 });
}
