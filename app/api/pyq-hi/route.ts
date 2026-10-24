import { NextResponse } from 'next/server';
import { pyqs } from '@/lib/pyqData';
import { PYQ_HI, PYQ_HI_OFFICIAL, PYQ_TOPIC_HI, PYQ_SUBTOPIC_HI } from '@/lib/pyqDataHi';
import { allNotes } from '@/lib/notes';
import { NOTE_HI } from '@/lib/notesHi';
import { cachePublic } from '@/lib/cacheHeaders';

/**
 * The question bank in Hindi, for pages in Hindi mode. Built once at deploy
 * and served from the edge: the English pages never load it, and a reader
 * who switches to Hindi fetches it once for every PYQ page.
 */

export const dynamic = 'force-static';

/** "Paper I, 20. Akbar" in Hindi, from the note that syllabus item is. */
function syllabusHi(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const label of new Set(pyqs.flatMap((q) => q.syllabus))) {
    const m = label.match(/^Paper (I{1,2}), (\d+)\.\s*(.*)$/);
    if (!m) continue;
    const paper = m[1] === 'II' ? 2 : 1;
    const note = allNotes.find((n) => n.paper === paper && n.topic === Number(m[2]));
    const title = note ? NOTE_HI[note.slug]?.title : undefined;
    if (title) out[label] = `प्रश्नपत्र ${m[1]}, ${m[2]}. ${title}`;
  }
  return out;
}

export function GET() {
  return NextResponse.json(
    { q: PYQ_HI, official: PYQ_HI_OFFICIAL, topics: PYQ_TOPIC_HI, subtopics: PYQ_SUBTOPIC_HI, syllabus: syllabusHi() },
    { headers: cachePublic(86400) },
  );
}
