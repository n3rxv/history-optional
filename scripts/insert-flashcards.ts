/**
 * Insert hand-written flashcards from a JSON file.
 *
 *   npx tsx scripts/insert-flashcards.ts cards.json [--publish]
 *
 * The file is a JSON array of objects:
 *   { topic, type, front, back, front_hi, back_hi, source_book?, source_author? }
 *
 * paper, section and id are filled in from lib/notes.ts and the current
 * high-water mark, so the caller only writes the parts that require judgement.
 *
 * Cards go in as drafts by default. --publish is for when they have already
 * been reviewed; it is deliberately a flag rather than the default, because
 * the cost of an unreviewed card reaching a student is higher than the cost
 * of one extra command.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { allNotes } from '../lib/notes';

const ROOT = path.resolve(import.meta.dirname, '..');
for (const line of readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const REST = `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '')}/rest/v1`;
const KEY = process.env.SUPABASE_SECRET_KEY!;
const headers = { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}` };

const file = process.argv[2];
const PUBLISH = process.argv.includes('--publish');
if (!file) {
  console.error('usage: npx tsx scripts/insert-flashcards.ts <file.json> [--publish]');
  process.exit(1);
}

type Input = {
  topic: string;
  type: 'historian' | 'comparison' | 'cause-effect' | 'quote' | 'concept';
  front: string;
  back: string;
  front_hi: string;
  back_hi: string;
  source_book?: string;
  source_author?: string;
};

const cards: Input[] = JSON.parse(readFileSync(path.resolve(file), 'utf8'));
const TYPES = new Set(['historian', 'comparison', 'cause-effect', 'quote', 'concept']);

// Validate everything before writing anything: a half-inserted batch is far
// more annoying to clean up than a rejected one.
const problems: string[] = [];
cards.forEach((c, i) => {
  const note = allNotes.find((n) => n.slug === c.topic);
  if (!note) problems.push(`[${i}] unknown topic "${c.topic}"`);
  if (!TYPES.has(c.type)) problems.push(`[${i}] bad type "${c.type}"`);
  for (const f of ['front', 'back', 'front_hi', 'back_hi'] as const) {
    if (!c[f]?.trim()) problems.push(`[${i}] empty ${f}`);
  }
  if (c.front && c.front.length > 400) problems.push(`[${i}] front too long (${c.front.length})`);
});

// Duplicate fronts, both inside this batch and against what is already stored.
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9ऀ-ॿ ]/g, '').replace(/\s+/g, ' ').trim();
const seen = new Set<string>();
cards.forEach((c, i) => {
  const k = norm(c.front);
  if (seen.has(k)) problems.push(`[${i}] duplicate front within this file`);
  seen.add(k);
});

const stored = (await (
  await fetch(`${REST}/flashcards?select=front`, { headers })
).json()) as { front: string }[];
const storedKeys = new Set(stored.map((s) => norm(s.front)));
cards.forEach((c, i) => {
  if (storedKeys.has(norm(c.front))) problems.push(`[${i}] already in the database: "${c.front.slice(0, 60)}"`);
});

if (problems.length) {
  console.error(`${problems.length} problem(s), nothing written:`);
  for (const p of problems.slice(0, 25)) console.error(`  ${p}`);
  process.exit(1);
}

const idRes = await fetch(`${REST}/flashcards?select=id&id=like.g*&order=id.desc&limit=1`, { headers });
const idRows = (await idRes.json()) as { id: string }[];
let next = idRows.length ? Number(idRows[0].id.slice(1)) + 1 : 1;

const rows = cards.map((c) => {
  const note = allNotes.find((n) => n.slug === c.topic)!;
  return {
    id: `g${String(next++).padStart(4, '0')}`,
    topic: c.topic,
    paper: note.paper,
    section: note.section,
    type: c.type,
    front: c.front,
    back: c.back,
    front_hi: c.front_hi,
    back_hi: c.back_hi,
    source_book: c.source_book ?? null,
    source_author: c.source_author ?? null,
    status: PUBLISH ? 'published' : 'draft',
  };
});

const res = await fetch(`${REST}/flashcards`, {
  method: 'POST',
  headers: { ...headers, Prefer: 'return=minimal' },
  body: JSON.stringify(rows),
});
if (!res.ok) {
  console.error(`insert failed (${res.status}): ${(await res.text()).slice(0, 400)}`);
  process.exit(1);
}

const byTopic = new Map<string, number>();
for (const r of rows) byTopic.set(r.topic, (byTopic.get(r.topic) ?? 0) + 1);
console.log(`inserted ${rows.length} cards as ${PUBLISH ? 'published' : 'drafts'} (${rows[0].id}–${rows[rows.length - 1].id})`);
for (const [t, n] of byTopic) console.log(`  ${n}  ${t}`);
