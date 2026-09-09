'use client';

/**
 * Real marked answers on the homepage.
 *
 * The component this replaces typed out a fabricated answer beside an empty
 * scorecard, which showed the mechanics and none of the substance. These are
 * actual evaluations from the platform, so the marks, the section breakdown
 * and the criticism are all real.
 *
 * If nothing has been flagged shareable it renders nothing and the caller
 * falls back, rather than leaving a hole where a section used to be.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Sample = {
  id: string;
  label: string;
  question: string;
  answer: string;
  marks: number;
  outOf: number;
  sectionMarks: Record<string, number> | null;
  overall: string | null;
  introduction: { strengths: string[]; weaknesses: string[] };
  body: { strengths: string[]; weaknesses: string[] };
  conclusion: { strengths: string[]; weaknesses: string[] };
};

const RED = '#f87171';
const GREEN = '#4ade80';

export default function SampleEvaluations({ fallback }: { fallback: React.ReactNode }) {
  const [samples, setSamples] = useState<Sample[] | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    fetch('/api/sample-evaluations')
      .then(r => r.json())
      .then(d => setSamples(Array.isArray(d.samples) ? d.samples : []))
      .catch(() => setSamples([]));
  }, []);

  // Still loading, or nothing has been cleared for publication.
  if (samples === null || samples.length === 0) return <>{fallback}</>;

  const s = samples[Math.min(active, samples.length - 1)];
  const pct = s.outOf ? Math.round((s.marks / s.outOf) * 100) : 0;

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.25rem 3rem' }}>
      <style>{`
        .se-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
        .se-col { padding: 1.4rem; }
        .se-col + .se-col { border-left: 1px solid var(--border); }
        .se-crit { display: flex; gap: 9px; margin-bottom: 10px; font-size: 0.84rem; line-height: 1.6; color: var(--text2); }
        .se-mark { flex-shrink: 0; width: 15px; font-weight: 700; }
        @media (max-width: 780px) {
          .se-grid { grid-template-columns: 1fr; }
          .se-col + .se-col { border-left: none; border-top: 1px solid var(--border); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: '1.1rem' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text)' }}>
          Answers we actually marked
        </h2>
        <Link href="/evaluate" style={{ color: 'var(--accent)', fontSize: '0.86rem', fontWeight: 600 }}>
          Get yours marked &rarr;
        </Link>
      </div>

      {samples.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {samples.map((x, i) => (
            <button key={x.id} onClick={() => setActive(i)}
              style={{
                padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontSize: '0.74rem',
                border: `1px solid ${i === active ? 'var(--text3)' : 'var(--border)'}`,
                background: i === active ? 'var(--bg3)' : 'transparent',
                color: i === active ? 'var(--text)' : 'var(--text3)',
              }}>
              {x.marks}/{x.outOf}
            </button>
          ))}
        </div>
      )}

      <div className="se-grid">
        <div className="se-col">
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 8 }}>
            The question
          </div>
          <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 16px' }}>{s.question}</p>

          <div style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 8 }}>
            What was written &middot; {s.label}
          </div>
          <div style={{
            maxHeight: 260, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10,
            padding: '0.9rem', color: 'var(--text2)', fontSize: '0.85rem', lineHeight: 1.7, whiteSpace: 'pre-wrap',
          }}>{s.answer}</div>
        </div>

        <div className="se-col">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)' }}>
              What it scored
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.7rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
              {s.marks}<span style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>/{s.outOf}</span>
            </div>
          </div>

          <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', marginBottom: 18 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--text2)' }} />
          </div>

          {s.sectionMarks && (
            <div style={{ display: 'grid', gap: 7, marginBottom: 18 }}>
              {Object.entries(s.sectionMarks).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text2)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                  <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {[
            ...s.introduction.strengths, ...s.body.strengths, ...s.conclusion.strengths,
          ].slice(0, 2).map((x, i) => (
            <div key={`s${i}`} className="se-crit">
              <span className="se-mark" style={{ color: GREEN }}>+</span><span>{x}</span>
            </div>
          ))}
          {[
            ...s.introduction.weaknesses, ...s.body.weaknesses, ...s.conclusion.weaknesses,
          ].slice(0, 3).map((x, i) => (
            <div key={`w${i}`} className="se-crit">
              <span className="se-mark" style={{ color: RED }}>&minus;</span><span>{x}</span>
            </div>
          ))}

          {s.overall && (
            <p style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', color: 'var(--text3)', fontSize: '0.82rem', lineHeight: 1.65 }}>
              {s.overall}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
