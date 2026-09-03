import { createClient } from '@supabase/supabase-js';

/**
 * Book-passage retrieval for the evaluation flow.
 *
 * This used to live behind POST /api/rag-search, which /api/evaluate called
 * over HTTP against its own domain. That was wrong twice over: the route was
 * unauthenticated, so anyone could spend Voyage embedding credits by POSTing
 * to it, and the self-call burned a second lambda invocation plus a network
 * round-trip on every evaluation — with NEXT_PUBLIC_SITE_URL unset it fell
 * back to http://localhost:3000 and silently returned nothing in production.
 *
 * Callers now invoke this directly, in-process.
 */

const SIMILARITY_FLOOR = 0.45;
const MAX_CHUNKS = 6;
const EMBED_TIMEOUT_MS = 8000;

async function voyageEmbed(text: string, signal: AbortSignal): Promise<number[]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ model: 'voyage-4-lite', input: [text], input_type: 'query' }),
    signal,
  });
  const data = await res.json();
  if (!data.data?.[0]?.embedding) {
    throw new Error('Voyage embed failed: ' + JSON.stringify(data).slice(0, 300));
  }
  return data.data[0].embedding;
}

type Chunk = {
  content: string;
  book_title: string;
  author: string;
  similarity?: number;
};

/**
 * Returns source-labelled passages for `query`, or '' when nothing is
 * relevant. Never throws — retrieval is an enhancement, and an evaluation
 * without book context is worth more to the student than a failed request.
 */
export async function getBookContext(query: string): Promise<string> {
  if (!query || query.trim().length < 4) return '';

  // Without a deadline a hung upstream eats the caller's whole time budget.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EMBED_TIMEOUT_MS);

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      { auth: { persistSession: false } }
    );

    const embedding = await voyageEmbed(query, controller.signal);

    const { data: chunks } = await supabase.rpc('match_book_chunks_diverse', {
      query_embedding: embedding,
      per_book_count: 3,
    });

    if (!chunks || chunks.length === 0) return '';

    // Below the floor the books simply do not cover this topic. Keep the
    // unfiltered set when filtering leaves too little to be useful.
    const filtered = (chunks as Chunk[]).filter((c) => (c.similarity ?? 1) > SIMILARITY_FLOOR);
    const finalChunks = (filtered.length >= 3 ? filtered : (chunks as Chunk[])).slice(0, MAX_CHUNKS);

    return finalChunks
      .map((c, i) => `[Source ${i + 1} — ${c.book_title} | Author: ${c.author}]\n${c.content}`)
      .join('\n\n---\n\n');
  } catch (err) {
    console.error('[ragSearch] retrieval failed (non-fatal):', err);
    return '';
  } finally {
    clearTimeout(timer);
  }
}
