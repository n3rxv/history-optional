'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { StoredFlashCard, FlashCardIndexEntry } from '@/lib/flashcardStore';

/**
 * The flashcard deck, fetched rather than bundled.
 *
 * The study page used to import lib/flashcards.ts directly, which meant every
 * card's full text — English and Hindi — was in the JavaScript sent to every
 * visitor. Fine at 55 cards; about 6 MB at the ~2,000 the syllabus supports.
 *
 * Two payloads instead of one:
 *
 *   index   id, section and type for every published card. 58 bytes each, so
 *           ~129 KB at 2,000 cards. Enough to filter, to count what is due
 *           against localStorage, and to decide the order of a queue.
 *   cards   full text, fetched only for cards actually being shown.
 *
 * The prefetch is deliberately over-eager. Reviewing is a rhythm — flip,
 * grade, next — and a spinner between cards would break it. So the window is
 * wide and refills early: to outrun it a reader would have to grade twenty
 * cards inside the time one request takes, which is not reachable by hand.
 * `isReady` lets the caller assert that guarantee rather than hope for it.
 */

/** Cards to hold ahead of the reader's position. */
const WINDOW = 40;
/** Refill once fewer than this many remain cached ahead. */
const REFILL_AT = 20;
/** Ids per request. Small enough to return fast, large enough to be few. */
const BATCH = 40;

type Deck = {
  index: FlashCardIndexEntry[];
  indexLoading: boolean;
  /** Distinguishable from an empty deck: a failed fetch must not render "0 cards". */
  error: string | null;
  getCard: (id: string) => StoredFlashCard | undefined;
  isReady: (id: string) => boolean;
  /** Pull these ids into the cache in the background. Safe to call often. */
  prefetch: (ids: string[]) => void;
  /** Keep a window of cards cached ahead of `position` in `orderedIds`. */
  keepAhead: (orderedIds: string[], position: number) => void;
  /** How many of `ids` are cached, for a caller that wants to show progress. */
  cachedCount: (ids: string[]) => number;
};

export function useFlashcardDeck(): Deck {
  const [index, setIndex] = useState<FlashCardIndexEntry[]>([]);
  const [indexLoading, setIndexLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // A ref for reads and a counter for renders. The cache is consulted inside
  // callbacks that must not be re-created on every fetch, but the component
  // still has to re-render when new cards land.
  const cache = useRef(new Map<string, StoredFlashCard>());
  const [, bump] = useState(0);

  // Ids already requested, so overlapping windows do not refetch the same
  // cards. Cleared only on unmount.
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/flashcards?index=1', { signal: ac.signal });
        if (!res.ok) throw new Error(`index ${res.status}`);
        const data = await res.json();
        setIndex(data.cards ?? []);
        setError(null);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setError('Could not load flashcards.');
      } finally {
        setIndexLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const prefetch = useCallback((ids: string[]) => {
    const missing = ids.filter((id) => !cache.current.has(id) && !inFlight.current.has(id));
    if (!missing.length) return;
    for (const id of missing) inFlight.current.add(id);

    (async () => {
      for (let i = 0; i < missing.length; i += BATCH) {
        const slice = missing.slice(i, i + BATCH);
        try {
          const res = await fetch(
            `/api/flashcards?ids=${encodeURIComponent(slice.join(','))}&limit=${slice.length}`,
          );
          if (!res.ok) throw new Error(`cards ${res.status}`);
          const data = await res.json();
          for (const card of (data.cards ?? []) as StoredFlashCard[]) {
            cache.current.set(card.id, card);
          }
          bump((n) => n + 1);
        } catch {
          // Leave these ids out of inFlight so a later pass can retry them;
          // a transient failure should not permanently blank a card.
          for (const id of slice) inFlight.current.delete(id);
        }
      }
    })();
  }, []);

  const keepAhead = useCallback(
    (orderedIds: string[], position: number) => {
      const ahead = orderedIds.slice(position, position + WINDOW);
      const cached = ahead.filter((id) => cache.current.has(id)).length;
      // Refill on the way in as well as when running low, so the first card
      // of a session is never the one that waits.
      if (cached < REFILL_AT || cached < ahead.length) prefetch(ahead);
    },
    [prefetch],
  );

  const getCard = useCallback((id: string) => cache.current.get(id), []);
  const isReady = useCallback((id: string) => cache.current.has(id), []);
  const cachedCount = useCallback(
    (ids: string[]) => ids.reduce((n, id) => (cache.current.has(id) ? n + 1 : n), 0),
    [],
  );

  return { index, indexLoading, error, getCard, isReady, prefetch, keepAhead, cachedCount };
}
