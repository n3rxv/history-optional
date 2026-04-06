import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const contactLimits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (contactLimits.get(ip) ?? []).filter(t => now - t < 60_000);
  if (recent.length >= 3) return true;
  contactLimits.set(ip, [...recent, now]);
  return false;
}

function sanitizeText(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many submissions. Please wait a moment.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const db = createServerClient();

  if (body.type === 'contact') {
    const name    = sanitizeText(body.name, 100);
    const email   = sanitizeText(body.email, 200);
    const message = sanitizeText(body.message, 2000);

    if (!name || !email || !message)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });

    const { error } = await db.from('contact_submissions').insert({ type: 'contact', name, email, message });
    if (error) return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });

  } else if (body.type === 'bug') {
    const page        = sanitizeText(body.page, 200);
    const description = sanitizeText(body.description, 2000);
    const email       = sanitizeText(body.email, 200);

    if (!page || !description)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const { error } = await db.from('contact_submissions').insert({
      type: 'bug', page, message: description, email: email || null,
    });
    if (error) return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });

  } else if (body.type === 'weekly_checkup') {
    const message = sanitizeText(body.message, 2000);
    if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    const { error } = await db.from('contact_submissions').insert({ type: 'weekly_checkup', message, name: 'checkup', email: 'checkup@system' });
    if (error) return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
