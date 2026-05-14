import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Remove edge runtime — Supabase admin client needs Node.js runtime
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

    const prompt = `You are an expert UPSC Prelims teacher. A student attempted this MCQ:

Topic: ${topic}
Question: ${question}
Options: ${options.map((o: string, i: number) => `(${String.fromCharCode(65+i)}) ${o}`).join(' | ')}
Correct Answer: (${String.fromCharCode(65+correct)}) ${correctOption}

Respond ONLY with raw JSON (no markdown, no backticks):
{
  "solution": "Step-by-step reasoning why this answer is correct. Be factual and specific.",
  "technique": "The elimination or reasoning technique to crack this question type fast in exam.",
  "concepts": "2-4 key facts/concepts a student must know to answer this.",
  "related": "3-5 related UPSC keywords, topics, or themes this question connects to."
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 700,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
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
