import type { Metadata } from 'next';
import Link from 'next/link';
import { pyqs } from '@/lib/pyqData';

export const metadata: Metadata = {
  title: 'India Since Independence PYQs — UPSC History Optional Previous Year Questions',
  description: 'All UPSC History Optional Previous Year Questions on India Since Independence (Paper II) from 1979–2026 — national integration, foreign policy, developmental economics and social movements.',
  alternates: { canonical: 'https://historyoptional.xyz/pyqs/india-since-independence' },
};

/**
 * India Since Independence was not a section: its 47 questions sat inside
 * Modern India's 469, unmarked. The PYQ book and the official syllabus both
 * treat it separately (Paper II items 13-15), so it has its own page now.
 */
export default function PYQPage() {
  const questions = pyqs.filter(q => q.section === 'Paper II - India Since Independence');

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://historyoptional.xyz/pyqs/india-since-independence#page",
        "url": "https://historyoptional.xyz/pyqs/india-since-independence",
        "name": "India Since Independence PYQs — UPSC History Optional",
        "description": questions.length + " Previous Year Questions on India Since Independence for UPSC History Optional",
        "isPartOf": { "@id": "https://historyoptional.xyz/#website" },
        "inLanguage": "en-IN",
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://historyoptional.xyz" },
          { "@type": "ListItem", "position": 2, "name": "PYQs", "item": "https://historyoptional.xyz/pyqs" },
          { "@type": "ListItem", "position": 3, "name": "India Since Independence", "item": "https://historyoptional.xyz/pyqs/india-since-independence" },
        ]
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          <Link href="/pyqs" style={{ color: 'var(--text3)', textDecoration: 'none' }}>PYQs</Link> · Paper II
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
          India Since Independence — Previous Year Questions
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          UPSC History Optional Paper II · {questions.length} questions · 1979–2026
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {questions.map(q => (
            <Link key={q.id} href={`/pyqs/${q.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '1.1rem 1.4rem',
                borderLeft: '3px solid var(--blue, #4c8bc9)',
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
