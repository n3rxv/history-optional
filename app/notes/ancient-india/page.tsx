import type { Metadata } from 'next';
import Link from 'next/link';
import { allNotes } from '@/lib/notes';

export const metadata: Metadata = {
  title: 'Ancient India Notes — UPSC History Optional',
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
        "name": "Ancient India Notes — UPSC History Optional",
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
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          <Link href="/notes" style={{ color: 'var(--text3)', textDecoration: 'none' }}>Notes</Link> · Paper I
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
          Ancient India
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          UPSC History Optional Paper I · {notes.length} topics
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notes.map(note => (
            <Link key={note.slug} href={`/notes/${note.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '1.1rem 1.4rem',
                borderLeft: '3px solid var(--accent)',
              }}>
                <div style={{ color: 'var(--text)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.3rem' }}>{note.title}</div>
                <div style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>{note.description}</div>
                {note.subtopics && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                    {note.subtopics.map(st => (
                      <span key={st} style={{
                        fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                        color: 'var(--text3)', background: 'var(--bg3)',
                        border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 3,
                      }}>{st}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
