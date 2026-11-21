import { NextRequest, NextResponse } from 'next/server';
import { anthropicClient, deepseekClient } from '@/lib/claude';
import { streamGeminiPdf } from '@/lib/geminiPdf';
import { checkRateLimit, clientIp, tooManyRequests } from '@/lib/rateLimit';
import { consumeUsage, releaseUsage } from '@/lib/usageQuota';
import { createSentenceGate } from '@/lib/citationGate';
import { suggestNext } from '@/lib/chatNext';

export const maxDuration = 90;
import { createClient } from "@supabase/supabase-js";
import { MENTOR_SYSTEM, MAINS_ANSWER_STYLE, buildRagBasePrompt } from '@/lib/prompts';
import { retrieve as retrievePassages } from '@/lib/rag/retrieve';
import { formatPassages, formatTimeline, sourcesForClient } from '@/lib/rag/context';
import { checkDates } from '@/lib/rag/dateCheck';


const RATE_LIMIT = 20; // max 20 messages per 10 minutes per IP
const CHAT_FREE_LIMIT = 3; // lifetime (no reset)
const OWNER_EMAIL = process.env.OWNER_EMAIL!;

export async function POST(req: NextRequest) {
  // ── IP rate limit ────────────────────────────────────────────────
  const { allowed: withinRate } = await checkRateLimit(`chat:${clientIp(req)}`, {
    limit: RATE_LIMIT,
    windowSeconds: 10 * 60,
  });
  if (!withinRate) return tooManyRequests();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const token = req.headers.get('x-user-token') ?? '';
  const fingerprint = req.headers.get('x-fingerprint') ?? '';

  // One token verification for the request. This ran twice against Google
  // before: once for the owner/premium check and again for the quota read.
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
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('firebase_uid', decoded.uid)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();
        if (sub) isPremium = true;
      }
    } catch {}
  }

  // Free chats require an account, for the same reason evaluations do: an
  // anonymous caller is metered only by a request header they control.
  const metered = !isOwner && !isPremium;
  if (metered && !firebaseUid) {
    return NextResponse.json({ error: 'login_required' }, { status: 401 });
  }

  // Claimed before the model call, not after it. The old order read the count,
  // streamed the answer, then wrote count+1, so parallel requests all saw the
  // same starting value. The increment also only ran when a token was present,
  // which made anonymous chat unlimited outright.
  if (metered) {
    const { allowed } = await consumeUsage(firebaseUid, fingerprint || null, 'chat_count', CHAT_FREE_LIMIT);
    if (!allowed) return NextResponse.json({ error: 'limit_reached' }, { status: 403 });
  }

  const refundChat = async () => {
    if (metered) await releaseUsage(firebaseUid, fingerprint || null, 'chat_count');
  };
  
  // ── Main request handler ────────────────────────────────────────
  try {
    const { messages, bookMode, bookTitle, pdf_base64, pdf_name, lang, mentorMode, responseStyle, brainstormMode, format, stages } = await req.json();
    // Brainstorm is a paid mode, and the client's say-so is not a subscription.
    const brainstorm = Boolean(brainstormMode) && (isPremium || isOwner);
    // One message can ask for a Mains answer whatever the chosen style is:
    // "Turn this into a Mains answer" and a picked PYQ both do. Mentor mode
    // has its own format and keeps it.
    const style: string = format === 'mains' && !mentorMode ? 'mains' : responseStyle;
    const maxTokens = mentorMode ? 3500 : (style === 'elaborative' ? 3500 : style === 'mains' ? 2500 : 1800);

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

    const STYLE_RULE = style === 'mains'
      ? MAINS_ANSWER_STYLE
      : style === 'elaborative'
      ? `RESPONSE STYLE — ELABORATIVE: Flowing prose paragraphs (3-5 sentences each). Cover sub-arguments and historiographical debates in depth.`
      : `RESPONSE STYLE — CONCISE: Bullet points only. Format: **Bold label** — 1 crisp line max. Intro: 1-2 lines. Conclusion: 1-2 lines. No walls of text.`;

    const system = brainstorm
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

    // ── RAG: book context for normal chat and bookMode ──────────────────
    // Run inside the stream, not before it. The search takes seconds, and
    // while it ran here the response had not started, so the page could only
    // show a spinner; now the reader is told it is searching and what it found.
    const lastQ = typeof messages?.[messages.length - 1]?.content === 'string'
      ? messages[messages.length - 1].content
      : '';
    type RagSource = { book_title: string; author: string; content: string };
    type Grounding = { ragContext: string; ragSources: RagSource[]; timeline: string; claims: string[] };
    const NO_GROUNDING: Grounding = { ragContext: '', ragSources: [], timeline: '', claims: [] };
    // Planned, filtered and reranked search over the tagged collection, plus
    // the curated timeline rows for the question (lib/rag/retrieve.ts). When it
    // fails the answer goes without passages: none is better than wrong ones.
    const retrieve = async (): Promise<Grounding> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const r = await retrievePassages(lastQ, {
          bookTitle: bookMode && bookTitle && bookTitle !== 'all' ? bookTitle : null,
          signal: controller.signal,
        });
        console.log(`[rag] ${r.stage}: ${r.hits.length} passages, ${r.events.length} timeline rows in ${r.ms} ms`,
          JSON.stringify({ subjects: r.plan.subjects, periods: r.plan.periods, topics: r.plan.topics }));
        return { ragContext: formatPassages(r.hits), ragSources: sourcesForClient(r.hits), timeline: formatTimeline(r.events), claims: r.plan.claims };
      } catch (e) {
        console.error('[rag] retrieval failed, answering without passages:', e);
        return NO_GROUNDING;
      } finally {
        clearTimeout(timer);
      }
    };

    const systemFor = (g: Grounding) => {
      if (!g.ragContext && !g.timeline && !g.claims.length) return system;
      const ragBasePrompt = buildRagBasePrompt({ responseStyle: style, bookTitle, ragContext: g.ragContext, timeline: g.timeline, claims: g.claims });
      return (mentorMode && isPremium ? MENTOR_SYSTEM + '\n\n' : system + '\n\n') + ragBasePrompt;
    };


    // Detect MCQ/Prelims question
    const lastUserMsg = messages?.[messages.length - 1]?.content ?? '';
    const isMCQ = typeof lastUserMsg === 'string' && (
      /\(a\)|\(b\)|\(c\)|\(d\)/.test(lastUserMsg) ||
      /which of the following/i.test(lastUserMsg) ||
      /consider the following/i.test(lastUserMsg) ||
      /correct answer|mcq|prelims|pyq/i.test(lastUserMsg)
    );

    // Routing, one model per mode:
    //   PDF mode      → Claude Haiku 4.5, which reads the document; Gemini
    //                   takes over if the Anthropic call fails first
    //   Hindi mode    → Claude Haiku 4.5 (DeepSeek's Hindi is weaker)
    //   Mentor mode   → DeepSeek in English, Haiku in Hindi
    //   Normal chat   → DeepSeek
    // DeepSeek is spoken to through its Anthropic-compatible endpoint
    // (lib/claude.ts), so both sides stream the same way.
    // ── Streaming response ──────────────────────────────────────────
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));
        // Sentences are released as soon as they are complete and audited,
        // rather than the whole answer being held back for a post-pass. See
        // lib/citationGate.ts for why the buffer existed and why it no longer
        // has to.
        const gate = createSentenceGate(send);
        // The raw answer is kept as well, for writing the follow-up suggestion.
        let answerText = '';
        const collect = (chunk: string) => { answerText += chunk; gate.push(chunk); };
        // Progress lines for the page's checklist, ahead of any answer text.
        // Only for a client that asked: one still running the old script
        // would print them into the answer.
        const stage = (event: Record<string, unknown>) => {
          if (stages) send('__STAGE__' + JSON.stringify(event) + '\n');
        };
        let ragSources: RagSource[] = [];
        try {
          let grounding = NO_GROUNDING;
          if (!pdf_base64 && lastQ.length > 3) {
            stage({ id: 'search', book: bookMode && bookTitle && bookTitle !== 'all' ? bookTitle : null });
            grounding = await retrieve();
            ragSources = grounding.ragSources;
            stage({ id: 'found', passages: ragSources.length, books: [...new Set(ragSources.map(r => r.book_title))] });
          } else if (pdf_base64) {
            stage({ id: 'pdf', name: pdf_name ?? null });
          }
          stage({ id: 'write' });

          const systemPrompt = systemFor(grounding) + (lang === 'hi' ? '\n\nCRITICAL INSTRUCTION: You MUST respond ENTIRELY in Hindi (Devanagari script) regardless of the language of the question. Every single word of your response must be in Hindi. Do NOT use English even for technical terms — transliterate them. Historical names, dates, and places should use their Hindi equivalents. The one exception is citation markers: write them exactly as [Source #1] or [Source #1, #3], in English with Western digits, never translated, so they can be linked to their passages.' : '\n\nCRITICAL INSTRUCTION: You MUST respond ENTIRELY in English regardless of the language of the question.');

          // Whether the model ended on its own, not at its length limit.
          // Answers often close on a list item with no full stop, which the
          // gate would otherwise take for a cut-off sentence and drop.
          let ended = false;
          /** One DeepSeek stream, read the same way as the Anthropic ones.
           *  Without a DeepSeek key the call goes to Haiku instead, so the
           *  chat keeps answering rather than failing. */
          const runDeepSeek = async (sys: string) => {
            const deepseek = deepseekClient();
            const plain = messages.map((m: any) => ({ role: m.role, content: m.content }));
            const params: any = deepseek
              ? { model: 'deepseek-flash', max_tokens: maxTokens, system: sys, messages: plain, thinking: { type: 'disabled' } }
              : { model: 'claude-haiku-4-5-20251001', max_tokens: maxTokens, system: sys, messages: plain };
            const s = (deepseek ?? anthropicClient()).messages.stream(params);
            for await (const chunk of s as any) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                collect(chunk.delta.text);
              } else if (chunk.type === 'message_delta') {
                ended = chunk.delta.stop_reason === 'end_turn' || chunk.delta.stop_reason === 'stop_sequence';
              }
            }
          };

          if (pdf_base64) {
            // PDF mode — Haiku reads the document. Gemini reads it too, and
            // takes over if Anthropic refuses the call before any text.
            const anthropic = anthropicClient();
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
            let haikuText = '';
            const pdfCollect = (t: string) => { haikuText += t; collect(t); };
            try {
              const anthropicStream = anthropic.messages.stream({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: maxTokens,
                system: systemPrompt,
                messages: msgsCopy,
              });
              for await (const chunk of anthropicStream) {
                if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                  pdfCollect(chunk.delta.text);
                } else if (chunk.type === 'message_delta') {
                  ended = chunk.delta.stop_reason === 'end_turn' || chunk.delta.stop_reason === 'stop_sequence';
                }
              }
            } catch (e) {
              // Switch only when nothing went out; once Haiku has written, a
              // second opening below its text would read as a muddle.
              if (haikuText) throw e;
              console.error('PDF chat: Haiku failed, using Gemini:', e);
              ended = await streamGeminiPdf({ system: systemPrompt, messages, pdfBase64: pdf_base64, maxTokens, onText: collect });
            }
          } else if (lang === 'hi') {
            // Hindi mode, mentor included — Haiku (DeepSeek's Hindi is weaker)
            const anthropic = anthropicClient();
            const builtMessages = messages.map((m: any, i: number) => {
              if (i === messages.length - 1 && m.role === 'user') {
                return { role: m.role, content: m.content + '\n\n[IMPORTANT: Respond entirely in Hindi (Devanagari script), keeping citation markers as [Source #N]]' };
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
              } else if (chunk.type === 'message_delta') {
                ended = chunk.delta.stop_reason === 'end_turn' || chunk.delta.stop_reason === 'stop_sequence';
              }
            }
          } else {
            // Normal chat and mentor mode — DeepSeek.
            await runDeepSeek(systemPrompt);
          }

          gate.flush(ended);
          // Logged for review, not shown: the check only matches sentences that
          // name one timeline event, and no row is verified yet.
          for (const issue of checkDates(answerText)) {
            console.warn(`[rag] date ${issue.severity}: ${issue.said} (${issue.event.id}) in: ${issue.sentence.slice(0, 160)}`);
          }
          if (gate.emitted() === 0) send('Something went wrong. Please try again.');
          else if (stages) {
            // Before the sources, whose JSON runs to the end of the stream.
            // Only for a client that asked for stages; older ones would print it.
            const next = await suggestNext(lastQ, answerText, lang === 'hi' ? 'hi' : 'en');
            if (next) send('\n__NEXT__' + JSON.stringify(next));
          }

          send('\n__SOURCES__' + JSON.stringify(ragSources));
        } catch (err) {
          // The chat was claimed before the model call; nothing was delivered.
          await refundChat();
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
