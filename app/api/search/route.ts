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

/** A debate or reading in the historiography bank, with who argues in it. */
export type DebateHit = { id: string; title: string; period: string; historians: string[]; matched: string[] };

let indexPromise: Promise<IndexEntry[]> | null = null;
/**
 * The historiography bank, held for an hour per lambda. The search modal used
 * to read the whole debates table from Supabase in the browser every time it
 * opened; now one read an hour serves everyone, and the bank changes rarely.
 */
const DEBATE_TTL_MS = 60 * 60 * 1000;
let debateCache: { at: number; promise: Promise<Omit<DebateHit, 'matched'>[]> } | null = null;
function getDebates(): Promise<Omit<DebateHit, 'matched'>[]> {
  if (!debateCache || Date.now() - debateCache.at > DEBATE_TTL_MS) {
    const promise = import('@/lib/debates')
      .then(({ loadDebates }) => loadDebates())
      .then((all) => all.map((d) => ({ id: d.id, title: d.title, period: d.period, historians: [...new Set(d.positions.map((p) => p.historian_name))] })))
      .catch(() => { debateCache = null; return []; });
    debateCache = { at: Date.now(), promise };
  }
  return debateCache.promise;
}
let pyqPromise: Promise<PyqHit[]> | null = null;

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', hellip: '…', bull: '•' };
/** The note HTML's entities as the characters they stand for, so snippets read as text. */
const decodeEntities = (t: string) => t
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&([a-z]+);/gi, (m, name) => NAMED[name.toLowerCase()] ?? m);

/**
 * Built once per lambda instance, not per request. Stripping tags across the
 * whole corpus is ~3MB of regex work; doing it per keystroke would make this
 * route slower than the client code it replaced.
 */
function getIndex(): Promise<IndexEntry[]> {
  indexPromise ??= (async () => {
    const { noteContent } = await import('@/lib/noteContent');
    return allNotes.map((n) => {
      const text = decodeEntities(((noteContent as Record<string, string>)[n.slug] ?? '').replace(/<[^>]*>/g, ' '))
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
  if (q.length < MIN_QUERY) return NextResponse.json({ notes: [], pyqs: [], debates: [] });

  // Generous: a debounced search box issues a handful of requests per session,
  // but the corpus scan is real CPU and should not be free to hammer.
  const { allowed } = await checkRateLimit(`search:${clientIp(req)}`, {
    limit: 60,
    windowSeconds: 60,
  });
  if (!allowed) return tooManyRequests();

  const needle = q.toLowerCase();
  const [index, allPyqs, allDebates] = await Promise.all([getIndex(), getPyqs(), getDebates()]);

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

  // A debate matches on its title or on a historian who argues in it.
  const debateHits: DebateHit[] = allDebates
    .map((d) => {
      const matched = d.historians.filter((h) => h.toLowerCase().includes(needle));
      const t = d.title.toLowerCase();
      const score = t.startsWith(needle) ? 3 : t.includes(needle) ? 2 : matched.length ? 1 : 0;
      return { d: { ...d, matched }, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.d);

  return NextResponse.json(
    { notes: hits, pyqs: pyqHits, debates: debateHits },
    // Identical queries are common (users retype, reopen the modal). Cheap to
    // serve from the edge; the corpus only changes on deploy.
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } }
  );
}
