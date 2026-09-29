import { NextRequest, NextResponse } from 'next/server';
import { getNoteBySlug } from '@/lib/notes';
import { pyqsForTopic } from '@/lib/notePyqMap';
import { countForTopic } from '@/lib/flashcardStore';
import { cachePublic } from '@/lib/cacheHeaders';

/**
 * What the site already has on one syllabus topic, for the chat page.
 *
 *   GET /api/chat/related?slug=mauryan-empire
 *
 * The chat's start screen lists a topic's past questions to pick from, and an
 * answer is followed by the PYQs, flashcards and notes on its topic. Both need
 * the PYQ set, which is 600 KB of text that has no business in the browser
 * bundle, so it is matched here and only the one topic's questions go down.
 *
 * Nothing in the response depends on who is asking, so it is cached at the
 * edge. It changes only when a deploy changes the PYQ data or a batch of
 * flashcards is published, and an hour's lag on a card count is harmless.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') ?? '';
  const note = getNoteBySlug(slug);
  if (!note) return NextResponse.json({ error: 'unknown_topic' }, { status: 404 });

  const pyqs = pyqsForTopic(note.paper, note.topic, note.slug);
  const flashcards = await countForTopic(note.slug);

  return NextResponse.json(
    {
      topic: {
        slug: note.slug,
        title: note.title,
        section: note.section,
        paper: note.paper,
      },
      pyqs: pyqs.map((q) => ({ id: q.id, year: q.year, marks: q.marks, question: q.question })),
      flashcards,
    },
    { headers: cachePublic(3600) },
  );
}
