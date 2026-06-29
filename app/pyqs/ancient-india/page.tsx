import type { Metadata } from 'next';
import Link from 'next/link';
import { pyqs } from '@/lib/pyqData';

export const metadata: Metadata = {
  title: 'Ancient India PYQs — UPSC History Optional Previous Year Questions',
  description: 'All UPSC History Optional Previous Year Questions on Ancient India (Paper I) from 1979–2025. Covers Harappan Civilization, Vedic Period, Mauryas, Guptas, and more.',
  alternates: { canonical: 'https://historyoptional.xyz/pyqs/ancient-india' },
};

export default function AncientIndiaPYQs() {
  const questions = pyqs.filter(q => q.section === 'Paper I - Ancient India');

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://historyoptional.xyz/pyqs/ancient-india#page",
        "url": "https://historyoptional.xyz/pyqs/ancient-india",
        "name": "Ancient India PYQs — UPSC History Optional",
        "description": `${questions.length} Previous Year Questions on Ancient India for UPSC History Optional`,
        "isPartOf": { "@id": "https://historyoptional.xyz/#website" },
        "inLanguage": "en-IN",
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://historyoptional.xyz" },
          { "@type": "ListItem", "position": 2, "name": "PYQs", "item": "https://historyoptional.xyz/pyqs" },
          { "@type": "ListItem", "position": 3, "name": "Ancient India", "item": "https://historyoptional.xyz/pyqs/ancient-india" },
        ]
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          <Link href="/pyqs" style={{ color: 'var(--text3)', textDecoration: 'none' }}>PYQs</Link> · Paper I
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
          Ancient India — Previous Year Questions
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          UPSC History Optional Paper I · {questions.length} questions · 1979–2025
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {questions.map(q => (
            <Link key={q.id} href={`/pyqs/${q.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '1.1rem 1.4rem',
                borderLeft: '3px solid var(--accent)',
                transition: 'background 0.15s',
              }}>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 3 }}>{q.year}</span>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 3 }}>{q.marks}M</span>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', padding: '2px 8px', borderRadius: 3 }}>{q.topic}</span>
                </div>
                <p style={{ color: 'var(--text)', fontSize: '0.92rem', lineHeight: 1.65, margin: 0 }}>{q.question}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
