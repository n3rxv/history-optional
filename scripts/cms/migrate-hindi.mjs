/**
 * Fills payload.notes.content_hi, one note at a time, skipping any that already
 * have it. Safe to stop and re-run: it only ever touches rows where content_hi
 * is null.
 *
 * Separate from migrate-content.mjs because converting the 5.6MB Hindi corpus
 * through JSDOM takes minutes, and bundling it with the English pass meant one
 * slow run that could not be resumed.
 */
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical';
import { JSDOM } from 'jsdom';
import { getPayload } from 'payload';
import pg from 'pg';
import config from '../../payload.config.ts';
import { noteContentHi } from '../../lib/noteContentHi.ts';

const payload = await getPayload({ config });
const editorConfig = await editorConfigFactory.default({ config: payload.config });

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL_SESSION ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await db.connect();

const { rows } = await db.query(
  'select id, slug from payload.notes where content_hi is null order by slug');
console.log(`${rows.length} notes still need Hindi`);

let done = 0, skipped = 0;
for (const row of rows) {
  const html = noteContentHi[row.slug];
  if (!html) { skipped += 1; console.log(`  - ${row.slug}: no Hindi body, leaving null`); continue; }
  const tree = convertHTMLToLexical({ editorConfig, html, JSDOM });
  await db.query('update payload.notes set content_hi = $1 where id = $2', [JSON.stringify(tree), row.id]);
  done += 1;
  console.log(`  ${String(done).padStart(2)}/${rows.length}  ${row.slug}  ${Math.round(html.length / 1000)}k`);
}
console.log(`\nHindi written for ${done} notes, ${skipped} had none.`);
await db.end();
process.exit(0);
