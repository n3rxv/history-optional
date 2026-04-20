'use client';
import { useMemo, useState, useEffect, useRef } from 'react';
import { pyqData } from '@/lib/pyqData';

function getDailyQuestions() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
  const p1 = pyqData.filter(q => ['Ancient India', 'Medieval India'].includes(q.section));
  const p2 = pyqData.filter(q => ['Modern India', 'World History'].includes(q.section));
  const picked: typeof pyqData = [];
  const used = new Set<number>();
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

function calcTotalMins(questions: { marks: number }[]) {
  return questions.reduce((acc, q) => acc + (q.marks <= 10 ? 7 : q.marks <= 15 ? 11 : 14), 0);
}

function pad(n: number) { return String(n).padStart(2, '0'); }

const sectionColors: Record<string, string> = {
  'Ancient India':  'var(--yellow, #eab308)',
  'Medieval India': 'var(--red, #ef4444)',
  'Modern India':   'var(--accent, #3b82f6)',
  'World History':  'var(--green, #22c55e)',
};

export default function DailyAnswerWriting() {
  const questions = useMemo(() => getDailyQuestions(), []);
  const totalMins = useMemo(() => calcTotalMins(questions), [questions]);
  const totalSecs = totalMins * 60;

  const [started, setStarted] = useState(false);
  const [secsLeft, setSecsLeft] = useState(totalSecs);
  const [finished, setFinished] = useState(false);
  const iRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!started || finished) return;
    iRef.current = setInterval(() => {
      setSecsLeft(prev => {
        if (prev <= 1) { clearInterval(iRef.current!); setFinished(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (iRef.current) clearInterval(iRef.current); };
  }, [started, finished]);

  const pct = ((totalSecs - secsLeft) / totalSecs) * 100;
  const isLow = secsLeft < 120 && started;
  const timeStr = finished ? 'Time up' : `${pad(Math.floor(secsLeft / 60))}:${pad(secsLeft % 60)}`;
  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const p1count = questions.filter(q => ['Ancient India', 'Medieval India'].includes(q.section)).length;
  const p2count = 5 - p1count;

  return (
    <section style={{ marginBottom: '3rem' }}>
      <div style={{
        background: 'var(--card, rgba(255,255,255,0.03))',
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '1.25rem 1.5rem 1rem',
          borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: '1rem', flexWrap: 'wrap',
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(34,197,94,0.1)', color: 'var(--green, #22c55e)',
              fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600,
              marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: 'var(--green, #22c55e)',
                display: 'inline-block', animation: 'dawPulse 1.8s ease-in-out infinite',
              }} />
              Live today
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--text)', marginBottom: 2 }}>
              Daily Answer Writing
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{dateStr}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            {started ? (
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700,
                color: isLow ? 'var(--red, #ef4444)' : 'var(--text)',
                letterSpacing: '0.02em', lineHeight: 1, transition: 'color 0.3s',
              }}>{timeStr}</div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                {totalMins} min total
              </div>
            )}
            {!started && (
              <button
                onClick={() => setStarted(true)}
                style={{
                  background: 'var(--text, #fff)', color: 'var(--bg, #0a0a0a)',
                  border: 'none', borderRadius: 8, padding: '0.5rem 1.1rem',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: 'var(--font-display)',
                }}
              >
                <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor"><path d="M0 0l9 5.5-9 5.5z"/></svg>
                Start timer
              </button>
            )}
          </div>
        </div>

        <div style={{ height: 2, background: 'var(--border, rgba(255,255,255,0.08))' }}>
          {started && (
            <div style={{
              height: '100%', width: `${pct}%`,
              background: isLow ? 'var(--red, #ef4444)' : 'var(--accent, #3b82f6)',
              transition: 'width 1s linear, background 0.3s',
            }} />
          )}
        </div>

        <div style={{ padding: '0.5rem 1.5rem' }}>
          {questions.map((q, i) => {
            const mins = q.marks <= 10 ? 7 : q.marks <= 15 ? 11 : 14;
            const color = sectionColors[q.section] || 'var(--accent)';
            const href = `/chat?q=${encodeURIComponent(q.question)}&marks=${q.marks}&model=1`;
            return (
              <div key={q.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '1rem 0',
                borderBottom: i < 4 ? '1px solid var(--border, rgba(255,255,255,0.06))' : 'none',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border, rgba(255,255,255,0.1))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, color: 'var(--text3)',
                  flexShrink: 0, marginTop: 1,
                }}>{i + 1}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 5, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 20,
                      background: `color-mix(in srgb, ${color} 12%, transparent)`,
                      color, fontWeight: 600, letterSpacing: '0.04em',
                    }}>{q.section}</span>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 20,
                      background: 'rgba(255,255,255,0.05)', color: 'var(--text3)',
                      fontFamily: 'var(--font-mono)',
                    }}>{q.marks}M · {mins} min · {q.year}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.55 }}>
                    {q.question}
                  </p>
                </div>

                <a
                  href={href}
                  style={{
                    flexShrink: 0, fontSize: 12, padding: '0.3rem 0.75rem',
                    border: '1px solid var(--border, rgba(255,255,255,0.12))',
                    borderRadius: 6, color: 'var(--text3)', textDecoration: 'none',
                    fontWeight: 500, whiteSpace: 'nowrap',
                    transition: 'color 0.15s, border-color 0.15s', marginTop: 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = color; e.currentTarget.style.borderColor = color; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border, rgba(255,255,255,0.12))'; }}
                >
                  See answer →
                </a>
              </div>
            );
          })}
        </div>

        <div style={{
          borderTop: '1px solid var(--border, rgba(255,255,255,0.08))',
          padding: '0.75rem 1.5rem',
          background: 'rgba(0,0,0,0.15)',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem',
        }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
            5 questions · {totalMins} minutes total · Resets at midnight
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
            {p1count} Paper I · {p2count} Paper II
          </span>
        </div>
      </div>
      <style>{`@keyframes dawPulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </section>
  );
}
