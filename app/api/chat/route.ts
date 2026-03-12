import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, system } = await req.json();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          ...messages
        ],
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'No response';
    return NextResponse.json({ content: [{ text }] });
  } catch (err) {
    return NextResponse.json({ content: [{ text: 'Error: ' + err }] });
  }
}
