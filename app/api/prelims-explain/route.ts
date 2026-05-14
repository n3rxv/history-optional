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
  "smart_guess": "ROLEPLAY AS EXAM-HALL ASPIRANT: You are a sharp UPSC aspirant sitting in the exam. You have studied sincerely but are NOT certain of the answer to this specific question. Show your live reasoning across 6 points separated by || (double pipe). No newlines inside. No block labels or headings — just the reasoning directly. Point 1: What does a prepared aspirant notice in the first 10 seconds? Any familiar name, term, place, dynasty, act, or pattern that triggers even a partial memory? State it honestly including if nothing rings a bell. Do not pretend to know more than you do. || Point 2: Carefully read the actual words in the question and options. Does any term sound distinctly Sanskrit, Persian, Arabic, Portuguese, or British-colonial? Does any option use absolute language like only, always, never, solely, first, all which is a classic UPSC trap? Name the exact clue and what it suggests. Do NOT invent facts. || Point 3: What does a well-rounded UPSC aspirant know from adjacent domains — Geography, Polity, Economics, Current Affairs — that helps here? Name the exact domain and frame your inference explicitly as an inference not a fact. || Point 4: Identify the deliberate trap UPSC has set. Which option is designed to fool someone who half-knows the topic? Name it and explain exactly why a careless aspirant would fall for it. || Point 5: Walk through elimination step by step. Start with the option most confidently wrong. Show how far elimination gets you. If narrowed to 2, state which one you would bet on and the single deciding reason. || Point 6: State your final answer choice and confidence — Low, Medium, or High. One crisp reasoning sentence. If genuinely unknowable without memorisation say so and tell the student exactly what to study. ABSOLUTE RULES: Never invent facts. Never state a guess as certainty. Always hedge inferences. Model intellectual honesty."
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 3500,
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
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('prelims-explain error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
