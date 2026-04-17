import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const chatLimits = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT = 20; // max 20 messages per 10 minutes per IP
const CHAT_FREE_LIMIT = 5; // per month
const OWNER_EMAIL = process.env.OWNER_EMAIL!;

export async function POST(req: NextRequest) {
  // ── IP rate limit ────────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const now = Date.now();
  if (chatLimits.get(ip) && now - chatLimits.get(ip)!.ts > 10 * 60 * 1000) chatLimits.delete(ip);
  const current = chatLimits.get(ip);
  if (current && current.count >= RATE_LIMIT)
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });
  chatLimits.set(ip, { count: (current?.count ?? 0) + 1, ts: current?.ts ?? now });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const token = req.headers.get('x-user-token') ?? '';

  // ── Owner bypass — check if token is a real auth token ──────────
  let isOwner = false;
  try {
    const { createServerClient } = await import('@/lib/supabase');
    const db = createServerClient();
    const { data: { user } } = await db.auth.getUser(token);
    if (user?.email === OWNER_EMAIL) isOwner = true;
  } catch {}

  // ── Fingerprint-based usage check ───────────────────────────────
  if (!isOwner) {
    const fingerprint = token; // frontend sends fingerprint as x-user-token
    if (!fingerprint) return NextResponse.json({ error: 'limit_reached' }, { status: 403 });

    // Check subscription
    const nowISO = new Date().toISOString();
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', fingerprint)
      .eq('status', 'active')
      .gt('expires_at', nowISO)
      .single();

    if (!sub) {
      // Check monthly chat usage via usage_tracking
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: usage } = await supabase
        .from('usage_tracking')
        .select('chat_count, chat_month')
        .eq('fingerprint', fingerprint)
        .single();

      const used = (usage?.chat_month === currentMonth) ? (usage?.chat_count ?? 0) : 0;
      if (used >= CHAT_FREE_LIMIT)
        return NextResponse.json({ error: 'limit_reached' }, { status: 403 });
    }
  }

  // ── Call Groq ────────────────────────────────────────────────────
  try {
    const { messages, system } = await req.json();
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
            ...messages,
          ],
          max_tokens: 4000,
          reasoning_effort: "none",
        }),
      });

    let response = await groqFetch('qwen/qwen3-32b');
    if (response.status === 503 || response.status === 429) {
      console.log('Primary model over capacity, falling back to llama-3.3-70b...');
      response = await groqFetch('llama-3.3-70b-versatile');
    }
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || 'No response';
    const text = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    return NextResponse.json({ content: [{ text }] });
  } catch {
    return NextResponse.json({ content: [{ text: 'Something went wrong. Please try again.' }] });
  }
}
