import type { Metadata } from 'next';
import { allNotes } from '@/lib/notes';
import NotesIndex from '@/components/notes/NotesIndex';

export const metadata: Metadata = {
  title: { absolute: 'World History Notes: UPSC History Optional' },
  description: 'Topic-wise notes for World History — UPSC History Optional Paper II. Covers all major topics for Mains preparation.',
  alternates: { canonical: 'https://historyoptional.xyz/notes/world-history' },
};

export default function WorldHistoryNotesPage() {
  const notes = allNotes.filter(n => n.section === 'World History');

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://historyoptional.xyz/notes/world-history#page",
        "url": "https://historyoptional.xyz/notes/world-history",
        "name": "World History Notes: UPSC History Optional",
        "description": notes.length + " topic-wise notes for World History",
        "isPartOf": { "@id": "https://historyoptional.xyz/#website" },
        "inLanguage": "en-IN",
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://historyoptional.xyz" },
          { "@type": "ListItem", "position": 2, "name": "Notes", "item": "https://historyoptional.xyz/notes" },
          { "@type": "ListItem", "position": 3, "name": "World History", "item": "https://historyoptional.xyz/notes/world-history" },
        ]
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <NotesIndex variant="world" />
    </>
  );
}
