/**
 * End-to-end check of the Qdrant-backed retrieval path.
 *
 *   npx tsx scripts/rag-smoke.ts ["a question"]
 *
 * Exercises lib/vectorStore.ts itself rather than re-issuing the REST calls,
 * so what passes here is the same code the API routes run. Embeds a real
 * question through Voyage, so it costs a fraction of a cent per run.
 *
 * What to look for: several *different* books in the diverse results. The
 * whole point of the grouped query is that a contested question surfaces more
 * than one historian -- that is what History Optional answers are marked on.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

// vectorStore reads QDRANT_COLLECTION at module load, so the environment has
// to be in place before it is imported.
for (const line of readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const { searchDiverse, searchBook } = await import('../lib/vectorStore');

const question = process.argv[2] ?? 'Assess the nature of the Mauryan state and its administration';

async function embed(text: string): Promise<number[]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ model: 'voyage-4-lite', input: [text], input_type: 'query' }),
  });
  const data = await res.json();
  if (!data.data?.[0]?.embedding) throw new Error('Voyage: ' + JSON.stringify(data).slice(0, 200));
  return data.data[0].embedding;
}

console.log(`question: ${question}\n`);
const t0 = Date.now();
const vector = await embed(question);
console.log(`embedded in ${Date.now() - t0}ms (${vector.length} dims)\n`);

const t1 = Date.now();
const diverse = await searchDiverse(vector, { perBook: 3 });
const ms = Date.now() - t1;

console.log(`── searchDiverse: ${diverse.length} chunks in ${ms}ms ──`);
for (const [i, c] of diverse.slice(0, 8).entries()) {
  console.log(`${String(i + 1).padStart(2)}. ${c.similarity.toFixed(3)}  ${c.book_title.slice(0, 52)}`);
}
const distinct = new Set(diverse.map((c) => c.book_title));
console.log(`\ndistinct books in results: ${distinct.size}`);
console.log(distinct.size >= 3
  ? '✓ diversity working — several historians represented'
  : '⚠ only ' + distinct.size + ' book(s); check the book_title payload index');

// The first result's own book is guaranteed to have content, so it is a fair
// target for the single-book path.
const target = diverse[0]?.book_title;
if (target) {
  const t2 = Date.now();
  const single = await searchBook(vector, target, { limit: 5 });
  console.log(`\n── searchBook("${target.slice(0, 40)}"): ${single.length} chunks in ${Date.now() - t2}ms ──`);
  const leaked = single.filter((c) => c.book_title !== target);
  console.log(leaked.length === 0
    ? '✓ filter holds — all results from the requested book'
    : `✗ filter leaked ${leaked.length} chunk(s) from other books`);
}

console.log(`\nsample passage:\n${(diverse[0]?.content ?? '').slice(0, 240)}...`);
