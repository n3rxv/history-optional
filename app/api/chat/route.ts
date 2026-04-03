import { NextRequest, NextResponse } from 'next/server';

const chatLimits = new Map<string, { count: number; ts: number }>();
const LIMIT = 20; // max 20 messages per 10 minutes per IP

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const now = Date.now();
  const entry = chatLimits.get(ip);

  if (entry && now - entry.ts > 10 * 60 * 1000) chatLimits.delete(ip);

  const current = chatLimits.get(ip);
  if (current && current.count >= LIMIT) {
    return NextResponse.json({ content: [{ text: 'Too many messages. Please wait a few minutes.' }] }, { status: 429 });
  }
  chatLimits.set(ip, { count: (current?.count ?? 0) + 1, ts: current?.ts ?? now });

  try {
    const { messages, system } = await req.json();

    const groqFetch = async (model: string) =>
      fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            ...messages
          ],
          max_tokens: 1024,
        }),
      });

    // Try Kimi-K2 first, fall back to llama-3.3-70b on capacity issues
    let response = await groqFetch('moonshotai/kimi-k2-instruct');

    if (response.status === 503 || response.status === 429) {
      console.log('Kimi-K2 over capacity in chat, falling back to llama-3.3-70b...');
      response = await groqFetch('llama-3.3-70b-versatile');
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'No response';
    return NextResponse.json({ content: [{ text }] });
  } catch {
    return NextResponse.json({ content: [{ text: 'Something went wrong. Please try again.' }] });
  }
}
