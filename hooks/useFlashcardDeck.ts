'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FlashCardFront, FlashCardIndexEntry } from '@/lib/flashcardStore';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getFingerprint } from '@/lib/fingerprint';

/**
 * The flashcard deck, fetched rather than bundled.
 *
 * The study page used to import lib/flashcards.ts directly, which meant every
 * card's full text — English and Hindi — was in the JavaScript sent to every
 * visitor. Fine at 55 cards; about 6 MB at the ~2,000 the syllabus supports.
 *
 * Three payloads instead of one:
 *
 *   index   id, section and type for every published card. 58 bytes each, so
 *           ~129 KB at 2,000 cards. Enough to filter, to count what is due
 *           against localStorage, and to decide the order of a queue.
 *   cards   question text, fetched only for cards actually being shown.
 *   answers fetched one at a time, when the reader flips a card.
 *
 * The third payload exists because answers are metered: a reader gets a
 * hundred free ones and then needs a subscription. That cannot ride along with
 * the cards, for two separate reasons. The response would vary by reader,
 * which breaks the edge cache the other two rely on. And the prefetch below
 * pulls forty cards ahead of where the reader is — charging for those would
 * spend the whole allowance before they had read three.
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

/**
 * What the reader has left. `unlimited` covers subscribers and the owner;
 * `requiresLogin` means no account yet, so the allowance has not started.
 */
export type Allowance = {
  used: number;
  limit: number;
  unlimited: boolean;
  requiresLogin?: boolean;
};

/** The answer to one card, once the reader is entitled to it. */
export type CardBack = { back: string; back_hi: string | null };

type Deck = {
  index: FlashCardIndexEntry[];
  indexLoading: boolean;
  /** Distinguishable from an empty deck: a failed fetch must not render "0 cards". */
  error: string | null;
  getCard: (id: string) => FlashCardFront | undefined;
  isReady: (id: string) => boolean;
  /** The answer, if this reader has it. Undefined means not yet revealed. */
  getBack: (id: string) => CardBack | undefined;
  /**
   * Open a card's answer, spending one unit of the allowance if it is not
   * already unlocked. Resolves to what happened, so the caller can show a
   * paywall rather than an empty card.
   */
  reveal: (id: string) => Promise<'granted' | 'locked' | 'login' | 'error'>;
  allowance: Allowance | null;
  /** Pull these ids into the cache in the background. Safe to call often. */
  prefetch: (ids: string[]) => void;
  /** Keep a window of cards cached ahead of `position` in `orderedIds`. */
  keepAhead: (orderedIds: string[], position: number) => void;
  /** How many of `ids` are cached, for a caller that wants to show progress. */
  cachedCount: (ids: string[]) => number;
};

/** Identity headers for the metered routes. Absent when neither is known. */
async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) headers['x-user-token'] = token;
  } catch {
    // Signed out, or the token refresh failed. Fall back to the fingerprint.
  }
  try {
    const fp = await getFingerprint();
    if (fp) headers['x-fingerprint'] = fp;
  } catch {
    // Non-fatal; the request is simply attributed to the account alone.
  }
  return headers;
}

export function useFlashcardDeck(): Deck {
  const [index, setIndex] = useState<FlashCardIndexEntry[]>([]);
  const [indexLoading, setIndexLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // A ref for reads and a counter for renders. The cache is consulted inside
  // callbacks that must not be re-created on every fetch, but the component
  // still has to re-render when new cards land.
  const cache = useRef(new Map<string, FlashCardFront>());
  const backs = useRef(new Map<string, CardBack>());
  const [allowance, setAllowance] = useState<Allowance | null>(null);
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

  // The allowance, so the page can say how many free answers are left before
  // the reader opens anything. Re-read when the account changes: signing in
  // can turn a metered reader into a subscriber, and the paywall has to
  // notice without a reload.
  const loadAllowance = useCallback(async () => {
    try {
      const res = await fetch('/api/flashcards/reveal', { headers: await authHeaders() });
      if (!res.ok) return;
      setAllowance(await res.json());
    } catch {
      // Leave it null. The page treats null as "not known yet" and shows no
      // count, which is better than showing a wrong one.
    }
  }, []);

  useEffect(() => {
    void loadAllowance();
    const unsub = onAuthStateChanged(auth, () => {
      // A sign-in or sign-out changes whose allowance this is, so answers
      // already fetched under the old identity must not be trusted.
      backs.current.clear();
      void loadAllowance();
      bump((n) => n + 1);
    });
    return () => unsub();
  }, [loadAllowance]);

  /**
   * Answers the reader is already entitled to, for cards just fetched. Spends
   * nothing, so it is safe to call for the whole prefetch window.
   */
  const loadOwnedBacks = useCallback(async (ids: string[]) => {
    const wanted = ids.filter((id) => !backs.current.has(id));
    if (!wanted.length) return;
    try {
      const res = await fetch('/api/flashcards/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ ids: wanted, spend: false }),
      });
      if (!res.ok) return;
      const data = await res.json();
      for (const c of (data.cards ?? []) as { id: string; back: string; back_hi: string | null }[]) {
        backs.current.set(c.id, { back: c.back, back_hi: c.back_hi });
      }
      if (data.cards?.length) bump((n) => n + 1);
    } catch {
      // The answer simply arrives later, when the reader flips the card.
    }
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
          for (const card of (data.cards ?? []) as FlashCardFront[]) {
            cache.current.set(card.id, card);
          }
          bump((n) => n + 1);
          // Answers this reader has already paid for, so a card they have seen
          // before opens instantly on the next review. `spend: false` is what
          // makes this safe to do for a whole window.
          void loadOwnedBacks(slice);
        } catch {
          // Leave these ids out of inFlight so a later pass can retry them;
          // a transient failure should not permanently blank a card.
          for (const id of slice) inFlight.current.delete(id);
        }
      }
    })();
  }, [loadOwnedBacks]);

  /**
   * Open one answer. This is the call that can cost the reader a unit, so it
   * is made from the flip and from nowhere else.
   */
  const reveal = useCallback(async (id: string): Promise<'granted' | 'locked' | 'login' | 'error'> => {
    if (backs.current.has(id)) return 'granted';
    try {
      const res = await fetch('/api/flashcards/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ ids: [id], spend: true }),
      });
      // 401 is not a failure to answer: it means no account yet, and the body
      // says so, so read it rather than treating the status as an outage.
      if (res.status === 401) {
        setAllowance({ used: 0, limit: 0, unlimited: false, requiresLogin: true });
        return 'login';
      }
      if (!res.ok) return 'error';
      const data = await res.json();
      const card = (data.cards ?? [])[0] as { back: string; back_hi: string | null } | undefined;
      setAllowance({
        used: data.used ?? 0,
        limit: data.limit ?? 0,
        unlimited: data.unlimited === true,
        requiresLogin: data.requiresLogin === true,
      });
      if (!card) return 'locked';
      backs.current.set(id, { back: card.back, back_hi: card.back_hi });
      bump((n) => n + 1);
      return 'granted';
    } catch {
      return 'error';
    }
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
  const getBack = useCallback((id: string) => backs.current.get(id), []);
  const isReady = useCallback((id: string) => cache.current.has(id), []);
  const cachedCount = useCallback(
    (ids: string[]) => ids.reduce((n, id) => (cache.current.has(id) ? n + 1 : n), 0),
    [],
  );

  return {
    index, indexLoading, error,
    getCard, isReady, getBack, reveal, allowance,
    prefetch, keepAhead, cachedCount,
  };
}
