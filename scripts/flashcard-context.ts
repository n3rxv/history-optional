/**
 * Dump everything needed to write flashcards for a topic.
 *
 *   npx tsx scripts/flashcard-context.ts <slug> [passages]
 *   npx tsx scripts/flashcard-context.ts --list
 *
 * The companion to scripts/generate-flashcards.ts for when the cards are
 * written by hand (or by an assistant in a conversation) rather than by an
 * API call: same three grounds, printed instead of prompted.
 *
 * Passages are truncated because the point is to ground attributions, not to
 * reproduce the book -- a paragraph is enough to see who argued what.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { allNotes } from '../lib/notes';
import { getPYQsForNote } from '../lib/notePyqMap';

const ROOT = path.resolve(import.meta.dirname, '..');
for (const line of readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const { searchDiverse } = await import('../lib/vectorStore');

const REST = `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '')}/rest/v1`;
const KEY = process.env.SUPABASE_SECRET_KEY!;
const sb = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const slug = process.argv[2];
const PASSAGES = Number(process.argv[3]) || 12;

if (!slug || slug === '--list') {
  const counts = new Map<string, number>();
  // PostgREST truncates an unbounded select at 1000 rows, so page through it
  // or the topics that sort last silently report zero cards.
  const rows: { topic: string }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const page = (await (
      await fetch(`${REST}/flashcards?select=topic&order=id&offset=${offset}&limit=1000`, { headers: sb })
    ).json()) as { topic: string }[];
    rows.push(...page);
    if (page.length < 1000) break;
  }
  for (const r of rows) {
    counts.set(r.topic, (counts.get(r.topic) ?? 0) + 1);
  }
  console.log('slug                                  cards  pyqs  section');
  for (const n of allNotes) {
    const c = counts.get(n.slug) ?? 0;
    const p = getPYQsForNote(n.slug, n.section).length;
    console.log(
      `${n.slug.padEnd(37)} ${String(c).padStart(5)} ${String(p).padStart(5)}  ${n.section}${c === 0 ? '   <- empty' : ''}`,
    );
  }
  process.exit(0);
}

const note = allNotes.find((n) => n.slug === slug);
if (!note) {
  console.error(`No topic "${slug}". Run with --list.`);
  process.exit(1);
}

async function voyageEmbed(text: string): Promise<number[]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.VOYAGE_API_KEY}` },
    body: JSON.stringify({ model: 'voyage-4-lite', input: [text], input_type: 'query' }),
  });
  const data = await res.json();
  if (!data.data?.[0]?.embedding) throw new Error('Voyage: ' + JSON.stringify(data).slice(0, 200));
  return data.data[0].embedding;
}

/**
 * Index and contents pages are dense in page numbers and commas and carry
 * almost no sentences. Both conditions are required: prose about, say, a
 * governor appointed twice in 1658 trips the digit test on its own.
 */
function looksLikeIndex(t: string): boolean {
  const digits = (t.match(/\d/g) ?? []).length / Math.max(t.length, 1);
  const commas = (t.match(/,/g) ?? []).length / Math.max(t.length, 1);
  return digits > 0.05 && commas > 0.025;
}

/**
 * One query per subtopic rather than one for the whole topic.
 *
 * A topic-level query is a bag of every term in the syllabus entry, and the
 * chunks that match a bag of everything best are index pages — they literally
 * contain every term in the book. Retrieval for "British Expansion in India.
 * Battle of Buxar, Mysore Wars, Anglo-Maratha Wars, Punjab" came back five
 * eighths indexes and bibliographies. Asking about Buxar on its own returns
 * prose about Buxar.
 */
const queries = note.subtopics?.length
  ? note.subtopics.map((s) => `${s} — ${note.title}`)
  : [`${note.title}. ${note.description}`];

const existingRes = await fetch(
  `${REST}/flashcards?select=id,type,front&topic=eq.${encodeURIComponent(slug)}`,
  { headers: sb },
);
const existing = (await existingRes.json()) as { id: string; type: string; front: string }[];

const perQuery = Math.max(3, Math.ceil((PASSAGES * 2) / queries.length));
const byId = new Map<string | number, { content: string; book_title: string; author: string; similarity: number; via: string }>();

for (const q of queries) {
  const emb = await voyageEmbed(q);
  const hits = await searchDiverse(emb, { perBook: 2, maxResults: perQuery });
  for (const h of hits) {
    if (looksLikeIndex(h.content)) continue;
    const prev = byId.get(h.id);
    if (!prev || h.similarity > prev.similarity) {
      byId.set(h.id, { ...h, via: q.split(' — ')[0] });
    }
  }
}

const passages = [...byId.values()]
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, PASSAGES);
const pyqs = getPYQsForNote(note.slug, note.section) as { year: number; marks?: number; question: string }[];

console.log(`=== ${note.title} (${slug}) ===`);
console.log(`Paper ${note.paper} · ${note.section} · ${note.description}`);
if (note.subtopics?.length) console.log(`Subtopics: ${note.subtopics.join(', ')}`);
console.log(`Existing cards: ${existing.length} · PYQs: ${pyqs.length}`);

console.log(`\n--- PASSAGES (${passages.length}) ---`);
for (const [i, p] of passages.entries()) {
  console.log(`\n[${i + 1}] ${p.book_title} | ${p.author} | sim ${p.similarity.toFixed(3)} | via: ${p.via}`);
  console.log(p.content.replace(/\s+/g, ' ').slice(0, 900));
}

console.log(`\n--- PYQs (${Math.min(pyqs.length, 20)} of ${pyqs.length}) ---`);
for (const q of pyqs.slice(0, 20)) {
  console.log(`(${q.year}${q.marks ? `, ${q.marks}m` : ''}) ${q.question.replace(/\s+/g, ' ').slice(0, 220)}`);
}

console.log(`\n--- EXISTING FRONTS (do not repeat) ---`);
if (!existing.length) console.log('(none)');
for (const e of existing) console.log(`[${e.type}] ${e.front.slice(0, 150)}`);
