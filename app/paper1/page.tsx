'use client';
import Link from 'next/link';
import { paper1Notes, paper1Sections } from '@/lib/notes';


export default function Paper1() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          UPSC History Optional
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
          Paper I — Ancient & Medieval India
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.95rem', maxWidth: 600 }}>
          {paper1Notes.length} topics covering Sources, Pre-history through the 18th century.
          Click any topic to open the full notes with annotation support.
        </p>
      </div>

      {paper1Sections.map(section => (
        <div key={section} style={{ marginBottom: '2.5rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              color: 'var(--accent)',
              fontWeight: 600,
            }}>{section}</h2>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>
              {paper1Notes.filter(n => n.section === section).length} topics
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.85rem' }}>
            {paper1Notes.filter(n => n.section === section).map((note, i) => (
              <Link key={note.slug} href={`/notes/${note.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '1.1rem 1.25rem',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent2)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'; }}
                >
                  <span style={{
                    minWidth: 28, height: 28,
                    background: 'var(--accent-dim)',
                    border: '1px solid var(--accent2)',
                    borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>{note.topic}</span>
                  <div>
                    <div style={{ color: 'var(--text)', fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.25rem', lineHeight: 1.3 }}>
                      {note.title}
                    </div>
                    <div style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>
                      {note.description}
                    </div>
                    {note.subtopics && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                        {note.subtopics.slice(0,3).map(s => (
                          <span key={s} style={{
                            fontSize: '0.68rem', color: 'var(--text3)',
                            background: 'var(--bg)', border: '1px solid var(--border)',
                            padding: '1px 6px', borderRadius: 3,
                          }}>{s}</span>
                        ))}
                        {note.subtopics.length > 3 && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>+{note.subtopics.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
