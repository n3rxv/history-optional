import { NextRequest, NextResponse } from 'next/server';
import { listIndex, listCards } from '@/lib/flashcardStore';
import { cachePublic } from '@/lib/cacheHeaders';

/**
 * Flashcards, served instead of bundled.
 *
 *   GET /api/flashcards?index=1
 *     One small record per published card: id, section, type, topic. This
 *     is what the study page needs to count what is due and build its
 *     filters, and it stays small as the deck grows. topic is the notes slug,
 *     so the chat can send a reader to the cards on the topic it answered.
 *
 *   GET /api/flashcards?section=&type=&ids=&limit=&offset=
 *     Card text WITHOUT the answer, for the cards actually being studied.
 *
 * The answer side is not here. It is metered -- a reader gets a hundred free
 * answers and then needs a subscription -- so it depends on who is asking, and
 * this route's response is cached publicly at the edge, where it is served to
 * whoever asks next regardless of what they have paid. Those two facts cannot
 * both be true of one route, which is exactly the trap lib/cacheHeaders.ts
 * describes. Answers come from POST /api/flashcards/reveal instead.
 *
 * What remains here is identical for every visitor -- spaced-repetition state
 * lives in the browser's localStorage, never here -- so it is safe to cache.
 */
const MAX_LIMIT = 200;

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  try {
    if (p.get('index') === '1') {
      const index = await listIndex();
      return NextResponse.json(
        { cards: index, total: index.length },
        // A minute, not ten. Ten was chosen on the reasoning that cards change
        // rarely, which is true in steady state and wrong on the day you
        // publish a batch -- 190 cards went live and the site kept serving 55
        // from the edge for the rest of the window. The index is ~14 KB at 245
        // cards, so the extra origin traffic from a shorter life is nothing
        // against being able to see an edit land.
        { headers: cachePublic(60) },
      );
    }

    const idsParam = p.get('ids');
    const ids = idsParam ? idsParam.split(',').map((s) => s.trim()).filter(Boolean) : undefined;

    // An unbounded limit is how one request ends up returning the whole deck,
    // which is the thing this route exists to prevent.
    const limit = Math.min(Number(p.get('limit')) || 60, MAX_LIMIT);
    const offset = Math.max(Number(p.get('offset')) || 0, 0);

    const { cards, total } = await listCards({
      section: p.get('section') ?? undefined,
      type: p.get('type') ?? undefined,
      ids,
      limit,
      offset,
    });

    return NextResponse.json(
      { cards, total, limit, offset },
      { headers: cachePublic(60) },
    );
  } catch (e) {
    // Distinguishable from an empty deck on purpose: a client that reads a
    // failed query as "no cards" shows an empty shelf during an outage.
    console.error('[api/flashcards]', e);
    return NextResponse.json(
      { error: 'flashcards_unavailable' },
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}
