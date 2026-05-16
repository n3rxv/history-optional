'use client';
import React, { useState, useEffect, useRef } from 'react';
import { prelimsQuestions } from '@/lib/prelimsData';
import { supabase } from '@/lib/supabase';

type Filter = 'all' | 'pyq' | 'practice' | 'bookmarked';
type NavStatus = 'unattempted' | 'answered' | 'wrong' | 'marked' | 'answered-marked';

interface AIResult {
  solution: string;
  technique: string;
  concepts: string;
  related: string;
  smart_guess: string;
}

interface QuestionState {
  selected: number | null;
  submitted: boolean;
  marked: boolean;
  aiResult: AIResult | null;
  aiLoading: boolean;
}

const TOPICS = Array.from(new Set(prelimsQuestions.map(q => q.topic)));
const YEARS = Array.from(new Set(prelimsQuestions.filter(q => q.year).map(q => q.year!))).sort((a,b) => b-a);

function getNavStatus(qs: QuestionState): NavStatus {
  if (qs.marked && qs.submitted) return 'answered-marked';
  if (qs.marked) return 'marked';
  if (qs.submitted) return qs.selected === null ? 'answered' : (qs as any).isCorrect ? 'answered' : 'wrong';
  return 'unattempted';
}

const NAV_COLORS: Record<NavStatus, { bg: string; border: string; text: string }> = {
  unattempted:       { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.45)' },
  answered:          { bg: 'rgba(74,222,128,0.15)',  border: 'rgba(74,222,128,0.5)',   text: '#4ade80' },
  wrong:             { bg: 'rgba(248,113,113,0.15)',  border: 'rgba(248,113,113,0.5)',   text: '#f87171' },
  marked:            { bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.5)',   text: '#fbbf24' },
  'answered-marked': { bg: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.5)',   text: '#60a5fa' },
};

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


const LS_KEY = 'prelims_explanations_v2';
function getCached(qid: string): AIResult | null {
  try { const s = localStorage.getItem(LS_KEY); if (!s) return null; return JSON.parse(s)[qid] ?? null; } catch { return null; }
}
function setCached(qid: string, r: AIResult) {
  try { const s = localStorage.getItem(LS_KEY); const o = s ? JSON.parse(s) : {}; o[qid] = r; localStorage.setItem(LS_KEY, JSON.stringify(o)); } catch {}
}
export default function PrelimsPage() {
  const [filter, setFilter]           = useState<Filter>('all');
const [topicFilter, setTopicFilter] = useState<string>('all');
  const [yearFilter, setYearFilter]   = useState<string>('all');
  const [showNav, setShowNav]         = useState(typeof window !== 'undefined' ? window.innerWidth > 768 : true);
  const [current, setCurrent]         = useState(0);
  const [states, setStates] = useState<Record<string, QuestionState>>(() => {
    try {
      const saved = localStorage.getItem('ho_prelims_states');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [showResult, setShowResult]   = useState(false);
  const [isPremium, setIsPremium]     = useState(false);
  const [token, setToken]             = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        setToken(session.access_token);
        const res = await fetch(`/api/usage?fp=premcheck&checkSub=1&token=${session.access_token}`);
        const data = await res.json();
        setIsPremium(!!data.isPremium);
      } catch {}
    })();
  }, []);

  const filtered = prelimsQuestions.filter(q => {
    if (filter === 'bookmarked') return !!states[q.id]?.marked;
    if (filter !== 'all' && q.type !== filter) return false;
    if (topicFilter !== 'all' && q.topic !== topicFilter) return false;
    if (yearFilter !== 'all' && String(q.year) !== yearFilter) return false;
    return true;
  });

  const q = filtered[current];
  const emptyQS: QuestionState = { selected: null, submitted: false, marked: false, aiResult: null, aiLoading: false };
  const qs: QuestionState = q ? (states[q.id] ?? emptyQS) : emptyQS;

  useEffect(() => { setCurrent(0); setShowResult(false); }, [filter, topicFilter, yearFilter]);

  const updateState = (id: string, patch: Partial<QuestionState>) =>
    setStates(prev => {
      const next = { ...prev, [id]: { ...(prev[id] ?? emptyQS), ...patch } };
      try { localStorage.setItem('ho_prelims_states', JSON.stringify(next)); } catch {}
      return next;
    });

  const handleSelect = (idx: number) => {
    if (!q || qs.submitted) return;
    updateState(q.id, { selected: idx });
  };

  const handleSubmit = async () => {
    if (!q || qs.selected === null || qs.submitted) return;
    updateState(q.id, { submitted: true, isCorrect: qs.selected === q.correct } as any);
    if (!isPremium || !token) return;
    const cached = getCached(q.id);
    if (cached) { updateState(q.id, { aiResult: cached, aiLoading: false }); return; }
    updateState(q.id, { submitted: true, isCorrect: qs.selected === q.correct, aiLoading: true } as any);
    try {
      const res = await fetch('/api/prelims-explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ question: q.question, options: q.options, correct: q.correct, topic: q.topic }),
      });
      if (res.ok) {
        const data = await res.json();
        setCached(q.id, data);
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

  // ── Score screen ──────────────────────────────────────────────────────────
  if (showResult) {
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    return (
      <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', paddingTop: '6rem' }}>
        <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1.2rem' }}>
            {score / maxScore >= 0.7 ? '🏆' : score / maxScore >= 0.5 ? '📚' : '💪'}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 700, color: score >= 0 ? '#4ade80' : '#f87171', lineHeight: 1 }}>
            {score >= 0 ? '+' : ''}{score}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', marginBottom: '2.5rem', marginTop: '0.5rem' }}>
            out of {maxScore} &nbsp;·&nbsp; +2 correct &nbsp;−0.66 wrong
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Correct', val: correct, color: '#4ade80', sub: `+${(correct * 2).toFixed(2)}` },
              { label: 'Wrong',   val: wrong,   color: '#f87171', sub: `−${(wrong * 0.66).toFixed(2)}` },
              { label: 'Skipped', val: skipped, color: 'rgba(255,255,255,0.3)', sub: '±0' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.25rem 1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.val}</div>
                <div style={{ fontSize: '0.75rem', color: s.color, opacity: 0.7, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{s.sub}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>Score vs Maximum</div>
            <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(0, pct)}%`, height: '100%', background: pct >= 70 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171', borderRadius: 5, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginTop: 10 }}>{Math.max(0, pct)}%</div>
          </div>

          <button onClick={() => setShowResult(false)} style={{
            width: '100%', padding: '1rem', borderRadius: 12, border: 'none',
            background: 'var(--accent)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '1rem',
          }}>← Back to Questions</button>
        </div>
      </div>
    );
  }

  if (!q) return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
        <div style={{ fontSize: '1rem' }}>No questions match this filter.</div>
      </div>
    </div>
  );

  const isCorrect = qs.submitted && qs.selected === q.correct;

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', flexDirection: 'column' }}>

      {/* sticky top bar — sits below navbar (navbar is 72px) */}
      <div style={{
        position: 'sticky', top: 72, zIndex: 40,
        background: 'rgba(8,8,16,0.97)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0.7rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
      }}>
        {/* badge */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, padding: '0.25rem 0.65rem', flexShrink: 0 }}>
          AMAC & Modern
        </div>

        {/* type pills */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['all', 'pyq', 'practice'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '0.28rem 0.75rem', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
              background: filter === f ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
              color: filter === f ? '#000' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.15s',
            }}>{f === 'all' ? 'All' : f === 'pyq' ? 'PYQs' : 'MCQs'}</button>
          ))}
        </div>

        {/* topic filter */}
        <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
          color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', padding: '0.28rem 0.6rem', cursor: 'pointer', maxWidth: 210,
        }}>
          <option value="all">All Topics</option>
          {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {/* year filter */}
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
          color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', padding: '0.28rem 0.6rem', cursor: 'pointer', maxWidth: 120,
        }}>
          <option value="all">All Years</option>
          {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>

        <button onClick={() => setFilter(filter === 'bookmarked' ? 'all' : 'bookmarked' as any)}
          onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(251,191,36,0.2)'; (e.target as HTMLButtonElement).style.borderColor = 'rgba(251,191,36,0.7)'; (e.target as HTMLButtonElement).style.color = '#fbbf24'; }}
          onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = filter === 'bookmarked' ? 'rgba(251,191,36,0.15)' : 'transparent'; (e.target as HTMLButtonElement).style.borderColor = filter === 'bookmarked' ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.1)'; (e.target as HTMLButtonElement).style.color = filter === 'bookmarked' ? '#fbbf24' : 'rgba(255,255,255,0.5)'; }}
          style={{
            background: filter === 'bookmarked' ? 'rgba(251,191,36,0.15)' : 'transparent',
            border: filter === 'bookmarked' ? '1px solid rgba(251,191,36,0.5)' : '1px solid rgba(255,255,255,0.1)',
            color: filter === 'bookmarked' ? '#fbbf24' : 'rgba(255,255,255,0.5)',
            borderRadius: 8, padding: '0.28rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s',
          }}>★ Bookmarks</button>

        <div style={{ flex: 1 }} />

        {/* live score + counter */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.82rem' }}>
          <span style={{ color: score >= 0 ? '#4ade80' : '#f87171', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem' }}>
            {score >= 0 ? '+' : ''}{score}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>{current + 1} / {filtered.length}</span>
          {answered > 0 && (
            <button onClick={() => setShowResult(true)} style={{
              padding: '0.28rem 0.75rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.78rem',
            }}>Score →</button>
          )}
        </div>

        {/* nav toggle */}
        <button onClick={() => setShowNav(v => !v)} style={{
          padding: '0.28rem 0.65rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.09)',
          background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.78rem',
        }}>{showNav ? '◀ Hide' : '▶ Nav'}</button>
      </div>

      {/* body */}
      <div style={{ display: 'flex', flex: 1, maxWidth: 1280, margin: '0 auto', width: '100%', padding: '2rem 1.5rem', gap: '2rem', alignItems: 'flex-start' }}>

        {/* ── Question panel ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>Q{current + 1}</span>
            <span style={{
              fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 5,
              background: q.type === 'pyq' ? 'rgba(212,168,67,0.12)' : 'rgba(96,165,250,0.1)',
              color: q.type === 'pyq' ? '#d4a843' : '#60a5fa',
              border: `1px solid ${q.type === 'pyq' ? 'rgba(212,168,67,0.3)' : 'rgba(96,165,250,0.2)'}`,
              fontWeight: 600,
            }}>
              {q.type === 'pyq' ? `PYQ ${q.year ?? ''}` : 'MCQs'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: 5 }}>{q.topic}</span>
          </div>

          {/* question text */}
          <div style={{ fontSize: '1.15rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.95)', whiteSpace: 'pre-line', marginBottom: '1.5rem', fontWeight: 500 }}>
            {q.question}
          </div>

          {/* options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {q.options.map((opt, i) => {
              let bg = 'rgba(255,255,255,0.03)', border = 'rgba(255,255,255,0.09)', color = 'rgba(255,255,255,0.8)', icon = '';
              if (!qs.submitted) {
                if (qs.selected === i) { bg = 'rgba(96,165,250,0.12)'; border = 'rgba(96,165,250,0.5)'; color = '#93c5fd'; }
              } else {
                if (i === q.correct)      { bg = 'rgba(74,222,128,0.1)'; border = 'rgba(74,222,128,0.5)'; color = '#4ade80'; icon = '✓'; }
                else if (qs.selected === i) { bg = 'rgba(248,113,113,0.1)'; border = 'rgba(248,113,113,0.5)'; color = '#fca5a5'; icon = '✗'; }
              }
              return (
                <button key={i} onClick={() => handleSelect(i)} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '1rem',
                  padding: '1rem 1.25rem', borderRadius: 12,
                  background: bg, border: `1px solid ${border}`, color,
                  textAlign: 'left', cursor: qs.submitted ? 'default' : 'pointer',
                  transition: 'all 0.15s', fontSize: '1rem', lineHeight: 1.6, width: '100%',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.7, marginTop: 3, flexShrink: 0, minWidth: 18, fontWeight: 700 }}>
                    {icon || String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {/* action row */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'center' }}>
            {!qs.submitted ? (
              <>
                <button onClick={handleSubmit} disabled={qs.selected === null} style={{
                  padding: '0.75rem 1.75rem', borderRadius: 10, border: 'none',
                  background: qs.selected !== null ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                  color: qs.selected !== null ? '#000' : 'rgba(255,255,255,0.2)',
                  fontWeight: 700, cursor: qs.selected !== null ? 'pointer' : 'not-allowed', fontSize: '0.95rem',
                  transition: 'all 0.14s',
                }}>Submit</button>
                <button onClick={handleMark} style={{
                  padding: '0.75rem 1.1rem', borderRadius: 10,
                  border: `1px solid ${qs.marked ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  background: qs.marked ? 'rgba(251,191,36,0.1)' : 'transparent',
                  color: qs.marked ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.14s',
                }}>{qs.marked ? '★ Bookmarked' : '☆ Bookmark'}</button>
              </>
            ) : (
              <>
                <div style={{
                  padding: '0.75rem 1.25rem', borderRadius: 10, fontSize: '0.95rem', fontWeight: 700,
                  background: isCorrect ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                  border: `1px solid ${isCorrect ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)'}`,
                  color: isCorrect ? '#4ade80' : '#f87171',
                }}>
                  {isCorrect ? '✓ Correct  +2' : `✗ Wrong  −0.66 · Ans: (${String.fromCharCode(65 + q.correct)})`}
                </div>
                <button onClick={handleMark} style={{
                  padding: '0.75rem 1rem', borderRadius: 10,
                  border: `1px solid ${qs.marked ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  background: qs.marked ? 'rgba(251,191,36,0.1)' : 'transparent',
                  color: qs.marked ? '#fbbf24' : 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.9rem',
                }}>{qs.marked ? '★' : '☆'}</button>
              </>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => goTo(current - 1)} disabled={current === 0} style={{
                padding: '0.75rem 1.1rem', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.09)', background: 'transparent',
                color: current === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.55)',
                cursor: current === 0 ? 'not-allowed' : 'pointer', fontSize: '0.9rem',
              }}>← Prev</button>
              <button onClick={() => goTo(current + 1)} disabled={current === filtered.length - 1} style={{
                padding: '0.75rem 1.1rem', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.09)', background: 'transparent',
                color: current === filtered.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.75)',
                cursor: current === filtered.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.9rem',
              }}>Next →</button>
            </div>
          </div>

          {/* ── Explanation (premium only) ── */}
          {qs.submitted && (
            <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
              <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: !isPremium ? '#fbbf24' : qs.aiLoading ? '#fbbf24' : qs.aiResult ? '#4ade80' : '#f87171', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                  Explanation
                </span>
                {isPremium && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#d4a843', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.25)', borderRadius: 4, padding: '0.12rem 0.5rem' }}>✦ Premium</span>
                )}
              </div>

              {!isPremium ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>🔒</div>
                  <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>Explanations are for Premium members</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.25)' }}>Step-by-step solution · Technique · Concepts · Keywords · Smart Guess</div>
                </div>
              ) : qs.aiLoading ? (
                <div style={{ padding: '1.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
                  ))}
                  <style>{`@keyframes pulse{0%,100%{opacity:.2;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}`}</style>
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)' }}>Generating explanation…</span>
                </div>
              ) : qs.aiResult ? (
                <div style={{ padding: '1.25rem' }}>
                  {([
                    { label: 'Solution',                    icon: '💡', content: qs.aiResult.solution  },
                    { label: 'Problem-Solving Technique',   icon: '⚙️', content: qs.aiResult.technique },
                    ...(qs.aiResult.smart_guess ? [{ label: 'How to Smart Guess', icon: '🧠', content: qs.aiResult.smart_guess }] : []),
                    { label: 'Minimum Concepts Required',   icon: '📌', content: qs.aiResult.concepts  },
                    { label: 'Related Concepts & Keywords', icon: '🔗', content: qs.aiResult.related   },
                  ] as { label: string; icon: string; content: string }[]).map((sec, idx, arr) => (
                    <div key={sec.label} style={{ marginBottom: idx < arr.length-1 ? '1.1rem' : 0, paddingBottom: idx < arr.length-1 ? '1.1rem' : 0, borderBottom: idx < arr.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.6rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>{sec.icon}</span>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, background: 'linear-gradient(90deg, var(--accent), #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{sec.label}</span>
                      </div>
                      <div style={{ fontSize: '0.97rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.85)' }}>
                        {sec.content.split('||').map((point, i) => {
                          const labeled = point.trim().replace(
                            /(LINCHPIN STATEMENT|LINCHPIN\/ANCHOR STATEMENT|PAIR ELIMINATION|ODD-ONE-OUT|EXTREME LANGUAGE TRAP|CHRONOLOGICAL ORDERING|GEOGRAPHICAL ELIMINATION|ASSERTION-REASON|MATCH-THE-FOLLOWING|NEGATIVE QUESTION|DEGREE-OF-CERTAINTY|PROCESS-OF-ELIMINATION|NCERT ANCHOR|CONTEMPORARY SOURCE|ADMINISTRATIVE\/ECONOMIC TERM)/g,
                            '|||LABEL|||$1|||ENDLABEL|||'
                          );
                          const parts = labeled.split('|||');
                          return (
                            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                              <span style={{ color: '#60a5fa', flexShrink: 0, marginTop: '2px' }}>•</span>
                              <span>{parts.map((p, j) => p === 'LABEL' ? null : p === 'ENDLABEL' ? null : parts[j-1] === 'LABEL' ? <span key={j} style={{ display:'inline-flex',alignItems:'center',padding:'1px 7px',borderRadius:'5px',background:'rgba(96,165,250,0.12)',border:'1px solid rgba(96,165,250,0.3)',color:'#93c5fd',fontSize:'0.72rem',fontWeight:700,letterSpacing:'0.04em',verticalAlign:'middle',margin:'0 2px' }}>{p}</span> : <span key={j}>{p}</span>)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1.25rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                  Could not load explanation. Please try again.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Navigator sidebar ── */}
        {showNav && (
          <div style={{
            width: 260, flexShrink: 0,
            position: 'sticky', top: 130,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, boxShadow: '0 0 0 1px rgba(59,130,246,0.08), 0 8px 32px rgba(0,0,0,0.4)', padding: '1.1rem', maxHeight: 'calc(100vh - 170px)', overflowY: 'auto',
          }}>
            <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.9rem' }}>
              Navigator
            </div>

            {/* legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.9rem' }}>
              {[
                { label: 'Correct', bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.5)' },
                { label: 'Wrong',   bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.5)' },
                { label: 'Unanswered', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.12)' },
              ].map(({ label, bg, border }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.28rem' }}>
                  <div style={{ width: 9, height: 9, borderRadius: 3, background: bg, border: `1px solid ${border}` }} />
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.42rem' }}>
              {filtered.map((fq, idx) => {
                const fqs = states[fq.id] ?? emptyQS;
                const status = getNavStatus(fqs);
                const c = NAV_COLORS[status];
                const isActive = idx === current;

  return (
                  <button key={fq.id} onClick={() => goTo(idx)} style={{
                    width: '100%', aspectRatio: '1', borderRadius: 7,
                    border: `1px solid ${isActive ? 'var(--accent)' : c.border}`,
                    background: isActive ? 'rgba(59,130,246,0.2)' : c.bg,
                    color: isActive ? 'var(--accent)' : c.text,
                    fontSize: '0.78rem', fontWeight: isActive ? 700 : 500, cursor: 'pointer',
                    transition: 'all 0.12s', letterSpacing: '0.01em',
                  }}>{idx + 1}</button>
                );
              })}
            </div>

            {/* summary */}
            <div style={{ marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Score',   val: `${score >= 0 ? '+' : ''}${score}`, color: score >= 0 ? '#4ade80' : '#f87171' },
                { label: 'Correct', val: String(correct),   color: '#4ade80' },
                { label: 'Wrong',   val: String(wrong),     color: '#f87171' },
                { label: 'Marked',  val: String(markedCnt), color: '#fbbf24' },
                { label: 'Left',    val: String(filtered.length - answered), color: 'rgba(255,255,255,0.28)' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
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
