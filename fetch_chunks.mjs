// fetch_chunks.mjs
// Run: node fetch_chunks.mjs "your query here"
// Needs: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, JINA_API_KEY in env

import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
const JINA_KEY = process.env.JINA_API_KEY;

const query = process.argv[2] || 'causes of 1857 revolt';

async function jinaEmbedBatch(texts) {
  const res = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JINA_KEY}`,
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v3',
      task: 'retrieval.query',
      dimensions: 384,
      input: texts,
    }),
  });
  const data = await res.json();
  if (!data.data) throw new Error('Jina embed failed: ' + JSON.stringify(data));
  return data.data.map(d => d.embedding);
}

async function jinaRerank(query, chunks) {
  const res = await fetch('https://api.jina.ai/v1/rerank', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JINA_KEY}`,
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
  return data.results.map(r => ({ ...chunks[r.index], score: r.relevance_score }));
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    realtime: { transport: ws },
  });

  console.log(`\nQuery: "${query}"\n`);
  console.log('Step 1: Embedding...');
  const [embedding] = await jinaEmbedBatch([query]);

  console.log('Step 2: Fetching from Supabase (match_book_chunks_diverse)...');
  const { data: allChunks, error } = await supabase.rpc('match_book_chunks_diverse', {
    query_embedding: embedding,
    per_book_count: 3,
  });
  if (error) throw new Error('Supabase error: ' + JSON.stringify(error));

  console.log(`Got ${allChunks.length} chunks from ${new Set(allChunks.map(c => c.book_title)).size} books\n`);

  // Same filter as production
  const filtered = allChunks.filter(c => (c.similarity ?? 1) > 0.45);
  console.log(`After 0.45 similarity filter: ${filtered.length} chunks from ${new Set(filtered.map(c => c.book_title)).size} books`);

  // Show which books got filtered out
  const filteredOutBooks = [...new Set(allChunks.map(c => c.book_title))].filter(
    b => !filtered.some(c => c.book_title === b)
  );
  if (filteredOutBooks.length > 0) {
    console.log(`Filtered out books (similarity < 0.45): ${filteredOutBooks.join(', ')}\n`);
  }

  const chunksToRerank = (filtered.length >= 3 ? filtered : allChunks).slice(0, 12);

  console.log('Step 3: Reranking...');
  const reranked = await jinaRerank(query, chunksToRerank);

  // Same diversity logic as production (max 2 per book)
  const finalChunks = [];
  const bookCount = {};
  const overflow = [];
  for (const chunk of reranked) {
    const count = bookCount[chunk.book_title] ?? 0;
    if (count < 2) {
      finalChunks.push(chunk);
      bookCount[chunk.book_title] = count + 1;
    } else {
      overflow.push(chunk);
    }
    if (finalChunks.length >= 8) break;
  }
  for (const chunk of overflow) {
    if (finalChunks.length >= 8) break;
    finalChunks.push(chunk);
  }

  console.log(`\nFinal ${finalChunks.length} chunks:\n`);
  console.log('='.repeat(60));

  finalChunks.forEach((c, i) => {
    console.log(`\n[Source ${i + 1} — ${c.book_title} | Author: ${c.author}]`);
    console.log(`Similarity: ${c.similarity?.toFixed(4)} | Rerank score: ${c.score?.toFixed(4)}`);
    console.log('-'.repeat(40));
    console.log(c.content.slice(0, 500) + (c.content.length > 500 ? '...' : ''));
  });

  // Also print formatted block ready to paste into system prompt
  console.log('\n' + '='.repeat(60));
  console.log('FORMATTED FOR SYSTEM PROMPT:');
  console.log('='.repeat(60) + '\n');
  const formatted = finalChunks
    .map((c, i) => `[Source ${i + 1} — ${c.book_title} | Author: ${c.author}]\n${c.content}`)
    .join('\n\n---\n\n');
  console.log(formatted);
}

main().catch(console.error);
