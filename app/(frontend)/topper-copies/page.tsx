import { allNotes } from '@/lib/notes';
import { pyqs } from '@/lib/pyqData';
import TopperBrowser from '@/components/topper/TopperBrowser';

/**
 * Every topper copy. The notes' titles and each PYQ's year are worked out
 * here and handed down: the page used to import the whole question bank
 * into the browser for the years on its PYQ chips.
 */
export default function TopperCopiesPage() {
  const notes = allNotes.map((n) => ({ slug: n.slug, title: n.title, section: n.section }));
  const years: Record<number, number> = {};
  for (const q of pyqs) years[q.id] = q.year;
  return <TopperBrowser notes={notes} years={years} />;
}
