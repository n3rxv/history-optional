import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    const { pipeline } = await import('@xenova/transformers');
    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const output = await embedder(query, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data as Float32Array);

    const { data: chunks, error } = await supabase.rpc('match_book_chunks', {
      query_embedding: embedding,
      match_count: 4,
    });

    if (error) throw error;

    const context = chunks
      ?.map((c: { book_title: string; content: string }) => `[${c.book_title}]\n${c.content}`)
      .join('\n\n---\n\n') ?? '';

    return NextResponse.json({ context });
  } catch (err) {
    console.error('RAG error:', err);
    return NextResponse.json({ context: '' });
  }
}
