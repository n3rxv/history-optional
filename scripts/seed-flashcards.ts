/**
 * Load the cards in lib/flashcards.ts into the flashcards table.
 *
 *   npx tsx scripts/seed-flashcards.ts [--dry]
 *
 * Upserts on id, so re-running is safe and idempotent. Ids are preserved
 * exactly -- the study page keys spaced-repetition progress on card id in
 * localStorage, so changing them would silently reset everyone's reviews.
 *
 * lib/flashcards.ts stays in the repo after this as the seed source and as
 * the type definition. What changes is that the client page stops importing
 * it, which is the whole point: it was shipping every card to every browser.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { flashcards } from '../lib/flashcards';

const ROOT = path.resolve(import.meta.dirname, '..');
for (const line of readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const DRY = process.argv.includes('--dry');

// PostgREST over plain fetch rather than @supabase/supabase-js: that client
// pulls in Realtime, which needs a WebSocket global Node 20 does not have.
// The app itself is fine (Vercel runs a newer Node), but a seed script should
// not need a dependency to insert rows.
const REST = `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, '')}/rest/v1`;
const KEY = process.env.SUPABASE_SECRET_KEY!;
const headers = {
  'Content-Type': 'application/json',
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
};

const rows = flashcards.map((c) => ({
  id: c.id,
  topic: c.topic,
  paper: c.paper,
  section: c.section,
  type: c.type,
  front: c.front,
  back: c.back,
  front_hi: c.front_hi ?? null,
  back_hi: c.back_hi ?? null,
  status: 'published',
}));

// A duplicate id would silently overwrite a card rather than add one, so it is
// worth failing loudly here instead of losing content quietly.
const seen = new Set<string>();
const dupes = rows.filter((r) => (seen.has(r.id) ? true : (seen.add(r.id), false)));
if (dupes.length) {
  console.error(`Duplicate ids in lib/flashcards.ts: ${dupes.map((d) => d.id).join(', ')}`);
  process.exit(1);
}

console.log(`${rows.length} cards to seed (${new Set(rows.map((r) => r.topic)).size} topics)`);
if (DRY) {
  console.log('--dry: nothing written');
  process.exit(0);
}

const BATCH = 100;
let done = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const slice = rows.slice(i, i + BATCH);
  const res = await fetch(`${REST}/flashcards`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(slice),
  });
  if (!res.ok) {
    console.error(`\nbatch at ${i} failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    process.exit(1);
  }
  done += slice.length;
  process.stdout.write(`\rupserted ${done}/${rows.length}`);
}

const verify = await fetch(`${REST}/flashcards?select=id`, {
  headers: { ...headers, Prefer: 'count=exact', Range: '0-0' },
});
// PostgREST reports the total in Content-Range as "0-0/<count>".
const total = verify.headers.get('content-range')?.split('/')[1] ?? '?';
console.log(`\ndone: table now holds ${total} cards`);
