/**
 * Moves editorial content from the app's own tables into Payload.
 *
 * Additive and re-runnable. It never writes to note_overrides, notifications
 * or posts, and the site keeps reading those until its readers are switched
 * over separately. Running it twice updates rather than duplicates, because
 * every collection is keyed on a stable slug.
 *
 *   node scripts/cms/migrate-content.mjs --dry     report only, write nothing
 *   node scripts/cms/migrate-content.mjs           apply
 *
 * Content is HTML and Lexical stores a node tree, so each body goes through
 * convertHTMLToLexical. That conversion is lossy for anything Lexical has no
 * node for, so the script counts what it could not represent and prints it
 * rather than failing silently.
 */
import { getPayload } from 'payload';
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical';
import { JSDOM } from 'jsdom';
import config from '../../payload.config.ts';
import { allNotes } from '../../lib/notes.ts';
import { noteContent } from '../../lib/noteContent.ts';
import { createServerClient } from '../../lib/supabase.ts';

const DRY = process.argv.includes('--dry');
const log = (...a) => console.log(...a);

const plain = (html) => (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

async function main() {
  const payload = await getPayload({ config });
  const editorConfig = await editorConfigFactory.default({ config: payload.config });
  const toLexical = (html) => convertHTMLToLexical({ editorConfig, html: html || '<p></p>', JSDOM });

  const db = createServerClient();
  const { data: overrides, error: ovErr } = await db
    .from('note_overrides').select('slug, content, updated_at');
  if (ovErr) throw new Error(`note_overrides: ${ovErr.message}`);
  const overrideBySlug = new Map((overrides ?? []).map((o) => [o.slug, o]));

  log(`\n${DRY ? 'DRY RUN, nothing will be written' : 'APPLYING'}\n`);

  // ── NOTES ───────────────────────────────────────────────────────────────────
  let created = 0, updated = 0, lossy = 0;
  for (const note of allNotes) {
    const override = overrideBySlug.get(note.slug);
    const html = override?.content ?? noteContent[note.slug] ?? '';
    const source = override ? 'cms override' : 'shipped default';

    const data = {
      title: note.title,
      slug: note.slug,
      section: note.section,
      paper: String(note.paper),
      topic: note.topic,
      description: note.description ?? '',
      subtopics: (note.subtopics ?? []).map((label) => ({ label })),
      content: toLexical(html),
      _status: 'published',
    };

    // A conversion that drops most of the text is worth knowing about.
    const before = plain(html).length;
    const after = JSON.stringify(data.content).length;
    if (before > 200 && after < before * 0.5) {
      lossy += 1;
      log(`  ! ${note.slug}: ${before} chars of text -> ${after} chars of tree, check this one`);
    }

    if (DRY) { log(`  would write ${note.slug.padEnd(34)} ${source}, ${before} chars`); continue; }

    const existing = await payload.find({
      collection: 'notes', where: { slug: { equals: note.slug } }, limit: 1, depth: 0,
    });
    if (existing.docs.length) {
      await payload.update({ collection: 'notes', id: existing.docs[0].id, data, depth: 0 });
      updated += 1;
    } else {
      await payload.create({ collection: 'notes', data, depth: 0 });
      created += 1;
    }
  }
  log(`\nnotes: ${created} created, ${updated} updated, ${allNotes.length} total${lossy ? `, ${lossy} flagged` : ''}`);

  // ── ANNOUNCEMENTS ───────────────────────────────────────────────────────────
  const { data: notifications, error: nErr } = await db
    .from('notifications').select('id, title, link, type, created_at');
  if (nErr) log(`notifications: could not read (${nErr.message})`);
  else {
    let n = 0;
    for (const row of notifications ?? []) {
      const data = { title: row.title, link: row.link ?? '', kind: row.type ?? 'announcement' };
      if (DRY) { log(`  would write announcement: ${row.title}`); continue; }
      const existing = await payload.find({
        collection: 'announcements', where: { title: { equals: row.title } }, limit: 1, depth: 0,
      });
      if (existing.docs.length) {
        await payload.update({ collection: 'announcements', id: existing.docs[0].id, data, depth: 0 });
      } else {
        await payload.create({ collection: 'announcements', data, depth: 0 });
      }
      n += 1;
    }
    log(`announcements: ${DRY ? (notifications ?? []).length + ' would be written' : n + ' written'}`);
  }

  // ── ARTICLES ────────────────────────────────────────────────────────────────
  const { data: posts, error: pErr } = await db
    .from('posts').select('id, type, title, excerpt, content, tags, published_at, published');
  if (pErr) log(`posts: could not read (${pErr.message})`);
  else {
    let n = 0;
    for (const row of posts ?? []) {
      const slug = (row.title || `post-${row.id}`)
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
      const data = {
        title: row.title,
        slug,
        kind: row.type === 'current-affairs' ? 'current-affairs' : 'new-note',
        excerpt: row.excerpt ?? '',
        tags: (row.tags ?? []).map((label) => ({ label })),
        publishedAt: row.published_at ?? null,
        content: toLexical(row.content),
        _status: row.published ? 'published' : 'draft',
      };
      if (DRY) { log(`  would write article: ${slug}`); continue; }
      const existing = await payload.find({
        collection: 'articles', where: { slug: { equals: slug } }, limit: 1, depth: 0,
      });
      if (existing.docs.length) {
        await payload.update({ collection: 'articles', id: existing.docs[0].id, data, depth: 0 });
      } else {
        await payload.create({ collection: 'articles', data, depth: 0 });
      }
      n += 1;
    }
    log(`articles: ${DRY ? (posts ?? []).length + ' would be written' : n + ' written'}`);
  }

  log('\ndone. The app tables were not modified.');
  process.exit(0);
}

main().catch((e) => { console.error('\nFAILED:', e?.message ?? e); process.exit(1); });
