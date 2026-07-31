import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
import { createClient } from '@supabase/supabase-js';

async function voyageEmbed(text: string): Promise<number[]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ model: 'voyage-4-lite', input: [text], input_type: 'query' }),
  });
  const data = await res.json();
  if (!data.data?.[0]?.embedding) throw new Error('Voyage embed failed: ' + JSON.stringify(data));
  return data.data[0].embedding;
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ context: '' });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    const embedding = await voyageEmbed(query);

    const { data: chunks } = await supabase.rpc('match_book_chunks_diverse', {
      query_embedding: embedding,
      per_book_count: 3,
    });

    if (!chunks || chunks.length === 0) return NextResponse.json({ context: '' });

    const filtered = chunks.filter((c: any) => (c.similarity ?? 1) > 0.45);
    const toSelect = (filtered.length >= 3 ? filtered : chunks).slice(0, 12);

    const finalChunks: typeof toSelect = [];
    const bookCount: Record<string, number> = {};
    for (const chunk of toSelect) {
      const count = bookCount[chunk.book_title] ?? 0;
      if (count < 2) {
        finalChunks.push(chunk);
        bookCount[chunk.book_title] = count + 1;
      }
      if (finalChunks.length >= 6) break;
    }

    const context = finalChunks
      .map((c: any, i: number) => `[Source ${i + 1} — ${c.book_title} | Author: ${c.author}]\n${c.content}`)
      .join('\n\n---\n\n');

    return NextResponse.json({ context });
  } catch (err) {
    console.error('RAG search error:', err);
    return NextResponse.json({ context: '' });
  }
}
