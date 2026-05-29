import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const chatLimits = new Map<string, { count: number; ts: number }>();

async function jinaEmbed(text: string): Promise<number[]> {
  const res = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v3',
      task: 'retrieval.query',
      dimensions: 384,
      input: [text],
    }),
  });
  const data = await res.json();
  if (!data.data) {
    console.error('Jina embed error:', JSON.stringify(data));
    throw new Error('Jina embedding failed: ' + JSON.stringify(data));
  }
  return data.data[0].embedding;
}

async function getBookContext(query: string, bookTitle?: string): Promise<string> {
  try {
    const embedding = await jinaEmbed(query);
    const supabase = (await import('@supabase/supabase-js')).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    const { data: chunks } = await supabase.rpc('match_book_chunks', {
      query_embedding: embedding,
      match_count: 5,
      filter_book: bookTitle ?? null,
    });
    if (!chunks || chunks.length === 0) return '';
    return chunks.map((c: any) => '[' + c.book_title + '] ' + c.content).join(' --- ');
  } catch (e) {
    console.error('RAG error:', e);
    return '';
  }
}
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
    const { messages, system, bookMode, bookTitle } = await req.json();
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
            ...(ragSystem ? [{ role: 'system', content: ragSystem }] : []),
            ...messages,
          ],
          max_tokens: 4000,

        }),
      });

    // ── RAG: inject book context if bookMode ────────────────────────
    let ragContext = '';
    if (bookMode) {
      const lastQ = messages?.[messages.length - 1]?.content ?? '';
      ragContext = await getBookContext(lastQ, bookTitle);
      console.log('RAG chunks found:', ragContext.length, 'chars, bookMode:', bookMode, 'bookTitle:', bookTitle);
    }

    const ragSystem = ragContext
      ? `${system ?? ''}

RELEVANT BOOK PASSAGES (use these as primary source for your answer):

${ragContext}

Base your answer on these passages. Cite the book title when referencing specific content.`
      : system;

    // Detect MCQ/Prelims question
    const lastUserMsg = messages?.[messages.length - 1]?.content ?? '';
    const isMCQ = typeof lastUserMsg === 'string' && (
      /\(a\)|\(b\)|\(c\)|\(d\)/.test(lastUserMsg) ||
      /which of the following/i.test(lastUserMsg) ||
      /consider the following/i.test(lastUserMsg) ||
      /correct answer|mcq|prelims|pyq/i.test(lastUserMsg)
    );

    const primaryModel = isMCQ ? 'openai/gpt-oss-120b' : 'qwen/qwen3-32b';
    const fallbackModel = isMCQ ? 'llama-3.3-70b-versatile' : 'llama-3.3-70b-versatile';

    let response = await groqFetch(primaryModel);
    if (response.status === 503 || response.status === 429) {
      console.log(`Primary model over capacity, falling back...`);
      response = await groqFetch(fallbackModel);
    }
    const data = await response.json();
    console.log("Groq response:", JSON.stringify(data));
    const raw = data.choices?.[0]?.message?.content || 'No response';
    const text = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    return NextResponse.json({ content: [{ text }] });
  } catch {
    return NextResponse.json({ content: [{ text: 'Something went wrong. Please try again.' }] });
  }
}
