import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sanitizeNoteHtml } from '@/lib/sanitizeNoteHtml';

/**
 * Note body HTML for one slug, in one language.
 *
 * NoteReader used to import lib/noteContent (3.3MB) and lib/noteContentHi
 * (5.6MB) directly, so opening any note downloaded both corpora — every
 * English reader paid for the entire Hindi library and vice versa, to render
 * a single note.
 *
 * Serving it here means a reader fetches one note in one language. It also
 * means admin overrides take effect immediately: /notes/[slug] is statically
 * generated, so the note_overrides row it reads at build time never refreshed
 * until the next deploy.
 */

const LANGS = new Set(['en', 'hi']);

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') ?? '';
  const lang = req.nextUrl.searchParams.get('lang') ?? 'en';

  // Slugs index a static object; keep the shape tight rather than trusting it.
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) {
    return NextResponse.json({ error: 'bad slug' }, { status: 400 });
  }
  if (!LANGS.has(lang)) {
    return NextResponse.json({ error: 'bad lang' }, { status: 400 });
  }

  // An admin override wins over the shipped content, in either language.
  let content = '';
  try {
    const { data } = await createServerClient()
      .from('note_overrides')
      .select('content')
      .eq('slug', slug)
      .maybeSingle();
    // Also sanitized on read, so rows written before sanitizing-on-write
    // existed are covered without a migration. The shipped corpus below is
    // not sanitized: it is version-controlled source, so anyone who could
    // alter it already has repository access.
    if (data?.content) content = sanitizeNoteHtml(data.content);
  } catch {
    // Overrides are optional; fall through to the shipped content.
  }

  if (!content) {
    // Imported per-language so an English request never loads the Hindi
    // module into the lambda, and vice versa.
    if (lang === 'hi') {
      const { noteContentHi } = await import('@/lib/noteContentHi');
      content = (noteContentHi as Record<string, string>)[slug] ?? '';
      // Hindi is incomplete for some topics; English is the fallback there.
      if (!content) {
        const { noteContent } = await import('@/lib/noteContent');
        content = (noteContent as Record<string, string>)[slug] ?? '';
      }
    } else {
      const { noteContent } = await import('@/lib/noteContent');
      content = (noteContent as Record<string, string>)[slug] ?? '';
    }
  }

  return NextResponse.json(
    { content },
    {
      headers: {
        // Short browser cache, longer at the edge: note bodies change only
        // when an admin edits one, and that is rare.
        'Cache-Control': 'public, max-age=60, s-maxage=600, stale-while-revalidate=86400',
      },
    }
  );
}
