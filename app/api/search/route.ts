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
 *
 * PYQs are searched here for the same reason. SearchModal used to match them
 * against lib/pyqs.ts, a 20-question file, while every PYQ page renders
 * lib/pyqData.ts with 1584 — so site search silently missed 99% of the bank.
 * Importing the real one into the client would have put 403KB back into every
 * page, which 63c6d2b had just removed.
 */

const MIN_QUERY = 2;
const MAX_RESULTS = 5;
const SNIPPET_BEFORE = 40;
const SNIPPET_AFTER = 80;

type IndexEntry = { slug: string; text: string; lower: string };

/** Only the fields the result row renders. */
export type PyqHit = {
  id: number;
  question: string;
  topic: string;
  subtopic: string;
  section: string;
  marks: number;
  year: number;
};

let indexPromise: Promise<IndexEntry[]> | null = null;
let pyqPromise: Promise<PyqHit[]> | null = null;

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

/** Built once per lambda, like the note index. */
function getPyqs(): Promise<PyqHit[]> {
  pyqPromise ??= import('@/lib/pyqData').then(({ pyqs }) =>
    pyqs.map((p) => ({
      id: p.id,
      question: p.question,
      topic: p.topic,
      subtopic: p.subtopic,
      section: p.section,
      marks: p.marks,
      year: p.year,
    }))
  );
  return pyqPromise;
}

/** Mirrors the client's scoring so ordering is unchanged. */
function scorePyq(p: PyqHit, needle: string): number {
  const at = (text: string) => {
    const t = text.toLowerCase();
    if (t.startsWith(needle)) return 3;
    if (t.includes(needle)) return 2;
    return 0;
  };
  // Sub-topic is the finest label the bank carries — "Kalhana", "Feudalism
  // Debate" — and is often exactly what a reader types. Scored above topic,
  // below the question text itself.
  return Math.max(at(p.question) * 2, at(p.subtopic) * 1.5, at(p.topic), at(p.section));
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  if (q.length < MIN_QUERY) return NextResponse.json({ notes: [], pyqs: [] });

  // Generous: a debounced search box issues a handful of requests per session,
  // but the corpus scan is real CPU and should not be free to hammer.
  const { allowed } = await checkRateLimit(`search:${clientIp(req)}`, {
    limit: 60,
    windowSeconds: 60,
  });
  if (!allowed) return tooManyRequests();

  const needle = q.toLowerCase();
  const [index, allPyqs] = await Promise.all([getIndex(), getPyqs()]);

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

  const pyqHits = allPyqs
    .map((p) => ({ p, score: scorePyq(p, needle) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((x) => x.p);

  return NextResponse.json(
    { notes: hits, pyqs: pyqHits },
    // Identical queries are common (users retype, reopen the modal). Cheap to
    // serve from the edge; the corpus only changes on deploy.
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } }
  );
}
