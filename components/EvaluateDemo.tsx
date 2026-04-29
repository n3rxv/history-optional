'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const ANSWER_TEXT =
  'The rise of Indian nationalism in the 19th century stemmed from colonial exploitation and Western education. Dadabhai Naoroji\'s Drain of Wealth theory exposed economic extraction. The Indian National Congress (1885) gave political voice to the educated middle class — marking the institutional beginning of organised nationalist movement in India.';

const SCORES = [
  { label: 'Introduction', max: 2, score: 1,   color: 'var(--accent)' },
  { label: 'Body',         max: 5, score: 3,   color: 'var(--yellow)' },
  { label: 'Conclusion',   max: 2, score: 1.5, color: 'var(--green)'  },
  { label: 'Presentation', max: 1, score: 0.5, color: 'var(--red)'    },
];

const TOTAL_MAX   = 10;
const TOTAL_SCORE = 6;

const COMMENT_GOOD = 'Drain of Wealth cited correctly. INC formation logically connected to nationalism.';
const COMMENT_IMPROVE = 'No historiographical reference (e.g. Bipin Chandra). Conclusion lacks a forward-looking statement.';

const CYCLE_MS = 8000;
const TYPE_SPEED_BASE = 22;

export default function EvaluateDemo() {
  const [typed, setTyped]         = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [barWidths, setBarWidths] = useState(SCORES.map(() => 0));
  const [showComment, setShowComment] = useState(false);
  const [showTotal, setShowTotal] = useState(false);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iRef     = useRef(0);

  function clearTimers() {
    if (cycleRef.current) clearTimeout(cycleRef.current);
    if (typeRef.current)  clearTimeout(typeRef.current);
  }

  function runCycle() {
    // reset
    setTyped('');
    setShowFeedback(false);
    setBarWidths(SCORES.map(() => 0));
    setShowComment(false);
    setShowTotal(false);
    iRef.current = 0;

    // type
    function typeNext() {
      const i = iRef.current;
      if (i <= ANSWER_TEXT.length) {
        setTyped(ANSWER_TEXT.slice(0, i));
        iRef.current = i + 1;
        typeRef.current = setTimeout(typeNext, TYPE_SPEED_BASE + Math.random() * 14);
      } else {
        // done typing — show feedback after short pause
        typeRef.current = setTimeout(() => {
          setShowFeedback(true);
          setTimeout(() => {
            setBarWidths(SCORES.map(s => (s.score / s.max) * 100));
          }, 120);
          setTimeout(() => setShowComment(true), 700);
          setTimeout(() => setShowTotal(true),  900);

          // restart cycle
          cycleRef.current = setTimeout(runCycle, CYCLE_MS);
        }, 500);
      }
    }
    typeNext();
  }

  useEffect(() => {
    // small delay before first run so page has settled
    cycleRef.current = setTimeout(runCycle, 600);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section style={{ marginBottom: '3rem', position: 'relative', zIndex: 1 }}>
      <style>{`
        @keyframes ev-fade-in  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        .ev-comment { opacity:0; transform:translateY(6px); transition: opacity 0.45s ease, transform 0.45s ease; }
        .ev-comment.show { opacity:1; transform:none; }
        .ev-total   { opacity:0; transition: opacity 0.4s ease 0.1s; }
        .ev-total.show { opacity:1; }
        .ev-bar { height:4px; border-radius:2px; transition: width 1.1s cubic-bezier(.22,1,.36,1); }
        .ev-cta:hover { opacity:0.85; }
      `}</style>

      {/* Section header */}
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.5rem' }}>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', color:'#fff', fontWeight:600 }}>
          Answer Evaluation — See How It Works
        </h2>
        <Link href="/evaluate"
          style={{ fontFamily:'var(--font-mono)', fontSize:'0.72rem', color:'var(--red)', letterSpacing:'0.06em', textDecoration:'none', border:'1px solid rgba(239,68,68,0.3)', padding:'4px 14px', borderRadius:20 }}>
          Try it free →
        </Link>
      </div>

      {/* Demo card */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', borderLeft:'3px solid var(--red)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }} className="grid-2col">

          {/* LEFT — answer pane */}
          <div style={{ padding:'1.5rem', borderRight:'1px solid var(--border)' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.62rem', letterSpacing:'0.12em', color:'var(--text3)', textTransform:'uppercase', marginBottom:'0.9rem' }}>
              Your answer
            </div>

            {/* Question badge */}
            <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)', borderRadius:6, padding:'8px 12px', marginBottom:'1rem' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.58rem', color:'var(--red)', letterSpacing:'0.08em', marginBottom:3 }}>P2 · 2021 · 10M</div>
              <div style={{ fontSize:'0.78rem', color:'var(--text2)', lineHeight:1.55 }}>
                Trace the causes of the rise of nationalist movement in India.
              </div>
            </div>

            {/* Typing area */}
            <div style={{
              background:'var(--bg3, #111)', border:'1px solid var(--border2)', borderRadius:8,
              padding:'12px 14px', minHeight:130, fontSize:'0.8rem', lineHeight:1.75,
              color:'var(--text2)', fontFamily:'var(--font-body)', position:'relative',
            }}>
              {typed}
              {/* blinking cursor */}
              <span style={{
                display:'inline-block', width:2, height:'0.9em',
                background:'var(--red)', marginLeft:1,
                verticalAlign:'middle',
                animation: showFeedback ? 'none' : 'blink 0.8s step-end infinite',
                opacity: showFeedback ? 0 : 1,
              }} />
            </div>
          </div>

          {/* RIGHT — feedback pane */}
          <div style={{ padding:'1.5rem' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.62rem', letterSpacing:'0.12em', color:'var(--text3)', textTransform:'uppercase', marginBottom:'0.9rem' }}>
              AI feedback
            </div>

            {showFeedback ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
                {/* Score bars */}
                {SCORES.map((s, idx) => (
                  <div key={s.label}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:'0.76rem', color:'var(--text2)' }}>{s.label}</span>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.72rem', color: s.color, fontWeight:600 }}>
                        {s.score}/{s.max}
                      </span>
                    </div>
                    <div style={{ background:'var(--border)', borderRadius:2, height:4, overflow:'hidden' }}>
                      <div className="ev-bar" style={{ width:`${barWidths[idx]}%`, background: s.color }} />
                    </div>
                  </div>
                ))}

                {/* Comment */}
                <div className={`ev-comment${showComment ? ' show' : ''}`}
                  style={{ background:'var(--bg3, #111)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', marginTop:2 }}>
                  <div style={{ fontSize:'0.72rem', color:'var(--green)', marginBottom:4 }}>
                    ✓ {COMMENT_GOOD}
                  </div>
                  <div style={{ fontSize:'0.72rem', color:'var(--yellow)', lineHeight:1.6 }}>
                    ↑ {COMMENT_IMPROVE}
                  </div>
                </div>

                {/* Total */}
                <div className={`ev-total${showTotal ? ' show' : ''}`}
                  style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', borderTop:'1px solid var(--border)', paddingTop:'0.75rem' }}>
                  <span style={{ fontSize:'0.76rem', color:'var(--text3)', fontFamily:'var(--font-mono)' }}>TOTAL</span>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', color:'var(--yellow)', fontWeight:700, letterSpacing:'-0.02em' }}>
                    {TOTAL_SCORE}
                    <span style={{ fontSize:'0.9rem', color:'var(--text3)', fontWeight:400 }}>/{TOTAL_MAX}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
                {/* Skeleton placeholders while typing */}
                {SCORES.map(s => (
                  <div key={s.label}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:'0.76rem', color:'var(--text3)' }}>{s.label}</span>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.72rem', color:'var(--border2)' }}>—/{s.max}</span>
                    </div>
                    <div style={{ background:'var(--border)', borderRadius:2, height:4 }} />
                  </div>
                ))}
                <div style={{ background:'var(--border)', borderRadius:8, height:64, opacity:0.4 }} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', borderTop:'1px solid var(--border)', paddingTop:'0.75rem' }}>
                  <span style={{ fontSize:'0.76rem', color:'var(--text3)', fontFamily:'var(--font-mono)' }}>TOTAL</span>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', color:'var(--border2)', fontWeight:700 }}>—/10</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom strip */}
        <div style={{ borderTop:'1px solid var(--border)', padding:'12px 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.65rem', color:'var(--red)', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', padding:'3px 10px', borderRadius:20 }}>
              1 free eval / week
            </span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.65rem', color:'var(--text3)' }}>
              Works for 10M, 15M &amp; 20M questions
            </span>
          </div>
          <Link href="/evaluate" className="ev-cta"
            style={{ background:'var(--red)', color:'#fff', padding:'7px 20px', borderRadius:6, textDecoration:'none', fontWeight:700, fontSize:'0.82rem', transition:'opacity 0.2s', whiteSpace:'nowrap' }}>
            Evaluate my answer →
          </Link>
        </div>
      </div>
    </section>
  );
}
