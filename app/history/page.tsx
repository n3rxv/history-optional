'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadHistory, deleteFromHistory, AnswerEntry } from '@/hooks/useAnswerHistory';

function ScoreRing({ pct, size = 48 }: { pct: number; size?: number }) {
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const color = pct >= 70 ? 'var(--green)' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border2)" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={4} strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round" />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}
        fill={color} fontSize="10px" fontFamily="var(--font-mono)" fontWeight="700">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<AnswerEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setEntries(loadHistory());
    setMounted(true);
  }, []);

  const handleDelete = (id: string) => {
    deleteFromHistory(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const avgScore = entries.length > 0
    ? entries.reduce((sum, e) => sum + (e.marks / e.marksOutOf) * 100, 0) / entries.length
    : 0;

  const trend = entries.length >= 2
    ? (entries[0].marks / entries[0].marksOutOf) - (entries[entries.length - 1].marks / entries[entries.length - 1].marksOutOf)
    : 0;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Your Progress</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>Answer History</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>Every answer you've had evaluated. Stored locally in your browser.</p>
      </div>

      {mounted && entries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.85rem', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem 1.25rem' }}>
            <div style={{ color: 'var(--text3)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Total Attempts</div>
            <div style={{ color: 'var(--text)', fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{entries.length}</div>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem 1.25rem' }}>
            <div style={{ color: 'var(--text3)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Avg Score</div>
            <div style={{ color: avgScore >= 70 ? 'var(--green)' : avgScore >= 50 ? '#f59e0b' : '#ef4444', fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{Math.round(avgScore)}%</div>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem 1.25rem' }}>
            <div style={{ color: 'var(--text3)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Trend</div>
            <div style={{ color: trend > 0 ? 'var(--green)' : trend < 0 ? '#ef4444' : 'var(--text3)', fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '—'}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '0.7rem' }}>{trend > 0 ? 'Improving' : trend < 0 ? 'Declining' : 'Stable'}</div>
          </div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem 1.25rem' }}>
            <div style={{ color: 'var(--text3)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Best Score</div>
            <div style={{ color: 'var(--green)', fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {Math.round(Math.max(...entries.map(e => (e.marks / e.marksOutOf) * 100)))}%
            </div>
          </div>
        </div>
      )}

      {!mounted || entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✍️</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.5rem' }}>No answers yet</div>
          <div style={{ color: 'var(--text3)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Go evaluate an answer and it will appear here automatically.</div>
          <Link href="/evaluate" style={{ fontSize: '0.85rem', color: 'var(--accent)', textDecoration: 'none', background: 'var(--accent-dim)', border: '1px solid rgba(59,130,246,0.3)', padding: '8px 18px', borderRadius: 6 }}>
            Evaluate an Answer →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {entries.map(entry => {
            const pct = (entry.marks / entry.marksOutOf) * 100;
            const isOpen = expanded === entry.id;
            const date = new Date(entry.date);
            const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            return (
              <div key={entry.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', cursor: 'pointer' }}
                  onClick={() => setExpanded(isOpen ? null : entry.id)}>
                  <ScoreRing pct={pct} size={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.25rem' }}>
                      {entry.question}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>{dateStr}</span>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: pct >= 70 ? 'var(--green)' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>
                        {entry.marks}/{entry.marksOutOf} marks
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>{isOpen ? '▲' : '▼'}</span>
                    <button onClick={e => { e.stopPropagation(); if (confirm('Delete this entry?')) handleDelete(entry.id); }}
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', padding: '3px 8px', borderRadius: 5, fontSize: '0.7rem' }}>
                      ✕
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                      {(['introduction', 'body', 'conclusion', 'presentation'] as const).map(sec => {
                        const sm = entry.sectionMarks[sec];
                        const sp = (sm.awarded / sm.out_of) * 100;
                        return (
                          <div key={sec} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.6rem 0.75rem' }}>
                            <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: '0.25rem' }}>{sec}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: sp >= 70 ? 'var(--green)' : sp >= 50 ? '#f59e0b' : '#ef4444' }}>
                              {sm.awarded}<span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>/{sm.out_of}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: '0.83rem', color: 'var(--text2)', lineHeight: 1.6, background: 'var(--bg3)', padding: '0.75rem 1rem', borderRadius: 6, border: '1px solid var(--border)' }}>
                      {entry.overallFeedback}
                    </div>
                    <Link href="/evaluate" style={{ fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none', alignSelf: 'flex-start' }}>
                      Evaluate another answer →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
