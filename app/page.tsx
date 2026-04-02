'use client';
import CurrentAffairsSection from '@/components/CurrentAffairsSection';
import Link from 'next/link';
import { paper1Notes, paper2Notes } from '@/lib/notes';

const stats = [
  { value: '51', label: 'Topics', color: 'var(--accent)' },
  { value: '2',  label: 'Papers', color: 'var(--yellow)' },
  { value: '4',  label: 'Sections', color: 'var(--red)' },
  { value: 'AI', label: 'Assistant', color: 'var(--green)' },
];

const features = [
  { icon: '✍️', title: 'Smart Annotations',              color: 'var(--yellow)', desc: 'Handwritten annotations support — write with your digital pen directly on the notes.' },
  { icon: '📖', title: 'Comprehensive & Exhaustive Notes', color: 'var(--accent)', desc: 'Complete unabridged notes with embedded historiography, structured by syllabus.' },
  { icon: '📝', title: 'Free Answer Evaluation',          color: 'var(--red)',    desc: 'Get your UPSC answers evaluated instantly — detailed feedback, structure & scoring.' },
  { icon: '🤖', title: 'Your Personalized AI Assistant',  color: 'var(--green)',  desc: 'An AI that knows your syllabus — ask any History Optional question, get structured answers.' },
];

const p1Sections = ['Ancient India', 'Medieval India'];
const p2Sections = ['Modern India', 'World History'];

const sectionColors: Record<string, string> = {
  'Ancient India':   'var(--yellow)',
  'Medieval India':  'var(--red)',
  'Modern India':    'var(--accent)',
  'World History':   'var(--green)',
};

export default function Home() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem 4rem' }}>

      {/* Hero */}
      <section style={{ padding: '5rem 0 3.5rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
          color: 'var(--accent)',
          fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
          padding: '5px 16px', borderRadius: 20,
          marginBottom: '2rem', letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          UPSC Civil Services · Mains Optional
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.8rem, 7vw, 4.5rem)',
          fontWeight: 700, lineHeight: 1.1,
          color: '#ffffff', marginBottom: '0.75rem',
          letterSpacing: '-0.03em',
        }}>
          History Optional
        </h1>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.4rem, 3vw, 2rem)',
          fontWeight: 400, fontStyle: 'italic',
          color: 'var(--accent)', marginBottom: '1.5rem',
        }}>Study Platform</h2>

        <p style={{
          color: 'var(--text2)', fontSize: '1.05rem',
          maxWidth: 500, margin: '0 auto 2.5rem', lineHeight: 1.7,
        }}>
          Complete notes · PYQ bank · AI assistant · Interactive timelines — everything for Paper I & II in one place.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/paper1" style={{
            background: 'var(--accent)', color: '#000000',
            padding: '0.8rem 2.25rem', borderRadius: 6,
            textDecoration: 'none', fontWeight: 700,
            fontSize: '0.9rem', fontFamily: 'var(--font-body)',
            letterSpacing: '0.02em',
          }}>Paper I →</Link>
          <Link href="/paper2" style={{
            background: 'transparent', color: 'var(--text)',
            padding: '0.8rem 2.25rem', borderRadius: 6,
            textDecoration: 'none', fontWeight: 500,
            fontSize: '0.9rem',
            border: '1px solid var(--border3)',
          }}>Paper II →</Link>
          <Link href="/chat" style={{
            background: 'rgba(234,179,8,0.1)', color: 'var(--yellow)',
            padding: '0.8rem 2.25rem', borderRadius: 6,
            textDecoration: 'none', fontWeight: 500,
            fontSize: '0.9rem',
            border: '1px solid rgba(234,179,8,0.25)',
          }}>Ask AI →</Link>
        </div>
      </section>

      {/* Stats bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
        gap: '1px', background: 'var(--border)',
        border: '1px solid var(--border)', borderRadius: 8,
        overflow: 'hidden', marginBottom: '3rem',
      }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ color: 'var(--text3)', fontSize: '0.72rem', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Paper cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '3rem' }}>
        {[
          { title: 'Ancient & Medieval India', label: 'Paper I', notes: paper1Notes, sections: p1Sections, href: '/paper1' },
          { title: 'Modern India & World History', label: 'Paper II', notes: paper2Notes, sections: p2Sections, href: '/paper2' },
        ].map(paper => (
          <div key={paper.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '1.75rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ color: 'var(--text3)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>{paper.label}</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#ffffff', fontWeight: 600 }}>{paper.title}</h2>
              </div>
              <span style={{
                background: 'rgba(59,130,246,0.08)', color: 'var(--accent)',
                border: '1px solid rgba(59,130,246,0.2)',
                fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
                padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
              }}>{paper.notes.length} topics</span>
            </div>

            {paper.sections.map(sec => (
              <div key={sec} style={{ marginBottom: '1.1rem' }}>
                <div style={{
                  color: sectionColors[sec], fontSize: '0.68rem',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  marginBottom: '0.5rem', fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                }}>{sec}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {paper.notes.filter(n => n.section === sec).slice(0, 5).map(n => (
                    <Link key={n.slug} href={`/notes/${n.slug}`} style={{
                      fontSize: '0.76rem', color: 'var(--text2)',
                      padding: '3px 10px', borderRadius: 20,
                      border: '1px solid var(--border)',
                      textDecoration: 'none', background: 'var(--bg3)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = sectionColors[sec];
                      (e.currentTarget as HTMLElement).style.color = sectionColors[sec];
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text2)';
                    }}>
                      {n.title.length > 24 ? n.title.slice(0,24)+'…' : n.title}
                    </Link>
                  ))}
                  {paper.notes.filter(n => n.section === sec).length > 5 && (
                    <Link href={paper.href} style={{ fontSize: '0.76rem', color: sectionColors[sec], padding: '3px 10px', textDecoration: 'none' }}>
                      +{paper.notes.filter(n => n.section === sec).length - 5} more
                    </Link>
                  )}
                </div>
              </div>
            ))}

            <Link href={paper.href} style={{
              display: 'block', marginTop: '1.25rem', textAlign: 'center',
              padding: '0.6rem', border: '1px solid var(--border2)',
              borderRadius: 6, color: 'var(--text2)', textDecoration: 'none',
              fontSize: '0.85rem', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}
            >View all {paper.label} topics →</Link>
          </div>
        ))}
      </div>

      {/* Features */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#ffffff', marginBottom: '1.25rem', fontWeight: 600 }}>
          Platform Features
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {features.map(f => (
            <div key={f.title} style={{ background: 'var(--bg2)', padding: '1.5rem' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: f.color, marginBottom: '0.4rem', fontSize: '0.95rem' }}>{f.title}</div>
              <div style={{ color: 'var(--text3)', fontSize: '0.8rem', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
      <CurrentAffairsSection />

      {/* PYQs banner */}
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border2)',
        borderRadius: 10, padding: '1.75rem 2rem',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
        borderLeft: '3px solid var(--red)',
      }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#ffffff', marginBottom: '0.35rem', fontWeight: 600 }}>
            Previous Year Questions
          </h3>
          <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>
            Filter by year, paper and topic. Study patterns and question trends.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/pyqs" style={{
            background: 'var(--red)', color: '#ffffff',
            padding: '0.65rem 1.5rem', borderRadius: 6,
            textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
          }}>Browse PYQs</Link>
          <Link href="/chat" style={{
            background: 'transparent', color: 'var(--accent)',
            padding: '0.65rem 1.5rem', borderRadius: 6,
            textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem',
            border: '1px solid rgba(59,130,246,0.3)',
          }}>Ask AI →</Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: '1fr 1fr'"] { grid-template-columns: 1fr !important; }
          div[style*="repeat(4,1fr)"] { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  );
}
