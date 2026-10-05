import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAdminAuthed } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase';
import { sanitizeNoteHtml } from '@/lib/sanitizeNoteHtml';

/**
 * Admin only. This used to be public, uncached, and return every override in
 * full, about 1.2 MB a request, so each call (the admin overview counting
 * them, a crawler, anyone looping on it) came straight out of Supabase's
 * egress quota. Readers get note bodies from /api/note-content, which is
 * edge-cached and sends one note in one language.
 *
 *   ?slug=x   one override, with its content
 *   ?list=1   every override's slug and date, without content
 *   (none)    every override in full, for the editor and the backup export
 */
export async function GET(req: NextRequest) {
  if (!await isAdminAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const listOnly = searchParams.get('list') === '1';

  const db = createServerClient();
  const query = slug
    ? db.from('note_overrides').select('slug, content, updated_at').eq('slug', slug)
    : db.from('note_overrides').select(listOnly ? 'slug, updated_at' : 'slug, content, updated_at');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { headers: { 'Cache-Control': 'private, no-store' } });
}

// POST and DELETE require admin password
export async function POST(req: NextRequest) {
  if (!await isAdminAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { slug, content } = await req.json();
  if (!slug || content === undefined) {
    return NextResponse.json({ error: 'Missing slug or content' }, { status: 400 });
  }
  // Sanitized before storage, so a leaked admin token cannot plant markup
  // that every reader of this note would then execute. isAdminAuthed is an
  // HMAC of an expiry with no subject and no revocation, so a leaked token
  // stays valid for its full window.
  const db = createServerClient();
  const { error } = await db
    .from('note_overrides')
    .upsert(
      { slug, content: sanitizeNoteHtml(content), updated_at: new Date().toISOString() },
      { onConflict: 'slug' }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  refreshNotePage(slug);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { slug } = await req.json();
  const db = createServerClient();
  const { error } = await db.from('note_overrides').delete().eq('slug', slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  refreshNotePage(slug);
  return NextResponse.json({ ok: true });
}

/**
 * Note pages are prerendered and never revalidate on a timer, so search
 * engines would keep the old body until the next deploy. Marking the path
 * renders it once, on its next visit.
 */
function refreshNotePage(slug: unknown) {
  if (typeof slug === 'string' && /^[a-z0-9-]{1,80}$/.test(slug)) revalidatePath(`/notes/${slug}`);
}
