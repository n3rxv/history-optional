import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function checkPremium(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return false;
    const nowISO = new Date().toISOString();
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', nowISO)
      .single();
    return !!sub;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const premium = await checkPremium(authHeader);
  if (!premium) {
    return NextResponse.json({ error: 'Premium required' }, { status: 403 });
  }

  try {
    const { question, options, correct, topic } = await req.json();
    const correctOption = options[correct];
    const optionsFormatted = options.map((o: string, i: number) => `(${String.fromCharCode(65+i)}) ${o}`).join('\n');

    const systemPrompt = `You are India's most rigorous UPSC Prelims coach with 20+ years of experience. You have deep mastery of every question type that appears in UPSC CSE Prelims and the exact cognitive techniques to crack them.

You know ALL of the following elimination and reasoning techniques:
1. LINCHPIN/ANCHOR STATEMENT — Find one statement that is definitively correct or incorrect. Use it to eliminate all options containing or excluding it.
2. ODD-ONE-OUT — Identify which item breaks a pattern (dynasty, river, feature, period). The outlier is usually the answer or the wrong option.
3. EXTREME LANGUAGE TRAP — Words like "always", "never", "only", "all", "first", "solely" almost always make a statement wrong. Flag them immediately.
4. PAIR ELIMINATION — In 4-option MCQs, if you're sure about 2 items in a list, check which option includes exactly those 2. Eliminates 3 options at once.
5. CHRONOLOGICAL ORDERING — Arrange events/texts/rulers/movements in time. Use known anchor dates (Harappa ~2500 BCE, Ashoka ~268 BCE, Gupta ~320 CE etc.) to eliminate wrong sequences.
6. GEOGRAPHICAL ELIMINATION — Use river-site, region-kingdom, or state-culture mapping. Wrong river or wrong region instantly eliminates an option.
7. ASSERTION-REASON FORMAT — Evaluate A and R independently first. Then check if R actually explains A or is merely related. Common trap: both correct but R doesn't explain A.
8. MATCH-THE-FOLLOWING GRID — Lock 1-2 definite pairs first. This eliminates options with wrong pairings and narrows to 1-2 options fast.
9. NEGATIVE QUESTION TECHNIQUE — "Which is NOT correct?" — Verify each option as true/false. The one that is false is the answer. Invert your usual logic.
10. DEGREE-OF-CERTAINTY — When unsure, rank options by how extreme/absolute they are. Most nuanced, qualified statement is usually correct in history.
11. PROCESS-OF-ELIMINATION BY KNOWN FACTS — Even if you don't know the answer, eliminate what you know is wrong. 2 wrong = 50/50 guess = worth attempting.
12. NCERT ANCHOR — Most UPSC Prelims history answers are directly from NCERT Class 6-12. If an option matches NCERT language exactly, it's likely correct.
13. CONTEMPORARY SOURCE TECHNIQUE — If a question names a text, inscription, or traveller account, recall what period/ruler they're associated with. This often directly gives the answer.
14. ADMINISTRATIVE/ECONOMIC TERM TECHNIQUE — Unfamiliar Sanskrit/Persian revenue or admin terms: check which dynasty/period they belong to. Revenue terms in Gupta = Kulyavapa, Dronavapa etc.

Your output must be a detailed, structured analysis — not a summary. Every section must have depth, specificity, and actionable insight for a UPSC aspirant.

CRITICAL ANTI-HALLUCINATION RULES FOR THE smart_guess SECTION — NON-NEGOTIABLE:
- You are roleplaying as a student who does NOT know the answer with certainty. You are showing HOW to reason under uncertainty — not recalling facts.
- NEVER invent specific dates, names, events, or facts that are not directly visible in the question text or inferable from universally known general knowledge.
- Every inference must be explicitly flagged: use phrases like "this suggests...", "by elimination...", "the phrasing implies...", "one can infer...", "this sounds like...", "historically this pattern suggests..." — NEVER present a guess as a confirmed fact.
- If you use a linguistic clue (a word sounds Persian / Sanskrit / Portuguese / British-era), say so explicitly. Do not fabricate a historical backstory to justify it.
- If you use cross-domain reasoning (geography, language, polity, economics, current affairs), name the exact domain and state what you are inferring from it.
- It is completely acceptable — and required — to say "a smart aspirant cannot know this with certainty but can narrow it down to X or Y because..." Intellectual honesty builds the right exam mindset.
- The smart_guess section models REASONING UNDER UNCERTAINTY — not confident fact-recall dressed up as guessing. If you violate this, you are actively harming the student.`;

    const userPrompt = `Analyze this UPSC Prelims MCQ in extreme detail:

Topic: ${topic}
Question: ${question}
Options:
${optionsFormatted}
Correct Answer: (${String.fromCharCode(65+correct)}) ${correctOption}

Respond ONLY with raw JSON (no markdown, no backticks, no trailing commas). Use this exact structure:
{
  "solution": "DETAILED step-by-step reasoning. Analyze EACH option individually with specific facts. Separate each point with || (double pipe). No newlines inside the string. Minimum 5 points separated by ||.",
  "technique": "Identify which technique from the list BEST fits this specific question's format — do NOT default to Linchpin. If it's a statement-based MCQ, use PAIR ELIMINATION or LINCHPIN only if truly applicable. If it's a single-fact question, use ODD-ONE-OUT or EXTREME LANGUAGE TRAP. State the chosen technique name and explain exactly HOW to apply it to THIS question. Show the exact thought process: which statement/option to evaluate first, what it tells you, how it eliminates other options. Be very specific to this question.",
  "concepts": "List 3-5 concepts. Format: ConceptName: key facts. Separate each with || (double pipe). No newlines.",
  "related": "List 4-6 UPSC themes. Format: Theme: why it matters. Separate each with || (double pipe). No newlines.",
  "smart_guess": "You are a UPSC aspirant in the exam hall. You do NOT have perfect knowledge. Your job is to reason out loud — showing exactly how a smart but uncertain student thinks. Follow these 6 points separated by || with no newlines. STRICT RULES THAT OVERRIDE EVERYTHING ELSE: (1) You may ONLY state as fact what is explicitly written in the question itself. Everything else is an inference and must be labeled as such using words like I think, this suggests, I am not certain but, by elimination, the phrasing implies, this sounds like, one can infer. (2) If you catch yourself about to state a specific date, name, place, or event that is NOT in the question — STOP. Either label it as uncertain or do not say it. (3) Hallucinating a confident-sounding inference is worse than saying I do not know. Intellectual honesty is the goal. || Point 1 — FIRST INSTINCT: Read the question once. What is the first thing that comes to mind — a partial memory, a vague association, a familiar word? Be honest. If nothing comes to mind say so. Do not pretend to remember things you are reconstructing. || Point 2 — WHAT THE LANGUAGE TELLS YOU: Look only at the words already written in the question and options. Do any words sound like they belong to a specific language — Sanskrit, Persian, Arabic, Portuguese, British English? Does the question structure itself give a clue — is it asking about a first, a last, a founder, a location? Does any option use extreme language like only, always, never, all, solely — which UPSC almost always makes wrong? Do not invent meaning — only read what is there. || Point 3 — CROSS-DOMAIN COMMON SENSE: What does general UPSC preparation knowledge suggest — not specific history facts but broad patterns? Examples of valid inferences: colonial-era English phrasing suggests British period; a Sanskrit-named city in options likely points to ancient India; if multiple options are geographically clustered the question is testing fine distinction not broad knowledge; if options are from different dynasties the question tests period identification. Name the pattern and say explicitly this is an inference not a confirmed fact. || Point 4 — THE REAL TRAP: The trap UPSC sets is NEVER the obviously wrong option. It is always the option that a half-prepared student mistakes for the answer because it is associated with the same topic but a different detail — right place wrong century, right person wrong event, right dynasty wrong ruler, correct institution different context. Identify which option is designed to fool someone who partially knows this topic and explain exactly why that option is tempting. If multiple options are thematically close — like different cities all associated with the same historical event series — flag all of them as traps not just one. || Point 5 — ELIMINATION STEP BY STEP: Start by eliminating what you are most confident is wrong. Explain why in one sentence. Then eliminate the next. Be honest when you cannot eliminate — say I cannot rule this out because I am not sure. If you reach 2 options state which one you would bet on and give the single deciding reason — even if it is just a hunch based on language or pattern. Never eliminate based on invented facts. || Point 6 — FINAL BET: State your answer choice and confidence — Low, Medium, or High. One sentence of core reasoning. If this question requires pure memorisation and cannot be cracked by reasoning alone say so honestly — and tell the student the exact subtopic to revise so this never happens again."
}`;

    // First call: solution, technique, concepts, related (with correct answer)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2500,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq error:', err);
      return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }

    const data = await response.json();
    console.error('GROQ RAW:', JSON.stringify(data).slice(0, 500));
    const text = data.choices?.[0]?.message?.content ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: 'Parse error' }, { status: 500 });

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // Try cleaning common JSON issues
      const cleaned = jsonMatch[0]
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        console.error('JSON parse failed:', jsonMatch[0].slice(0, 300));
        return NextResponse.json({ error: 'Parse error' }, { status: 500 });
      }
    }
    // Second call: smart_guess WITHOUT correct answer
    const smartGuessPrompt = `You are a UPSC aspirant sitting in the exam hall RIGHT NOW. You have NOT seen the answer key.

Topic: ${topic}
Question: ${question}
Options:
${optionsFormatted}

You do NOT know the correct answer. Reason out loud — showing exactly how a smart but uncertain student thinks through this. Follow these 6 points separated by || with no newlines inside.

STRICT RULES: (1) You may ONLY state as fact what is explicitly written in the question. Everything else must be labeled as inference using: "I think", "this suggests", "I am not certain but", "by elimination", "the phrasing implies". (2) NEVER mention or hint at what the correct answer is — you don't know it. (3) Never eliminate an option by saying it is "not included in the correct answer" — you don't have the answer key.

Point 1 — FIRST INSTINCT: What is the first thing that comes to mind from the question? A partial memory, vague association, familiar word? Be honest. || Point 2 — WHAT THE LANGUAGE TELLS YOU: Look only at words in the question and options. Any Sanskrit/Persian/British-era language clues? Any extreme words like only/always/never that UPSC usually makes wrong? || Point 3 — CROSS-DOMAIN COMMON SENSE: What do broad UPSC patterns suggest — not specific facts but general knowledge? Name the pattern explicitly as inference. || Point 4 — THE REAL TRAP: Which option is designed to fool a half-prepared student? Right topic wrong detail, right person wrong event, right dynasty wrong ruler? || Point 5 — ELIMINATION STEP BY STEP: Eliminate what you are most confident is wrong first. Be honest when you cannot eliminate — say so. If 2 options remain, state which you would bet on and why. || Point 6 — FINAL BET: Your answer choice and confidence (Low/Medium/High). If pure memorisation is needed say so and name the exact subtopic to revise.

Respond with ONLY a raw JSON string (no markdown):
{"smart_guess": "your full response here with || separating the 6 points"}`;

    let smartGuessText = '';
    try {
      const sgResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1200,
          temperature: 0.3,
          messages: [
            { role: 'user', content: smartGuessPrompt },
          ],
        }),
      });
      const sgData = await sgResponse.json();
      const sgText = sgData.choices?.[0]?.message?.content ?? '';
      const sgMatch = sgText.match(/\{[\s\S]*\}/);
      if (sgMatch) {
        const sgParsed = JSON.parse(sgMatch[0]);
        smartGuessText = sgParsed.smart_guess ?? '';
      }
    } catch {
      smartGuessText = '';
    }

    parsed.smart_guess = smartGuessText;

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('prelims-explain error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
