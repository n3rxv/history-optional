import { NextRequest, NextResponse } from 'next/server';
import { listIndex, listCards } from '@/lib/flashcardStore';
import { cachePublic } from '@/lib/cacheHeaders';

/**
 * Flashcards, served instead of bundled.
 *
 *   GET /api/flashcards?index=1
 *     One small record per published card: id, section, type. This is what
 *     the study page needs to count what is due and build its filters, and
 *     it stays small as the deck grows.
 *
 *   GET /api/flashcards?section=&type=&ids=&limit=&offset=
 *     Full card text, for the cards actually being studied.
 *
 * The response is identical for every visitor -- spaced-repetition state
 * lives in the browser's localStorage, never here -- so it is safe to cache
 * publicly at the edge. That is the condition lib/cacheHeaders.ts warns
 * about: a route whose body varies by caller must not use a public policy.
 */
const MAX_LIMIT = 200;

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  try {
    if (p.get('index') === '1') {
      const index = await listIndex();
      return NextResponse.json(
        { cards: index, total: index.length },
        // Cards change when someone edits or publishes one, which is rare.
        // Ten minutes at the edge with a long stale window means the database
        // sees almost none of this traffic.
        { headers: cachePublic(600) },
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
      { headers: cachePublic(600) },
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
