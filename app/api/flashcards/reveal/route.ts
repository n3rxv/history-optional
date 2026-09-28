import { NextRequest, NextResponse } from 'next/server';
import { listBacks } from '@/lib/flashcardStore';
import { noStore } from '@/lib/cacheHeaders';
import {
  FREE_FLASHCARD_LIMIT,
  readUnlocks,
  resolveReader,
  spendUnlocks,
} from '@/lib/flashcardAccess';

/**
 * Flashcard answers.
 *
 *   POST /api/flashcards/reveal
 *   { ids: string[], spend?: boolean }
 *
 * The answer side of the deck lives here rather than on /api/flashcards
 * because the response depends on who is asking, and /api/flashcards is cached
 * publicly at the edge -- lib/cacheHeaders.ts spells out why those two facts
 * cannot both be true of one route. So fronts are cacheable and shared, and
 * answers are private and metered.
 *
 * `spend` is the difference between looking and opening:
 *
 *   spend: false   Return the answers this reader has already unlocked, and
 *                  nothing else. The study page prefetches a window of cards
 *                  ahead of where the reader is, and that window must not
 *                  charge for cards they have not chosen to look at.
 *
 *   spend: true    Claim allowance for the card being opened. Sent for the one
 *                  card the reader just flipped, never for a batch.
 *
 * A client that lied and sent `spend: true` for forty ids could only burn its
 * own allowance, which is why the cap below is a guard against a bug rather
 * than against an attacker.
 *
 * An account is required either way. The study page will not open a card
 * without one, but that check lives in the browser, and this route was serving
 * answers to a request carrying nothing but a fingerprint.
 */

/** Ids per request. Matches the deck hook's prefetch batch. */
const MAX_IDS = 60;
/**
 * A deliberate spend is one card: the one just flipped. Anything more is a
 * client bug, and the reader should not pay for it.
 */
const MAX_SPEND_IDS = 1;

export async function POST(req: NextRequest) {
  let body: { ids?: unknown; spend?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400, headers: noStore });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((v): v is string => typeof v === 'string' && v.length > 0).slice(0, MAX_IDS)
    : [];
  const spend = body.spend === true;

  if (spend && ids.length > MAX_SPEND_IDS) {
    return NextResponse.json({ error: 'too_many_to_spend' }, { status: 400, headers: noStore });
  }

  try {
    const reader = await resolveReader(req);

    if (reader.unlimited) {
      const cards = await listBacks(ids);
      return NextResponse.json(
        { cards, locked: [], used: 0, limit: FREE_FLASHCARD_LIMIT, unlimited: true },
        { headers: noStore },
      );
    }

    // 401 rather than an empty grant: the caller is not being refused a card,
    // they are being told the request cannot be attributed to anyone yet. The
    // body carries the reason so the page can offer sign-in instead of
    // reporting a spent allowance the reader never had.
    if (!reader.signedIn) {
      return NextResponse.json(
        {
          error: 'login_required',
          requiresLogin: true,
          cards: [],
          locked: ids,
          used: 0,
          limit: FREE_FLASHCARD_LIMIT,
          unlimited: false,
        },
        { status: 401, headers: noStore },
      );
    }

    const outcome = spend
      ? await spendUnlocks(reader, ids)
      : await readUnlocks(reader, ids);

    // Degraded means the allowance could not be read, so nothing was granted.
    // Say so rather than returning an empty set that looks like a spent quota,
    // or the page will tell a paying reader they are out of free cards.
    if (outcome.degraded) {
      return NextResponse.json(
        { error: 'unlocks_unavailable' },
        { status: 503, headers: noStore },
      );
    }

    const cards = await listBacks(outcome.granted);
    return NextResponse.json(
      {
        cards,
        locked: outcome.locked,
        used: outcome.used,
        limit: FREE_FLASHCARD_LIMIT,
        unlimited: false,
      },
      { headers: noStore },
    );
  } catch (e) {
    console.error('[api/flashcards/reveal]', e);
    return NextResponse.json(
      { error: 'flashcards_unavailable' },
      { status: 503, headers: noStore },
    );
  }
}

/**
 * The reader's allowance, without asking for any card.
 *
 * The study page shows how many free answers are left, and needs that before
 * the reader opens anything.
 */
export async function GET(req: NextRequest) {
  try {
    const reader = await resolveReader(req);
    if (reader.unlimited) {
      return NextResponse.json(
        { used: 0, limit: FREE_FLASHCARD_LIMIT, unlimited: true },
        { headers: noStore },
      );
    }
    // Reported rather than refused: the page shows this before the reader has
    // asked for anything, and a signed-out visitor browsing questions is not
    // doing anything wrong.
    if (!reader.signedIn) {
      return NextResponse.json(
        { used: 0, limit: FREE_FLASHCARD_LIMIT, unlimited: false, requiresLogin: true },
        { headers: noStore },
      );
    }
    const { used, degraded } = await readUnlocks(reader, []);
    if (degraded) {
      return NextResponse.json({ error: 'unlocks_unavailable' }, { status: 503, headers: noStore });
    }
    return NextResponse.json(
      { used, limit: FREE_FLASHCARD_LIMIT, unlimited: false },
      { headers: noStore },
    );
  } catch (e) {
    console.error('[api/flashcards/reveal] status', e);
    return NextResponse.json({ error: 'flashcards_unavailable' }, { status: 503, headers: noStore });
  }
}
