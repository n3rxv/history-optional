import { NextResponse } from 'next/server';
import { PRELIMS_HI, PRELIMS_TOPIC_HI } from '@/lib/prelimsDataHi';
import { cachePublic } from '@/lib/cacheHeaders';

/**
 * The Prelims questions in Hindi, for the practice pages in Hindi mode.
 * Built once at deploy and served from the edge: English readers never load
 * it, and a reader who switches to Hindi fetches it once for the visit.
 */

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(
    { q: PRELIMS_HI, topics: PRELIMS_TOPIC_HI },
    { headers: cachePublic(86400) },
  );
}
