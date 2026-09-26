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

/** Just enough to filter and to work out what is due. */
export type FlashCardIndexEntry = Pick<StoredFlashCard, 'id' | 'section' | 'type'>;

const CARD_COLUMNS = 'id,topic,paper,section,type,front,back,front_hi,back_hi';

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function listIndex(): Promise<FlashCardIndexEntry[]> {
  const { data, error } = await client()
    .from('flashcards')
    .select('id,section,type')
    .eq('status', 'published')
    .order('id');

  // An empty deck and a failed query are not the same thing, and a caller
  // that cannot tell them apart will render "0 cards" during an outage.
  if (error) throw new Error(`flashcard index: ${error.message}`);
  return (data ?? []) as FlashCardIndexEntry[];
}

export async function listCards(opts: {
  section?: string;
  type?: string;
  ids?: string[];
  limit?: number;
  offset?: number;
} = {}): Promise<{ cards: StoredFlashCard[]; total: number }> {
  const { section, type, ids, limit = 60, offset = 0 } = opts;

  let q = client()
    .from('flashcards')
    .select(CARD_COLUMNS, { count: 'exact' })
    .eq('status', 'published');

  if (section && section !== 'All') q = q.eq('section', section);
  if (type && type !== 'All') q = q.eq('type', type);
  // Fetching an explicit set is how the page pulls the cards for one study
  // queue without also pulling the rest of the deck.
  if (ids?.length) q = q.in('id', ids);

  const { data, error, count } = await q.order('id').range(offset, offset + limit - 1);
  if (error) throw new Error(`flashcards: ${error.message}`);

  return { cards: (data ?? []) as StoredFlashCard[], total: count ?? 0 };
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

/** Distinct sections and types actually present, for the filter controls. */
export async function listFacets(): Promise<{ sections: string[]; types: string[] }> {
  const index = await listIndex();
  return {
    sections: [...new Set(index.map((c) => c.section))].sort(),
    types: [...new Set(index.map((c) => c.type))].sort(),
  };
}
