import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@/lib/supabase";

const chatLimits = new Map<string, { count: number; ts: number }>();
const LIMIT = 20; // max 20 messages per 10 minutes per IP
const CHAT_FREE_LIMIT = 5; // per month
const OWNER_EMAIL = process.env.OWNER_EMAIL!;
const OWNER_PHONE = process.env.OWNER_PHONE!;

export async function POST(req: NextRequest) {
  // ── IP rate limit (abuse protection) ────────────────────────────
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const now = Date.now();
  const entry = chatLimits.get(ip);
  if (entry && now - entry.ts > 10 * 60 * 1000) chatLimits.delete(ip);
  const current = chatLimits.get(ip);
  if (current && current.count >= LIMIT) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });
  }
  chatLimits.set(ip, { count: (current?.count ?? 0) + 1, ts: current?.ts ?? now });

  const token = req.headers.get('x-user-token');

  // ── Auth check ───────────────────────────────────────────────────
  if (!token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const db = createServerClient();
  const { data: { user }, error: userErr } = await db.auth.getUser(token);
  if (userErr || !user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  // ── Usage check (skip for owner) ─────────────────────────────────
  const isOwner = user.email === OWNER_EMAIL;
  if (!isOwner) {
    const { data: profile } = await db.from("user_profiles").select("phone").eq("user_id", user.id).single();
    const phone = profile?.phone ?? "";

    if (!phone) {
      return NextResponse.json({ error: 'no_phone' }, { status: 403 });
    }

    if (phone !== OWNER_PHONE) {
      // Check subscription
      const nowISO = new Date().toISOString();
      const { data: sub } = await db
        .from("subscriptions").select("status").eq("user_id", user.id)
        .eq("status", "active").gt("expires_at", nowISO).single();

      if (!sub) {
        // Check MONTHLY chat usage
        const thisMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
        const { data: usage } = await db
          .from("chat_usage")
          .select("count")
          .eq("phone", phone)
          .eq("month", thisMonth)
          .single();
        const used = usage?.count ?? 0;

        if (used >= CHAT_FREE_LIMIT) {
          return NextResponse.json({ error: 'limit_reached' }, { status: 403 });
        }

        // Increment monthly usage
        if (usage) {
          await db.from("chat_usage").update({ count: used + 1 }).eq("phone", phone).eq("month", thisMonth);
        } else {
          await db.from("chat_usage").insert({ user_id: user.id, phone, month: thisMonth, count: 1 });
        }
      }
    }
  }

  // ── Call Groq ────────────────────────────────────────────────────
  try {
    const { messages, system } = await req.json();

  // Input length limit
  const lastMsg = messages?.[messages.length - 1]?.content ?? '';
  if (typeof lastMsg === 'string' && lastMsg.length > 4000)
    return NextResponse.json({ error: 'Message too long' }, { status: 400 });
  if (!Array.isArray(messages) || messages.length > 50)
    return NextResponse.json({ error: 'Too many messages in context' }, { status: 400 });

    const groqFetch = async (model: string) =>
      fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            ...messages
          ],
          max_tokens: 4000,
        }),
      });

    let response = await groqFetch('moonshotai/kimi-k2-instruct');
    if (response.status === 503 || response.status === 429) {
      console.log('Kimi-K2 over capacity, falling back to llama-3.3-70b...');
      response = await groqFetch('llama-3.3-70b-versatile');
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'No response';
    return NextResponse.json({ content: [{ text }] });
  } catch {
    return NextResponse.json({ content: [{ text: 'Something went wrong. Please try again.' }] });
  }
}
