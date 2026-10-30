import { allNotes } from '@/lib/notes';
import { pyqs } from '@/lib/pyqData';
import TopperBrowser from '@/components/topper/TopperBrowser';
import { questionSig } from '@/components/topper/note';

/**
 * Every topper copy. The notes' titles and each PYQ's year are worked out
 * here and handed down: the page used to import the whole question bank
 * into the browser for the years on its PYQ chips. Each PYQ's wording goes
 * down as a short signature, which tells Hindi mode which copies answer a
 * PYQ as asked and so may show it in Hindi.
 */
export default function TopperCopiesPage() {
  const notes = allNotes.map((n) => ({ slug: n.slug, title: n.title, section: n.section }));
  const years: Record<number, number> = {};
  const sigs: Record<number, string> = {};
  for (const q of pyqs) {
    years[q.id] = q.year;
    sigs[q.id] = questionSig(q.question);
  }
  return <TopperBrowser notes={notes} years={years} sigs={sigs} />;
}
