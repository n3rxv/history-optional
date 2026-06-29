import type { Metadata } from 'next';
import Link from 'next/link';
import { allNotes } from '@/lib/notes';

export const metadata: Metadata = {
  title: 'History Optional Notes — UPSC Mains Paper I & II',
  description: 'Comprehensive free notes for UPSC History Optional covering Ancient India, Medieval India, Modern India and World History. Structured topic-wise for Paper I and Paper II.',
  alternates: { canonical: 'https://historyoptional.xyz/notes' },
};

const SECTIONS = [
  { label: 'Ancient India', slug: 'ancient-india', section: 'Ancient India', paper: 'Paper I', color: 'var(--accent)' },
  { label: 'Medieval India', slug: 'medieval-india', section: 'Medieval India', paper: 'Paper I', color: 'var(--accent)' },
  { label: 'Modern India', slug: 'modern-india', section: 'Modern India', paper: 'Paper II', color: 'var(--blue, #4c8bc9)' },
  { label: 'World History', slug: 'world-history', section: 'World History', paper: 'Paper II', color: 'var(--blue, #4c8bc9)' },
];

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
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          History Optional
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
          Notes
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
          {allNotes.length} topic-wise notes · Paper I & II · Free for all aspirants
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {SECTIONS.map(({ label, slug, section, paper, color }) => {
            const count = allNotes.filter(n => n.section === section).length;
            return (
              <Link key={slug} href={`/notes/${slug}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '1.5rem',
                  borderLeft: `3px solid ${color}`,
                  transition: 'background 0.15s',
                }}>
                  <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color, marginBottom: '0.5rem' }}>{paper}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>{label}</div>
                  <div style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>{count} topics →</div>
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ marginTop: '3rem' }}>
          <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>All Notes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {allNotes.map(note => (
              <Link key={note.slug} href={`/notes/${note.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '0.9rem 1.25rem',
                  borderLeft: `3px solid ${note.paper === 1 ? 'var(--accent)' : 'var(--blue, #4c8bc9)'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
                }}>
                  <div>
                    <div style={{ color: 'var(--text)', fontSize: '0.92rem', fontWeight: 600 }}>{note.title}</div>
                    <div style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{note.description}</div>
                  </div>
                  <span style={{
                    fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                    color: 'var(--text3)', background: 'var(--bg3)',
                    border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 3, flexShrink: 0,
                  }}>{note.section}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
