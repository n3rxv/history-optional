import { NextRequest, NextResponse } from 'next/server';
import { fixSentenceSpacing } from '@/lib/textSpacing';

export const maxDuration = 90;
import { createClient } from "@supabase/supabase-js";
import {
  WHITELISTED_HISTORIAN_BOOKS,
  WHITELISTED_HISTORIAN_SURNAMES,
  BROAD_ONLY_HISTORIANS,
  ALL_KNOWN_HISTORIAN_NAMES,
  MENTOR_SYSTEM,
  buildRagBasePrompt,
} from '@/lib/prompts';

const chatLimits = new Map<string, { count: number; ts: number }>();

// Voyage AI — embed + rerank (voyage-4-lite, rerank-2-lite)
async function localEmbedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ model: 'voyage-4-lite', input: texts, input_type: 'query' }),
  });
  const data = await res.json();
  if (!data.data) throw new Error('Voyage embed failed: ' + JSON.stringify(data));
  return data.data.map((item: any) => item.embedding);
}

async function localRerank(query: string, chunks: {id: any, content: string, book_title: string, author: string}[]): Promise<{id: any, content: string, book_title: string, author: string, score: number}[]> {
  try {
    const res = await fetch('https://api.voyageai.com/v1/rerank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({ model: 'rerank-2-lite', query, documents: chunks.map(c => c.content), top_k: 6 }),
    });
    const data = await res.json();
    if (!data.data) return chunks.slice(0, 6).map(c => ({ ...c, score: 0 }));
    return data.data.map((r: any) => ({ ...chunks[r.index], score: r.relevance_score }));
  } catch (e) {
    console.error('Voyage rerank failed:', e);
    return chunks.slice(0, 6).map(c => ({ ...c, score: 0 }));
  }
}

async function getBookContext(query: string, bookTitle?: string): Promise<string> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    const filter = (bookTitle && bookTitle !== "all") ? bookTitle : null;

    // Step 1 (optimized): Single embedding, no query expansion
    const [singleEmbedding] = await localEmbedBatch([query]);

    // Step 2: Search
    let results;
    if (!filter) {
      // All Books mode: single DB round-trip using match_book_chunks_diverse,
      // which does the per-book top-3 ranking INSIDE Postgres (via a window
      // function) instead of 25 separate network round-trips from here.
      results = await Promise.all([
        supabase.rpc('match_book_chunks_diverse', {
          query_embedding: singleEmbedding,
          per_book_count: 3,
        })
      ]);
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
    const allChunks: {id: any, content: string, book_title: string, author: string, similarity: number}[] = [];
    for (const result of results) {
      if (result.error) {
        console.error('Supabase RPC error:', result.error);
      }
      for (const chunk of (result.data ?? [])) {
        if (!seen.has(chunk.id)) {
          seen.add(chunk.id);
          allChunks.push({ id: chunk.id, content: chunk.content, book_title: chunk.book_title, author: chunk.author, similarity: chunk.similarity });
        }
      }
    }

    if (allChunks.length === 0) return '';

    // Step 4b: Filter low-similarity chunks before reranking
    // (similarity < 0.45 means book likely doesn't cover this topic)
    const filtered = allChunks.filter((c) => (c.similarity ?? 1) > 0.45);
    // Rerank removed — similarity sort is sufficient, Render free tier too slow
    const topChunks = (filtered.length >= 3 ? filtered : allChunks).slice(0, 4);
    console.log(`Chunks before filter: ${allChunks.length}, after: ${topChunks.length}`);

    // Ensure diversity - max 2 chunks per book
    const finalChunks: typeof topChunks = [];
    const bookCount: Record<string, number> = {};
    const overflow: typeof topChunks = [];

    for (const chunk of topChunks) {
      const count = bookCount[chunk.book_title] ?? 0;
      if (count < 2) {
        finalChunks.push(chunk);
        bookCount[chunk.book_title] = count + 1;
      } else {
        overflow.push(chunk);
      }
      if (finalChunks.length >= 6) break;
    }
    for (const chunk of overflow) {
      if (finalChunks.length >= 6) break;
      finalChunks.push(chunk);
    }

    // Step 7: Return chunks with source labels
    return finalChunks
      .map((c, i) => `[Source ${i + 1} — ${c.book_title} | Author: ${c.author}]\n${c.content.slice(0, 600)}`)
      .join('\n\n---\n\n');

  } catch (e) {
    console.error('RAG error:', e);
    return '';
  }
}
const RATE_LIMIT = 20; // max 20 messages per 10 minutes per IP
const CHAT_FREE_LIMIT = 3; // lifetime (no reset)
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
  const fingerprint = req.headers.get('x-fingerprint') ?? '';

  // Firebase auth check
  let isOwner = false;
  let isPremium = false;
  let firebaseUid = '';

  if (token) {
    try {
      const { adminAuth } = await import('@/lib/firebaseAdmin');
      const decoded = await adminAuth.verifyIdToken(token);
      firebaseUid = decoded.uid;
      if (decoded.email === OWNER_EMAIL) isOwner = true;
      if (!isOwner) {
        const nowISO = new Date().toISOString();
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('firebase_uid', decoded.uid)
          .eq('status', 'active')
          .gt('expires_at', nowISO)
          .single();
        if (sub) isPremium = true;
      }
    } catch {}
  }

  // Fingerprint + firebase_uid based usage check
  if (!isOwner && !isPremium) {
    let used = 0;
    if (token) {
      try {
        const { adminAuth: auth2 } = await import('@/lib/firebaseAdmin');
        const dec = await auth2.verifyIdToken(token);
        const { data: byUid } = await supabase
          .from('usage_tracking')
          .select('chat_count')
          .eq('firebase_uid', dec.uid)
          .single();
        used = Math.max(used, byUid?.chat_count ?? 0);
      } catch {}
    }
    if (fingerprint) {
      const { data: byFp } = await supabase
        .from('usage_tracking')
        .select('chat_count')
        .eq('fingerprint', fingerprint)
        .single();
      used = Math.max(used, byFp?.chat_count ?? 0);
    }
    if (used >= CHAT_FREE_LIMIT)
      return NextResponse.json({ error: 'limit_reached' }, { status: 403 });
  }
  
  // ── Main request handler ────────────────────────────────────────
  try {
    const { messages, bookMode, bookTitle, pdf_base64, pdf_name, lang, mentorMode, responseStyle, brainstormMode } = await req.json();
    const maxTokens = mentorMode ? 3500 : (responseStyle === 'elaborative' ? 3500 : 1800);

    // ── Build system prompt server-side (never from client) ──────────
    const SCOPE_GUARD = `SCOPE GUARD: You help with UPSC History Optional preparation. The syllabus is WIDE — assume a question is in scope unless it clearly is not.

IN SCOPE — Paper I: Indian history from prehistory and the Harappan civilisation through ancient, medieval, modern and up to 1964, plus sources, archaeology and historiography.
IN SCOPE — Paper II (World History), all of these count:
- Enlightenment and modern ideas, INCLUDING its philosophers by name: Kant, Rousseau, Montesquieu, Locke, Voltaire, Adam Smith
- Origins of modern politics; English, American and French Revolutions; liberalism, nationalism, socialism, Marxism, fascism as political ideas
- Industrialisation and its social and economic effects
- Nation-state system; imperialism and colonialism; revolution and counter-revolution
- The World Wars; the world after 1945; decolonisation and underdevelopment
- Unification of Europe and the European Union; NATO; the League of Nations and the UN
- Disintegration of the USSR, the unipolar world, and GLOBALIZATION and its social and economic consequences

DEFAULT TO ANSWERING. If a message is phrased as an exam question — a quoted statement plus a directive such as "Critically examine", "Analyse", "Comment", "Elucidate", "Discuss", "Evaluate", "Examine" — it is an exam question from a real paper: answer it. Political philosophy, economic history, international relations and contemporary global processes are all examinable under Paper II and must NOT be refused as "philosophy" or "outside history".

Refuse only what is genuinely unrelated to the exam — coding help, medical or legal advice, personal chit-chat. When you do refuse, say so in one line. Never refuse a question a second time after the user has confirmed they want it answered.`;

    const WRITING_RULES = `WRITING RULES:
- NEVER write a historian name as a bare bullet — always "**Name** argues that..." within the bullet.
- NEVER add a separate "Key Historians Cited" list. Weave references into the body.
- Use **bold** for key terms, historian names, pivotal events — within sentences only.
- Do NOT use ### headings — use **bold** for section titles only.
- Include specific dates, names, events for empirical weight.
- Use plain English spellings only — no diacritical marks.`;

    const STYLE_RULE = responseStyle === 'elaborative'
      ? `RESPONSE STYLE — ELABORATIVE: Flowing prose paragraphs (3-5 sentences each). Cover sub-arguments and historiographical debates in depth.`
      : `RESPONSE STYLE — CONCISE: Bullet points only. Format: **Bold label** — 1 crisp line max. Intro: 1-2 lines. Conclusion: 1-2 lines. No walls of text.`;

    const system = brainstormMode
      ? `You are an expert UPSC History Optional strategist helping the user brainstorm.

${SCOPE_GUARD}

If given a TOPIC: Key Arguments & Dimensions (6-8 angles), Important Historians & Their Stands (5-6), Connecting Themes.
If given a QUESTION: Decoding the Question, Must-Include Points, Historiographical Ammunition.
Use **bold** for key terms. Be crisp — this is a planning tool.`
      : `You are an expert UPSC History Optional tutor.

${SCOPE_GUARD}

Always use UPSC format: Introduction, Body (subheadings), Conclusion.
For descriptive questions: explain clearly, facts first, historiography concise.
For argumentative questions: multiple perspectives, clear weighted stance, use historiography.

${WRITING_RULES}

${STYLE_RULE}${pdf_base64 ? "\n\nThe user has uploaded a PDF. Analyze it carefully and answer questions about it." : ""}`;
    const lastMsg = messages?.[messages.length - 1]?.content ?? '';
    if (typeof lastMsg === 'string' && lastMsg.length > 10000)
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    if (!Array.isArray(messages) || messages.length > 50)
      return NextResponse.json({ error: 'Too many messages in context' }, { status: 400 });

    const anthropicCall = async (model: string, systemPrompt: string | undefined, withPdf = false) => {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      // Build messages — inject PDF as document in first user message if present
      let builtMessages: any[];
      if (withPdf && pdf_base64) {
        // Find last user message index
        const msgsCopy = messages.map((m: any) => ({ role: m.role, content: m.content }));
        // Inject PDF document block into the FIRST user turn only
        const firstUserIdx = msgsCopy.findIndex((m: any) => m.role === 'user');
        if (firstUserIdx !== -1) {
          msgsCopy[firstUserIdx] = {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdf_base64,
                },
                title: pdf_name ?? 'Uploaded PDF',
                cache_control: { type: 'ephemeral' },
              },
              { type: 'text', text: typeof messages[firstUserIdx].content === 'string' ? messages[firstUserIdx].content : 'Please analyze this PDF.' },
            ],
          };
        }
        builtMessages = msgsCopy;
      } else {
        builtMessages = messages.map((m: any) => ({ role: m.role, content: m.content }));
      }

      return anthropic.messages.create({
        model,
        max_tokens: 3500,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: builtMessages,
      });
    };

    // ── RAG: always inject book context (normal chat + bookMode) ────────
    let ragContext = '';
    let ragSources: { book_title: string; author: string; content: string }[] = [];
    const lastQ = typeof messages?.[messages.length - 1]?.content === 'string'
      ? messages[messages.length - 1].content
      : '';
    if (!pdf_base64 && lastQ.length > 3) {
      try {
        // bookMode passes bookTitle filter; normal chat uses "all" (diverse across books)
        ragContext = await Promise.race([
          getBookContext(lastQ, bookMode ? bookTitle : 'all'),
          new Promise<string>((_, reject) => setTimeout(() => reject(new Error('RAG timeout')), 10000)),
        ]);
        ragSources = ragContext
          .split('\n\n---\n\n')
          .map(block => {
            const match = block.match(/^\[Source \d+ — (.+?) \| Author: (.+?)\]\n([\s\S]+)$/);
            if (match) return { book_title: match[1], author: match[2], content: match[3] };
            return null;
          })
          .filter(Boolean) as { book_title: string; author: string; content: string }[];
      } catch(e) {
        console.error('RAG skipped (embed service timeout or error):', e);
        ragContext = '';
        ragSources = [];
      }
    }


    
const ragBasePrompt = buildRagBasePrompt({ responseStyle, bookTitle, ragContext });

const ragSystem = ragContext
  ? (mentorMode && isPremium ? MENTOR_SYSTEM + '\n\n' : system + '\n\n') + ragBasePrompt
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
    // ALL responses → Claude Haiku 4.5 (Anthropic) — Groq removed in favour
    // of consistent citation/RAG quality across both bookMode and normal chat.
    // ── Streaming response ──────────────────────────────────────────
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));
        const collect = (chunk: string) => { fullAnswer += chunk; };
        let fullAnswer = '';
        try {
          const systemPrompt = ragSystem + (lang === 'hi' ? '\n\nCRITICAL INSTRUCTION: You MUST respond ENTIRELY in Hindi (Devanagari script) regardless of the language of the question. Every single word of your response must be in Hindi. Do NOT use English even for technical terms — transliterate them. Historical names, dates, and places should use their Hindi equivalents.' : '\n\nCRITICAL INSTRUCTION: You MUST respond ENTIRELY in English regardless of the language of the question.');

          if (pdf_base64) {
            // PDF mode — Haiku only (DeepSeek does not support document input)
            const Anthropic = (await import('@anthropic-ai/sdk')).default;
            const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
            const msgsCopy = messages.map((m: any) => ({ role: m.role, content: m.content }));
            const firstUserIdx = msgsCopy.findIndex((m: any) => m.role === 'user');
            if (firstUserIdx !== -1) {
              msgsCopy[firstUserIdx] = {
                role: 'user',
                content: [
                  { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf_base64 }, title: pdf_name ?? 'Uploaded PDF', cache_control: { type: 'ephemeral' } },
                  { type: 'text', text: typeof messages[firstUserIdx].content === 'string' ? messages[firstUserIdx].content : 'Please analyze this PDF.' },
                ],
              };
            }
            const anthropicStream = anthropic.messages.stream({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: maxTokens,
              system: systemPrompt,
              messages: msgsCopy,
            });
            for await (const chunk of anthropicStream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                collect(chunk.delta.text);
              }
            }
          } else if (lang === 'hi') {
            // Hindi mode — Haiku (DeepSeek Hindi quality weak hai)
            const Anthropic = (await import('@anthropic-ai/sdk')).default;
            const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
            const builtMessages = messages.map((m: any, i: number) => {
              if (i === messages.length - 1 && m.role === 'user') {
                return { role: m.role, content: m.content + '\n\n[IMPORTANT: Respond entirely in Hindi (Devanagari script)]' };
              }
              return { role: m.role, content: m.content };
            });
            const anthropicStream = anthropic.messages.stream({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: maxTokens,
              system: systemPrompt,
              messages: builtMessages,
            });
            for await (const chunk of anthropicStream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                collect(chunk.delta.text);
              }
            }
          } else {
            // Normal chat — Groq GPT-OSS-120B (on_demand)
            const builtMessages = messages.map((m: any) => ({ role: m.role, content: m.content }));
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
              },
              signal: AbortSignal.timeout(45000),
              body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                max_tokens: maxTokens,
                stream: true,
                messages: [
                  { role: 'system', content: systemPrompt },
                  ...builtMessages,
                ],
              }),
            });
            if (!groqRes.ok || !groqRes.body) throw new Error(`Groq API error: ${groqRes.status}`);
            const reader = groqRes.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() ?? '';
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (trimmed.startsWith('data: ')) {
                  try {
                    const json = JSON.parse(trimmed.slice(6));
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) collect(delta);
                  } catch {}
                }
              }
            }
          }
          // ── Post-generation citation verification (optimized) ──────
          // Runs after every response (Groq removed — Haiku now generates
          // all answers). Catches two attribution patterns:
          //    the bracket is stripped if wrong (claim text is kept, since
          //    it may be true even if misattributed).
          // 2. Prose-style: "Author argues/notes/draws a parallel that..."
          //    with no brackets at all — detected by scanning for any
          //    whitelisted historian surname appearing in the answer text.
          //    These are riskier: the ENTIRE sentence is removed if
          //    unverified, because unlike a misattributed real quote, a
          //    fabricated prose claim has no underlying fact to preserve —
          //    the argument itself was invented, not just mis-sourced.
          try {
            // Debug logging
            // Skip verifier if answer uses Source #N style citations (Voyage RAG)
            // — these are already grounded in passages, no bracket/prose misattribution risk
            const hasSourceCitations = /Source #\d+/.test(fullAnswer);
            if (hasSourceCitations) {
              // No stripping needed — citations are inline Source #N references
            } else {
            const bracketPattern = /\([A-Z][a-zA-Z.\s]+?,\s*[^)]+?\)/g;
            const sentences = fullAnswer.match(/[^.!?]*[.!?]+/g) ?? [fullAnswer];

            // ── LAYER 1+2: Pre-verifier (no API call) ─────────────────────────
            // Strip without calling API:
            // Rule A: BROAD_ONLY historians (Majumdar, Nizami, Jha etc.) with specific claims → strip sentence
            // Rule B: Unknown bracket book title not in historian's verified list → strip bracket
            const BROAD_ONLY = ['Jha', 'Nizami', 'Riazul Islam', 'Surendra Gopal', 'Majumdar', 'K.A. Nizami', 'R.C. Majumdar', 'D.N. Jha'];
            const specificClaimPattern = /argues|notes|writes|states|claimed|asserts|observes|emphasises|emphasizes|points out|concludes|suggests|contends|maintains/;

            for (const sentence of [...sentences]) {
              let shouldStrip = false;

              // Rule A: broad-only historian with specific claim or bracket
              for (const name of BROAD_ONLY) {
                if (sentence.includes(name)) {
                  bracketPattern.lastIndex = 0;
                  if (specificClaimPattern.test(sentence) || bracketPattern.test(sentence)) {
                    shouldStrip = true;
                    break;
                  }
                }
              }

              // Rule B: whitelisted historian but cited book not in their verified list
              if (!shouldStrip) {
                for (const [historian, books] of Object.entries(WHITELISTED_HISTORIAN_BOOKS)) {
                  if (sentence.includes(historian)) {
                    const bracketMatches = sentence.match(/\([^)]+\)/g) ?? [];
                    for (const bracket of bracketMatches) {
                      const bl = bracket.toLowerCase();
                      // Skip pure year brackets like (1984)
                      if (/^\(\d{4}\)$/.test(bracket.trim())) continue;
                      // Check if it looks like a book title (has letters beyond just a year)
                      if (/[a-zA-Z]{4,}/.test(bracket)) {
                        const bookVerified = books.some(b => bl.includes(b.slice(0, 10).toLowerCase()));
                        if (!bookVerified) {
                          fullAnswer = fullAnswer.split(bracket).join('').replace(/\s+([.,;])/g, '$1');
                        }
                      }
                    }
                  }
                }
              }

              if (shouldStrip && fullAnswer.includes(sentence)) {
                fullAnswer = fullAnswer.split(sentence).join('').replace(/[ \t]{2,}/g, ' ');
              }
            }

            // ── LAYER 3: API verifier — DISABLED (Groq hangs, RAG already grounds answers) ────
            if (false) {
            const updatedSentences = fullAnswer.match(/[^.!?]*[.!?]+/g) ?? [fullAnswer];
            bracketPattern.lastIndex = 0;

            const sentencesWithBracket = updatedSentences.filter(s => {
              bracketPattern.lastIndex = 0;
              return bracketPattern.test(s);
            });
            const sentencesWithSurname = updatedSentences.filter(s =>
              WHITELISTED_HISTORIAN_SURNAMES.some(name => s.includes(name))
            );
            const flaggedSentences = updatedSentences.filter(s =>
              sentencesWithBracket.includes(s) || sentencesWithSurname.includes(s)
            );

            if (flaggedSentences.length > 0 && ragSources.length > 0) {
              const citedSnippetBlock = flaggedSentences.join('\n');

              const sourceBlock = ragSources
                .map((s, i) => `[Source ${i + 1} — ${s.book_title} | Author: ${s.author}]\n${s.content}`)
                .join('\n\n---\n\n');

              const verifyRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                },
                signal: AbortSignal.timeout(8000),
                body: JSON.stringify({
                  model: 'llama-3.3-70b-versatile',
                  max_tokens: 800,
                  stream: false,
                  messages: [
                    {
                      role: 'system',
                      content: `You are a strict THREE-LAYER citation auditor for UPSC History answers.

For each flagged sentence, verify ALL three layers:
LAYER 1 — AUTHOR: Does this historian appear in the source passages under their own [Source N | Author: X] label?
LAYER 2 — BOOK: If a book title is cited, does it match the actual book in the passages for that author?
LAYER 3 — CONTENT: Does the specific claim/argument actually appear in that author's passage? Topical similarity is NOT enough.

If ANY layer fails → flag it.

Classify into:
- "bad_brackets": bracket "(Author, Title)" failing any layer. Return ONLY the bracket text exactly.
- "bad_prose_sentences": prose attribution ("Author argues/notes/states...") failing any layer. Return FULL sentence exactly.

A historian mentioned in passing without a specific claim does NOT need layer 3 check.

Respond ONLY with valid JSON, no markdown:
{"bad_brackets": ["(Author, Title)"], "bad_prose_sentences": ["Full sentence."]}

If all pass: {"bad_brackets": [], "bad_prose_sentences": []}`,
                    },
                    {
                      role: 'user',
                      content: `SOURCE PASSAGES:\n${sourceBlock}\n\n---\n\nFLAGGED SENTENCES:\n${citedSnippetBlock}`,
                    },
                  ],
                }),
              });
              const verifyJson = await verifyRes.json();
              const verifyText = verifyJson.choices?.[0]?.message?.content?.trim() ?? '';
              // Extract first valid JSON object — Groq sometimes appends extra text
              const jsonMatch = verifyText.match(/\{[\s\S]*?\}/);
              if (!jsonMatch) throw new Error('No JSON found in verify response');
              const cleaned = jsonMatch[0];
              const parsed = JSON.parse(cleaned) as { bad_brackets: string[]; bad_prose_sentences: string[] };

              for (const bad of parsed.bad_brackets ?? []) {
                if (fullAnswer.includes(bad)) {
                  fullAnswer = fullAnswer.split(bad).join('').replace(/\s+([.,;])/g, '$1');
                }
              }
              for (const bad of parsed.bad_prose_sentences ?? []) {
                if (fullAnswer.includes(bad)) {
                  fullAnswer = fullAnswer.split(bad).join('').replace(/[ \t]{2,}/g, ' ');
                }
              }
            }
            } // end if(false) layer 3
            } // end else (non-Source#N citations)
          } catch (verifyErr) {
            // Verification is best-effort — if it fails, fall back to
            // sending the unverified answer rather than blocking the
            // response entirely.
            console.error('Citation verification failed:', verifyErr);
          }


          // Strip incomplete trailing sentence (stream cut mid-sentence)
          const endsClean = /[.!?]["'»]?\s*$/.test(fullAnswer.trimEnd());
          if (!endsClean) {
            const lastClean = fullAnswer.trimEnd().lastIndexOf('.');
            const lastQ = fullAnswer.trimEnd().lastIndexOf('?');
            const lastE = fullAnswer.trimEnd().lastIndexOf('!');
            const lastPunct = Math.max(lastClean, lastQ, lastE);
            if (lastPunct > fullAnswer.length * 0.5) {
              fullAnswer = fullAnswer.slice(0, lastPunct + 1).trimEnd();
            }
          }
          // Model sometimes drops the space after a full stop — normalise here so
          // the saved history and the PDF export get the fix too, not just the view.
          fullAnswer = fixSentenceSpacing(fullAnswer);
          if (!fullAnswer.trim()) fullAnswer = 'Something went wrong. Please try again.';
          send(fullAnswer);

          // Increment chat_count for all users (except owner) — analytics + abuse prevention
          if (!isOwner && firebaseUid) {
            try {
              const { createClient: ccInc } = await import('@supabase/supabase-js');
              const sbInc = ccInc(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
              const { data: existingChat } = await sbInc
                .from('usage_tracking')
                .select('chat_count')
                .eq('firebase_uid', firebaseUid)
                .single();
              const newChatCount = (existingChat?.chat_count ?? 0) + 1;
              await sbInc.from('usage_tracking')
                .update({ chat_count: newChatCount, updated_at: new Date().toISOString() }).eq('firebase_uid', firebaseUid);
              // Also update FP row to block multi-account abuse
              if (fingerprint && firebaseUid) {
                await sbInc.from('usage_tracking')
                  .upsert({ fingerprint, firebase_uid: firebaseUid, chat_count: newChatCount }, { onConflict: 'fingerprint' });
              }
            } catch (incErr) {
              console.log('chat_count increment failed', incErr);
            }
          }

          send('\n__SOURCES__' + JSON.stringify(ragSources));
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error('Chat stream error:', errMsg);
          let userMsg = 'Something went wrong. Please try again.';
          if (errMsg.includes('503') || errMsg.includes('high demand')) userMsg = 'AI is experiencing high demand. Please try again in a moment.';
          else if (errMsg.includes('429') || errMsg.includes('quota')) userMsg = 'Too many requests. Please wait a moment and try again.';
          send(userMsg);
        } finally {
          controller.close();
        }
      }
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Accel-Buffering': 'no', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive' } });
  } catch (err) {
    console.error('Chat API error:', err);
    const errMsg = err instanceof Error ? err.message : String(err);
    let userMsg = 'Something went wrong. Please try again.';
    if (errMsg.includes('503') || errMsg.includes('Service Unavailable') || errMsg.includes('high demand')) {
      userMsg = 'AI is experiencing high demand right now. Please try again in a moment.';
    } else if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('rate limit')) {
      userMsg = 'Too many requests. Please wait a moment and try again.';
    } else if (errMsg.includes('413') || errMsg.includes('too large')) {
      userMsg = 'PDF is too large. Please try a smaller file (under 20MB).';
    }
    return NextResponse.json({ content: [{ text: userMsg }] });
  }
}
