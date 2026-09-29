/**
 * Flashcard reads, from Postgres rather than the JavaScript bundle.
 *
 * The study page is a client component and used to import the whole card
 * array, so every card shipped to every browser. That is fine at 55 cards and
 * unworkable at the ~1,200 the syllabus can support: roughly 3 KB per card
 * with Hindi means 2,000 cards would be ~6 MB of JavaScript.
 *
 * The split that fixes it:
 *
 *   - `listIndex` returns one small record per card -- enough for the page to
 *     count what is due and populate its filters, and about 40 bytes a card,
 *     so 2,000 cards is ~80 KB rather than ~6 MB.
 *   - `listCards` returns full text only for the cards actually being
 *     studied, so the heavy payload scales with a session rather than with
 *     the size of the deck.
 *
 * Reads go through the anon key on purpose. Row level security already limits
 * selects to status = 'published', so an unreviewed card cannot escape even
 * if a query here forgets to filter -- the service key would bypass that.
 *
 * The one exception is listBacks. Answers are metered, and the anon key is
 * public -- it ships in the browser -- so if answers were readable with it the
 * gate in /api/flashcards/reveal would be decoration: anyone could select them
 * straight out of PostgREST. supabase/flashcard_unlocks.sql therefore revokes
 * the back columns from anon, which means the one caller that is allowed to
 * read them has to hold the service key.
 */
import { createClient } from '@supabase/supabase-js';

export type StoredFlashCard = {
  id: string;
  topic: string;
  paper: 1 | 2;
  section: string;
  type: 'historian' | 'comparison' | 'cause-effect' | 'quote' | 'concept';
  front: string;
  back: string;
  front_hi: string | null;
  back_hi: string | null;
};

/**
 * A card without its answer.
 *
 * The answer side is the paid part of the deck: fronts are free to browse and
 * backs come out of a reader's allowance. Keeping the two in separate types
 * means the public route cannot leak an answer by forgetting a filter -- there
 * is no `back` on the value it returns to omit.
 */
export type FlashCardFront = Omit<StoredFlashCard, 'back' | 'back_hi'>;

/** Just the answer, for a reader who has been granted it. */
export type FlashCardBack = Pick<StoredFlashCard, 'id' | 'back' | 'back_hi'>;

/** Just enough to filter and to work out what is due. */
export type FlashCardIndexEntry = Pick<StoredFlashCard, 'id' | 'section' | 'type'>;

/**
 * Everything except the answer. `back` and `back_hi` are deliberately absent:
 * this is the column list behind the public, edge-cached route, and a cached
 * response is served to whoever asks next regardless of what they have paid.
 */
const FRONT_COLUMNS = 'id,topic,paper,section,type,front,front_hi';

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}

/**
 * Privileged client, for reading answer columns the anon role is not granted.
 * Used by listBacks alone, after the caller has established entitlement.
 */
function privilegedClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
}

/**
 * PostgREST caps an unbounded select at its max-rows setting, which is 1000 on
 * Supabase, and it truncates silently. The deck passed that mark, so the index
 * is read in pages: anything less than a full page means we have the tail.
 */
const INDEX_PAGE = 1000;

export async function listIndex(): Promise<FlashCardIndexEntry[]> {
  const all: FlashCardIndexEntry[] = [];

  for (let offset = 0; ; offset += INDEX_PAGE) {
    const { data, error } = await client()
      .from('flashcards')
      .select('id,section,type')
      .eq('status', 'published')
      .order('id')
      .range(offset, offset + INDEX_PAGE - 1);

    // An empty deck and a failed query are not the same thing, and a caller
    // that cannot tell them apart will render "0 cards" during an outage.
    if (error) throw new Error(`flashcard index: ${error.message}`);

    const page = (data ?? []) as FlashCardIndexEntry[];
    all.push(...page);
    if (page.length < INDEX_PAGE) return all;
  }
}

export async function listCards(opts: {
  section?: string;
  type?: string;
  ids?: string[];
  limit?: number;
  offset?: number;
} = {}): Promise<{ cards: FlashCardFront[]; total: number }> {
  const { section, type, ids, limit = 60, offset = 0 } = opts;

  let q = client()
    .from('flashcards')
    .select(FRONT_COLUMNS, { count: 'exact' })
    .eq('status', 'published');

  if (section && section !== 'All') q = q.eq('section', section);
  if (type && type !== 'All') q = q.eq('type', type);
  // Fetching an explicit set is how the page pulls the cards for one study
  // queue without also pulling the rest of the deck.
  if (ids?.length) q = q.in('id', ids);

  const { data, error, count } = await q.order('id').range(offset, offset + limit - 1);
  if (error) throw new Error(`flashcards: ${error.message}`);

  return { cards: (data ?? []) as FlashCardFront[], total: count ?? 0 };
}

/**
 * The answers for a set of cards.
 *
 * Only ever called for ids the caller has already established the reader is
 * entitled to, and the result is never cached publicly -- which is why this is
 * a separate function rather than a flag on listCards. See
 * app/api/flashcards/reveal/route.ts.
 *
 * The status filter is kept even though the service key bypasses RLS: it is
 * the only thing stopping a draft card's answer from being served here.
 */
export async function listBacks(ids: string[]): Promise<FlashCardBack[]> {
  if (!ids.length) return [];
  const { data, error } = await privilegedClient()
    .from('flashcards')
    .select('id,back,back_hi')
    .eq('status', 'published')
    .in('id', ids);
  if (error) throw new Error(`flashcard backs: ${error.message}`);
  return (data ?? []) as FlashCardBack[];
}

/**
 * How many cards are published. Its own query rather than `listIndex().length`
 * so a page that only wants the number does not transfer the whole index.
 *
 * Returns null rather than 0 on failure: a homepage stat reading "0
 * flashcards" during a database wobble is worse than showing nothing.
 */
export async function countPublished(): Promise<number | null> {
  const { count, error } = await client()
    .from('flashcards')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');
  if (error) {
    console.error('[flashcardStore] count failed:', error.message);
    return null;
  }
  return count ?? 0;
}

/** Published cards on one notes topic; null on failure, for the same reason. */
export async function countForTopic(topic: string): Promise<number | null> {
  const { count, error } = await client()
    .from('flashcards')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('topic', topic);
  if (error) {
    console.error('[flashcardStore] topic count failed:', error.message);
    return null;
  }
  return count ?? 0;
}

/** Distinct sections and types actually present, for the filter controls. */
export async function listFacets(): Promise<{ sections: string[]; types: string[] }> {
  const index = await listIndex();
  return {
    sections: [...new Set(index.map((c) => c.section))].sort(),
    types: [...new Set(index.map((c) => c.type))].sort(),
  };
}
