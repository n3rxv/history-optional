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
  if (!data.data) throw new Error('Jina embed failed: ' + JSON.stringify(data));
  return data.data[0].embedding;
}

async function jinaEmbedBatch(texts: string[]): Promise<number[][]> {
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
      input: texts,
    }),
  });
  const data = await res.json();
  if (!data.data) throw new Error('Jina batch embed failed');
  return data.data.map((d: any) => d.embedding);
}

async function jinaRerank(query: string, chunks: {id: any, content: string, book_title: string}[]): Promise<{id: any, content: string, book_title: string, score: number}[]> {
  try {
    const res = await fetch('https://api.jina.ai/v1/rerank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'jina-reranker-v2-base-multilingual',
        query,
        documents: chunks.map(c => c.content),
        top_n: 6,
      }),
    });
    const data = await res.json();
    if (!data.results) return chunks.slice(0, 6).map(c => ({ ...c, score: 0 }));
    return data.results.map((r: any) => ({
      ...chunks[r.index],
      score: r.relevance_score,
    }));
  } catch {
    return chunks.slice(0, 6).map(c => ({ ...c, score: 0 }));
  }
}

async function expandQuery(query: string): Promise<string[]> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 150,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: `You are a UPSC History expert. Given this question, generate 3 short search queries that capture different aspects of it. Return ONLY a JSON array of 3 strings, nothing else.\nQuestion: "${query}"\nExample output: ["query 1", "query 2", "query 3"]`,
        }],
      }),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? '[]';
    const clean = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
    const arr = JSON.parse(clean);
    if (Array.isArray(arr) && arr.length > 0) return [query, ...arr.slice(0, 3)];
    return [query];
  } catch {
    return [query];
  }
}

async function getBookContext(query: string, bookTitle?: string): Promise<string> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    const filter = (bookTitle && bookTitle !== "all") ? bookTitle : null;

    // Step 1: Expand query into multiple sub-queries
    const queries = await // Step 1 (optimized): Single embedding, no query expansion
    const [singleEmbedding] = await jinaEmbedBatch([query]);

    // Step 2: Search
    let results;
    if (!filter) {
      // All Books mode: get top 3 per book to ensure diversity
      const { data: bookList } = await supabase
        .from('book_chunks')
        .select('book_title')
        .limit(1000);
      const books = [...new Set((bookList ?? []).map((r: any) => r.book_title))];
      const perBookPromises = books.map(book =>
        supabase.rpc('match_book_chunks', {
          query_embedding: singleEmbedding,
          match_count: 3,
          filter_book: book,
        })
      );
      results = await Promise.all(perBookPromises);
    } else {
      // Single book mode
      results = await Promise.all([
        supabase.rpc('match_book_chunks', {
          query_embedding: singleEmbedding,
          match_count: 12,
          filter_book: filter,
        })
      ]);
    }

    // Step 4: Merge + deduplicate by id
    const seen = new Set<any>();
    const allChunks: {id: any, content: string, book_title: string}[] = [];
    for (const result of results) {
      for (const chunk of (result.data ?? [])) {
        if (!seen.has(chunk.id)) {
          seen.add(chunk.id);
          allChunks.push({ id: chunk.id, content: chunk.content, book_title: chunk.book_title });
        }
      }
    }

    if (allChunks.length === 0) return '';

    // Step 4b: Filter low-similarity chunks before reranking
    // (similarity < 0.5 means book likely doesn't cover this topic)
    const filtered = allChunks.filter((c: any) => (c.similarity ?? 1) > 0.45);
    const chunksToRerank = (filtered.length >= 3 ? filtered : allChunks).slice(0, 12);
    console.log(`Chunks before filter: ${allChunks.length}, after: ${chunksToRerank.length}`);

    // Step 5: Rerank by true relevance
    const reranked = await jinaRerank(query, chunksToRerank);

    // Step 6: Ensure diversity - max 2 chunks per book, then fill remaining slots
    const finalChunks: typeof reranked = [];
    const bookCount: Record<string, number> = {};
    const overflow: typeof reranked = [];

    for (const chunk of reranked) {
      const count = bookCount[chunk.book_title] ?? 0;
      if (count < 2) {
        finalChunks.push(chunk);
        bookCount[chunk.book_title] = count + 1;
      } else {
        overflow.push(chunk);
      }
      if (finalChunks.length >= 8) break;
    }
    // Fill up to 8 if needed
    for (const chunk of overflow) {
      if (finalChunks.length >= 8) break;
      finalChunks.push(chunk);
    }

    // Step 7: Return chunks with source labels
    return finalChunks
      .map((c, i) => `[Source ${i + 1} — ${c.book_title}]\n${c.content}`)
      .join('\n\n---\n\n');

  } catch (e) {
    console.error('RAG error:', e);
    return '';
  }
}
const RATE_LIMIT = 20; // max 20 messages per 10 minutes per IP
const CHAT_FREE_LIMIT = 3; // per month
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

    const anthropicCall = async (model: string, systemPrompt: string | undefined) => {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      return anthropic.messages.create({
        model,
        max_tokens: 4000,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      });
    };

    // ── RAG: inject book context if bookMode ────────────────────────
    let ragContext = '';
    let ragSources: { book_title: string; content: string }[] = [];
    if (bookMode) {
      const lastQ = typeof messages?.[messages.length - 1]?.content === 'string'
        ? messages[messages.length - 1].content
        : '';
      try {
        ragContext = await getBookContext(lastQ, bookTitle);
        // Parse sources from formatted ragContext for UI display
        ragSources = ragContext
          .split('\n\n---\n\n')
          .map(block => {
            const match = block.match(/^\[Source \d+ — (.+?)\]\n([\s\S]+)$/);
            if (match) return { book_title: match[1], content: match[2] };
            return null;
          })
          .filter(Boolean) as { book_title: string; content: string }[];
      } catch(e) { console.error('RAG error:', e); }
    }

    const ragSystem = ragContext
      ? `${system ?? ''}
You are a UPSC History Optional expert. You MUST always give a complete, well-structured answer — NEVER refuse, NEVER say the book does not cover a topic. Always answer from your expert knowledge, using the passages below as supplementary evidence where relevant.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EPISTEMIC INTEGRITY PROTOCOL — HIGHEST PRIORITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are writing for UPSC History Optional aspirants. A fabricated fact, invented quote, or hallucinated event in their answer can cost them a rank — or the exam itself. This is not a writing exercise. This is someone's career.

CRITICAL RULE ON IRRELEVANT SOURCES: If the provided book passages are clearly about a different topic or era than the question (e.g., question is about French Revolution but passages are about Algeria or Vietnam), you MUST explicitly state: "The selected book does not cover this topic directly." Then answer from general knowledge — but WITHOUT inventing any quotes, statistics, names, or citations. A clean general-knowledge answer is infinitely better than a hallucinated one with fake quotes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — CLASSIFY EVERY CLAIM BEFORE WRITING IT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before writing any specific fact, mentally assign it one of three categories:

TIER 1 — CERTAIN: You are completely sure. Standard textbook facts. Well-known events. Verified dates.
→ Write normally. Example: "Akbar introduced the mansabdari system."

TIER 2 — PROBABLE: You are fairly confident but not 100% sure of the exact detail.
→ Hedge explicitly. Example: "Jahangir's Mewar campaign broadly aimed at..." or "Historians generally note that..."

TIER 3 — UNCERTAIN: You are reconstructing, pattern-completing, or guessing.
→ DO NOT WRITE IT. Replace with analytical observation or omit entirely.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — RED FLAG CHECKLIST (run this before every paragraph)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STOP before writing if you are about to include:
☐ A specific event/battle/massacre name not given in the question
☐ A specific date not given in the question  
☐ A direct quote attributed to a historian
☐ A book title you are not 100% certain exists
☐ A specific treaty clause or administrative detail
☐ A secondary person's name (e.g. "daughter of X", "son of Y")
☐ A specific statistic or percentage (e.g. "40% revenue loss")
☐ An institutional name in a specific context (e.g. "the Gwalior Committee of 1847")

If any box would be checked — hedge or omit.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — HISTORIAN CITATION RULES (strictest possible)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You may cite a historian ONLY when ALL THREE conditions are met:
(a) You are certain this historian wrote about this topic
(b) You are citing their KNOWN argument, not inventing one
(c) You are NOT putting specific words in their mouth

PERMITTED: "Irfan Habib analyses the zabti system's fiscal impact in Agrarian System of Mughal India"
PERMITTED: "Satish Chandra broadly argues that jagirdari crisis weakened Mughal administration"
PERMITTED: "Historians like Bipan Chandra have examined the economic drain thesis"

NEVER PERMITTED: Any sentence of the form "[Historian] writes: [quote you invented]"
NEVER PERMITTED: "[Historian] argues that [specific claim you are not certain they made]"
NEVER PERMITTED: Citing a historian for an argument outside their known area

KNOWN SAFE HISTORIAN-ARGUMENT PAIRS (only use these with confidence):
- Irfan Habib → Agrarian System, zabti/dahsala, peasant revolts, Mughal fiscal crisis
- Satish Chandra → Jagirdari crisis, Mughal decline, Medieval India survey
- Bipan Chandra → Economic nationalism, drain of wealth, Modern India
- Romila Thapar → Early India, Ashokan policy, historiography of ancient India
- R.S. Sharma → Material culture, feudalism debate, ancient Indian economy
- D.D. Kosambi → Marxist interpretation, coins as historical evidence
- Sekhar Bandyopadhyay → Plassey to Partition, social history of Bengal
- Eric Hobsbawm → Age of Revolution/Capital/Empire/Extremes, nationalism
- E.P. Thompson → English working class, moral economy, food riots
- Ranajit Guha → Subaltern studies, peasant insurgency

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — SHOW YOUR UNCERTAINTY, DON'T HIDE IT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Intellectual honesty is a feature, not a weakness. UPSC examiners respect analytical restraint.

GOOD UNCERTAINTY LANGUAGE:
- "The broad historical consensus suggests..."
- "While the exact details require verification, the general pattern was..."
- "Historians broadly argue, though accounts differ on specifics..."
- "Based on the general trajectory of this period..."

COMPARISON — hallucinated vs honest:

HALLUCINATED: "The Ahmedpur-Sarangpur massacre of 1615 demonstrated Jahangir's coercive Rajput policy, as noted by Irfan Habib who called it 'a doctrine of domination through fear'"
HONEST: "Jahangir's Mewar campaign (1608-1615) combined sustained military pressure with eventual diplomatic generosity — the 1615 treaty restored Chittorgarh to Rana Amar Singh, reflecting a more nuanced policy than pure coercion"

HALLUCINATED: "Munshi Bai, daughter of Rao Surjan Singh of Bikaner, was married in 1607 as part of Jahangir's pacification strategy"
HONEST: "Jahangir continued Akbar's practice of matrimonial alliances with Rajput houses, though these became less central after Mewar's submission"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL RULE — THE UPSC CREDIBILITY TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before submitting your response, ask: "If an expert UPSC examiner read this, would every specific fact, name, date, and quote survive scrutiny?"

If the answer is NO for any claim — remove it or hedge it.
A shorter, factually honest answer scores higher than a long, confident, hallucinated one.
The examiner's first instinct when they see a wrong citation is to distrust the entire answer.


BOOK PASSAGES from "${bookTitle && bookTitle !== "all" ? bookTitle : "reference books"}" (cite passages as [${bookTitle && bookTitle !== "all" ? bookTitle : "Book Title"}]):
IMPORTANT: The user has specifically selected "${bookTitle && bookTitle !== "all" ? bookTitle : "All Books"}" — prioritise answering from these passages above all else. Do not genericise the answer; ground it specifically in what this book covers.
Your answer must reflect THIS BOOK'S specific arguments, framework, and perspective — not a generic textbook answer. If the book has a distinct historiographical stance (e.g. Sekhar Bandyopadhyay's subaltern/social history lens, Romila Thapar's early India framework, Satish Chandra's medieval synthesis), use that lens explicitly in your answer.
${ragContext}`
      : system;


    // Detect MCQ/Prelims question
    const lastUserMsg = messages?.[messages.length - 1]?.content ?? '';
    const isMCQ = typeof lastUserMsg === 'string' && (
      /\(a\)|\(b\)|\(c\)|\(d\)/.test(lastUserMsg) ||
      /which of the following/i.test(lastUserMsg) ||
      /consider the following/i.test(lastUserMsg) ||
      /correct answer|mcq|prelims|pyq/i.test(lastUserMsg)
    );

    // Routing:
    // bookMode ON  → Sonnet 4.6 (Anthropic — RAG quality)
    // bookMode OFF → Groq Qwen3-32B (subscription — MCQ + normal chat)
    let text: string;

    if (bookMode) {
      // Book mode → Anthropic Sonnet 4.6
      const anthropicResponse = await anthropicCall('claude-sonnet-4-6', ragSystem);
      const raw = anthropicResponse.content?.[0]?.type === 'text'
        ? anthropicResponse.content[0].text
        : 'No response';
      text = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    } else {
      // Normal chat + MCQ → Groq Qwen3
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'qwen/qwen3-32b',
          messages: [
            ...(ragSystem ? [{ role: 'system', content: ragSystem }] : []),
            ...messages,
          ],
          max_tokens: 4000,
        }),
      });
      const groqData = await groqRes.json();
      const groqRaw = groqData.choices?.[0]?.message?.content || 'No response';
      text = groqRaw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    }
    return NextResponse.json({ content: [{ text }], sources: ragSources });
  } catch {
    return NextResponse.json({ content: [{ text: 'Something went wrong. Please try again.' }] });
  }
}
