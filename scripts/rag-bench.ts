/**
 * Measure retrieval latency and diversity, so tuning can be judged rather
 * than guessed at.
 *
 *   npx tsx scripts/rag-bench.ts [runs-per-question]
 *
 * Reports the median rather than the mean: one slow cold query would drag a
 * mean around and make two identical configurations look different.
 *
 * "books@6" is the quality guard. Every caller slices to about six chunks, so
 * what matters is how many distinct historians survive into that slice. If a
 * change halves latency but drops books@6, it is not a win -- History
 * Optional answers are marked on citing several historians.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
for (const line of readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const { searchDiverse } = await import('../lib/vectorStore');

const RUNS = Number(process.argv[2] ?? 3);
// Unset uses whatever searchDiverse defaults to, which is what most callers
// get. Set it to compare a specific group count against the default.
const MAX_RESULTS = process.env.MAXRESULTS ? Number(process.env.MAXRESULTS) : undefined;

const QUESTIONS = [
  'Assess the nature of the Mauryan state and its administration',
  'Evaluate the economic impact of the Permanent Settlement in Bengal',
  'Discuss the character of the Mughal land revenue system',
  'Examine the causes of the decline of the Harappan civilisation',
  'How did the Bhakti movement affect medieval Indian society?',
  'Analyse the consequences of the Industrial Revolution in Europe',
];

const cache = new Map<string, number[]>();
async function embed(text: string): Promise<number[]> {
  const hit = cache.get(text);
  if (hit) return hit;
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
  cache.set(text, data.data[0].embedding);
  return data.data[0].embedding;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

// Embed everything first so Voyage latency never lands inside a timing.
console.log(`embedding ${QUESTIONS.length} questions ...`);
const vectors = await Promise.all(QUESTIONS.map(embed));

// One untimed pass: the first query after a config change pays for loading
// segments, and that is not what we are measuring.
await searchDiverse(vectors[0], { perBook: 3, maxResults: MAX_RESULTS });

const all: number[] = [];
const booksAt6: number[] = [];

console.log(`\n${RUNS} runs per question, maxResults=${MAX_RESULTS ?? "default"}\n`);
for (const [i, q] of QUESTIONS.entries()) {
  const times: number[] = [];
  let chunks: Awaited<ReturnType<typeof searchDiverse>> = [];
  for (let r = 0; r < RUNS; r++) {
    const t = Date.now();
    chunks = await searchDiverse(vectors[i], { perBook: 3, maxResults: MAX_RESULTS });
    times.push(Date.now() - t);
  }
  const med = median(times);
  const b6 = new Set(chunks.slice(0, 6).map((c) => c.book_title)).size;
  all.push(...times);
  booksAt6.push(b6);
  console.log(
    `${String(med).padStart(5)}ms  books@6=${b6}  returned=${String(chunks.length).padStart(2)}  ${q.slice(0, 44)}`,
  );
}

console.log('\n──────── summary ────────');
console.log(`median latency : ${median(all)}ms`);
console.log(`min / max      : ${Math.min(...all)}ms / ${Math.max(...all)}ms`);
console.log(`mean books@6   : ${(booksAt6.reduce((a, b) => a + b, 0) / booksAt6.length).toFixed(2)} (6 is the ceiling)`);
