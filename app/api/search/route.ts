import { NextRequest, NextResponse } from 'next/server';
import { allNotes } from '@/lib/notes';
import { checkRateLimit, clientIp, tooManyRequests } from '@/lib/rateLimit';

/**
 * Full-text search across note bodies.
 *
 * This ran in the browser. components/SearchModal.tsx imported lib/noteContent
 * (3.3MB of note HTML) so it could substring-match bodies, SearchModal is
 * rendered by Navbar, and Navbar is in the root layout — so every page on the
 * site shipped the entire corpus to the client just in case someone pressed
 * Cmd-K.
 *
 * Note titles, descriptions and subtopics still match client-side from
 * lib/notes, which is small. Only body matching comes here.
 */

const MIN_QUERY = 2;
const MAX_RESULTS = 5;
const SNIPPET_BEFORE = 40;
const SNIPPET_AFTER = 80;

type IndexEntry = { slug: string; text: string; lower: string };

let indexPromise: Promise<IndexEntry[]> | null = null;

/**
 * Built once per lambda instance, not per request. Stripping tags across the
 * whole corpus is ~3MB of regex work; doing it per keystroke would make this
 * route slower than the client code it replaced.
 */
function getIndex(): Promise<IndexEntry[]> {
  indexPromise ??= (async () => {
    const { noteContent } = await import('@/lib/noteContent');
    return allNotes.map((n) => {
      const text = ((noteContent as Record<string, string>)[n.slug] ?? '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return { slug: n.slug, text, lower: text.toLowerCase() };
    });
  })();
  return indexPromise;
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  if (q.length < MIN_QUERY) return NextResponse.json({ notes: [] });

  // Generous: a debounced search box issues a handful of requests per session,
  // but the corpus scan is real CPU and should not be free to hammer.
  const { allowed } = await checkRateLimit(`search:${clientIp(req)}`, {
    limit: 60,
    windowSeconds: 60,
  });
  if (!allowed) return tooManyRequests();

  const needle = q.toLowerCase();
  const index = await getIndex();

  const hits: { slug: string; snippet: string }[] = [];
  for (const entry of index) {
    const idx = entry.lower.indexOf(needle);
    if (idx === -1) continue;
    hits.push({
      slug: entry.slug,
      snippet:
        '…' +
        entry.text.slice(Math.max(0, idx - SNIPPET_BEFORE), idx + SNIPPET_AFTER) +
        '…',
    });
    if (hits.length >= MAX_RESULTS) break;
  }

  return NextResponse.json(
    { notes: hits },
    // Identical queries are common (users retype, reopen the modal). Cheap to
    // serve from the edge; the corpus only changes on deploy.
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } }
  );
}
