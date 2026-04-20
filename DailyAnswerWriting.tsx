'use client';
import { useMemo, useState, useEffect, useRef } from 'react';
import { pyqData } from '@/lib/pyqData';

function getDailyQuestions() {
  // Deterministic daily seed based on date
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Simple seeded PRNG
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };

  // Pick questions across both papers, mix of marks
  const p1 = pyqData.filter(q => ['Ancient India', 'Medieval India'].includes(q.section));
  const p2 = pyqData.filter(q => ['Modern India', 'World History'].includes(q.section));

  const picked: typeof pyqData = [];
  const used = new Set<number>();

  // Aim for 2-3 from each paper, mix of 10/15/20 markers
  const pools = [p1, p2, p1, p2, p1.concat(p2)];
  for (let i = 0; i < 5; i++) {
    const pool = pools[i].filter(q => !used.has(q.id));
    if (!pool.length) continue;
    const idx = Math.floor(rand() * pool.length);
    picked.push(pool[idx]);
    used.add(pool[idx].id);
  }

  return picked;
}

function calcTotalTime(questions: { marks: number }[]) {
  return questions.reduce((acc, q) => {
    if (q.marks <= 10) return acc + 7;
    if (q.marks <= 15) return acc + 11;
    return acc + 14;
  }, 0);
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function DailyAnswerWriting() {
  const questions = useMemo(() => getDailyQuestions(), []);
  const totalMins = useMemo(() => calcTotalTime(questions), [questions]);

  const [started, setStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(totalMins * 60);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (started && !finished) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [started, finished]);

  const pct = ((totalMins * 60 - secondsLeft) / (totalMins * 60)) * 100;
  const isLow = secondsLeft < 120;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <section style={{ marginBottom: '3rem' }}>
      <div style={{
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'var(--card, rgba(255,255,255,0.03))',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
              <span style={{ fontSize: '1rem' }}>✍️</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1rem',
                color: 'var(--text)',
              }}>Daily Answer Writing</span>
              <span style={{
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.25)',
                color: 'var(--accent)',
                fontSize: '0.65rem',
                padding: '2px 8px',
                borderRadius: 20,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>Live Today</span>
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '0.72rem' }}>{dateStr}</div>
          </div>

          {/* Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {started && (
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: isLow ? 'var(--red, #ef4444)' : 'var(--accent)',
                letterSpacing: '0.05em',
                transition: 'color 0.3s',
              }}>
                {finished ? '⏰ Time Up' : formatTime(secondsLeft)}
              </div>
            )}
            {!started && (
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--text3)',
              }}>
                {totalMins} min total
              </div>
            )}
            {!started && (
              <button
                onClick={() => setStarted(true)}
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.5rem 1.25rem',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                }}
              >
                ▶ Start Timer
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {started && (
          <div style={{ height: 3, background: 'var(--border, rgba(255,255,255,0.08))' }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: isLow ? 'var(--red, #ef4444)' : 'var(--accent)',
              transition: 'width 1s linear, background 0.3s',
            }} />
          </div>
        )}

        {/* Questions */}
        <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {questions.map((q, i) => {
            const mins = q.marks <= 10 ? 7 : q.marks <= 15 ? 11 : 14;
            const sectionColor: Record<string, string> = {
              'Ancient India': 'var(--yellow, #eab308)',
              'Medieval India': 'var(--red, #ef4444)',
              'Modern India': 'var(--accent, #3b82f6)',
              'World History': 'var(--green, #22c55e)',
            };
            const color = sectionColor[q.section] || 'var(--accent)';
            const modelAnswerUrl = `/chat?q=${encodeURIComponent(q.question)}&marks=${q.marks}&model=1`;

            return (
              <div key={q.id} style={{
                border: '1px solid var(--border, rgba(255,255,255,0.08))',
                borderRadius: 8,
                padding: '0.875rem 1rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                background: 'var(--bg2, rgba(255,255,255,0.02))',
              }}>
                {/* Number */}
                <div style={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: color,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: 1,
                }}>{i + 1}</div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '1px 7px',
                      borderRadius: 4,
                      background: `color-mix(in srgb, ${color} 15%, transparent)`,
                      color,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}>{q.section}</span>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '1px 7px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--text3)',
                      fontFamily: 'var(--font-mono)',
                    }}>{q.marks}M · {mins} min · {q.year}</span>
                  </div>
                  <p style={{
                    margin: 0,
                    color: 'var(--text)',
                    fontSize: '0.875rem',
                    lineHeight: 1.55,
                  }}>{q.question}</p>
                </div>

                {/* See Answer */}
                <a
                  href={modelAnswerUrl}
                  style={{
                    flexShrink: 0,
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.75rem',
                    border: `1px solid ${color}`,
                    borderRadius: 6,
                    color,
                    textDecoration: 'none',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = `color-mix(in srgb, ${color} 12%, transparent)`)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  See Answer →
                </a>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--border, rgba(255,255,255,0.08))',
          padding: '0.75rem 1.5rem',
          color: 'var(--text3)',
          fontSize: '0.72rem',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <span>5 questions · {totalMins} minutes · Resets at midnight</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {questions.filter(q => ['Ancient India', 'Medieval India'].includes(q.section)).length} Paper I · {questions.filter(q => ['Modern India', 'World History'].includes(q.section)).length} Paper II
          </span>
        </div>
      </div>
    </section>
  );
}
