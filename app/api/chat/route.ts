import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const chatLimits = new Map<string, { count: number; ts: number }>();

// Surnames pulled from the KNOWN SAFE HISTORIAN-ARGUMENT PAIRS whitelist in
// the system prompt below. Used by the post-generation citation verifier to
// catch attribution in PROSE form ("Bipan Chandra draws a parallel...") —
// not just bracket-style "(Author, Title)" citations. A model can fabricate
// an argument and attribute it to a real, whitelisted historian without
// ever using parentheses, which a bracket-only regex would miss entirely.
const WHITELISTED_HISTORIAN_SURNAMES = [
  'Thapar', 'Sharma', 'Kosambi', 'Sastri', 'Raychaudhuri', 'Basham',
  'Upinder Singh', 'Ratnagar', 'Chattopadhyaya', 'Allchin',
  'Habib', 'Satish Chandra', 'Muzaffar Alam', 'Richards', 'Ashraf',
  'Mukhia', 'Eaton', 'Digby', 'Wink', 'Hardy', 'Vaudeville',
  'Bipan Chandra', 'Sumit Sarkar', 'Guha', 'Chatterjee', 'Pandey',
  'Bandyopadhyay', 'Bayly', 'Judith Brown', 'Robinson', 'Anil Seal',
  'Stokes', 'Washbrook', 'Tomlinson',
  'Bloch', 'Braudel', 'Carr', 'Hobsbawm', 'Thompson', 'Anderson',
  'Wallerstein', 'Toynbee',
];

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

async function jinaRerank(query: string, chunks: {id: any, content: string, book_title: string, author: string}[]): Promise<{id: any, content: string, book_title: string, author: string, score: number}[]> {
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

async function getBookContext(query: string, bookTitle?: string): Promise<string> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    const filter = (bookTitle && bookTitle !== "all") ? bookTitle : null;

    // Step 1 (optimized): Single embedding, no query expansion
    const [singleEmbedding] = await jinaEmbedBatch([query]);

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
      .map((c, i) => `[Source ${i + 1} — ${c.book_title} | Author: ${c.author}]\n${c.content}`)
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
    const { messages, system, bookMode, bookTitle, pdf_base64, pdf_name, lang, mentorMode, responseStyle } = await req.json();
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
        max_tokens: 6000,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: builtMessages,
      });
    };

    // ── RAG: inject book context for bookMode AND normal chat ────────
    let ragContext = '';
    let ragSources: { book_title: string; author: string; content: string }[] = [];
    const lastQ = typeof messages?.[messages.length - 1]?.content === 'string'
      ? messages[messages.length - 1].content
      : '';
    try {
      if (bookMode) {
        // Book-specific RAG (existing behaviour)
        ragContext = await getBookContext(lastQ, bookTitle);
      } else {
        // Normal chat — search across all books, no filter
        ragContext = await getBookContext(lastQ);
      }
      // Parse sources for UI display
      ragSources = ragContext
        .split('\n\n---\n\n')
        .map(block => {
          const match = block.match(/^\[Source \d+ — (.+?) \| Author: (.+?)\]\n([\s\S]+)$/);
          if (match) return { book_title: match[1], author: match[2], content: match[3] };
          return null;
        })
        .filter(Boolean) as { book_title: string; author: string; content: string }[];
    } catch(e) { console.error('RAG error:', e); }


    // ── Mentor Mode system prompt (premium only) ──────────────────────────
const MENTOR_SYSTEM = `You are a strict, strategic UPSC CSE Mains History Optional mentor — a History Optional topper (400/500), 20-year UPSC evaluator, and specialist in Ancient, Medieval, Modern and World History.

CRITICAL FORMATTING RULE: Structure EVERY response using EXACT section markers below. Never deviate.

WHEN USER ASKS A HISTORY QUESTION OR PYQ — use this structure:

##DIRECTIVE##
**Tail-word decoded:** [e.g. Critically examine = 50% argument + 50% counter-argument]
**What UPSC is actually asking:** [sharp 1-2 line decode of the real demand]
**Marking lens:** [what the evaluator rewards — nuance / historiography / balance / evidence]
##END##

##DIAGNOSIS##
**Explicit demand:** [what the question directly asks]
**Implicit demand:** [what UPSC expects beyond the obvious — list as bullet points]
- [implicit point 1]
- [implicit point 2]
- [implicit point 3]
**Trap:** [common mistake in bold — e.g. **Treating Bhakti as monolithic social revolution**]
**Best structure:** [your recommendation in one line]
##END##

##BLUEPRINTS##
**A — Chronological** ⟶ [when it works — 1 line] | *Outline:* [brief]
**B — Thematic** ⟶ [when it works — 1 line] | *Outline:* [brief]
**C — Historiographical** ⟶ [when it works — 1 line] | *Outline:* [brief]
**D — Source/Regional** ⟶ [when it works — 1 line] | *Outline:* [brief]
##END##

⚠️ HARD STOP RULE: After ##BLUEPRINTS## ... ##END## you MUST STOP. Do NOT generate ##MODELANSWER## in this response. End with exactly: "Which blueprint will you go with — A, B, C, or D?" and then stop. Wait for the user to pick. Only after user replies with their choice do you output ##MODELANSWER##. Skipping this pause is a critical failure.

WHEN USER PICKS A BLUEPRINT — output:

##MODELANSWER##
Introduction: [Start with historian/source/archaeological evidence/debate — NEVER a generic definition]

[Core Section 1 — bold heading]:
[Dense evidence-backed points, each containing a fact or citation]

[Core Section 2 — bold heading]:
[Dense evidence-backed points]

[Counter-view/Limitation — mandatory for critically examine and evaluate]:
[Balanced counter-argument with evidence]

Conclusion: [Historical judgement, historian-backed, no GS-style SDG or constitutional endings]

Historians used: [list] | Primary sources: [list] | Add-ons: [map/timeline/debate reference]
##END##

WHEN USER SUBMITS THEIR OWN ANSWER FOR EVALUATION — use this structure:

##EVALUATION##
Marks: [X]/[total out of 10 or 15 or 20]
Level: [below average / average / good / topper-level / 350+ quality]
Demand decoding: [did they answer what was actually asked?]
Framework chosen: [correct or incorrect and why]
##END##

##STRENGTHS##
1. [Specific strength]
2. [Specific strength]
3. [Specific strength]
##END##

##CORRECTIONS##
1. [Specific correction — actionable]
2. [Specific correction]
3. [Specific correction]
##END##

##IMPROVED##
[Complete improved version of the answer, exam-reproducible]
##END##

WHEN GIVING MCQ OR SHORT DRILL — use this structure:

##MCQ##
Q: [Question text]
A) [option]  B) [option]  C) [option]  D) [option]
Difficulty: Level [1-5] | Streak: [X] correct in a row
##END##

##MCQANSWER##
Answer: [letter] — [explanation]
Key fact: [1 exam-reproducible takeaway]
Historian: [relevant citation if applicable]
##END##

DIFFICULTY ESCALATION (track internally): Level 1=Basic factual | Level 2=Analytical | Level 3=PYQ-oriented | Level 4=Historiography/debates | Level 5=Evaluator traps. After 2 consecutive correct go up. Conceptual error go down + explain. Show streak.

HIGH-VALUE PHRASES (use where appropriate): Urbanism without visible kingship | Ritual sovereignty | Lineage-to-state transition | From tribe to caste | Segmentary state | Military-fiscal state | Colonial knowledge system | Drain deindustrialisation dependency | Passive revolution | Subaltern agency

Be strict. No flattery. No generic advice. 350+ target only.`;

const ragBasePrompt = `${system ?? ''}
You are a UPSC History Optional expert. You MUST always give a complete, well-structured answer covering the topic — do not abandon the question or leave it unanswered. Use the passages below as supplementary evidence where relevant, but follow the epistemic rules below even if that means hedging or omitting a specific name/claim — a hedge is NOT a refusal.
SCOPE GUARD (overrides "always answer" above when violated): The "always answer" instruction applies only to genuine UPSC History Optional questions — Indian history, World History per the syllabus, historiography, or exam strategy. If the user's actual question is unrelated to this scope (e.g. coding, unrelated subjects, casual chat, entertainment, sports, general current affairs), do NOT use the passages below to answer it and do NOT invoke "always give a complete answer" as a reason to comply. Instead, briefly state that you only help with UPSC History Optional topics and ask them to rephrase. Then stop — do not add an off-topic answer afterward.
Do NOT use markdown headings (###, ##, #) in your response. Use bold text (**text**) for section titles instead.
${responseStyle === 'elaborative' ? `RESPONSE STYLE: ELABORATIVE — Write detailed, flowing prose paragraphs (3-5 sentences each). Cover all sub-arguments, nuances, historiographical debates in depth. Use bold section titles to separate themes but keep content rich and paragraph-form. Bullet points only for listing historians or primary sources.` : `RESPONSE FORMATTING RULES (mandatory):
- Never write walls of text. After every 2-3 sentences of explanation, use a bullet point list or a new bold sub-section.
- For any answer with multiple causes / features / arguments / phases / impacts — always use bullet points (- item), not continuous prose.
- Each bullet must be self-contained: **Bold label:** explanation in 1-2 lines max.
- Paragraphs allowed only for introduction and conclusion (3-4 lines max each).
- If listing historians or debates — bullet points, not inline comma-separated lists.`}
You have a maximum of 45 seconds to respond. Write a complete, well-structured answer — do NOT stop mid-sentence or leave any part unanswered. If the question has multiple parts or theories, cover each one with adequate depth. Finish the full answer within the token limit — a complete answer is always better than a detailed but cut-off one.

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

ANCIENT INDIA:
- Romila Thapar → Early India, Ashokan policy, historiography of ancient India, *A History of India Vol.1*
- R.S. Sharma → Material culture, feudalism debate, ancient Indian economy, *Indian Feudalism*, *Material Culture and Social Formations in Ancient India*
- D.D. Kosambi → Marxist interpretation, coins as historical evidence, *An Introduction to the Study of Indian History*
- K.A. Nilakantha Sastri → South Indian history, Chola dynasty, Sangam age, *A History of South India*, *The Colas*
- H.C. Raychaudhuri → Political history of ancient India, Mauryan empire, *Political History of Ancient India*
- A.L. Basham → Cultural synthesis, ancient Indian civilisation, *The Wonder That Was India*
- Upinder Singh → Ancient and early medieval India synthesis, *A History of Ancient and Early Medieval India*
- Shereen Ratnagar → Harappan archaeology, trade networks, *Understanding Harappa*
- B.D. Chattopadhyaya → Early medieval urban decline thesis, state formation, trade
- F.R. Allchin → Harappan archaeology, South Asian Bronze Age

MEDIEVAL INDIA:
- Irfan Habib → Agrarian System, zabti/dahsala, peasant revolts, Mughal fiscal crisis, *The Agrarian System of Mughal India*
- Satish Chandra → Jagirdari crisis, Mughal decline, Medieval India survey, *Medieval India* (Parts 1 & 2)
- Muzaffar Alam → Mughal political culture, Persian cosmopolitanism, *The Crisis of Empire in Mughal North India*
- J.F. Richards → Mughal fiscal history, revenue system, *The Mughal Empire*
- K.M. Ashraf → Everyday life in Sultanate/Mughal period, *Life and Conditions of the People of Hindustan*
- Harbans Mukhia → Rejected European feudalism model for India, Mughal agrarian relations
- Richard Eaton → Temple desecration debate, Sufism in Deccan, *Essays on Islam and Indian History*, *A Social History of the Deccan*
- Simon Digby → Sufi movement, Sultanate military, *War-Horse and Elephant in the Delhi Sultanate*
- Andre Wink → Indo-Islamic world formation, *Al-Hind: The Making of the Indo-Islamic World*
- Peter Hardy → Muslim historiography, *Historians of Medieval India*
- Friedhelm Hardy → South Indian bhakti, Alvar theology, *Viraha-Bhakti*
- Charlotte Vaudeville → Kabir, nirgun bhakti tradition

MODERN INDIA / COLONIAL:
- Bipan Chandra → Economic nationalism, drain of wealth, Indian National Movement, *India's Struggle for Independence*, *The Rise and Growth of Economic Nationalism in India*
- Sumit Sarkar → Swadeshi movement, *Modern India 1885–1947*, critique of subaltern studies
- Ranajit Guha → Subaltern studies founder, peasant insurgency, *Elementary Aspects of Peasant Insurgency in Colonial India*
- Partha Chatterjee → Nationalist thought, colonial modernity, *Nationalist Thought and the Colonial World*
- Gyanendra Pandey → Communalism construction, *The Construction of Communalism in Colonial North India*
- Sekhar Bandyopadhyay → 1857 revolt, social reform, *Plassey to Partition*
- C.A. Bayly → Indian society and colonial transition, *Rulers, Townsmen and Bazaars*
- Judith Brown → Gandhi's political career, *Gandhi: Prisoner of Hope*
- Francis Robinson → Muslim separatism, *Separatism Among Indian Muslims*
- Anil Seal → Cambridge School — nationalist leaders as factionalists, *The Emergence of Indian Nationalism*
- Eric Stokes → Peasant resistance, 1857, *The Peasant Armed*, *The English Utilitarians and India*
- David Washbrook → South India political economy, colonial capitalism
- B.R. Tomlinson → Indian economy under colonialism, *The Indian National Congress and the Raj*

WORLD HISTORY / HISTORIOGRAPHY:
- Marc Bloch → Annales School, comparative feudalism, *Feudal Society*
- Fernand Braudel → Longue durée, Mediterranean history, *The Mediterranean and the Mediterranean World*
- E.H. Carr → Historical method, *What is History?*
- Eric Hobsbawm → Age of Revolution/Capital/Empire/Extremes, nationalism, *The Age of Revolution*
- E.P. Thompson → English working class, moral economy, food riots, *The Making of the English Working Class*
- Perry Anderson → Absolutism, feudalism, *Passages from Antiquity to Feudalism*
- Immanuel Wallerstein → World-systems theory, core-periphery model
- Arnold Toynbee → Civilisational theory, *A Study of History*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3B — CONTEMPORARY/PRIMARY SOURCE RULES (SEPARATE CATEGORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following are PRIMARY SOURCES / CONTEMPORARY ACCOUNTS — they are NOT historians in the modern academic sense. NEVER attribute historical analysis or "arguments" to them. You may only cite WHAT THEY OBSERVED OR WROTE in their own works.

PERMITTED: "Al-Biruni in *Kitab-ul-Hind* describes caste practices and Indian sciences as he observed them in the early 11th century"
NEVER PERMITTED: "Al-Biruni argues that the feudal structure of India caused..."

VERIFIED CONTEMPORARY SOURCES (cite only for what they directly recorded):

ANCIENT INDIA — FOREIGN ACCOUNTS & LITERARY SOURCES:
- Megasthenes (c.350–290 BCE) → *Indica* (surviving only in fragments quoted by later writers) — Greek ambassador at Chandragupta Maurya's court; described Pataliputra, caste-like social divisions, Mauryan military; NOTE: original text lost, cite only via fragments preserved in Diodorus/Strabo/Arrian
- Arrian (86–160 CE) → *Indica* and *Anabasis* — compiled Greek accounts of Alexander's India campaign and Mauryan India; useful for northwest India geography and Mauryan descriptions
- Strabo (64 BCE–24 CE) → *Geographica* — compiled Greek knowledge of India including Megasthenes fragments; Indo-Greek interactions
- Pliny the Elder (23–79 CE) → *Natural Historia* — Roman account of Indo-Roman trade, Indian luxury goods, spices; key source for trade drain from Rome to India
- Ptolemy (100–170 CE) → *Geographia* — mapped Indian ports and trade routes; useful for identifying ancient port cities on Malabar/Coromandel coast
- *Periplus Maris Erythraei* / Periplus of the Erythraean Sea (c.1st century CE, anonymous) → Greek merchant manual; most detailed account of Indo-Roman trade routes, ports (Barygaza/Bharuch, Muziri), goods traded
- Fa-Hien / Faxian (337–422 CE) → *Record of Buddhist Kingdoms* — Chinese Buddhist pilgrim; visited India during Chandragupta II (Gupta period); observations on Buddhist monasteries, society, Gupta prosperity; NOTE: more positive/idealized account
- Xuanzang / Hiuen Tsang (602–664 CE) → *Si-Yu-Ki (Buddhist Records of the Western World)* — Chinese pilgrim during Harsha's reign; most detailed account of 7th century India; describes Harsha's administration, religious diversity, university at Nalanda; crucial source for this period
- I-Tsing / Yijing (635–713 CE) → *A Record of the Buddhist Religion* — Chinese pilgrim; visited Nalanda; detailed account of Buddhist monastic life and Srivijaya; slightly later than Xuanzang
- Sangam Literature (c.1st–3rd century CE) → Tamil corpus (*Purananuru*, *Akananuru*, *Silappadikaram*, *Manimekalai* etc.) — PRIMARY LITERARY SOURCE for early South Indian society, Chera/Chola/Pandya polity, trade, social life; NOT a single author; cite specific texts when possible
- Kalhana (12th century CE) → *Rajatarangini* (River of Kings, 1148 CE) — Sanskrit chronicle of Kashmir kings; first systematic historical chronicle in Indian tradition; NOTE: mixes legend and history, but valuable for Kashmir and broader north Indian political history
- Banabhatta (7th century CE) → *Harshacharita* — court biography of Harsha; literary source for early 7th century north India; note: panegyric style, intended to glorify Harsha
- Kalidasa (c.4th–5th century CE) → *Meghaduta*, *Abhijnanasakuntalam*, *Raghuvamsha* — literary source for Gupta-era society, geography, cultural life; NOT a historical chronicle but reflects period's social norms

MEDIEVAL INDIA — FOREIGN ACCOUNTS & COURT CHRONICLES:
- Al-Biruni (973–1048) → *Kitab-ul-Hind* — observations on Indian society, science, religion, caste; came with Mahmud of Ghazni's court
- Amir Khusrau (1253–1325) → *Qiran-us-Sadain*, *Khazain-ul-Futuh* — literary accounts of Alauddin Khalji's reign, Delhi Sultanate court
- Ibn Battuta (1304–1368/9) → *Rihla* — observations on Muhammad bin Tughluq's Delhi, Indian cities, ports, social customs
- Ziauddin Barani (1285–1357) → *Tarikh-i-Firuz Shahi*, *Fatawa-i-Jahandari* — Delhi Sultanate political theory, court chronicle (his views are EXPLICITLY aristocratic-orthodox; note his bias when citing)
- Abul Fazl (1551–1602) → *Ain-i-Akbari*, *Akbarnama* — Mughal administration, Akbar's reign; official court historian (note imperial bias)
- Babur (1483–1530) → *Baburnama* — personal memoirs of battles, nature, Indian society; remarkably frank first-person account
- Gulbadan Begum (1523–1603) → *Humayunnama* — women's perspective on Mughal court, Humayun's life
- Jahangir (1569–1627) → *Tuzuk-i-Jahangiri* — personal memoirs, arts, administration (note: self-serving account)
- Marco Polo (1254–1324) → *Il Milione / The Travels* — observations on South India (Pandya kingdom, trade), Malabar coast; visited late 13th century
- Nicolo de Conti (c.1395–1469) → observations on Vijayanagara empire, South Indian trade
- Abdur Razzaq (1413–1482) → *Matla-us-Sadain* — detailed account of Vijayanagara under Deva Raya II, South Indian polity
- Athanasius Nikitin (d.1472) → *Journey Beyond Three Seas* — Russian traveller's account of Bahmani kingdom, Deccan society
- Duarte Barbosa (c.1480–1521) → Portuguese account of South Indian trade, Vijayanagara, Malabar coast
- Domingo Paes (early 16th c.) → Portuguese account of Vijayanagara at its peak under Krishnadeva Raya
- Fernão Nunes (early 16th c.) → Portuguese account of Vijayanagara history and administration
- Saqi Mustaid Khan → *Maasir-i-Alamgiri* — chronicle of Aurangzeb's reign (official Mughal court account; note pro-Aurangzeb bias)
- Khafi Khan → *Muntakhab-ul-Lubab* — more critical account of Aurangzeb's reign and Mughal decline
- Francois Bernier (1620–1688) → *Travels in the Mughal Empire* — French physician's observations on Mughal court, economy, compared India to European feudalism (his comparison is debated by historians)
- Jean Baptiste Tavernier (1605–1689) → French traveller, observations on Mughal trade and diamond mines
- Manucci (1639–c.1717) → *Storia do Mogor* — Italian account of Mughal court, wars of succession

RULE: When a student's answer would benefit from a contemporary source, cite WHAT the source RECORDS, not analytical conclusions the source never drew.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3C — RAG PASSAGE VERIFICATION GATE (applies whenever passages are provided below)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The passages under "BOOK PASSAGES" below are real excerpts from real books. They are evidence, not proof of any specific historian's name unless that name is written in the passage text itself.

These are TWO SEPARATE PATHS to a citation. Fully satisfy ONE path — never mix evidence from both to build a single citation.

PATH A — WHITELIST CITATION (no passage needed):
Use the historian's name only for the broad topic/argument listed next to them in KNOWN SAFE HISTORIAN-ARGUMENT PAIRS, with NO specific quote, NO specific wording, NO invented sentence attributed to them. Example: "Sastri's work on South Indian history situates this within the broader Shaiva-Islamic political contest of the period" — broad, no quote, matches his listed topic exactly.

PATH B — PASSAGE CITATION (quote or specific claim):
Any time you attach a SPECIFIC sentence, quote, or precise claim to a historian's name, that exact sentence must appear in the passage block tagged with THAT historian's name — i.e. under the SAME [Source N — book_title | Author: X] label. Before writing the citation, locate the sentence in the passages, check which [Source N — book_title | Author: X] heading it physically sits under, and use that exact author name. Do NOT swap in a different historian's name just because they are topically whitelisted for this subject — topical whitelisting (Path A) does not carry over to specific-claim citation (Path B). A name being whitelisted for "South Indian history" does not clear a quote that actually sits under a different source's heading.

If you cannot find the specific sentence under that historian's own source heading → you cannot use Path B. Fall back to Path A (broad, unquoted) or to unattributed phrasing: "historians have noted...", "scholarship on this period suggests...".

This rule exists because plausible-sounding names (a surname that sounds like a known scholar, a name that "feels" academic, OR a name that is whitelisted for the right general topic) are NOT a substitute for a verified source for a SPECIFIC claim. Being whitelisted for "South Indian history" makes a historian safe to mention broadly — it does NOT make them safe to attach to a quote that actually came from a different book in the passages.

If the passages below do not support a historian-specific claim you want to make, that is normal — most passages are general historical content, not historiographical debate. In that case, just make the point itself without attaching a historian's name to it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3D — NO INVENTED FRAMEWORKS, TERMS, DATES, OR COMPARISONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Being on a historian's broad whitelisted topic is NOT permission to invent the SPECIFIC content of their argument. These three patterns sound authoritative precisely because the historian's name is real — that is exactly why they slip past the check above. Catch them separately:

1. INVENTED YEAR/DATE attached to a citation
A historian being on the whitelist does not make any year safe to attach to them. Cite a year ONLY if that exact year appears in the passages below, next to this specific claim.
NEVER PERMITTED: "Upinder Singh (2021) notes that..." — unless "2021" is written in the passage beside this claim.
PERMITTED: "Upinder Singh's work on ancient and early medieval India discusses..." (no invented year).

2. INVENTED NAMED FRAMEWORK/MODEL/TERM attributed to a historian
Do not coin a theory-sounding label ("contractual state model", "X theory", "Y framework") and attach a real historian's name to it, unless that exact term is in the passages OR is something that historian is unambiguously, independently known for (e.g. R.S. Sharma + "Indian Feudalism" is fine — it is literally his book title).
NEVER PERMITTED: "Romila Thapar argues the Mandala theory reflects a 'contractual state' model" — Thapar has no known association with this term.
PERMITTED: Discuss the Mandala theory's actual content without inventing a label, or cite Thapar only for what she is whitelisted for (early Indian state formation, Ashokan policy) without bolting on an invented framework name.

3. INVENTED CROSS-CIVILISATIONAL COMPARISON presented as the historian's own claim
Comparing an Indian concept to "European feudalism" or any Western framework is a separate analytical move from anything in the whitelist. Never present such a comparison as something a specific named historian argued unless that comparison is written in the passages.
NEVER PERMITTED: "...this contrasts sharply with later medieval European feudalism," framed as part of a named historian's argument.
PERMITTED: Make the same comparison yourself, unattributed — "This differs from European feudalism, where..." — own it as your own analytical aside, don't borrow a historian's authority for it.

RULE OF THUMB: If a specific term, year, or comparison could turn out to be wrong and you have no passage to check it against — you invented it. State the substantive point and drop the false precision.

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


${bookTitle && bookTitle !== "all"
  ? `BOOK PASSAGES from "${bookTitle}" (cite passages as [${bookTitle}]):
IMPORTANT: The user has specifically selected "${bookTitle}" — prioritise answering from these passages above all else. Do not genericise the answer; ground it specifically in what this book covers.
Your answer must reflect THIS BOOK'S specific arguments, framework, and perspective — not a generic textbook answer. If the book has a distinct historiographical stance (e.g. Sekhar Bandyopadhyay's subaltern/social history lens, Romila Thapar's early India framework, Satish Chandra's medieval synthesis), use that lens explicitly in your answer.`
  : `RELEVANT BOOK PASSAGES (multiple books, top matches — cite each as [Book Title] shown in the source label):
Use these as supporting evidence where they are genuinely relevant to the question. They are a sample of nearby content, not a complete coverage of the topic — treat gaps in the passages as normal, not as license to invent specifics to fill them.`
}
${ragContext}`;

const ragSystem = ragContext
  ? (mentorMode && isPremium ? MENTOR_SYSTEM + '\n\n' : '') + ragBasePrompt
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
          const Anthropic = (await import('@anthropic-ai/sdk')).default;
          const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
          let builtMessages: any[];
          if (pdf_base64) {
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
            builtMessages = msgsCopy;
          } else {
            builtMessages = messages.map((m: any, i: number) => {
              if (i === messages.length - 1 && m.role === 'user' && lang === 'hi') {
                return { role: m.role, content: m.content + '\n\n[IMPORTANT: Respond entirely in Hindi (Devanagari script)]' };
              }
              return { role: m.role, content: m.content };
            });
          }
          const anthropicStream = anthropic.messages.stream({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 6000,
            system: ragSystem + (lang === 'hi' ? '\n\nCRITICAL INSTRUCTION: You MUST respond ENTIRELY in Hindi (Devanagari script) regardless of the language of the question. Every single word of your response must be in Hindi. Do NOT use English even for technical terms — transliterate them. Historical names, dates, and places should use their Hindi equivalents.' : '\n\nCRITICAL INSTRUCTION: You MUST respond ENTIRELY in English regardless of the language of the question.'),
            messages: builtMessages,
          });
          for await (const chunk of anthropicStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              collect(chunk.delta.text);
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
            const bracketPattern = /\([A-Z][a-zA-Z.\s]+?,\s*[^)]+?\)/g;
            const sentences = fullAnswer.match(/[^.!?]*[.!?]+/g) ?? [fullAnswer];

            const sentencesWithBracket = sentences.filter(s => {
              bracketPattern.lastIndex = 0;
              return bracketPattern.test(s);
            });
            const sentencesWithSurname = sentences.filter(s =>
              WHITELISTED_HISTORIAN_SURNAMES.some(name => s.includes(name))
            );
            // Union of both, de-duplicated, preserving answer order.
            const flaggedSentences = sentences.filter(s =>
              sentencesWithBracket.includes(s) || sentencesWithSurname.includes(s)
            );

            if (flaggedSentences.length > 0 && ragSources.length > 0) {
              const citedSnippetBlock = flaggedSentences.join('\n');

              const sourceBlock = ragSources
                .map((s, i) => `[Source ${i + 1} — ${s.book_title} | Author: ${s.author}]\n${s.content}`)
                .join('\n\n---\n\n');

              const Anthropic = (await import('@anthropic-ai/sdk')).default;
              const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
              const verifyRes = await anthropic.messages.create({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 600,
                system: `You are a strict citation auditor. You will be given (1) a set of source passages, each tagged with its book title and author, and (2) sentences from a generated answer that name a historian — either as a bracket citation "(Author, Title)" or as prose attribution ("Author argues/notes/draws a parallel that...").

For EACH sentence, check whether the specific claim attributed to that historian actually appears in the passage tagged with THAT author's name. Being topically associated with the right era/subject is NOT enough — the literal claim must be traceable to that author's own [Source N] passage.

Classify each flagged sentence into exactly one of two buckets:
- "bad_brackets": the sentence has a "(Author, Title)" bracket whose specific quote/claim is NOT in that author's passage. Return ONLY the bracket text itself, e.g. "(Sastri, A History of South India)", copied exactly.
- "bad_prose_sentences": the sentence attributes an argument/claim to a historian in prose (no bracket, or bracket present but the whole sentence's claim is unsupported) and that author's passages do NOT contain this claim or anything close to it — meaning the argument was likely invented and merely attached to a real name. Return the FULL sentence exactly as it appears.

Respond ONLY with valid JSON, no markdown, no preamble:
{"bad_brackets": ["(Author, Title)"], "bad_prose_sentences": ["Full sentence here."]}

If everything checks out, respond: {"bad_brackets": [], "bad_prose_sentences": []}`,
                messages: [{
                  role: 'user',
                  content: `SOURCE PASSAGES:\n${sourceBlock}\n\n---\n\nFLAGGED SENTENCES:\n${citedSnippetBlock}`,
                }],
              });
              const verifyText = verifyRes.content
                .map(b => b.type === 'text' ? b.text : '')
                .join('')
                .trim();
              const cleaned = verifyText.replace(/^```json\s*|```\s*$/g, '').trim();
              const parsed = JSON.parse(cleaned) as { bad_brackets: string[]; bad_prose_sentences: string[] };

              // Bracket fix: strip only the parenthetical, keep the claim.
              for (const bad of parsed.bad_brackets ?? []) {
                if (fullAnswer.includes(bad)) {
                  fullAnswer = fullAnswer.split(bad).join('').replace(/\s+([.,;])/g, '$1');
                }
              }
              // Prose fix: remove the whole sentence — the claim itself was
              // fabricated, not just mis-sourced, so nothing safe remains.
              for (const bad of parsed.bad_prose_sentences ?? []) {
                if (fullAnswer.includes(bad)) {
                  fullAnswer = fullAnswer.split(bad).join('').replace(/[ \t]{2,}/g, ' ');
                }
              }
            }
          } catch (verifyErr) {
            // Verification is best-effort — if it fails, fall back to
            // sending the unverified answer rather than blocking the
            // response entirely.
            console.error('Citation verification failed:', verifyErr);
          }


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
                .upsert({ firebase_uid: firebaseUid, fingerprint, chat_count: newChatCount }, { onConflict: 'firebase_uid' });
              // Also update FP row to block multi-account abuse
              if (fingerprint) {
                await sbInc.from('usage_tracking')
                  .upsert({ fingerprint, chat_count: newChatCount }, { onConflict: 'fingerprint' });
              }
            } catch (incErr) {
              console.log('chat_count increment failed', incErr);
            }
          }

          send('\n__SOURCES__' + JSON.stringify(ragSources));
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
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
