import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
import { createClient } from '@supabase/supabase-js';

const EMBED_SERVICE_URL = process.env.EMBED_SERVICE_URL || 'https://rag-embed-rerank.onrender.com';

async function localEmbed(text: string): Promise<number[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${EMBED_SERVICE_URL}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: [text] }),
        signal: AbortSignal.timeout(12000),
      });
      const data = await res.json();
      if (data.embeddings) return data.embeddings[0];
    } catch (e) {
      if (attempt === 1) throw e;
      console.warn('localEmbed attempt 1 failed, retrying...');
    }
  }
  throw new Error('Embed failed after 2 attempts');
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ context: '' });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    // Embed query via Render service
    const embedding = await localEmbed(query);

    // Fetch diverse chunks from Supabase
    const { data: chunks } = await supabase.rpc('match_book_chunks_diverse', {
      query_embedding: embedding,
      per_book_count: 3,
    });

    if (!chunks || chunks.length === 0) return NextResponse.json({ context: '' });

    // Filter by similarity + diversity (max 2 per book) + top 6 — no rerank
    const finalChunks: typeof chunks = [];
    const bookCount: Record<string, number> = {};
    for (const chunk of chunks) {
      if ((chunk.similarity ?? 1) <= 0.45) continue;
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
