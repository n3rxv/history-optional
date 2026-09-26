/**
 * Back up the flashcards table to a tracked file, or restore it from one.
 *
 *   npx tsx scripts/flashcards-backup.ts              # database -> supabase/flashcards.backup.json
 *   npx tsx scripts/flashcards-backup.ts --restore    # file -> database
 *
 * The cards are written and edited in Postgres, so the database is the source
 * of truth and this file is a copy of it — not the other way round. Keeping
 * the hand-built JSONs that produced a batch would have gone stale the first
 * time anyone corrected a card.
 *
 * Why it exists at all: this project has no database backups, and 190 of the
 * 245 cards were written in a single stretch. Losing the table would mean
 * writing them again.
 *
 * Restore preserves ids and status. Ids matter because the study page keys
 * spaced-repetition progress on them in localStorage, so a restore that
 * renumbered cards would silently reset every reader's review history.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
for (const line of readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const REST = `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '')}/rest/v1`;
const KEY = process.env.SUPABASE_SECRET_KEY!;
const headers = { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}` };

const FILE = path.join(ROOT, 'supabase/flashcards.backup.json');
const RESTORE = process.argv.includes('--restore');

const COLUMNS = [
  'id', 'topic', 'paper', 'section', 'type',
  'front', 'back', 'front_hi', 'back_hi',
  'source_book', 'source_author', 'source_chunk_id', 'status',
].join(',');

if (!RESTORE) {
  // Paged, because PostgREST caps a single response and a silent truncation
  // would produce a backup that looks complete and is not.
  const all: Record<string, unknown>[] = [];
  const PAGE = 500;
  for (let offset = 0; ; offset += PAGE) {
    const res = await fetch(`${REST}/flashcards?select=${COLUMNS}&order=id&limit=${PAGE}&offset=${offset}`, {
      headers,
    });
    if (!res.ok) {
      console.error(`export failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
      process.exit(1);
    }
    const page = (await res.json()) as Record<string, unknown>[];
    all.push(...page);
    if (page.length < PAGE) break;
  }

  // Verify against the table's own count rather than trusting the paging.
  const head = await fetch(`${REST}/flashcards?select=id`, {
    headers: { ...headers, Prefer: 'count=exact', Range: '0-0' },
  });
  const total = Number(head.headers.get('content-range')?.split('/')[1] ?? NaN);
  if (Number.isFinite(total) && total !== all.length) {
    console.error(`refusing to write: fetched ${all.length} rows but the table holds ${total}`);
    process.exit(1);
  }

  writeFileSync(FILE, JSON.stringify(all, null, 2) + '\n');
  const byStatus = all.reduce<Record<string, number>>((acc, c) => {
    const s = String(c.status);
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`wrote ${all.length} cards to supabase/flashcards.backup.json`);
  console.log(Object.entries(byStatus).map(([s, n]) => `  ${n} ${s}`).join('\n'));
} else {
  const cards = JSON.parse(readFileSync(FILE, 'utf8')) as Record<string, unknown>[];
  console.log(`restoring ${cards.length} cards, preserving ids and status`);

  const BATCH = 100;
  for (let i = 0; i < cards.length; i += BATCH) {
    const slice = cards.slice(i, i + BATCH);
    const res = await fetch(`${REST}/flashcards`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(slice),
    });
    if (!res.ok) {
      console.error(`\nbatch at ${i} failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
      process.exit(1);
    }
    process.stdout.write(`\rrestored ${Math.min(i + BATCH, cards.length)}/${cards.length}`);
  }
  console.log('\ndone');
}
