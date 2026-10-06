import type { Metadata } from 'next';
import { allNotes } from '@/lib/notes';
import NotesIndex from '@/components/notes/NotesIndex';

export const metadata: Metadata = {
  title: { absolute: 'Medieval India Notes: UPSC History Optional' },
  description: 'Topic-wise notes for Medieval India — UPSC History Optional Paper I. Covers all major topics for Mains preparation.',
  alternates: { canonical: 'https://historyoptional.xyz/notes/medieval-india' },
};

export default function MedievalIndiaNotesPage() {
  const notes = allNotes.filter(n => n.section === 'Medieval India');

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://historyoptional.xyz/notes/medieval-india#page",
        "url": "https://historyoptional.xyz/notes/medieval-india",
        "name": "Medieval India Notes: UPSC History Optional",
        "description": notes.length + " topic-wise notes for Medieval India",
        "isPartOf": { "@id": "https://historyoptional.xyz/#website" },
        "inLanguage": "en-IN",
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://historyoptional.xyz" },
          { "@type": "ListItem", "position": 2, "name": "Notes", "item": "https://historyoptional.xyz/notes" },
          { "@type": "ListItem", "position": 3, "name": "Medieval India", "item": "https://historyoptional.xyz/notes/medieval-india" },
        ]
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <NotesIndex variant="medieval" />
    </>
  );
}
