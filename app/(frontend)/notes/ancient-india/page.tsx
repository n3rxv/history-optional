import type { Metadata } from 'next';
import { allNotes } from '@/lib/notes';
import NotesIndex from '@/components/notes/NotesIndex';

export const metadata: Metadata = {
  title: { absolute: 'Ancient India Notes: UPSC History Optional' },
  description: 'Topic-wise notes for Ancient India — UPSC History Optional Paper I. Covers all major topics for Mains preparation.',
  alternates: { canonical: 'https://historyoptional.xyz/notes/ancient-india' },
};

export default function AncientIndiaNotesPage() {
  const notes = allNotes.filter(n => n.section === 'Ancient India');

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://historyoptional.xyz/notes/ancient-india#page",
        "url": "https://historyoptional.xyz/notes/ancient-india",
        "name": "Ancient India Notes: UPSC History Optional",
        "description": notes.length + " topic-wise notes for Ancient India",
        "isPartOf": { "@id": "https://historyoptional.xyz/#website" },
        "inLanguage": "en-IN",
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://historyoptional.xyz" },
          { "@type": "ListItem", "position": 2, "name": "Notes", "item": "https://historyoptional.xyz/notes" },
          { "@type": "ListItem", "position": 3, "name": "Ancient India", "item": "https://historyoptional.xyz/notes/ancient-india" },
        ]
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <NotesIndex variant="ancient" />
    </>
  );
}
