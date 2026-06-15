'use client';
import { useLang } from '@/lib/i18n/LangContext';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const pyqSlides = [
  { q: 'Analyze the contours of imperial ideology as exhibited during the Mauryan period.', year: 2023, marks: 15, paper: 'P1' },
  { q: '"The Khalji revolution was as much a socio-political as a military phenomenon." Comment.', year: 2022, marks: 15, paper: 'P1' },
  { q: 'What were the weaknesses of the Weimar Republic? How did Hitler succeed in establishing his dictatorship?', year: 2019, marks: 20, paper: 'P2' },
  { q: 'Trace the causes of the rise of nationalist movement in India and assess the contribution of the early nationalists.', year: 2021, marks: 20, paper: 'P2' },
  { q: 'Why did the Industrial Revolution occur first in Britain? Examine the factors.', year: 2018, marks: 15, paper: 'P2' },
  { q: 'Assess the nature and significance of the Bhakti Movement in medieval India.', year: 2020, marks: 15, paper: 'P1' },
];

const stats = [
  { value: 51,   label: 'Topics',     color: 'var(--accent)',  suffix: '', href: '/paper1'     },
  { value: 2,    label: 'Papers',     color: 'var(--yellow)',  suffix: '', href: '/paper2'     },
  { value: 1533, label: 'PYQs',       color: 'var(--red)',     suffix: '', href: '/pyqs'       },
  { value: 55,   label: 'Flashcards', color: 'var(--green)',   suffix: '', href: '/flashcards' },
];

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

function AnimatedStat({ value, label, color, suffix, href }: { value: number; label: string; color: string; suffix: string; href: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const count = useCounter(value, 1400, started);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div ref={ref} className="g-stat-block" style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }} onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, color }}>
          {count}{suffix}
        </div>
        <div style={{ color: 'var(--text3)', fontSize: '0.72rem', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
      </div>
    </Link>
  );
}

export function AnimatedStats() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: '3rem', position: 'relative', zIndex: 1 }} className="grid-4col">
      {stats.map(s => <AnimatedStat key={s.label} {...s} />)}
    </div>
  );
}

export function PYQCarousel() {
  const { langHi } = useLang();
  const [pyqIdx, setPyqIdx] = useState(0);
  const [pyqFade, setPyqFade] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => {
      setPyqFade(false);
      setTimeout(() => { setPyqIdx(i => (i + 1) % pyqSlides.length); setPyqFade(true); }, 300);
    }, 3500);
    return () => clearInterval(timer);
  }, []);
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '3px solid var(--red)', minHeight: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#fff', fontWeight: 600 }}>{langHi ? "पिछले वर्षों के प्रश्न" : "Previous Year Questions"}</h3>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text3)', letterSpacing: '0.1em' }}>1979–2025</span>
      </div>
      <div style={{ flex: 1, minHeight: 72 }}>
        <div className={`pyq-slide ${pyqFade ? 'pyq-in' : 'pyq-out'}`}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', padding: '2px 8px', borderRadius: 3 }}>{pyqSlides[pyqIdx].paper}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text3)' }}>{pyqSlides[pyqIdx].year} · {pyqSlides[pyqIdx].marks}M</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text2)', lineHeight: 1.65, margin: 0, fontFamily: 'var(--font-body)' }}>{pyqSlides[pyqIdx].q}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {pyqSlides.map((_, i) => (
          <button key={i} className={`pyq-dot ${i === pyqIdx ? 'active' : ''}`}
            onClick={() => { setPyqFade(false); setTimeout(() => { setPyqIdx(i); setPyqFade(true); }, 300); }} />
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
          <Link href="/pyqs" style={{ background: 'var(--red)', color: '#fff', padding: '0.55rem 1.25rem', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: '0.82rem', position: 'relative', overflow: 'hidden' }} className="shimmer-btn">{langHi ? "PYQ देखें" : "Browse PYQs"}</Link>
          <Link href="/chat" style={{ background: 'transparent', color: 'var(--accent)', padding: '0.55rem 1.25rem', borderRadius: 6, textDecoration: 'none', fontWeight: 500, fontSize: '0.82rem', border: '1px solid rgba(59,130,246,0.3)', position: 'relative', overflow: 'hidden' }} className="shimmer-btn">{langHi ? "AI से पूछें →" : "Ask AI →"}</Link>
        </div>
      </div>
    </div>
  );
}
