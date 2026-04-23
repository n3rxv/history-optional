'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { pyqs, pyqYears, pyqSections } from '@/lib/pyqData';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';

// ── Types ──────────────────────────────────────────────────────────────────────
interface PYQ {
  id: string;
  question: string;
  year: number;
  marks: number;
  section: string;
  topic: string;
  source?: string;
}

// ── Tabs ───────────────────────────────────────────────────────────────────────
const TABS = [
  { label: 'All',      value: 'all' },
  { label: 'Ancient',  value: 'Paper I - Ancient India' },
  { label: 'Medieval', value: 'Paper I - Medieval India' },
  { label: 'Modern',   value: 'Paper II - Modern India' },
  { label: 'World',    value: 'Paper II - World History' },
];

// ── Simple markdown renderer for model answer ─────────────────────────────────
function RenderAnswer({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', lineHeight: 1.85, color: '#d4d4d4' }}>
      {lines.map((line, i) => {
        // **HEADING**
        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
          return (
            <div key={i} style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.25em',
              textTransform: 'uppercase', color: 'rgba(74,222,128,0.7)',
              marginTop: i === 0 ? 0 : '1.4rem', marginBottom: '0.5rem',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {line.replace(/\*\*/g, '')}
              <span style={{ flex: 1, height: 1, background: 'rgba(74,222,128,0.1)', display: 'inline-block' }} />
            </div>
          );
        }
        // *Italic subheading*
        if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
          return (
            <div key={i} style={{ fontStyle: 'italic', color: '#888', fontWeight: 600, marginTop: '0.9rem', marginBottom: '0.25rem', fontSize: '0.88rem' }}>
              {line.replace(/\*/g, '')}
            </div>
          );
        }
        // ---
        if (line.trim() === '---') {
          return <hr key={i} style={{ border: 'none', borderTop: '1px solid #2a2a2a', margin: '1rem 0' }} />;
        }
        // blank
        if (line.trim() === '') return <div key={i} style={{ height: '0.4rem' }} />;

        // inline **bold**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <div key={i}>
            {parts.map((p, j) =>
              p.startsWith('**') && p.endsWith('**')
                ? <strong key={j} style={{ color: '#e2e8f0' }}>{p.replace(/\*\*/g, '')}</strong>
                : <span key={j}>{p}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Model Answer Modal ─────────────────────────────────────────────────────────
function ModelAnswerModal({
  pyq,
  token,
  onClose,
}: {
  pyq: PYQ;
  token: string;
  onClose: () => void;
}) {
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cacheKey = `ma_${pyq.id}`;

  useEffect(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setAnswer(cached); return; }
    } catch {}
    generate();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function generate() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/model-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: pyq.question, marks: pyq.marks, token }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || 'Failed to generate'); setLoading(false); return; }
      setAnswer(data.answer);
      try { localStorage.setItem(cacheKey, data.answer); } catch {}
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <style>{`
        @keyframes ma-pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes ma-in { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, #161616 0%, #111 100%)',
          border: '1px solid rgba(74,222,128,0.15)',
          borderRadius: 14,
          width: '100%', maxWidth: 760,
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 0 60px rgba(74,222,128,0.07), 0 30px 80px rgba(0,0,0,0.7)',
          position: 'relative', overflow: 'hidden',
          animation: 'ma-in 0.25s ease',
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(74,222,128,0.5), transparent)',
        }} />

        {/* Header */}
        <div style={{
          padding: '1.1rem 1.4rem 0.9rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'flex-start', gap: '1rem', flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'rgba(74,222,128,0.8)',
                background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
                padding: '2px 8px', borderRadius: 3,
              }}>Model Answer</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', color: '#555',
                background: '#1a1a1a', border: '1px solid #2a2a2a',
                padding: '2px 8px', borderRadius: 3,
              }}>{pyq.marks}M</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', color: '#555',
                background: '#1a1a1a', border: '1px solid #2a2a2a',
                padding: '2px 8px', borderRadius: 3,
              }}>{pyq.year}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.87rem', color: '#888', lineHeight: 1.65, fontStyle: 'italic' }}>
              {pyq.question}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0, background: 'none', border: '1px solid #2a2a2a',
              color: '#555', cursor: 'pointer', borderRadius: 6,
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#555'; (e.currentTarget as HTMLButtonElement).style.color = '#aaa'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a'; (e.currentTarget as HTMLButtonElement).style.color = '#555'; }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.4rem' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '4rem 0' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: 'rgba(74,222,128,0.6)',
                    animation: `ma-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#444' }}>
                Generating model answer...
              </div>
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '2.5rem' }}>
              <div style={{ color: '#f87171', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginBottom: '1rem' }}>{error}</div>
              <button
                onClick={generate}
                style={{
                  background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.25)',
                  color: 'rgba(74,222,128,0.8)', borderRadius: 4, padding: '0.5rem 1.2rem',
                  cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                }}
              >Try Again</button>
            </div>
          )}

          {answer && !loading && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#444' }}>
                  AI-Generated · {pyq.marks}M Format · UPSC CSM
                </div>
                <button
                  onClick={() => { try { localStorage.removeItem(cacheKey); } catch {} generate(); }}
                  style={{
                    background: 'none', border: 'none', color: '#444', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em',
                    textTransform: 'uppercase', textDecoration: 'underline', padding: 0,
                  }}
                >Regenerate</button>
              </div>
              <RenderAnswer text={answer} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PYQsPage() {
  const [activeTab, setActiveTab]     = useState<string>('all');
  const [filterYear, setFilterYear]   = useState<number | 'all'>('all');
  const [filterMarks, setFilterMarks] = useState<number | 'all'>('all');
  const [search, setSearch]           = useState('');
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [modelAnswerPYQ, setModelAnswerPYQ] = useState<PYQ | null>(null);

  // Subscription gate — same as evaluate page
  const { GateModals, usage, slots } = useSubscriptionGate(() => {});

  const filtered = pyqs.filter((q: PYQ) => {
    if (activeTab !== 'all' && q.section !== activeTab) return false;
    if (filterYear !== 'all' && q.year !== filterYear) return false;
    if (filterMarks !== 'all' && q.marks !== filterMarks) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!q.question.toLowerCase().includes(s) && !q.topic.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const isP1 = (section: string) => section.startsWith('Paper I');
  const markOptions = [10, 15, 20, 25, 30, 60];

  const clearAll = () => { setActiveTab('all'); setFilterYear('all'); setFilterMarks('all'); setSearch(''); };
  const hasFilters = activeTab !== 'all' || filterYear !== 'all' || filterMarks !== 'all' || search;

  const selectStyle: React.CSSProperties = {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '0.5rem 0.75rem',
    color: 'var(--text)', fontSize: '0.875rem', cursor: 'pointer',
  };

  function handleModelAnswer(e: React.MouseEvent, q: PYQ) {
    e.stopPropagation();
    if (!usage.isPremium) {
      // Open the existing gate modal by triggering a dummy evaluate click
      // The GateModals component handles this via slots
      const gateEl = document.getElementById('pyq-gate-trigger');
      gateEl?.click();
      return;
    }
    setModelAnswerPYQ(q);
  }

  return (
    <>
      <style>{`
        .pyq-row { transition: background 0.15s; }
        .pyq-row:hover { background: var(--bg3) !important; }
        .pyq-expand { transition: background 0.15s; }
        .ma-btn { transition: all 0.15s; }
        .ma-btn:hover { background: rgba(74,222,128,0.12) !important; border-color: rgba(74,222,128,0.5) !important; }
      `}</style>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            History Optional
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
                Previous Year Questions
              </h1>
              <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
                UPSC Mains 1979–2025 · {pyqs.length} questions
              </p>
            </div>
            <Link href="/test" style={{
              background: 'var(--accent)', color: '#fff',
              padding: '0.55rem 1.25rem', borderRadius: 6,
              fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              flexShrink: 0, marginTop: '0.25rem',
            }}>
              Start Test →
            </Link>
          </div>
        </div>

        {/* Quick-filter tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {TABS.map(tab => {
            const count = tab.value === 'all'
              ? pyqs.length
              : pyqs.filter((q: PYQ) => q.section === tab.value).length;
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                style={{
                  padding: '0.45rem 1rem', borderRadius: 6,
                  border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: active ? 'rgba(180,140,60,0.12)' : 'var(--bg2)',
                  color: active ? 'var(--accent)' : 'var(--text2)',
                  fontFamily: 'var(--font-ui)', fontSize: '0.85rem',
                  fontWeight: active ? 600 : 400, cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                {tab.label}
                <span style={{
                  fontSize: '0.68rem',
                  background: active ? 'rgba(180,140,60,0.2)' : 'var(--bg3)',
                  color: active ? 'var(--accent)' : 'var(--text3)',
                  padding: '1px 6px', borderRadius: 10,
                  fontFamily: 'var(--font-mono)',
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.25rem',
          display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center',
        }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions or topics..."
            style={{
              flex: 1, minWidth: 200,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '0.5rem 0.85rem',
              color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '0.875rem',
              outline: 'none',
            }}
          />
          <select value={filterYear} onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : +e.target.value)} style={selectStyle}>
            <option value="all">All Years</option>
            {pyqYears.map((y: number) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterMarks} onChange={e => setFilterMarks(e.target.value === 'all' ? 'all' : +e.target.value)} style={selectStyle}>
            <option value="all">All Marks</option>
            {markOptions.map(m => <option key={m} value={m}>{m} marks</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearAll} style={{
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text3)', cursor: 'pointer',
              padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.8rem',
            }}>Clear ✕</button>
          )}
        </div>

        {/* Count */}
        <div style={{ color: 'var(--text3)', fontSize: '0.8rem', marginBottom: '1rem' }}>
          Showing {filtered.length} of {pyqs.length} questions
        </div>

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filtered.map((q: PYQ) => {
            const isExpanded = expandedId === q.id;
            return (
              <div key={q.id} style={{
                background: 'var(--bg2)', border: isExpanded ? '1px solid rgba(74,222,128,0.15)' : '1px solid var(--border)',
                borderRadius: 8, overflow: 'hidden',
                borderLeft: `3px solid ${isP1(q.section) ? 'var(--accent)' : 'var(--blue, #4c8bc9)'}`,
                transition: 'border-color 0.15s',
              }}>
                {/* Row */}
                <div
                  className="pyq-row"
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  style={{ padding: '1.25rem 1.5rem', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{
                        background: isP1(q.section) ? 'rgba(180,140,60,0.12)' : 'rgba(76,139,201,0.12)',
                        color: isP1(q.section) ? 'var(--accent)' : 'var(--blue, #4c8bc9)',
                        border: `1px solid ${isP1(q.section) ? 'rgba(180,140,60,0.3)' : 'rgba(76,139,201,0.3)'}`,
                        fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                        padding: '2px 8px', borderRadius: 3, letterSpacing: '0.04em',
                      }}>
                        {q.section.replace('Paper I - ', 'P1 · ').replace('Paper II - ', 'P2 · ')}
                      </span>
                      <span style={{
                        background: 'var(--bg3)', color: 'var(--text3)',
                        fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                        padding: '2px 8px', borderRadius: 3, border: '1px solid var(--border)',
                      }}>{q.marks}M</span>
                      {q.source && q.source !== 'UPSC' && (
                        <span style={{
                          background: 'rgba(100,180,100,0.1)', color: '#6ab46a',
                          fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                          padding: '2px 8px', borderRadius: 3, border: '1px solid rgba(100,180,100,0.25)',
                        }}>{q.source}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: 'var(--text3)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{q.year}</span>
                      <span style={{ color: 'var(--text3)', fontSize: '0.65rem', transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '0.75rem' }}>
                    {q.question}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text3)', fontSize: '0.73rem' }}>{q.topic}</span>
                    <Link href={`/chat?q=${encodeURIComponent(q.question)}`} onClick={e => e.stopPropagation()} style={{
                      marginLeft: 'auto', color: 'var(--accent)',
                      fontSize: '0.78rem', textDecoration: 'none',
                      background: 'rgba(180,140,60,0.08)',
                      border: '1px solid rgba(180,140,60,0.25)',
                      padding: '3px 10px', borderRadius: 4,
                    }}>Ask AI →</Link>
                  </div>
                </div>

                {/* Expanded action row */}
                {isExpanded && (
                  <div style={{
                    padding: '0.75rem 1.5rem 1rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.015)',
                    display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap',
                  }}>
                    <button
                      className="ma-btn"
                      onClick={e => handleModelAnswer(e, q)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.45rem 1rem', borderRadius: 4,
                        background: 'rgba(74,222,128,0.06)',
                        border: '1px solid rgba(74,222,128,0.25)',
                        color: 'rgba(74,222,128,0.85)', cursor: 'pointer',
                        fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                        letterSpacing: '0.15em', textTransform: 'uppercase',
                      }}
                    >
                      {!usage.isPremium && (
                        <span style={{
                          background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)',
                          borderRadius: 3, padding: '1px 5px', fontSize: '0.5rem', letterSpacing: '0.15em',
                        }}>Premium</span>
                      )}
                      See Model Answer
                    </button>

                    <Link href={`/evaluate?q=${encodeURIComponent(q.question)}&m=${q.marks}`} onClick={e => e.stopPropagation()} style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.45rem 1rem', borderRadius: 4,
                      background: 'transparent', border: '1px solid var(--border)',
                      color: 'var(--text3)', textDecoration: 'none',
                      fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                      letterSpacing: '0.15em', textTransform: 'uppercase',
                      transition: 'all 0.15s',
                    }}>
                      Evaluate Answer
                    </Link>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
              No questions match your filters.
            </div>
          )}
        </div>
      </div>

      {/* Hidden gate trigger — GateModals renders the paywall */}
      <button id="pyq-gate-trigger" style={{ display: 'none' }} />
      <GateModals slots={slots} />

      {/* Model Answer Modal */}
      {modelAnswerPYQ && (
        <ModelAnswerModal
          pyq={modelAnswerPYQ}
          token={usage.token || ''}
          onClose={() => setModelAnswerPYQ(null)}
        />
      )}
    </>
  );
}
