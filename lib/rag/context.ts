import type { RagHit } from './retrieve';
import { groundingLine, SUBJECT_LABEL, type TimelineEvent } from './timeline';

/**
 * How retrieved passages and timeline rows are shown to the answering model.
 *
 * The first line of each block keeps the `[Source N — Title | Author: Name]`
 * shape the chat page and the citation chips already read. The second line is
 * what the old context lacked: the syllabus part, the years the passage is
 * about and the event it describes, so a passage on the 1942 Cripps offer can
 * no longer pass for one on the 1946 Cabinet Mission.
 */

const years = (a: number, b: number) => {
  const f = (y: number) => (y < 0 ? `${-y} BCE` : String(y));
  return a === b ? f(a) : `${f(a)}–${f(b)}`;
};

export function formatPassages(hits: RagHit[]): string {
  return hits
    .map((h, i) => {
      const head = `[Source ${i + 1} — ${h.book_title} | Author: ${h.author}]`;
      // An untagged passage has only its book's years, which say nothing about the passage.
      if (!h.tagged) return `${head}\n${h.text}`;
      const about = `About: ${SUBJECT_LABEL[h.subject] ?? h.subject}, ${years(h.year_start, h.year_end)}.${h.context ? ` ${h.context}` : ''}`;
      return `${head}\n${about}\n${h.text}`;
    })
    .join('\n\n---\n\n');
}

export function formatTimeline(events: TimelineEvent[]): string {
  return events.map((e) => `- ${groundingLine(e)}`).join('\n');
}

/** What the chat page shows under an answer: book, author and the passage itself. */
export function sourcesForClient(hits: RagHit[]) {
  return hits.map((h) => ({ book_title: h.book_title, author: h.author, content: h.text }));
}
