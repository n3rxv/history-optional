import type { Metadata } from 'next';
import { allNotes } from '@/lib/notes';
import NotesIndex from '@/components/notes/NotesIndex';

export const metadata: Metadata = {
  title: { absolute: 'History Optional Notes: UPSC Mains Paper I & II' },
  description: 'Comprehensive free notes for UPSC History Optional covering Ancient India, Medieval India, Modern India and World History. Structured topic-wise for Paper I and Paper II.',
  alternates: { canonical: 'https://historyoptional.xyz/notes' },
};

export default function NotesPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://historyoptional.xyz/notes#page",
        "url": "https://historyoptional.xyz/notes",
        "name": "History Optional Notes — UPSC Mains",
        "description": `${allNotes.length} topic-wise notes for UPSC History Optional Paper I and Paper II`,
        "isPartOf": { "@id": "https://historyoptional.xyz/#website" },
        "inLanguage": "en-IN",
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://historyoptional.xyz" },
          { "@type": "ListItem", "position": 2, "name": "Notes", "item": "https://historyoptional.xyz/notes" },
        ]
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <NotesIndex variant="all" />
    </>
  );
}
