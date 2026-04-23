'use client';
import { useState, useEffect, useCallback } from 'react';
import { flashcards, flashcardSections, flashcardTypes } from '@/lib/flashcards';
import type { FlashCard } from '@/lib/flashcards';

type SRData = {
  interval: number;
  easeFactor: number;
  nextDue: string;
  reps: number;
};

const STORAGE_KEY = 'ho_flashcards_v1';
function loadSR(): Record<string, SRData> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
}
function saveSR(data: Record<string, SRData>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}
function sm2(card: SRData | undefined, grade: 1 | 2 | 3 | 4): SRData {
  const ef = card?.easeFactor ?? 2.5;
  const reps = card?.reps ?? 0;
  const newEF = Math.max(1.3, ef + (0.1 - (4 - grade) * (0.08 + (4 - grade) * 0.02)));
  let interval = 1;
  if (grade < 2) { interval = 1; }
  else if (reps === 0) { interval = 1; }
  else if (reps === 1) { interval = 6; }
  else { interval = Math.round((card?.interval ?? 1) * newEF); }
  const nextDue = new Date(Date.now() + interval * 86400000).toISOString();
  return { interval, easeFactor: newEF, nextDue, reps: grade >= 2 ? reps + 1 : 0 };
}

const TYPE_LABELS: Record<string, string> = {
  historian: 'Historian',
  comparison: 'Comparison',
  'cause-effect': 'Cause & Effect',
  quote: 'Quote',
  concept: 'Concept',
};
const TYPE_COLORS: Record<string, { main: string; dim: string; glow: string }> = {
  historian:      { main: '#3b82f6', dim: 'rgba(59,130,246,0.12)',  glow: 'rgba(59,130,246,0.35)' },
  comparison:     { main: '#8b5cf6', dim: 'rgba(139,92,246,0.12)', glow: 'rgba(139,92,246,0.35)' },
  'cause-effect': { main: '#f59e0b', dim: 'rgba(245,158,11,0.12)', glow: 'rgba(245,158,11,0.35)' },
  quote:          { main: '#10b981', dim: 'rgba(16,185,129,0.12)', glow: 'rgba(16,185,129,0.35)' },
  concept:        { main: '#ef4444', dim: 'rgba(239,68,68,0.12)',  glow: 'rgba(239,68,68,0.35)' },
};

// SVG noise texture as data URI
const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

export default function Flashcards() {
  const [sr, setSR] = useState<Record<string, SRData>>({});
  const [mounted, setMounted] = useState(false);
  const [filterSection, setFilterSection] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterDue, setFilterDue] = useState<boolean>(false);
  const [queue, setQueue] = useState<FlashCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => { setSR(loadSR()); setMounted(true); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === ' ' && modalOpen) { e.preventDefault(); setFlipped(f => !f); }
      if (e.key === 'ArrowRight' && modalOpen && flipped) rate(3);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen, flipped]);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  const buildQueue = useCallback((singleCard?: FlashCard) => {
    if (singleCard) {
      setQueue([singleCard]); setIdx(0); setFlipped(false); setModalOpen(true); return;
    }
    const today = new Date().toISOString();
    let cards = flashcards.filter(c => {
      if (filterSection !== 'All' && c.section !== filterSection) return false;
      if (filterType !== 'All' && c.type !== filterType) return false;
      if (filterDue) { const s = sr[c.id]; if (s && s.nextDue > today) return false; }
      return true;
    });
    cards = cards.sort((a, b) => {
      const sa = sr[a.id], sb = sr[b.id];
      const aDue = !sa || sa.nextDue <= today, bDue = !sb || sb.nextDue <= today;
      if (aDue && !bDue) return -1; if (!aDue && bDue) return 1;
      return (sa?.easeFactor ?? 2.5) - (sb?.easeFactor ?? 2.5);
    });
    setQueue(cards); setIdx(0); setFlipped(false); setSessionDone(0); setModalOpen(true);
  }, [filterSection, filterType, filterDue, sr]);

  const closeModal = () => { setModalOpen(false); setFlipped(false); };

  const rate = useCallback((grade: 1 | 2 | 3 | 4) => {
    if (!queue[idx] || animating) return;
    const card = queue[idx];
    const updated = { ...sr, [card.id]: sm2(sr[card.id], grade) };
    setSR(updated); saveSR(updated);
    setAnimating(true);
    setTimeout(() => {
      setSessionDone(s => s + 1);
      if (idx + 1 >= queue.length) { closeModal(); }
      else { setIdx(i => i + 1); setFlipped(false); }
      setAnimating(false);
    }, 200);
  }, [queue, idx, sr, animating]);

  const currentCard = queue[idx];
  const today = new Date().toISOString();
  const dueCount = flashcards.filter(c => { const s = sr[c.id]; return !s || s.nextDue <= today; }).length;
  const studiedCount = Object.keys(sr).length;
  const filtered = flashcards.filter(c => {
    if (filterSection !== 'All' && c.section !== filterSection) return false;
    if (filterType !== 'All' && c.type !== filterType) return false;
    return true;
  });
  const filteredDue = filtered.filter(c => { const s = sr[c.id]; return !s || s.nextDue <= today; });
  const tc = currentCard ? TYPE_COLORS[currentCard.type] : TYPE_COLORS.concept;

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-ring { 0%,100% { opacity:0.4; transform:scale(1); } 50% { opacity:0.15; transform:scale(1.08); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes float { 0%,100% { transform:translateY(0px) rotate(0deg); } 50% { transform:translateY(-12px) rotate(1deg); } }
        .fc-card-wrap { animation: fadeUp 0.45s cubic-bezier(0.23,1,0.32,1) both; }
        .fc-rate-btn:hover { transform: translateY(-2px) scale(1.04) !important; }
        .fc-rate-btn:active { transform: translateY(0px) scale(0.98) !important; }
        .fc-browse-row:hover .fc-browse-arrow { opacity:1 !important; transform:translateX(3px) !important; }
        .flip-inner {
          position:relative; min-height:340px;
          transform-style:preserve-3d;
          transition:transform 0.6s cubic-bezier(0.23,1,0.32,1);
        }
        .flip-inner.flipped { transform:rotateY(180deg); }
        .flip-face {
          position:absolute; inset:0;
          backface-visibility:hidden; -webkit-backface-visibility:hidden;
          border-radius:20px;
          display:flex; flex-direction:column;
        }
        .flip-back { transform:rotateY(180deg); }
      `}</style>

      {/* ── MODAL OVERLAY ── */}
      {modalOpen && currentCard && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          {/* Ambient glow behind card */}
          <div style={{
            position: 'absolute', width: 480, height: 480,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${tc.glow} 0%, transparent 70%)`,
            animation: 'pulse-ring 4s ease-in-out infinite',
            pointerEvents: 'none',
            filter: 'blur(40px)',
          }} />

          <div className="fc-card-wrap" style={{ width: '100%', maxWidth: 620, display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>

            {/* Top bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, marginRight: '1rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  {idx + 1} / {queue.length}
                </span>
                <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(idx / queue.length) * 100}%`,
                    background: `linear-gradient(90deg, ${tc.main}, ${tc.main}cc)`,
                    borderRadius: 4, transition: 'width 0.4s ease',
                    boxShadow: `0 0 8px ${tc.glow}`,
                  }} />
                </div>
              </div>
              <button onClick={closeModal} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.4)', borderRadius: 6, padding: '0.28rem 0.6rem',
                cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
                flexShrink: 0, transition: 'all 0.15s',
              }}>ESC</button>
            </div>

            {/* Flip card */}
            <div style={{ perspective: '1400px', cursor: 'pointer' }} onClick={() => setFlipped(f => !f)}>
              <div className={`flip-inner${flipped ? ' flipped' : ''}`}>

                {/* FRONT FACE */}
                <div className="flip-face" style={{
                  background: `linear-gradient(145deg, #0d1117 0%, #0a0f1a 50%, #06080f 100%)`,
                  border: `1px solid ${tc.main}44`,
                  boxShadow: `0 0 0 1px ${tc.main}22, 0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`,
                  padding: '2rem',
                }}>
                  {/* Top accent bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
                    background: `linear-gradient(90deg, transparent, ${tc.main}, transparent)`,
                    borderRadius: 1,
                  }} />
                  {/* Corner graphic — top right */}
                  <svg style={{ position: 'absolute', top: 12, right: 12, opacity: 0.12 }} width="60" height="60" viewBox="0 0 60 60" fill="none">
                    <circle cx="50" cy="10" r="30" stroke={tc.main} strokeWidth="1"/>
                    <circle cx="50" cy="10" r="20" stroke={tc.main} strokeWidth="0.75"/>
                    <circle cx="50" cy="10" r="10" stroke={tc.main} strokeWidth="0.5"/>
                  </svg>
                  {/* Corner graphic — bottom left */}
                  <svg style={{ position: 'absolute', bottom: 16, left: 12, opacity: 0.07 }} width="80" height="40" viewBox="0 0 80 40" fill="none">
                    <line x1="0" y1="40" x2="80" y2="0" stroke={tc.main} strokeWidth="0.75"/>
                    <line x1="0" y1="30" x2="60" y2="0" stroke={tc.main} strokeWidth="0.5"/>
                    <line x1="0" y1="20" x2="40" y2="0" stroke={tc.main} strokeWidth="0.5"/>
                  </svg>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
                    <span style={{
                      fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase', letterSpacing: '0.14em',
                      color: tc.main,
                      background: tc.dim,
                      border: `1px solid ${tc.main}44`,
                      padding: '3px 9px', borderRadius: 4,
                      boxShadow: `0 0 12px ${tc.glow}`,
                    }}>{TYPE_LABELS[currentCard.type]}</span>
                    <span style={{
                      fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)',
                      fontFamily: 'var(--font-ui)', letterSpacing: '0.04em',
                    }}>{currentCard.section}</span>
                  </div>

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingRight: '1rem' }}>
                    <div style={{
                      fontFamily: 'var(--font-display)', fontSize: '1.15rem',
                      color: 'rgba(255,255,255,0.92)', lineHeight: 1.7,
                      letterSpacing: '-0.01em',
                    }}>
                      {currentCard.front}
                    </div>
                  </div>

                  <div style={{
                    marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    color: 'rgba(255,255,255,0.18)', fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                    Click to reveal
                  </div>
                </div>

                {/* BACK FACE */}
                <div className="flip-face flip-back" style={{
                  background: `linear-gradient(145deg, #060d1a 0%, #08101f 50%, #040810 100%)`,
                  border: `1px solid ${tc.main}55`,
                  boxShadow: `0 0 0 1px ${tc.main}28, 0 8px 60px rgba(0,0,0,0.7), inset 0 1px 0 ${tc.main}18`,
                  padding: '2rem', overflowY: 'auto',
                }}>
                  {/* Top accent bar — stronger on back */}
                  <div style={{
                    position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
                    background: `linear-gradient(90deg, transparent, ${tc.main}cc, transparent)`,
                  }} />
                  {/* Subtle grid pattern */}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 20, opacity: 0.03, pointerEvents: 'none',
                    backgroundImage: `linear-gradient(${tc.main} 1px, transparent 1px), linear-gradient(90deg, ${tc.main} 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                  }} />

                  <div style={{
                    fontSize: '0.58rem', fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase', letterSpacing: '0.14em',
                    color: tc.main, marginBottom: '1rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}>
                    <div style={{ width: 16, height: 1, background: tc.main, opacity: 0.5 }} />
                    Answer
                    <div style={{ width: 16, height: 1, background: tc.main, opacity: 0.5 }} />
                  </div>

                  <div style={{
                    color: 'rgba(255,255,255,0.88)', fontSize: '0.92rem',
                    lineHeight: 1.85, whiteSpace: 'pre-line',
                    fontFamily: 'var(--font-ui)',
                    position: 'relative', zIndex: 1,
                  }}>
                    {currentCard.back}
                  </div>
                </div>

              </div>
            </div>

            {/* Rating buttons */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.55rem',
              opacity: flipped ? 1 : 0,
              transform: flipped ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.3s ease 0.1s, transform 0.3s ease 0.1s',
              pointerEvents: flipped ? 'auto' : 'none',
            }}>
              {([
                { grade: 1, label: 'Blank',  sub: 'No recall',   color: '#ef4444', dim: 'rgba(239,68,68,0.1)',   glow: 'rgba(239,68,68,0.3)' },
                { grade: 2, label: 'Hard',   sub: 'With effort', color: '#f59e0b', dim: 'rgba(245,158,11,0.1)', glow: 'rgba(245,158,11,0.3)' },
                { grade: 3, label: 'Good',   sub: 'Recalled',    color: '#3b82f6', dim: 'rgba(59,130,246,0.1)', glow: 'rgba(59,130,246,0.3)' },
                { grade: 4, label: 'Easy',   sub: 'Perfect',     color: '#10b981', dim: 'rgba(16,185,129,0.1)', glow: 'rgba(16,185,129,0.3)' },
              ] as const).map(r => (
                <button key={r.grade} className="fc-rate-btn"
                  onClick={(e) => { e.stopPropagation(); rate(r.grade as 1|2|3|4); }}
                  style={{
                    background: r.dim,
                    border: `1px solid ${r.color}44`,
                    color: r.color, borderRadius: 10, padding: '0.65rem 0.4rem',
                    cursor: 'pointer', transition: 'all 0.18s', textAlign: 'center',
                    boxShadow: `inset 0 1px 0 ${r.color}18`,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.2rem', fontFamily: 'var(--font-ui)' }}>{r.label}</div>
                  <div style={{ fontSize: '0.6rem', opacity: 0.65, fontFamily: 'var(--font-mono)' }}>{r.sub}</div>
                </button>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ── MAIN PAGE ── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.25rem' }}>
          <div style={{ color: 'var(--text3)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
            History Optional
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>
            Analytical Flashcards
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem', maxWidth: 520, lineHeight: 1.65 }}>
            Historian debates, cause-effect chains, comparisons, quote attributions — built for Mains-level analysis.
          </p>
        </div>

        {/* Stats */}
        {mounted && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem', marginBottom: '1.75rem' }}>
            {[
              { label: 'Total', value: flashcards.length, color: '#3b82f6' },
              { label: 'Studied', value: studiedCount, color: '#8b5cf6' },
              { label: 'Due Today', value: dueCount, color: dueCount > 0 ? '#f59e0b' : '#777' },
              { label: 'Last Session', value: sessionDone, color: '#10b981' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'linear-gradient(135deg, #0d1117 0%, #0a0a0a 100%)',
                border: `1px solid ${s.color}28`,
                borderRadius: 10, padding: '0.9rem 1rem',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                  background: `linear-gradient(90deg, transparent, ${s.color}88, transparent)`,
                }} />
                <div style={{ fontSize: '0.6rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>{s.label}</div>
                <div style={{ fontSize: '1.65rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.color, lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters + Start */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.75rem', alignItems: 'center' }}>
          <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
            style={{ background: '#0a0a0a', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '0.38rem 0.7rem', fontSize: '0.78rem', cursor: 'pointer' }}>
            <option value="All">All Sections</option>
            {flashcardSections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ background: '#0a0a0a', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '0.38rem 0.7rem', fontSize: '0.78rem', cursor: 'pointer' }}>
            <option value="All">All Types</option>
            {flashcardTypes.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={filterDue} onChange={e => setFilterDue(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            Due only
          </label>
          <div style={{ flex: 1 }} />
          <button onClick={() => buildQueue()}
            style={{
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              color: '#fff', border: 'none',
              borderRadius: 8, padding: '0.48rem 1.25rem', fontSize: '0.82rem',
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
              boxShadow: '0 2px 16px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
              fontFamily: 'var(--font-ui)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(59,130,246,0.55), inset 0 1px 0 rgba(255,255,255,0.15)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
            Start {filteredDue.length > 0 ? `(${filteredDue.length} due)` : `(${filtered.length})`}
          </button>
        </div>

        {/* Session complete */}
        {sessionDone > 0 && (
          <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '0.9rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.83rem', color: 'var(--text2)' }}>
              Session complete — <strong style={{ color: 'var(--accent)' }}>{sessionDone} cards</strong> reviewed.
            </span>
            <button onClick={() => setSessionDone(0)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '0.73rem' }}>Dismiss</button>
          </div>
        )}

        {/* Browse list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginBottom: '0.15rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
            {filtered.length} cards
          </div>
          {filtered.map(card => {
            const s = sr[card.id];
            const isDue = !s || s.nextDue <= today;
            const tc2 = TYPE_COLORS[card.type];
            return (
              <div key={card.id} className="fc-browse-row"
                onClick={() => buildQueue(card)}
                style={{
                  background: 'linear-gradient(135deg, #0a0a0a 0%, #070d15 100%)',
                  border: `1px solid ${isDue && mounted ? tc2.main + '33' : 'var(--border)'}`,
                  borderRadius: 10, padding: '0.85rem 1.1rem',
                  display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
                  cursor: 'pointer', transition: 'all 0.15s',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = tc2.main + '55';
                  el.style.background = `linear-gradient(135deg, #0d1017 0%, ${tc2.dim} 100%)`;
                  el.style.boxShadow = `0 2px 16px ${tc2.glow}22`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = isDue && mounted ? tc2.main + '33' : 'var(--border)';
                  el.style.background = 'linear-gradient(135deg, #0a0a0a 0%, #070d15 100%)';
                  el.style.boxShadow = 'none';
                }}
              >
                {isDue && mounted && (
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: `linear-gradient(180deg, transparent, ${tc2.main}, transparent)`, borderRadius: '10px 0 0 10px' }} />
                )}
                <span style={{
                  fontSize: '0.58rem', fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: tc2.main, background: tc2.dim,
                  border: `1px solid ${tc2.main}33`,
                  padding: '2px 7px', borderRadius: 4,
                  display: 'block', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2,
                }}>{TYPE_LABELS[card.type]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text)', lineHeight: 1.45 }}>{card.front}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: '0.25rem' }}>{card.section}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  {mounted && (
                    <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: isDue ? tc2.main : 'var(--text3)' }}>
                      {isDue ? (s ? 'Due' : 'New') : `${s.interval}d`}
                    </span>
                  )}
                  <span className="fc-browse-arrow" style={{ color: 'var(--text3)', fontSize: '0.75rem', opacity: 0, transition: 'all 0.15s' }}>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
