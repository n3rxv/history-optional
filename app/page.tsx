'use client';
import CurrentAffairsSection from '@/components/CurrentAffairsSection';
import DailyAnswerWriting from '@/components/DailyAnswerWriting';
import Link from 'next/link';
import { paper1Notes, paper2Notes } from '@/lib/notes';
import { useEffect, useRef, useState } from 'react';

const stats = [
  { value: 51,   label: 'Topics',    color: 'var(--accent)',  suffix: '' },
  { value: 2,    label: 'Papers',    color: 'var(--yellow)',  suffix: '' },
  { value: 1533, label: 'PYQs',      color: 'var(--red)',     suffix: '' },
  { value: 55,   label: 'Flashcards',color: 'var(--green)',   suffix: '' },
];

const features = [
  { icon: '✍️', title: 'Smart Annotations',               color: 'var(--yellow)', desc: 'Handwritten annotations support — write with your digital pen directly on the notes.' },
  { icon: '📖', title: 'Comprehensive & Exhaustive Notes', color: 'var(--accent)', desc: 'Complete unabridged notes with embedded historiography, structured by syllabus. Completely free.' },
  { icon: '📝', title: 'Answer Evaluation',                color: 'var(--red)',    desc: 'Get your UPSC answers evaluated instantly — detailed feedback, structure & scoring. 1 answer evaluation/week for free.' },
  { icon: '🤖', title: 'Personalized AI Assistant',        color: 'var(--green)',  desc: 'An AI that knows your syllabus — ask any History Optional question, get structured answers. 5 queries/month for free.' },
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

// Floating background topics
const floatingTopics = [
  'Mauryan Empire', 'French Revolution', 'Akbar', 'Indus Valley',
  'Bhakti Movement', 'Russian Revolution', 'Chola Administration',
  'Delhi Sultanate', 'Industrial Revolution', 'Gandhian Nationalism',
  'Gupta Period', 'World War II', 'Vijayanagara', 'Non-Cooperation',
  'Mughal Decline', 'Imperialism', 'Vedic Period', 'Partition of India',
];

// PYQ carousel questions
const pyqSlides = [
  { q: 'Analyze the contours of imperial ideology as exhibited during the Mauryan period.', year: 2023, marks: 15, paper: 'P1' },
  { q: '"The Khalji revolution was as much a socio-political as a military phenomenon." Comment.', year: 2022, marks: 15, paper: 'P1' },
  { q: 'What were the weaknesses of the Weimar Republic? How did Hitler succeed in establishing his dictatorship?', year: 2019, marks: 20, paper: 'P2' },
  { q: 'Trace the causes of the rise of nationalist movement in India and assess the contribution of the early nationalists.', year: 2021, marks: 20, paper: 'P2' },
  { q: 'Why did the Industrial Revolution occur first in Britain? Examine the factors.', year: 2018, marks: 15, paper: 'P2' },
  { q: 'Assess the nature and significance of the Bhakti Movement in medieval India.', year: 2020, marks: 15, paper: 'P1' },
];

// Animated counter hook
function useCounter(target: number, duration = 1200, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

function AnimatedStat({ value, label, color, suffix }: { value: number; label: string; color: string; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const count = useCounter(value, 1400, started);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="g-stat-block">
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, color }}>
        {count}{suffix}
      </div>
      <div style={{ color: 'var(--text3)', fontSize: '0.72rem', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
    </div>
  );
}

export default function Home() {
  const [pyqIdx, setPyqIdx] = useState(0);
  const [pyqFade, setPyqFade] = useState(true);

  // Auto-advance PYQ carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setPyqFade(false);
      setTimeout(() => {
        setPyqIdx(i => (i + 1) % pyqSlides.length);
        setPyqFade(true);
      }, 300);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem 4rem', position: 'relative' }}>

      <style>{`
        /* Marquee */
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { display: flex; width: max-content; animation: marquee 32s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        .marquee-wrap { overflow: hidden; mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent); -webkit-mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent); }

        /* Floating topics */
        @keyframes floatUp {
          0%   { opacity: 0; transform: translateY(0) translateX(0); }
          10%  { opacity: 0.07; }
          80%  { opacity: 0.05; }
          100% { opacity: 0; transform: translateY(-420px) translateX(var(--drift)); }
        }
        .float-topic {
          position: absolute; pointer-events: none; white-space: nowrap;
          font-family: var(--font-display); font-size: 0.75rem; font-style: italic;
          color: var(--text3); letter-spacing: 0.04em;
          animation: floatUp var(--dur) ease-in var(--delay) infinite;
          opacity: 0;
        }

        /* PYQ slide */
        .pyq-slide { transition: opacity 0.3s ease, transform 0.3s ease; }
        .pyq-slide.visible { opacity: 1; transform: translateY(0); }
        .pyq-slide.hidden  { opacity: 0; transform: translateY(6px); }

        /* Dot indicator */
        .pyq-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--border2); transition: all 0.3s; cursor: pointer; border: none; padding: 0; }
        .pyq-dot.active { background: var(--accent); width: 16px; border-radius: 3px; }

        @media (max-width: 768px) {
          .grid-2col { grid-template-columns: 1fr !important; }
          .grid-4col { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      {/* ── Floating background topics ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 520, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {floatingTopics.map((t, i) => (
          <span key={t} className="float-topic" style={{
            left: `${(i * 37 + 11) % 90}%`,
            top: `${(i * 53 + 20) % 60}%`,
            ['--dur' as any]: `${14 + (i % 5) * 3}s`,
            ['--delay' as any]: `${(i * 1.7) % 12}s`,
            ['--drift' as any]: `${((i % 3) - 1) * 30}px`,
          }}>{t}</span>
        ))}
      </div>

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
        }}>Study Platform</h2>

        <p style={{ color: 'var(--text2)', fontSize: '1.05rem', maxWidth: 500, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          Complete notes · PYQ bank · Historiography bank · Answer Evaluation · AI assistant · Interactive timelines — everything History Optional for free at one place.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/paper1" style={{ background: 'var(--accent)', color: '#000', padding: '0.8rem 2.25rem', borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.02em' }}>Paper I →</Link>
          <Link href="/paper2" style={{ background: 'transparent', color: 'var(--text)', padding: '0.8rem 2.25rem', borderRadius: 6, textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem', border: '1px solid var(--border3)' }}>Paper II →</Link>
          <Link href="/chat"   style={{ background: 'rgba(234,179,8,0.1)', color: 'var(--yellow)', padding: '0.8rem 2.25rem', borderRadius: 6, textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem', border: '1px solid rgba(234,179,8,0.25)' }}>Ask AI →</Link>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: '3rem', position: 'relative', zIndex: 1 }} className="grid-4col">
        {stats.map(s => <AnimatedStat key={s.label} {...s} />)}
      </div>

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
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}>
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
            <div key={f.title} className="g-feature-tile">
              <div style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: f.color, marginBottom: '0.4rem', fontSize: '0.95rem' }}>{f.title}</div>
              <div style={{ color: 'var(--text3)', fontSize: '0.8rem', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <DailyAnswerWriting />
      <CurrentAffairsSection />

      {/* ── PYQ Carousel + Test banner ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', position: 'relative', zIndex: 1 }} className="grid-2col">

        {/* PYQ carousel card */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '3px solid var(--red)', minHeight: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#fff', fontWeight: 600 }}>Previous Year Questions</h3>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text3)', letterSpacing: '0.1em' }}>1979–2025</span>
          </div>

          {/* Sliding question */}
          <div style={{ flex: 1, minHeight: 72 }}>
            <div className={`pyq-slide ${pyqFade ? 'visible' : 'hidden'}`}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', padding: '2px 8px', borderRadius: 3 }}>{pyqSlides[pyqIdx].paper}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text3)' }}>{pyqSlides[pyqIdx].year} · {pyqSlides[pyqIdx].marks}M</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text2)', lineHeight: 1.65, margin: 0, fontFamily: 'var(--font-body)' }}>
                {pyqSlides[pyqIdx].q}
              </p>
            </div>
          </div>

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {pyqSlides.map((_, i) => (
              <button key={i} className={`pyq-dot ${i === pyqIdx ? 'active' : ''}`}
                onClick={() => { setPyqFade(false); setTimeout(() => { setPyqIdx(i); setPyqFade(true); }, 300); }} />
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
              <Link href="/pyqs" style={{ background: 'var(--red)', color: '#fff', padding: '0.55rem 1.25rem', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: '0.82rem' }}>Browse PYQs</Link>
              <Link href="/chat" style={{ background: 'transparent', color: 'var(--accent)', padding: '0.55rem 1.25rem', borderRadius: 6, textDecoration: 'none', fontWeight: 500, fontSize: '0.82rem', border: '1px solid rgba(59,130,246,0.3)' }}>Ask AI →</Link>
            </div>
          </div>
        </div>

        {/* Test banner */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', borderLeft: '3px solid var(--accent)' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#fff', marginBottom: '0.35rem', fontWeight: 600 }}>Attempt a Test</h3>
            <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>Timed sectional and full-length mock tests with instant self/AI-mentored evaluation.</p>
          </div>
          <Link href="/test" style={{ background: 'var(--accent)', color: '#000', padding: '0.65rem 1.5rem', borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem', display: 'inline-block' }}>Start Test →</Link>
        </div>
      </div>

    </div>
  );
}
