import type { Metadata } from 'next';
import { allNotes } from '@/lib/notes';
import Flashcards from '@/components/flashcards/Flashcards';

export const metadata: Metadata = {
  title: 'Flashcards: UPSC History Optional',
  description: 'Spaced-repetition flashcards for UPSC History Optional Mains: historians’ arguments, causes and effects, comparisons and quotes, by syllabus topic.',
  alternates: { canonical: 'https://historyoptional.xyz/flashcards' },
};

/** The cards come from /api/flashcards; the notes' titles and order come from here. */
export default function FlashcardsPage() {
  return <Flashcards notes={allNotes.map((n) => ({ slug: n.slug, title: n.title, section: n.section }))} />;
}
