'use client';
import React, { useState, useEffect, useRef } from 'react';
import { prelimsQuestions } from '@/lib/prelimsData';
import { supabase } from '@/lib/supabase';

type Filter = 'all' | 'pyq' | 'practice';
type NavStatus = 'unattempted' | 'answered' | 'marked' | 'answered-marked';

interface AIResult {
  solution: string;
  technique: string;
  concepts: string;
  related: string;
}

interface QuestionState {
  selected: number | null;
  submitted: boolean;
  marked: boolean;
  aiResult: AIResult | null;
  aiLoading: boolean;
}

const TOPICS = Array.from(new Set(prelimsQuestions.map(q => q.topic)));

function getNavStatus(qs: QuestionState): NavStatus {
  if (qs.marked && qs.submitted) return 'answered-marked';
  if (qs.marked) return 'marked';
  if (qs.submitted) return 'answered';
  return 'unattempted';
}

const NAV_COLORS: Record<NavStatus, { bg: string; border: string; text: string }> = {
  unattempted:      { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.5)' },
  answered:         { bg: 'rgba(74,222,128,0.15)',  border: 'rgba(74,222,128,0.5)',   text: '#4ade80' },
  marked:           { bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.5)',   text: '#fbbf24' },
  'answered-marked':{ bg: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.5)',   text: '#60a5fa' },
};

// Prelims scoring: +2 correct, -0.66 wrong, 0 skipped
function calcScore(questions: typeof prelimsQuestions, states: Record<string, QuestionState>) {
  let score = 0, correct = 0, wrong = 0, skipped = 0;
  for (const q of questions) {
    const qs = states[q.id];
    if (!qs?.submitted) { skipped++; continue; }
    if (qs.selected === q.correct) { score += 2; correct++; }
    else if (qs.selected !== null) { score -= 0.66; wrong++; }
    else { skipped++; }
  }
  return { score: Math.round(score * 100) / 100, correct, wrong, skipped };
}

export default function PrelimsPage() {
  const [filter, setFilter]       = useState<Filter>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [showNav, setShowNav]     = useState(true);
  const [current, setCurrent]     = useState(0);
  const [states, setStates]       = useState<Record<string, QuestionState>>({});
  const [showResult, setShowResult] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const questionRef = useRef<HTMLDivElement>(null);

  // Check premium status on mount
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch(`/api/usage?fp=premcheck&checkSub=1&token=${session.access_token}`);
        const data = await res.json();
        setIsPremium(!!data.isPremium);
      } catch {}
    })();
  }, []);

  // Filter — no day filter
  const filtered = prelimsQuestions.filter(q => {
    if (filter !== 'all' && q.type !== filter) return false;
    if (topicFilter !== 'all' && q.topic !== topicFilter) return false;
    return true;
  });

  const q  = filtered[current];
  const qs: QuestionState = q
    ? (states[q.id] ?? { selected: null, submitted: false, marked: false, aiResult: null, aiLoading: false })
    : { selected: null, submitted: false, marked: false, aiResult: null, aiLoading: false };

  useEffect(() => { setCurrent(0); setShowResult(false); }, [filter, topicFilter]);

  const updateState = (id: string, patch: Partial<QuestionState>) =>
    setStates(prev => ({ ...prev, [id]: { ...(prev[id] ?? { selected: null, submitted: false, marked: false, aiResult: null, aiLoading: false }), ...patch } }));

  const handleSelect = (idx: number) => {
    if (!q || qs.submitted) return;
    updateState(q.id, { selected: idx });
  };

  const handleSubmit = async () => {
    if (!q || qs.selected === null || qs.submitted) return;
    updateState(q.id, { submitted: true });

    // AI explanation only for premium users
    if (!isPremium) return;

    updateState(q.id, { aiLoading: true });
    try {
      const res = await fetch('/api/prelims-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q.question, options: q.options, correct: q.correct, topic: q.topic }),
      });
      if (res.ok) {
        const data = await res.json();
        updateState(q.id, { aiResult: data, aiLoading: false });
      } else {
        updateState(q.id, { aiLoading: false });
      }
    } catch {
      updateState(q.id, { aiLoading: false });
    }
  };

  const handleMark = () => { if (q) updateState(q.id, { marked: !qs.marked }); };

  const goTo = (idx: number) => {
    setCurrent(idx);
    setShowResult(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { score, correct, wrong, skipped } = calcScore(filtered, states);
  const answered  = correct + wrong;
  const markedCnt = filtered.filter(q => states[q.id]?.marked).length;
  const maxScore  = filtered.length * 2;

  // ── Score screen ─────────────────────────────────────────────────────────
  if (showResult) {
    const pct = maxScore > 0 ? Math.round(((score / maxScore) * 100)) : 0;
    return (
      <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {score / maxScore >= 0.7 ? '🏆' : score / maxScore >= 0.5 ? '📚' : '💪'}
          </div>

          {/* Score */}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 700, color: score >= 0 ? '#4ade80' : '#f87171', lineHeight: 1 }}>
            {score >= 0 ? '+' : ''}{score}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginBottom: '2rem', marginTop: '0.4rem' }}>
            out of {maxScore} · +2 correct, −0.66 wrong
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Correct',  val: correct,  color: '#4ade80', sub: `+${(correct * 2).toFixed(2)}` },
              { label: 'Wrong',    val: wrong,    color: '#f87171', sub: `−${(wrong * 0.66).toFixed(2)}` },
              { label: 'Skipped',  val: skipped,  color: 'rgba(255,255,255,0.3)', sub: '±0' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.val}</div>
                <div style={{ fontSize: '0.68rem', color: s.color, opacity: 0.7, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{s.sub}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Accuracy bar */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Score vs Max</div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(0, pct)}%`, height: '100%', background: pct >= 70 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171', borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: 8 }}>{Math.max(0, pct)}%</div>
          </div>

          <button onClick={() => setShowResult(false)} style={{
            width: '100%', padding: '0.9rem', borderRadius: 10, border: 'none',
            background: 'var(--accent)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
          }}>← Back to Questions</button>
        </div>
      </div>
    );
  }

  if (!q) return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
        <div>No questions match this filter.</div>
      </div>
    </div>
  );

  const isCorrect = qs.submitted && qs.selected === q.correct;

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', flexDirection: 'column' }}>

      {/* top bar */}
      <div style={{
        position: 'sticky', top: 56, zIndex: 40,
        background: 'rgba(8,8,16,0.96)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0.55rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap',
      }}>
        {/* badge */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, padding: '0.2rem 0.55rem', flexShrink: 0 }}>
          AMAC Prelims
        </div>

        {/* type pills */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {(['all', 'pyq', 'practice'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '0.18rem 0.55rem', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
              background: filter === f ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              color: filter === f ? '#000' : 'rgba(255,255,255,0.45)',
              transition: 'all 0.15s',
            }}>{f === 'all' ? 'All' : f === 'pyq' ? 'PYQ' : 'Practice'}</button>
          ))}
        </div>

        {/* topic filter */}
        <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
          color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', padding: '0.18rem 0.45rem', cursor: 'pointer', maxWidth: 190,
        }}>
          <option value="all">All Topics</option>
          {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <div style={{ flex: 1 }} />

        {/* live score */}
        <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', fontSize: '0.72rem' }}>
          <span style={{ color: score >= 0 ? '#4ade80' : '#f87171', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            {score >= 0 ? '+' : ''}{score}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>{current + 1}/{filtered.length}</span>
          {answered > 0 && (
            <button onClick={() => setShowResult(true)} style={{
              padding: '0.18rem 0.6rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: '0.7rem',
            }}>Score →</button>
          )}
        </div>

        {/* nav toggle */}
        <button onClick={() => setShowNav(v => !v)} style={{
          padding: '0.2rem 0.55rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.09)',
          background: 'transparent', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.7rem',
        }}>{showNav ? '◀ Hide' : '▶ Nav'}</button>
      </div>

      {/* body */}
      <div style={{ display: 'flex', flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '1.5rem 1rem', gap: '1.5rem', alignItems: 'flex-start' }}>

        {/* question panel */}
        <div ref={questionRef} style={{ flex: 1, minWidth: 0 }}>

          {/* meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)' }}>Q{current + 1}</span>
            <span style={{ fontSize: '0.65rem', padding: '0.12rem 0.45rem', borderRadius: 4,
              background: q.type === 'pyq' ? 'rgba(212,168,67,0.12)' : 'rgba(96,165,250,0.1)',
              color: q.type === 'pyq' ? '#d4a843' : '#60a5fa',
              border: `1px solid ${q.type === 'pyq' ? 'rgba(212,168,67,0.3)' : 'rgba(96,165,250,0.2)'}` }}>
              {q.type === 'pyq' ? `PYQ ${q.year ?? ''}` : 'Practice'}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.05)', padding: '0.12rem 0.45rem', borderRadius: 4 }}>{q.topic}</span>
          </div>

          {/* question text */}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', lineHeight: 1.72, color: 'rgba(255,255,255,0.92)', whiteSpace: 'pre-line', marginBottom: '1.1rem' }}>
            {q.question}
          </div>

          {/* options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1.1rem' }}>
            {q.options.map((opt, i) => {
              let bg = 'rgba(255,255,255,0.03)', border = 'rgba(255,255,255,0.09)', color = 'rgba(255,255,255,0.75)', icon = '';
              if (!qs.submitted) {
                if (qs.selected === i) { bg = 'rgba(96,165,250,0.12)'; border = 'rgba(96,165,250,0.45)'; color = '#93c5fd'; }
              } else {
                if (i === q.correct) { bg = 'rgba(74,222,128,0.12)'; border = 'rgba(74,222,128,0.45)'; color = '#4ade80'; icon = '✓'; }
                else if (qs.selected === i) { bg = 'rgba(248,113,113,0.12)'; border = 'rgba(248,113,113,0.45)'; color = '#fca5a5'; icon = '✗'; }
              }
              return (
                <button key={i} onClick={() => handleSelect(i)} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.7rem',
                  padding: '0.8rem 1rem', borderRadius: 10,
                  background: bg, border: `1px solid ${border}`, color,
                  textAlign: 'left', cursor: qs.submitted ? 'default' : 'pointer',
                  transition: 'all 0.14s', fontSize: '0.87rem', lineHeight: 1.55, width: '100%',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', opacity: 0.7, marginTop: 2, flexShrink: 0, minWidth: 16 }}>
                    {icon || String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* actions */}
          <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
            {!qs.submitted ? (
              <>
                <button onClick={handleSubmit} disabled={qs.selected === null} style={{
                  padding: '0.65rem 1.3rem', borderRadius: 10, border: 'none',
                  background: qs.selected !== null ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                  color: qs.selected !== null ? '#000' : 'rgba(255,255,255,0.2)',
                  fontWeight: 700, cursor: qs.selected !== null ? 'pointer' : 'not-allowed', fontSize: '0.84rem',
                  transition: 'all 0.14s',
                }}>Submit</button>
                <button onClick={handleMark} style={{
                  padding: '0.65rem 0.95rem', borderRadius: 10,
                  border: `1px solid ${qs.marked ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  background: qs.marked ? 'rgba(251,191,36,0.1)' : 'transparent',
                  color: qs.marked ? '#fbbf24' : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.14s',
                }}>{qs.marked ? '★ Marked' : '☆ Mark'}</button>
              </>
            ) : (
              <>
                <div style={{
                  padding: '0.65rem 1.1rem', borderRadius: 10, fontSize: '0.84rem', fontWeight: 700,
                  background: isCorrect ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                  border: `1px solid ${isCorrect ? 'rgba(74,222,128,0.35)' : 'rgba(248,113,113,0.35)'}`,
                  color: isCorrect ? '#4ade80' : '#f87171',
                }}>
                  {isCorrect ? '✓ Correct  +2' : `✗ Wrong  −0.66 · Ans: (${String.fromCharCode(65 + q.correct)})`}
                </div>
                <button onClick={handleMark} style={{
                  padding: '0.65rem 0.95rem', borderRadius: 10,
                  border: `1px solid ${qs.marked ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  background: qs.marked ? 'rgba(251,191,36,0.1)' : 'transparent',
                  color: qs.marked ? '#fbbf24' : 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.8rem',
                }}>{qs.marked ? '★' : '☆'}</button>
              </>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.45rem' }}>
              <button onClick={() => goTo(current - 1)} disabled={current === 0} style={{
                padding: '0.65rem 0.9rem', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.09)', background: 'transparent',
                color: current === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
                cursor: current === 0 ? 'not-allowed' : 'pointer', fontSize: '0.8rem',
              }}>← Prev</button>
              <button onClick={() => goTo(current + 1)} disabled={current === filtered.length - 1} style={{
                padding: '0.65rem 0.9rem', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.09)', background: 'transparent',
                color: current === filtered.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)',
                cursor: current === filtered.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem',
              }}>Next →</button>
            </div>
          </div>

          {/* AI Explanation — premium only */}
          {qs.submitted && (
            <div style={{
              borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.025)', overflow: 'hidden',
            }}>
              <div style={{ padding: '0.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: !isPremium ? '#fbbf24' : qs.aiLoading ? '#fbbf24' : '#4ade80', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                  AI Explanation
                </span>
                {isPremium && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: '#d4a843', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.25)', borderRadius: 4, padding: '0.1rem 0.4rem' }}>✦ Premium</span>
                )}
              </div>

              {!isPremium ? (
                <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '0.6rem' }}>🔒</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.4rem' }}>AI explanations are for Premium members</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>Step-by-step solution · Technique · Concepts · Keywords</div>
                </div>
              ) : qs.aiLoading ? (
                <div style={{ padding: '1.4rem', display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
                  ))}
                  <style>{`@keyframes pulse{0%,100%{opacity:.2;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}`}</style>
                </div>
              ) : qs.aiResult ? (
                <div style={{ padding: '1rem' }}>
                  {([
                    { label: 'Solution',                    icon: '💡', content: qs.aiResult.solution  },
                    { label: 'Problem-Solving Technique',   icon: '⚙️', content: qs.aiResult.technique },
                    { label: 'Minimum Concepts Required',   icon: '📌', content: qs.aiResult.concepts  },
                    { label: 'Related Concepts & Keywords', icon: '🔗', content: qs.aiResult.related   },
                  ] as const).map((sec, idx, arr) => (
                    <div key={sec.label} style={{ marginBottom: idx < arr.length-1 ? '0.9rem' : 0, paddingBottom: idx < arr.length-1 ? '0.9rem' : 0, borderBottom: idx < arr.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.78rem' }}>{sec.icon}</span>
                        <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.32)' }}>{sec.label}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.78)', whiteSpace: 'pre-line' }}>{sec.content}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1rem', color: 'rgba(255,255,255,0.28)', fontSize: '0.8rem' }}>
                  Could not load explanation. Check connection or try again.
                </div>
              )}
            </div>
          )}
        </div>

        {/* navigator sidebar */}
        {showNav && (
          <div style={{
            width: 215, flexShrink: 0,
            position: 'sticky', top: 120,
            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '1rem', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto',
          }}>
            <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: '0.7rem' }}>
              Navigator
            </div>

            {/* legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.8rem' }}>
              {(Object.entries(NAV_COLORS) as [NavStatus, typeof NAV_COLORS[NavStatus]][]).map(([s, c]) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.22rem' }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: c.bg, border: `1px solid ${c.border}` }} />
                  <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.22)', textTransform: 'capitalize' }}>
                    {s === 'answered-marked' ? 'ans+marked' : s}
                  </span>
                </div>
              ))}
            </div>

            {/* grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.32rem' }}>
              {filtered.map((fq, idx) => {
                const fqs = states[fq.id] ?? { selected: null, submitted: false, marked: false, aiResult: null, aiLoading: false };
                const status = getNavStatus(fqs);
                const c = NAV_COLORS[status];
                const isActive = idx === current;
                return (
                  <button key={fq.id} onClick={() => goTo(idx)} style={{
                    width: '100%', aspectRatio: '1', borderRadius: 6,
                    border: `1px solid ${isActive ? 'var(--accent)' : c.border}`,
                    background: isActive ? 'rgba(59,130,246,0.2)' : c.bg,
                    color: isActive ? 'var(--accent)' : c.text,
                    fontSize: '0.65rem', fontWeight: isActive ? 700 : 400, cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}>{idx + 1}</button>
                );
              })}
            </div>

            {/* summary */}
            <div style={{ marginTop: '0.9rem', paddingTop: '0.7rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Score',    val: `${score >= 0 ? '+' : ''}${score}`, color: score >= 0 ? '#4ade80' : '#f87171' },
                { label: 'Correct',  val: String(correct),  color: '#4ade80' },
                { label: 'Wrong',    val: String(wrong),    color: '#f87171' },
                { label: 'Marked',   val: String(markedCnt), color: '#fbbf24' },
                { label: 'Left',     val: String(filtered.length - answered), color: 'rgba(255,255,255,0.28)' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.32)' }}>{s.label}</span>
                  <span style={{ color: s.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
