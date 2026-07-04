import CurrentAffairsSection from '@/components/CurrentAffairsSection';
import EvaluateDemo from '@/components/EvaluateDemo';
import DailyAnswerWriting from '@/components/DailyAnswerWriting';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { AnimatedStats, PYQCarousel } from '@/components/HomeClient';
import { paper1Notes, paper2Notes } from '@/lib/notes';

const stats = [
  { value: 51,   label: 'Topics',    color: 'var(--accent)',  suffix: '', href: '/paper1'     },
  { value: 2,    label: 'Papers',    color: 'var(--yellow)',  suffix: '', href: '/paper2'     },
  { value: 1533, label: 'PYQs',      color: 'var(--red)',     suffix: '', href: '/pyqs'       },
  { value: 55,   label: 'Flashcards',color: 'var(--green)',   suffix: '', href: '/flashcards' },
];

const features = [
  { icon: '✍️', title: 'Smart Annotations',               color: 'var(--yellow)', desc: 'Handwritten annotations support — write with your digital pen directly on the notes. Annotate, highlight and mark directly on the content as you study.',             href: '/paper1'   },
  { icon: '📖', title: 'Comprehensive & Exhaustive Notes', color: 'var(--accent)', desc: 'Complete unabridged notes with embedded historiography, structured by syllabus. Completely free.',                                                                   href: '/paper1'   },
  { icon: '📝', title: 'Answer Evaluation',                color: 'var(--red)',    desc: 'Get your UPSC answers evaluated instantly — detailed feedback on structure, content & scoring. Tailored specifically for History Optional. 1 evaluation on free tier. Unlimited on Premium.', href: '/evaluate' },
  { icon: '🤖', title: 'Personalized AI Assistant',        color: 'var(--green)',  desc: 'An AI that knows your syllabus — ask any History Optional question and get structured, exam-ready answers with historiography. 3 queries on free tier. Unlimited on Premium.',            href: '/chat'     },
];

const p1Sections = ['Ancient India', 'Medieval India'];
const p2Sections = ['Modern India', 'World History'];

const sectionColors: Record<string, string> = {
  'Ancient India':  'var(--yellow)',
  'Medieval India': 'var(--red)',
  'Modern India':   'var(--accent)',
  'World History':  'var(--green)',
};

// Marquee items — historians + topics alternating
const marqueeItems = [
  { text: 'Romila Thapar', sub: 'State Formation & Early India' },
  { text: 'Irfan Habib', sub: 'Agrarian System of Mughal India' },
  { text: 'R.S. Sharma', sub: 'Indian Feudalism' },
  { text: 'Bipin Chandra', sub: 'Nationalist Historiography' },
  { text: 'D.D. Kosambi', sub: 'Marxist History of India' },
  { text: 'Burton Stein', sub: 'Segmentary State — Vijayanagara' },
  { text: 'Satish Chandra', sub: 'Medieval India' },
  { text: 'M. Athar Ali', sub: 'Mughal Mansabdari Crisis' },
  { text: 'Eric Hobsbawm', sub: 'Age of Revolution' },
  { text: 'E.P. Thompson', sub: 'Making of the English Working Class' },
  { text: 'Dadabhai Naoroji', sub: 'Drain of Wealth Theory' },
  { text: 'Mohammad Habib', sub: 'Khalji Revolution' },
];

export default function Home() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem 4rem', position: 'relative' }}>

      <style>{`
        .shimmer-btn::before { content:""; position:absolute; top:0; left:-75%; width:50%; height:100%; background:linear-gradient(120deg,transparent 0%,rgba(255,255,255,0.13) 50%,transparent 100%); transform:skewX(-20deg); opacity:0; pointer-events:none; z-index:1; }
        .shimmer-btn:hover::before { opacity:1; animation:glass-shine 0.55s ease forwards; }
        /* Marquee */
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { display: flex; width: max-content; animation: marquee 32s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        .marquee-wrap { overflow: hidden; mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent); -webkit-mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent); }

        /* PYQ slide */
        .pyq-slide { transition: opacity 0.3s ease, transform 0.3s ease; }
        .pyq-slide.pyq-in { opacity: 1;  }
        .pyq-slide.pyq-out { opacity: 0; transform: translateY(6px); }

        /* Dot indicator */
        .pyq-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--border2); transition: all 0.3s; cursor: pointer; border: none; padding: 0; }
        .pyq-dot.active { background: var(--accent); width: 16px; border-radius: 3px; }

        @media (max-width: 768px) {
          .grid-2col { grid-template-columns: 1fr !important; }
          .grid-4col { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section style={{ padding: '5rem 0 3.5rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
          color: 'var(--accent)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
          padding: '5px 16px', borderRadius: 20, marginBottom: '2rem',
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 2s ease infinite' }} />
          UPSC Civil Services · Mains Optional
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(2.8rem, 7vw, 4.5rem)',
          fontWeight: 700, lineHeight: 1.1, color: '#ffffff', marginBottom: '0.75rem',
          letterSpacing: '-0.03em',
        }}>History Optional</h1>

        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 2rem)',
          fontWeight: 400, fontStyle: 'italic', color: 'var(--accent)', marginBottom: '1.5rem',
        }}>Self-Study Platform</h2>

        <p style={{ color: 'var(--text2)', fontSize: '1.05rem', maxWidth: 500, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          Complete notes · PYQ bank · Historiography bank · Answer Evaluation · AI assistant · Interactive timelines — everything History Optional for free at one place.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button href="/paper1" size="lg">Paper I →</Button>
          <Button href="/paper2" size="lg" variant="outline">Paper II →</Button>
          <Button href="/chat" size="lg" variant="tinted" color="yellow">Ask AI →</Button>
        </div>
      </section>

      {/* ── Historian Marquee ── */}
      <div className="marquee-wrap" style={{ marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
        <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '10px 0', background: 'linear-gradient(90deg, rgba(10,10,10,0.8), rgba(17,17,17,0.6))' }}>
          <div className="marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 2.5rem', flexShrink: 0 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600 }}>{item.text}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text3)', letterSpacing: '0.04em' }}>— {item.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Animated Stats ── */}
      <AnimatedStats />

      {/* ── Paper cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '3rem', position: 'relative', zIndex: 1 }} className="grid-2col">
        {[
          { title: 'Ancient & Medieval India',    label: 'Paper I',  notes: paper1Notes, sections: p1Sections, href: '/paper1' },
          { title: 'Modern India & World History', label: 'Paper II', notes: paper2Notes, sections: p2Sections, href: '/paper2' },
        ].map(paper => (
          <div key={paper.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ color: 'var(--text3)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>{paper.label}</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#fff', fontWeight: 600 }}>{paper.title}</h2>
              </div>
              <span style={{ background: 'rgba(59,130,246,0.08)', color: 'var(--accent)', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>{paper.notes.length} topics</span>
            </div>
            {paper.sections.map(sec => (
              <div key={sec} style={{ marginBottom: '1.1rem' }}>
                <div style={{ color: sectionColors[sec], fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{sec}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {paper.notes.filter(n => n.section === sec).slice(0, 5).map(n => (
                    <Link key={n.slug} href={`/notes/${n.slug}`} className="g-topic-pill"
                      style={{ ['--hover-color' as any]: sectionColors[sec] }}>
                      {n.title.length > 24 ? n.title.slice(0, 24) + '…' : n.title}
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
            <Link href={paper.href} style={{ display: 'block', marginTop: '1.25rem', textAlign: 'center', padding: '0.6rem', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text2)', textDecoration: 'none', fontSize: '0.85rem', transition: 'all 0.15s' }}
              className="g-paper-view-link">
              View all {paper.label} topics →
            </Link>
          </div>
        ))}
      </div>

      {/* ── Features ── */}
      <section style={{ marginBottom: '3rem', position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff', marginBottom: '1.25rem', fontWeight: 600 }}>Platform Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }} className="grid-4col">
          {features.map(f => (
            <Link key={f.title} href={f.href} style={{ textDecoration: 'none', display: 'flex', alignSelf: 'stretch' }}>
              <div className="g-feature-tile" style={{ cursor: 'pointer', transition: 'transform 0.15s ease', height: '100%', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: f.color, marginBottom: '0.4rem', fontSize: '0.95rem' }}>{f.title}</div>
                <div style={{ color: 'var(--text3)', fontSize: '0.8rem', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── PYQ Carousel + Test banner ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', position: 'relative', zIndex: 1, marginBottom: '3rem' }} className="grid-2col">

        <PYQCarousel />

        {/* Test banner */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', borderLeft: '3px solid var(--accent)' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#fff', marginBottom: '0.35rem', fontWeight: 600 }}>Attempt a Test</h3>
            <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>Timed sectional and full-length mock tests with instant self/AI-mentored evaluation.</p>
          </div>
          <Link href="/test" style={{ background: 'var(--accent)', color: '#000', padding: '0.65rem 1.5rem', borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem', display: 'inline-block', position: 'relative', overflow: 'hidden' }} className="shimmer-btn">Start Test →</Link>
        </div>
      </div>

      {/* ── Explore further: interactive demos & extras ── */}
      <EvaluateDemo />
      <div id="daily-answer"><DailyAnswerWriting /></div>
      <CurrentAffairsSection />

    </div>
  );
}
