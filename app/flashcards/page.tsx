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
  quote: 'Quote / Attribution',
  concept: 'Concept',
};

const TYPE_COLORS: Record<string, string> = {
  historian: '#3b82f6',
  comparison: '#8b5cf6',
  'cause-effect': '#f59e0b',
  quote: '#10b981',
  concept: '#ef4444',
};

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

  useEffect(() => {
    const data = loadSR();
    setSR(data);
    setMounted(true);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === ' ' && modalOpen) { e.preventDefault(); setFlipped(f => !f); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen]);

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  const buildQueue = useCallback(() => {
    const today = new Date().toISOString();
    let cards = flashcards.filter(c => {
      if (filterSection !== 'All' && c.section !== filterSection) return false;
      if (filterType !== 'All' && c.type !== filterType) return false;
      if (filterDue) {
        const s = sr[c.id];
        if (s && s.nextDue > today) return false;
      }
      return true;
    });
    cards = cards.sort((a, b) => {
      const sa = sr[a.id], sb = sr[b.id];
      const aDue = !sa || sa.nextDue <= today;
      const bDue = !sb || sb.nextDue <= today;
      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;
      return (sa?.easeFactor ?? 2.5) - (sb?.easeFactor ?? 2.5);
    });
    setQueue(cards);
    setIdx(0);
    setFlipped(false);
    setSessionDone(0);
    setModalOpen(true);
  }, [filterSection, filterType, filterDue, sr]);

  const closeModal = () => {
    setModalOpen(false);
    setFlipped(false);
  };

  const rate = useCallback((grade: 1 | 2 | 3 | 4) => {
    if (!queue[idx]) return;
    const card = queue[idx];
    const updated = { ...sr, [card.id]: sm2(sr[card.id], grade) };
    setSR(updated);
    saveSR(updated);
    setSessionDone(s => s + 1);
    if (idx + 1 >= queue.length) {
      closeModal();
    } else {
      setIdx(i => i + 1);
      setFlipped(false);
    }
  }, [queue, idx, sr]);

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

  return (
    <>
      {/* ── FLIP CARD MODAL OVERLAY ── */}
      {modalOpen && currentCard && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Progress + close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, marginRight: '1rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  {idx + 1} / {queue.length}
                </span>
                <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(idx / queue.length) * 100}%`, background: 'var(--accent)', borderRadius: 4, transition: 'width 0.35s ease' }} />
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', borderRadius: 6, padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0 }}
              >
                Esc
              </button>
            </div>

            {/* The flip card */}
            <div
              style={{ perspective: '1200px', cursor: 'pointer' }}
              onClick={() => setFlipped(f => !f)}
            >
              <div style={{
                position: 'relative', minHeight: 320,
                transformStyle: 'preserve-3d',
                transition: 'transform 0.55s cubic-bezier(0.23, 1, 0.32, 1)',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}>

                {/* FRONT */}
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 16, padding: '2rem',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <span style={{
                      fontSize: '0.62rem', fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase', letterSpacing: '0.12em',
                      color: TYPE_COLORS[currentCard.type],
                      background: TYPE_COLORS[currentCard.type] + '18',
                      border: `1px solid ${TYPE_COLORS[currentCard.type]}33`,
                      padding: '2px 8px', borderRadius: 4,
                    }}>{TYPE_LABELS[currentCard.type]}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>{currentCard.section}</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text)', lineHeight: 1.65 }}>
                      {currentCard.front}
                    </div>
                  </div>
                  <div style={{ marginTop: '1.5rem', color: 'var(--text3)', fontSize: '0.72rem', textAlign: 'center', letterSpacing: '0.04em' }}>
                    Click to flip · Space to flip
                  </div>
                </div>

                {/* BACK */}
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 16, padding: '2rem',
                  display: 'flex', flexDirection: 'column', overflowY: 'auto',
                }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Answer</div>
                  <div style={{ flex: 1, color: 'var(--text)', fontSize: '0.92rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                    {currentCard.back}
                  </div>
                </div>

              </div>
            </div>

            {/* Rating buttons — only after flip */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem',
              opacity: flipped ? 1 : 0,
              transform: flipped ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.25s ease, transform 0.25s ease',
              pointerEvents: flipped ? 'auto' : 'none',
            }}>
              {([
                { grade: 1, label: 'Blank', sub: 'No recall', color: '#ef4444' },
                { grade: 2, label: 'Hard', sub: 'With effort', color: '#f59e0b' },
                { grade: 3, label: 'Good', sub: 'Recalled', color: '#3b82f6' },
                { grade: 4, label: 'Easy', sub: 'Perfect', color: '#10b981' },
              ] as const).map(r => (
                <button key={r.grade} onClick={() => rate(r.grade as 1 | 2 | 3 | 4)}
                  style={{
                    background: r.color + '14', border: `1px solid ${r.color}44`,
                    color: r.color, borderRadius: 10, padding: '0.7rem 0.5rem',
                    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = r.color + '28'; el.style.borderColor = r.color + '88'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = r.color + '14'; el.style.borderColor = r.color + '44'; }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.2rem' }}>{r.label}</div>
                  <div style={{ fontSize: '0.62rem', opacity: 0.75 }}>{r.sub}</div>
                </button>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ── MAIN PAGE ── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
            History Optional
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>
            Analytical Flashcards
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem', maxWidth: 560 }}>
            Historian arguments, comparisons, cause-effect chains, and quote attributions — built for Mains-level analysis, not rote recall.
          </p>
        </div>

        {/* Stats */}
        {mounted && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.75rem' }}>
            {[
              { label: 'Total Cards', value: flashcards.length },
              { label: 'Studied', value: studiedCount },
              { label: 'Due Today', value: dueCount, highlight: dueCount > 0 },
              { label: 'Last Session', value: sessionDone },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>{s.label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.highlight ? 'var(--accent)' : 'var(--text)', lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters + Start */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
          <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '0.4rem 0.7rem', fontSize: '0.8rem', cursor: 'pointer' }}>
            <option value="All">All Sections</option>
            {flashcardSections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '0.4rem 0.7rem', fontSize: '0.8rem', cursor: 'pointer' }}>
            <option value="All">All Types</option>
            {flashcardTypes.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={filterDue} onChange={e => setFilterDue(e.target.checked)}
              style={{ accentColor: 'var(--accent)' }} />
            Due only
          </label>

          <div style={{ flex: 1 }} />

          <button onClick={buildQueue}
            style={{
              background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 7, padding: '0.45rem 1.1rem', fontSize: '0.82rem',
              fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
            Start {filteredDue.length > 0 ? `(${filteredDue.length} due)` : `(${filtered.length})`}
          </button>
        </div>

        {/* Session complete banner */}
        {sessionDone > 0 && (
          <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
              Session complete — <strong style={{ color: 'var(--accent)' }}>{sessionDone} cards</strong> reviewed.
            </span>
            <button onClick={() => setSessionDone(0)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '0.75rem' }}>Dismiss</button>
          </div>
        )}

        {/* Browse list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: '0.25rem' }}>
            {filtered.length} cards
          </div>
          {filtered.map(card => {
            const s = sr[card.id];
            const isDue = !s || s.nextDue <= today;
            return (
              <div key={card.id}
                onClick={() => {
                  const i = flashcards.findIndex(c => c.id === card.id);
                  setQueue([card]);
                  setIdx(0);
                  setFlipped(false);
                  setModalOpen(true);
                }}
                style={{
                  background: 'var(--bg2)', border: `1px solid ${isDue && mounted ? 'rgba(59,130,246,0.2)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '0.9rem 1.1rem',
                  display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
                  cursor: 'pointer', transition: 'border-color 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isDue && mounted ? 'rgba(59,130,246,0.2)' : 'var(--border)'; }}
              >
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <span style={{
                    fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: TYPE_COLORS[card.type],
                    background: TYPE_COLORS[card.type] + '18',
                    border: `1px solid ${TYPE_COLORS[card.type]}33`,
                    padding: '1px 6px', borderRadius: 3, display: 'block', whiteSpace: 'nowrap',
                  }}>{TYPE_LABELS[card.type]}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.4 }}>{card.front}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: '0.3rem' }}>{card.section}</div>
                </div>
                {mounted && (
                  <div style={{ flexShrink: 0, fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: isDue ? 'var(--accent)' : 'var(--text3)', whiteSpace: 'nowrap' }}>
                    {isDue ? (s ? 'Due' : 'New') : `${s.interval}d`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
