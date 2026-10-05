import { NextRequest, NextResponse } from 'next/server';
import { dailyQuestionsFor } from '@/lib/dailyQuestions';

/**
 * One day's daily answer-writing set, for a homepage prerendered on an earlier
 * day. The day is in the URL and its set never changes, so the CDN keeps each
 * answer for good: about one function call per day per region, where the
 * homepage used to render itself again every hour to roll the set over.
 */
export async function GET(req: NextRequest) {
  const day = req.nextUrl.searchParams.get('day') ?? '';
  const questions = dailyQuestionsFor(day);
  if (!questions) return NextResponse.json({ error: 'bad day' }, { status: 400 });
  return NextResponse.json(
    { day, questions },
    { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable' } },
  );
}
