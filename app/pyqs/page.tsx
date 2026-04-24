'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { pyqs, pyqYears, type PYQ } from '@/lib/pyqData';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import { supabase } from '@/lib/supabase';

const TABS = [
  { label: 'All',      value: 'all' },
  { label: 'Ancient',  value: 'Paper I - Ancient India' },
  { label: 'Medieval', value: 'Paper I - Medieval India' },
  { label: 'Modern',   value: 'Paper II - Modern India' },
  { label: 'World',    value: 'Paper II - World History' },
];

// ── Render markdown-style model answer ──
function AnswerBody({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text)' }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: '0.6rem' }} />;
        if (/^\*\*(.+)\*\*$/.test(line.trim())) {
          const heading = line.trim().replace(/^\*\*|\*\*$/g, '');
          return (
            <div key={i} style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem',
              letterSpacing: '0.05em', color: 'var(--accent)', textTransform: 'uppercase',
              marginTop: '1.2rem', marginBottom: '0.4rem',
            }}>{heading}</div>
          );
        }
        if (/^\*(.+)\*$/.test(line.trim())) {
          const sub = line.trim().replace(/^\*|\*$/g, '');
          return (
            <div key={i} style={{
              fontWeight: 600, fontStyle: 'italic',
              color: 'var(--text2)', marginTop: '0.8rem', marginBottom: '0.2rem',
            }}>{sub}</div>
          );
        }
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} style={{ margin: '0 0 0.1rem' }}>
            {parts.map((part, j) =>
              /^\*\*(.+)\*\*$/.test(part)
                ? <strong key={j}>{part.replace(/\*\*/g, '')}</strong>
                : part
            )}
          </p>
        );
      })}
    </div>
  );
}

// ── Model Answer Modal ──
function ModelAnswerModal({
  question, marks, cacheKey, onClose,
}: {
  question: string;
  marks: number;
  cacheKey: string;
  onClose: () => void;
}) {
  const [answer, setAnswer] = useState<string | null>(() => {
    try { return localStorage.getItem(`model-answer:${cacheKey}`); } catch { return null; }
  });
  const [loading, setLoading] = useState(!answer);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (forceRegen = false) => {
    if (!forceRegen && answer) return;
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;

    try {
      const res = await fetch('/api/model-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, marks, token }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Failed to generate. Please try again.');
      } else {
        setAnswer(data.answer);
        try { localStorage.setItem(`model-answer:${cacheKey}`, data.answer); } catch {}
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }, [question, marks, cacheKey, answer]);

  // Auto-fetch on mount if no cache
  useState(() => { if (!answer) generate(); });

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1002,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '2rem 1rem', overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 12, width: '100%', maxWidth: 720,
          padding: '2rem', position: 'relative',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)', marginBottom: '2rem',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem' }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--accent)', marginBottom: '0.4rem',
            }}>Model Answer · {marks}M</div>
            <p style={{ color: 'var(--text2)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
              {question.length > 120 ? question.slice(0, 120) + '…' : question}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text3)', cursor: 'pointer',
            padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', flexShrink: 0,
          }}>✕</button>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 0' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <span style={{ color: 'var(--text3)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                Generating model answer…
              </span>
              <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}`}</style>
            </div>
          )}
          {error && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ color: '#f87171', fontSize: '0.88rem', marginBottom: '1rem' }}>{error}</div>
              <button onClick={() => generate(true)} style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                padding: '0.5rem 1.25rem', borderRadius: 6, cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
              }}>Try Again</button>
            </div>
          )}
          {answer && !loading && (
            <>
              <AnswerBody text={answer} />
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => { setAnswer(null); generate(true); }} style={{
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--text3)', cursor: 'pointer',
                  padding: '0.4rem 1rem', borderRadius: 6, fontSize: '0.78rem',
                }}>Regenerate</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function PYQsPage() {
  const [activeTab, setActiveTab]       = useState<string>('all');
  const [filterYear, setFilterYear]     = useState<number | 'all'>('all');
  const [filterMarks, setFilterMarks]   = useState<number | 'all'>('all');
  const [search, setSearch]             = useState('');
  const [modelAnswerQ, setModelAnswerQ] = useState<PYQ | null>(null);

  const { GateModals, usage, slots, showChatLimitModal } = useSubscriptionGate(() => {});

  const handleModelAnswer = (e: React.MouseEvent, q: PYQ) => {
    e.stopPropagation();
    if (!usage.isPremium) { showChatLimitModal(); return; }
    setModelAnswerQ(q);
  };

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

  return (
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
          }}>Start Test →</Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const count = tab.value === 'all' ? pyqs.length : pyqs.filter((q: PYQ) => q.section === tab.value).length;
          const active = activeTab === tab.value;
          return (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)} style={{
              padding: '0.45rem 1rem', borderRadius: 6,
              border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: active ? 'rgba(180,140,60,0.12)' : 'var(--bg2)',
              color: active ? 'var(--accent)' : 'var(--text2)',
              fontFamily: 'var(--font-ui)', fontSize: '0.85rem',
              fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              {tab.label}
              <span style={{
                fontSize: '0.68rem',
                background: active ? 'rgba(180,140,60,0.2)' : 'var(--bg3)',
                color: active ? 'var(--accent)' : 'var(--text3)',
                padding: '1px 6px', borderRadius: 10, fontFamily: 'var(--font-mono)',
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
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search questions or topics..."
          style={{
            flex: 1, minWidth: 200, background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '0.5rem 0.85rem',
            color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none',
          }}
        />
        <select value={filterYear} onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : +e.target.value)} style={selectStyle}>
          <option value="all">All Years</option>
          {pyqYears.map(y => <option key={y} value={y}>{y}</option>)}
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
        {(() => {
          const topicCounts: Record<string, number> = {};
          filtered.forEach((q: PYQ) => { topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1; });
          const seenTopics = new Set<string>();
          return filtered.map((q: PYQ, idx: number) => {
            const isFirst = !seenTopics.has(q.topic);
            if (isFirst) seenTopics.add(q.topic);
            const count = topicCounts[q.topic];
            const badgeColor = count >= 8 ? '#ef4444' : count >= 5 ? '#f97316' : count >= 3 ? '#eab308' : 'var(--text3)';
            const badgeBg = count >= 8 ? 'rgba(239,68,68,0.08)' : count >= 5 ? 'rgba(249,115,22,0.08)' : count >= 3 ? 'rgba(234,179,8,0.08)' : 'rgba(255,255,255,0.04)';
            const badgeBorder = count >= 8 ? 'rgba(239,68,68,0.3)' : count >= 5 ? 'rgba(249,115,22,0.3)' : count >= 3 ? 'rgba(234,179,8,0.3)' : 'var(--border)';
            return (
              <div key={q.id}>
                {isFirst && count >= 2 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: `${idx > 0 ? '1.25rem' : '0'} 0 0.5rem` }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    <span style={{ fontSize: '0.63rem', fontFamily: 'var(--font-mono)', color: badgeColor, background: badgeBg, border: `1px solid ${badgeBorder}`, padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                      {q.topic} · asked {count}×
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                  </div>
                )}
                <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '1.25rem 1.5rem',
            borderLeft: `3px solid ${isP1(q.section) ? 'var(--accent)' : 'var(--blue, #4c8bc9)'}`,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'; }}
          >
            {/* Badges + year */}
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
                {q.source !== 'UPSC' && (
                  <span style={{
                    background: 'rgba(100,180,100,0.1)', color: '#6ab46a',
                    fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                    padding: '2px 8px', borderRadius: 3, border: '1px solid rgba(100,180,100,0.25)',
                  }}>{q.source}</span>
                )}
              </div>
              <span style={{ color: 'var(--text3)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{q.year}</span>
            </div>

            {/* Question */}
            <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '0.75rem' }}>
              {q.question}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text3)', fontSize: '0.73rem' }}>{q.topic}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>

                {/* Model Answer button */}
                <button
                  onClick={e => handleModelAnswer(e, q)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    color: usage.isPremium ? 'var(--accent)' : 'var(--text3)',
                    fontSize: '0.78rem', cursor: 'pointer',
                    background: usage.isPremium ? 'rgba(180,140,60,0.08)' : 'var(--bg3)',
                    border: usage.isPremium ? '1px solid rgba(180,140,60,0.25)' : '1px solid var(--border)',
                    padding: '3px 10px', borderRadius: 4,
                  }}
                >
                  {!usage.isPremium && (
                    <span style={{
                      fontSize: '0.58rem', fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.08em', color: '#f59e0b',
                      background: 'rgba(245,158,11,0.12)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      padding: '1px 5px', borderRadius: 3,
                    }}>PRO</span>
                  )}
                  Model Answer
                </button>

                {/* Ask AI */}
                <Link href={`/chat?q=${encodeURIComponent(q.question)}`} style={{
                  color: 'var(--accent)', fontSize: '0.78rem', textDecoration: 'none',
                  background: 'rgba(180,140,60,0.08)',
                  border: '1px solid rgba(180,140,60,0.25)',
                  padding: '3px 10px', borderRadius: 4,
                }}>Ask AI →</Link>
              </div>
            </div>
          </div>
              </div>
            );
          });
        })()}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
            No questions match your filters.
          </div>
        )}
      </div>

      {/* Paywall */}
      <GateModals slots={slots} />

      {/* Model Answer Modal */}
      {modelAnswerQ && (
        <ModelAnswerModal
          question={modelAnswerQ.question}
          marks={modelAnswerQ.marks}
          cacheKey={String(modelAnswerQ.id)}
          onClose={() => setModelAnswerQ(null)}
        />
      )}
    </div>
  );
}
