/**
 * Compares the "Chat with Books" menu against what the corpus actually holds.
 *
 * The menu used to be hardcoded twice inside app/chat/page.tsx, so the two
 * could drift with nothing to notice: both JL Mehta volumes were embedded,
 * retrievable, and unselectable, because ingesting a book does not touch the
 * markup. This makes that state fail loudly instead.
 *
 * A listed title that is not in the database is worse than it looks — the
 * reader picks a book, ragSearch filters on a title that matches nothing, and
 * the answer comes back with no sources rather than an error.
 *
 * Usage: npx tsx scripts/checkBookList.mts
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { BOOKS } from '../lib/books';

for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false },
});

// PostgREST caps a select at 1,000 rows by default. Reading the corpus in one
// call reported 11 books out of 32 and would have flagged 21 healthy titles as
// missing — a check that lies is worse than no check.
const counts = new Map<string, number>();
const PAGE = 1000;
for (let from = 0; ; from += PAGE) {
  const { data, error } = await db
    .from('book_chunks').select('book_title').range(from, from + PAGE - 1);
  if (error) { console.error('  query failed:', error.message); process.exit(1); }
  for (const r of data ?? []) counts.set(r.book_title, (counts.get(r.book_title) ?? 0) + 1);
  if (!data || data.length < PAGE) break;
}
const totalChunks = [...counts.values()].reduce((a, b) => a + b, 0);

const listed = new Set(BOOKS.map(b => b.value));
const stored = new Set(counts.keys());

const missing = [...stored].filter(t => !listed.has(t)).sort();
const dead    = [...listed].filter(t => !stored.has(t)).sort();

console.log(`  menu: ${listed.size} books    corpus: ${stored.size} books    chunks: ${totalChunks.toLocaleString()}`);

if (dead.length) {
  console.log(`\n  IN THE MENU BUT NOT IN THE CORPUS (${dead.length}) — selecting these returns nothing:`);
  for (const t of dead) console.log(`      ${t}`);
}
if (missing.length) {
  console.log(`\n  IN THE CORPUS BUT NOT IN THE MENU (${missing.length}) — paid to embed, cannot be chosen:`);
  for (const t of missing) console.log(`      ${t}  (${counts.get(t)} chunks)`);
}
if (!dead.length && !missing.length) console.log('\n  in sync.');
process.exit(dead.length || missing.length ? 1 : 0);
