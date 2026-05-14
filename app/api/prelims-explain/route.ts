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

Your output must be a detailed, structured analysis — not a summary. Every section must have depth, specificity, and actionable insight for a UPSC aspirant.`;

    const userPrompt = `Analyze this UPSC Prelims MCQ in extreme detail:

Topic: ${topic}
Question: ${question}
Options:
${optionsFormatted}
Correct Answer: (${String.fromCharCode(65+correct)}) ${correctOption}

Respond ONLY with raw JSON (no markdown, no backticks, no trailing commas). Use this exact structure:
{
  "solution": "DETAILED step-by-step reasoning. Analyze EACH option/statement individually — explain why it is correct or incorrect with specific historical facts. End with why the correct answer is definitively right. Minimum 5-6 sentences.",
  "technique": "Name the primary technique (e.g. LINCHPIN STATEMENT, PAIR ELIMINATION etc.) and explain exactly HOW to apply it to THIS question. Show the exact thought process: which statement/option to evaluate first, what it tells you, how it eliminates other options. Be very specific to this question.",
  "concepts": "List 3-5 core concepts a student MUST know to answer this. For each concept, give 1-2 key facts. Format: 'Concept name: key fact(s)'. Cover the topic deeply.",
  "related": "List 4-6 related UPSC themes, potential follow-up questions, and recurring patterns. Format as: 'Theme: why it matters for UPSC'. Include any PYQ patterns if relevant."
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2000,
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
    const text = data.choices?.[0]?.message?.content ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: 'Parse error' }, { status: 500 });

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('prelims-explain error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
