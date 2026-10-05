import type { Metadata } from 'next';
import { allNotes } from '@/lib/notes';
import NotesIndex from '@/components/notes/NotesIndex';

export const metadata: Metadata = {
  title: 'Modern India Notes — UPSC History Optional',
  description: 'Topic-wise notes for Modern India — UPSC History Optional Paper II. Covers all major topics for Mains preparation.',
  alternates: { canonical: 'https://historyoptional.xyz/notes/modern-india' },
};

export default function ModernIndiaNotesPage() {
  const notes = allNotes.filter(n => n.section === 'Modern India');

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://historyoptional.xyz/notes/modern-india#page",
        "url": "https://historyoptional.xyz/notes/modern-india",
        "name": "Modern India Notes — UPSC History Optional",
        "description": notes.length + " topic-wise notes for Modern India",
        "isPartOf": { "@id": "https://historyoptional.xyz/#website" },
        "inLanguage": "en-IN",
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://historyoptional.xyz" },
          { "@type": "ListItem", "position": 2, "name": "Notes", "item": "https://historyoptional.xyz/notes" },
          { "@type": "ListItem", "position": 3, "name": "Modern India", "item": "https://historyoptional.xyz/notes/modern-india" },
        ]
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <NotesIndex variant="modern" />
    </>
  );
}
