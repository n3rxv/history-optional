import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

async function jinaRerank(query: string, chunks: {id: any, content: string, book_title: string, author: string}[]) {
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
    return data.results.map((r: any) => ({ ...chunks[r.index], score: r.relevance_score }));
  } catch {
    return chunks.slice(0, 6).map(c => ({ ...c, score: 0 }));
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ context: '' });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    // Embed query
    const embedding = await jinaEmbed(query);

    // Fetch diverse chunks
    const { data: chunks } = await supabase.rpc('match_book_chunks_diverse', {
      query_embedding: embedding,
      per_book_count: 3,
    });

    if (!chunks || chunks.length === 0) return NextResponse.json({ context: '' });

    // Filter low similarity
    const filtered = chunks.filter((c: any) => (c.similarity ?? 1) > 0.45);
    const toRerank = (filtered.length >= 3 ? filtered : chunks).slice(0, 12);

    // Rerank
    const reranked = await jinaRerank(query, toRerank);

    // Diversity — max 2 per book
    const finalChunks: typeof reranked = [];
    const bookCount: Record<string, number> = {};
    for (const chunk of reranked) {
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
