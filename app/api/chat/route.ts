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

    // Step 1 (optimized): Single embedding, no query expansion
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
    const { messages, system, bookMode, bookTitle, pdf_base64, pdf_name, lang } = await req.json();
    const lastMsg = messages?.[messages.length - 1]?.content ?? '';
    if (typeof lastMsg === 'string' && lastMsg.length > 4000)
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
    let ragSources: { book_title: string; content: string }[] = [];
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
          const match = block.match(/^\[Source \d+ — (.+?)\]\n([\s\S]+)$/);
          if (match) return { book_title: match[1], content: match[2] };
          return null;
        })
        .filter(Boolean) as { book_title: string; content: string }[];
    } catch(e) { console.error('RAG error:', e); }

    const ragSystem = ragContext
      ? `${system ?? ''}
You are a UPSC History Optional expert. You MUST always give a complete, well-structured answer covering the topic — do not abandon the question or leave it unanswered. Use the passages below as supplementary evidence where relevant, but follow the epistemic rules below even if that means hedging or omitting a specific name/claim — a hedge is NOT a refusal.
Do NOT use markdown headings (###, ##, #) in your response. Use bold text (**text**) for section titles instead.
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

Before naming ANY historian in your answer, run this check:
1. Is this name in the KNOWN SAFE HISTORIAN-ARGUMENT PAIRS list above? → If yes, only use the argument/topic listed next to them.
2. Is this name written verbatim inside the passages below, attached to the specific claim you want to make? → If yes, you may cite it.
3. If NEITHER (a) nor (b) is true for this specific name+claim combination → DO NOT invent a name. Use unattributed phrasing instead: "historians have noted...", "a common critique is...", "scholarship on this period suggests...".

This rule exists because plausible-sounding names (a surname that sounds like a known scholar, a name that "feels" academic) are NOT a substitute for a verified source. A name must come from the whitelist or from the passage text — never from pattern-matching on what an authoritative-sounding name "should" be.

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
    // ── Streaming response ──────────────────────────────────────────
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));
        try {
          if (bookMode || pdf_base64) {
            // Anthropic streaming
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
                send(chunk.delta.text);
              }
            }
          } else {
            // Groq streaming
            const groqSystemPrompt = ragSystem + (lang === 'hi' ? '\n\nCRITICAL INSTRUCTION: You MUST respond ENTIRELY in Hindi (Devanagari script) regardless of the language of the question. Every single word must be in Hindi.' : '\n\nCRITICAL INSTRUCTION: You MUST respond ENTIRELY in English regardless of the language of the question. Every single word must be in English.');
            const groqMessages = messages.map((m: any, i: number) => {
              if (i === messages.length - 1 && m.role === 'user') {
                if (lang === 'hi') return { role: m.role, content: m.content + '\n\n[तुम्हें पूरा जवाब हिंदी (देवनागरी) में देना है।]' };
                return { role: m.role, content: m.content + '\n\n[IMPORTANT: Respond entirely in English only.]' };
              }
              return { role: m.role, content: m.content };
            });
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
              body: JSON.stringify({
                model: 'qwen/qwen3-32b',
                stream: true,
                messages: [
                  ...(groqSystemPrompt ? [{ role: 'system', content: groqSystemPrompt }] : []),
                  ...groqMessages,
                ],
                max_tokens: 6000,
              }),
            });
            const reader = groqRes.body!.getReader();
            const dec = new TextDecoder();
            let buf = '';
            let accumulated = '';
            let thinkDone = false;
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true });
              const lines = buf.split('\n');
              buf = lines.pop() ?? '';
              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;
                try {
                  const delta = JSON.parse(data).choices?.[0]?.delta?.content ?? '';
                  if (!delta) continue;
                  if (thinkDone) { send(delta); continue; }
                  accumulated += delta;
                  // Check if think block is complete
                  const endIdx = accumulated.indexOf('</think>');
                  if (endIdx !== -1) {
                    thinkDone = true;
                    const after = accumulated.slice(endIdx + 8);
                    if (after) send(after);
                  }
                } catch { /* skip malformed */ }
              }
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
