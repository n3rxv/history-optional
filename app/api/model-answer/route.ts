export const maxDuration = 120;

import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are an expert UPSC History Optional examiner and answer writer with deep mastery of Indian and World History. You write model answers that consistently score 130+/150.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EPISTEMIC INTEGRITY PROTOCOL — HIGHEST PRIORITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are writing for UPSC History Optional aspirants. A fabricated fact, invented quote, or hallucinated event in their answer can cost them a rank — or the exam itself. This is not a writing exercise. This is someone's career.

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


Your historian knowledge base:
ANCIENT INDIA: Romila Thapar (Maurya empire, early India, secularism thesis), D.D. Kosambi (Marxist framework, pastoral-agrarian transition, iron age), R.S. Sharma (Indian feudalism thesis, decline of urban centres, iron age enables Ganga valley states), H.C. Raychaudhuri (political history), A.L. Basham (culture, religion, Wonder That Was India), B.D. Chattopadhyaya (early medieval state formation, land grants as integrative strategy NOT decline), U.N. Ghoshal (bureaucratic centralized Mauryan state), Burton Stein (segmentary state model), Upinder Singh (archaeological approach, mechanisms of integration), Shereen Ratnagar (Harappan trade-collapse thesis), Kenoyer (competing elites, seals as clan totems), R.P. Kangle (Arthashastra — Mauryan authorship).

MEDIEVAL INDIA: Satish Chandra (Mughal decline, jagirdari crisis), Irfan Habib (Mughal agrarian system, zabti/dahsala, peasant revolts, Agrarian System of Mughal India), K.A. Nizami (Sufism, Chishti influence on Delhi Sultanate), M. Athar Ali (Mughal nobility, mansabdari — The Mughal Nobility Under Aurangzeb), Simon Digby (Sufi networks and political economy), Harbans Mukhia (debate on Indian feudalism), Muzaffar Alam (composite culture, crisis of empire), J.F. Richards (Mughal Empire), Peter Hardy (Islamic character of sultanate), Andre Wink (Al-Hind), C.A. Bayly (18th century economic growth, portfolio capitalism).

MODERN INDIA: Bipan Chandra (nationalism, colonialism, economic drain — India's Struggle for Independence), Sumit Sarkar (Modern India, Swadeshi movement), Ayesha Jalal (Jinnah, Partition, The Sole Spokesman — Pakistan as bargaining chip), Mushirul Hasan (composite nationalism, communalism), Judith Brown (Gandhi — cautious politician), Ranajit Guha (Elementary Aspects of Peasant Insurgency, subaltern studies), Shahid Amin (Gandhi as Mahatma, gap between message and peasant reception), Lata Mani (sati debate — women as ground not subjects), Dadabhai Naoroji (drain theory), Utsa Patnaik ($45 trillion drain estimate), Bernard Cohn (colonial knowledge), Anil Seal (Cambridge School — patronage not anti-colonialism), Gyanendra Pandey (communalism constructed by colonial knowledge), Urvashi Butalia (gendered violence in partition).

WORLD HISTORY: Eric Hobsbawm (Age of Revolution/Capital/Empire, nationalism), E.P. Thompson (Making of the English Working Class, pessimist school, moral economy), Immanuel Wallerstein (world-systems theory), Perry Anderson (lineages of absolutism), Christopher Hill (English Revolution), R.R. Palmer (Age of Democratic Revolutions), Lefebvre (peasant revolution autonomous in French Revolution), Soboul (sans-culottes), Furet (Terror implicit in ideology), Fischer (German will to war in WWI), Fitzpatrick (social history of Russian Revolution), Fanon (Wretched of the Earth, decolonization).

FORMAT YOUR ANSWER EXACTLY AS FOLLOWS:

**INTRODUCTION**
2-3 sentences. Open with a historiographical debate — name at least one historian with their specific thesis. Preview argument. Never start with a definition or date.

**BODY**

**[Write the actual thematic heading here — e.g. "Emergence from Vedic and Bardic Traditions"]**
- **[Bold analytical sub-point]**: specific evidence/date/text + historian argument
- **[Bold analytical sub-point]**: specific evidence + link to question
- **[Bold analytical sub-point]**: counter-nuance or historiographical angle
- **[Bold analytical sub-point]**: synthesis sentence
Minimum 4 bullet points per heading. Each bullet starts with a **bold key term or claim**, then elaborates. Do NOT write "[Thematic Heading 1]" — write the real heading title directly.

**[Second thematic heading]**
- Same bullet structure — 4 points minimum.

**[Third thematic heading]**
- Same bullet structure.

**[Fourth thematic heading — for 15M/20M]**
- Same bullet structure.

**[Fifth thematic heading — for 20M only]**
- Same bullet structure.

**CRITICAL ASSESSMENT**
Balance: note the historiographical debate, counter-view, limitations — 3-4 sentences. Name historians on both sides.

**CONCLUSION**
2-3 sentences. Resolve the intro tension by name — affirm, qualify or reject a historian's position. Synthesise strongest threads. Historical significance. No new material, no generic summary.

FORMATTING RULES — STRICT:
- Section headings use **bold** only — no --- separators between sections
- Thematic headings use **bold** — NOT *italics with brackets* like *[Thematic Heading 1]*
- Do NOT write placeholder text like "[Thematic Heading 1]" — always write the real title
- No horizontal rules (---) anywhere in the answer
- Clean flowing text between sections — just a blank line between paragraphs

---
RULES:
- Cite at least 4 different historians by name with their specific arguments
- Use analytical language ("argues", "contends", "demonstrates") — not descriptive
- 10M: 3 body paragraphs, ~400-450 words total
- 15M: 4 body paragraphs, ~550-620 words total
- 20M: 5 body paragraphs, ~700-800 words total
- Critical Assessment mandatory — name the historiographical debate
- Do NOT use phrases like "It is important to note" or "In conclusion, we can say"`;

export async function POST(req: NextRequest) {
  try {
    const { question, marks, token } = await req.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ error: 'premium_required' }, { status: 403 });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    let isPremium = false;
    try {
      // token is a real Supabase access_token from the frontend session
      const { verifyFirebaseToken } = await import("@/lib/verifyFirebaseToken");
      const user = await verifyFirebaseToken(token);
      const error = !user;
      if (error || !user) {
        return NextResponse.json({ error: 'premium_required' }, { status: 403 });
      }

      if (user.email === process.env.OWNER_EMAIL) {
        isPremium = true;
      } else {
        const nowISO = new Date().toISOString();
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('firebase_uid', user.uid)
          .eq('status', 'active')
          .gt('expires_at', nowISO)
          .maybeSingle();
        isPremium = !!sub;
      }
    } catch {
      return NextResponse.json({ error: 'premium_required' }, { status: 403 });
    }

    if (!isPremium) {
      return NextResponse.json({ error: 'premium_required' }, { status: 403 });
    }

    // ── RAG: fetch relevant book passages via Voyage AI ──
    let ragContext = '';
    try {
      const { createClient: createSupabase } = await import('@supabase/supabase-js');
      const supabase = createSupabase(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      );

      // Embed via Voyage AI
      const embedRes = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
        },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({ model: 'voyage-4-lite', input: [question], input_type: 'query' }),
      });
      const embedData = await embedRes.json();
      const embedding = embedData.data?.[0]?.embedding;

      if (embedding) {
        const { data: chunks } = await supabase.rpc('match_book_chunks_diverse', {
          query_embedding: embedding,
          per_book_count: 3,
        });

        if (chunks && chunks.length > 0) {
          const filtered = chunks.filter((c: any) => (c.similarity ?? 1) > 0.45).slice(0, 12);
          const toRerank = filtered.length >= 3 ? filtered : chunks.slice(0, 12);

          // Rerank via Voyage AI
          let finalChunks: any[] = [];
          try {
            const rerankRes = await fetch('https://api.voyageai.com/v1/rerank', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
              },
              body: JSON.stringify({ model: 'rerank-2-lite', query: question, documents: toRerank.map((c: any) => c.content), top_k: 6 }),
            });
            const rerankData = await rerankRes.json();
            if (rerankData.data) {
              finalChunks = rerankData.data.map((r: any) => ({ ...toRerank[r.index], score: r.relevance_score }));
            } else {
              finalChunks = toRerank.slice(0, 6);
            }
          } catch {
            finalChunks = toRerank.slice(0, 6);
          }

          if (finalChunks.length > 0) {
            ragContext = finalChunks
              .map((c: any, i: number) => `[Source ${i + 1} \u2014 ${c.book_title} | Author: ${c.author}]\n${c.content}`)
              .join('\n\n---\n\n');
          }
        }
      }
    } catch (ragErr) {
      console.error('RAG fetch error (non-fatal):', ragErr);
    }

    // ── Generate via Anthropic Haiku ──
    const rawMarks = parseInt(marks) || 10;
    const marksNum = rawMarks >= 30 ? 20 : rawMarks === 12 || rawMarks === 13 ? 10 : rawMarks;

    const ragSection = ragContext
      ? `

RELEVANT BOOK PASSAGES (use ONLY these for specific historian citations — do not invent citations outside these):

${ragContext}

CITATION RULE: You may cite a historian ONLY if their name appears in the Source passages above. For historians NOT in these passages, use only broad safe attributions from your known pairs list.`
      : '';

    const prompt = `Write a complete UPSC History Optional model answer for this ${marksNum}-mark question. Follow the format exactly.${ragSection}

QUESTION (${marksNum} marks): ${question}

Write the full model answer now:`;

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let answer = '';
    const anthropicStream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: marksNum >= 20 ? 6000 : marksNum >= 15 ? 4000 : 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });
    for await (const chunk of anthropicStream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        answer += chunk.delta.text;
      }
    }
    answer = answer.trim();

    if (!answer) {
      console.error('[model-answer] Haiku returned empty answer');
      return NextResponse.json({ error: 'Failed to generate answer. Please try again. (empty response)' }, { status: 500 });
    }

    // ── 3-Layer Citation Verifier ──────────────────────────────────────────
    const BROAD_ONLY = ['Jha', 'Nizami', 'Riazul Islam', 'Surendra Gopal', 'Majumdar', 'K.A. Nizami', 'R.C. Majumdar', 'D.N. Jha'];
    const WHITELISTED_SURNAMES = [
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
    const specificClaimPattern = /argues|notes|writes|states|claimed|asserts|observes|emphasises|emphasizes|points out|concludes|suggests|contends|maintains/;
    const bracketPattern = /\([A-Z][a-zA-Z.\s]+?,\s*[^)]+?\)/g;

    try {
      const sentences = answer.match(/[^.!?]*[.!?]+/g) ?? [answer];

      // Layer 1+2: pre-verifier — no API call
      for (const sentence of sentences) {
        let strip = false;
        for (const name of BROAD_ONLY) {
          if (sentence.includes(name)) {
            bracketPattern.lastIndex = 0;
            if (specificClaimPattern.test(sentence) || bracketPattern.test(sentence)) {
              strip = true;
              break;
            }
          }
        }
        if (strip && answer.includes(sentence)) {
          answer = answer.split(sentence).join('').replace(/[ 	]{2,}/g, ' ');
        }
      }

      // Layer 3: API verifier — content check against RAG passages
      if (ragContext) {
        const updatedSentences = answer.match(/[^.!?]*[.!?]+/g) ?? [answer];
        const flagged = updatedSentences.filter((s: string) => {
          bracketPattern.lastIndex = 0;
          return bracketPattern.test(s) || WHITELISTED_SURNAMES.some((n: string) => s.includes(n));
        });

        if (flagged.length > 0) {
          const anthropicV = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
          const verifyMsg = await anthropicV.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 800,
            system: `You are a strict citation auditor. For each flagged sentence, check if the historian name and claim actually appear in the SOURCE PASSAGES. Respond ONLY with valid JSON: {"bad_brackets": ["..."], "bad_prose_sentences": ["..."]}. If all pass: {"bad_brackets": [], "bad_prose_sentences": []}`,
            messages: [{ role: 'user', content: `SOURCE PASSAGES:
${ragContext}

---

FLAGGED SENTENCES:
${flagged.join('\n')}` }],
          });
          const vt = verifyMsg.content[0]?.type === 'text' ? verifyMsg.content[0].text.trim() : '';
          const vc = vt.replace(/^```json\s*|```\s*$/g, '').trim();
          const vp = JSON.parse(vc) as { bad_brackets: string[]; bad_prose_sentences: string[] };

          for (const bad of vp.bad_brackets ?? []) {
            if (answer.includes(bad)) answer = answer.split(bad).join('').replace(/\s+([.,;])/g, '$1');
          }
          for (const bad of vp.bad_prose_sentences ?? []) {
            if (answer.includes(bad)) answer = answer.split(bad).join('').replace(/[ 	]{2,}/g, ' ');
          }
        }
      }
    } catch (verifyErr) {
      console.error('Verifier error (non-fatal):', verifyErr);
    }

    return NextResponse.json({ answer });

  } catch (err: any) {
    console.error('[model-answer] OUTER CATCH:', err?.message ?? err);
    console.error('[model-answer] stack:', err?.stack?.slice(0, 500));
    return NextResponse.json({ error: `Failed to generate answer. (${err?.message ?? 'unknown'})` }, { status: 500 });
  }
}
