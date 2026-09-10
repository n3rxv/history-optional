'use client';

/**
 * Three real marked answers, shown as paper.
 *
 * The component this replaces typed out an invented answer beside an empty
 * scorecard: it demonstrated the mechanics and none of the substance. These
 * are actual evaluations, so the marks, the band reasoning and the criticism
 * are all real, and the criticism is the part that sells.
 *
 * Only rows flagged `shareable` are fetched, and the endpoint never selects
 * the author's email or uid. If nothing is flagged this renders the fallback
 * rather than leaving a hole where a section used to be.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

type Part = { analysis: string | null; strengths: string[]; weaknesses: string[]; suggestions: string[] };
type Band = { awarded?: number; out_of?: number; reasoning?: string };

type Sample = {
  id: string;
  label: string;
  question: string;
  answer: string;
  marks: number;
  outOf: number;
  sectionMarks: Record<string, Band> | null;
  demand: string[];
  historians: Array<{ name?: string; argument?: string }>;
  modelAnswer: { introduction?: string; body?: string[]; conclusion?: string } | null;
  overall: string | null;
  introduction: Part; body: Part; conclusion: Part;
};

const GREEN = '#4ade80';
const RED = '#f87171';
const BLUE = '#7ab3f5';

export default function SampleEvaluations({ fallback }: { fallback: React.ReactNode }) {
  const [samples, setSamples] = useState<Sample[] | null>(null);
  const [open, setOpen] = useState<Sample | null>(null);

  useEffect(() => {
    fetch('/api/sample-evaluations')
      .then(r => r.json())
      .then(d => setSamples(Array.isArray(d.samples) ? d.samples : []))
      .catch(() => setSamples([]));
  }, []);

  if (samples === null || samples.length === 0) return <>{fallback}</>;

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.25rem 3.5rem' }}>
      <style>{`
        .sv-grid { display: grid; gap: 26px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }

        /* A page, not a tile. Paper is white in either site theme, which is the
           whole point: the sheet has to sit on the page like a document laid on
           a desk. So this block hard-codes its own ink-on-paper palette instead
           of reading the theme tokens, and every colour in it is fixed. */
        .sv-page {
          position: relative; display: flex; flex-direction: column; overflow: hidden;
          width: 100%; aspect-ratio: 1 / 1;
          text-align: left; cursor: pointer; border: 0; border-radius: 2px;
          padding: clamp(17px, 4.6%, 30px);
          background: #fdfdfb; color: #141414;
          font-family: var(--font-body);
          box-shadow: 0 0 0 1px rgba(0,0,0,0.20),
                      0 1px 2px rgba(0,0,0,0.30),
                      0 14px 30px -10px rgba(0,0,0,0.60);
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .sv-page:hover, .sv-page:focus-visible { transform: translateY(-5px);
          box-shadow: 0 0 0 1px rgba(0,0,0,0.24),
                      0 2px 4px rgba(0,0,0,0.30),
                      0 22px 40px -12px rgba(0,0,0,0.70); }
        .sv-page:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

        .sv-label { font-family: var(--font-ui); font-size: 0.55rem; letter-spacing: 0.16em;
          text-transform: uppercase; color: #6b6862; }
        /* Thick over thin: the masthead rule every printed paper carries. */
        .sv-rules { height: 3px; border-top: 2px solid #141414; border-bottom: 1px solid #141414;
          margin: 9px 0 14px; }

        .sv-q { font-size: 0.83rem; line-height: 1.5; margin: 0 0 12px; color: #141414;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .sv-q b { font-weight: 700; }

        /* The script itself, fading out mid-page the way a document preview
           does. flex:1 makes it absorb the slack, so a short answer and a long
           one both fill the sheet. */
        .sv-ans { flex: 1; min-height: 0; overflow: hidden; font-size: 0.7rem; line-height: 1.62;
          color: #3d3a35;
          -webkit-mask-image: linear-gradient(#000 52%, transparent 100%);
                  mask-image: linear-gradient(#000 52%, transparent 100%); }

        .sv-tbl { width: 100%; border-collapse: collapse; margin-top: 12px;
          font-family: var(--font-ui); font-size: 0.62rem; }
        .sv-tbl th { text-align: left; padding: 0 0 4px; font-size: 0.52rem; font-weight: 600;
          letter-spacing: 0.11em; text-transform: uppercase; color: #6b6862;
          border-bottom: 1px solid #141414; }
        .sv-tbl td { padding: 4px 0; border-bottom: 1px solid #e2dfd8; color: #141414; }
        .sv-tbl td:first-child { text-transform: capitalize; }
        .sv-tbl .n { text-align: right; font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
        .sv-tbl tr.tot td { border-bottom: 0; border-top: 1px solid #141414;
          padding-top: 6px; font-weight: 700; }

        .sv-ft { display: flex; justify-content: space-between; align-items: baseline; gap: 10px;
          margin-top: 12px; padding-top: 8px; border-top: 1px solid #e2dfd8;
          font-family: var(--font-ui); font-size: 0.53rem; letter-spacing: 0.08em;
          text-transform: uppercase; color: #6b6862; }

        /* The examiner's mark, in red, at the corner where it always goes. */
        .sv-stamp { position: absolute; top: clamp(13px, 4%, 26px); right: clamp(13px, 4%, 26px);
          transform: rotate(-9deg); padding: 3px 8px; border: 2px solid #c0392b; border-radius: 3px;
          color: #c0392b; font-family: var(--font-mono); font-weight: 700; font-size: 0.95rem; }

        .sv-open { position: absolute; left: 0; right: 0; bottom: 0; padding: 9px 14px;
          background: #141414; color: #fff; font-family: var(--font-ui); font-size: 0.6rem;
          letter-spacing: 0.1em; text-transform: uppercase; text-align: center;
          transform: translateY(100%); transition: transform .18s ease; }
        .sv-page:hover .sv-open, .sv-page:focus-visible .sv-open { transform: translateY(0); }
        /* No hover on a touch screen, so the affordance has to stay put. */
        @media (hover: none) { .sv-open { transform: translateY(0); } }

        .sv-crit { display: flex; gap: 10px; margin-bottom: 9px; font-size: 0.85rem; line-height: 1.65; }
        .sv-crit b { flex-shrink: 0; width: 13px; font-weight: 700; }
        .sv-h2 { font-size: 0.6rem; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--text3); margin: 26px 0 10px; }
        .sv-h2:first-of-type { margin-top: 0; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: '1.3rem' }}>
        {/* Matched to the "Platform Features" heading above it: same family,
            size and weight, so the two sections read as siblings. */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text)', fontWeight: 600, margin: 0 }}>
          Answers we actually marked
        </h2>
        <Link href="/evaluate" style={{ color: 'var(--accent)', fontSize: '0.86rem', fontWeight: 600 }}>
          Get yours marked &rarr;
        </Link>
      </div>

      <div className="sv-grid">
        {samples.map((s, i) => {
          const bands = Object.entries(s.sectionMarks ?? {});
          // Collapsed to one flow: the clamp and the fade need a single
          // paragraph, not the answer's own line breaks.
          const excerpt = s.answer.replace(/\s+/g, ' ').trim();
          return (
            <button key={s.id} className="sv-page" onClick={() => setOpen(s)}>
              <div className="sv-label">{s.label}</div>
              <div className="sv-rules" />

              <p className="sv-q"><b>Q.</b> {s.question}</p>
              <div className="sv-ans">{excerpt}</div>

              {bands.length > 0 && (
                <table className="sv-tbl">
                  <thead><tr><th>Section</th><th className="n">Marks</th></tr></thead>
                  <tbody>
                    {bands.map(([name, b]) => (
                      <tr key={name}>
                        <td>{name.replace(/_/g, ' ')}</td>
                        <td className="n">{b.awarded}/{b.out_of}</td>
                      </tr>
                    ))}
                    <tr className="tot"><td>Total</td><td className="n">{s.marks}/{s.outOf}</td></tr>
                  </tbody>
                </table>
              )}

              <div className="sv-ft">
                <span>historyoptional.xyz</span>
                <span>Sheet {i + 1} of {samples.length}</span>
              </div>

              <div className="sv-stamp">{s.marks}/{s.outOf}</div>
              <div className="sv-open">Open the full marking &rarr;</div>
            </button>
          );
        })}
      </div>

      {open && <Sheet s={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

/** The whole evaluation, opened from a card. */
function Sheet({ s, onClose }: { s: Sample; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  const parts: Array<[string, Part]> = [
    ['Introduction', s.introduction], ['Body', s.body], ['Conclusion', s.conclusion],
  ];
  const crit = (glyph: string, colour: string, items: string[]) =>
    items.map((x, i) => (
      <div key={glyph + i} className="sv-crit">
        <b style={{ color: colour }}>{glyph}</b><span style={{ color: 'var(--text2)' }}>{x}</span>
      </div>
    ));

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={s.label}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999, padding: '1rem', overflowY: 'auto',
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      }}>
      <div style={{
        width: '100%', maxWidth: 760, margin: '2rem 0', background: 'var(--bg2)',
        border: '1px solid var(--border)', borderRadius: 4, padding: 'clamp(1.2rem, 4vw, 2.2rem)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, marginBottom: 18 }}>
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text3)' }}>{s.label}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>&times;</button>
        </div>

        <p style={{ color: 'var(--text)', fontSize: '1.02rem', lineHeight: 1.6, margin: '0 0 6px' }}>{s.question}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)' }}>
            {s.marks}<span style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>/{s.outOf}</span>
          </span>
        </div>

        {s.demand.length > 0 && (<>
          <div className="sv-h2">What the question demanded</div>
          {s.demand.map((d, i) => (
            <p key={i} style={{ color: 'var(--text2)', fontSize: '0.88rem', lineHeight: 1.7, margin: '0 0 10px' }}>{d}</p>
          ))}
        </>)}

        <div className="sv-h2">What was written</div>
        <div style={{
          border: '1px solid var(--border)', borderRadius: 4, padding: '1rem', maxHeight: 300,
          overflowY: 'auto', color: 'var(--text2)', fontSize: '0.86rem', lineHeight: 1.75, whiteSpace: 'pre-wrap',
        }}>{s.answer}</div>

        {s.sectionMarks && (<>
          <div className="sv-h2">How it was marked</div>
          {Object.entries(s.sectionMarks).map(([name, b]) => (
            <div key={name} style={{ borderBottom: '1px solid var(--bg3)', padding: '11px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--text)', fontSize: '0.88rem', textTransform: 'capitalize' }}>{name.replace(/_/g, ' ')}</span>
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.86rem', color: 'var(--text)' }}>{b.awarded}/{b.out_of}</span>
              </div>
              {b.reasoning && <p style={{ color: 'var(--text3)', fontSize: '0.83rem', lineHeight: 1.65, margin: 0 }}>{b.reasoning}</p>}
            </div>
          ))}
        </>)}

        {parts.map(([name, part]) => (
          (part.analysis || part.strengths.length || part.weaknesses.length || part.suggestions.length) ? (
            <div key={name}>
              <div className="sv-h2">{name}</div>
              {part.analysis && <p style={{ color: 'var(--text2)', fontSize: '0.87rem', lineHeight: 1.7, margin: '0 0 12px' }}>{part.analysis}</p>}
              {crit('+', GREEN, part.strengths)}
              {crit('−', RED, part.weaknesses)}
              {crit('→', BLUE, part.suggestions)}
            </div>
          ) : null
        ))}

        {s.historians.length > 0 && (<>
          <div className="sv-h2">Historians who should have been cited</div>
          {s.historians.map((h, i) => (
            <p key={i} style={{ fontSize: '0.86rem', lineHeight: 1.65, margin: '0 0 10px' }}>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{h.name}</span>
              {h.argument && <span style={{ color: 'var(--text2)' }}> &mdash; {h.argument}</span>}
            </p>
          ))}
        </>)}

        {s.modelAnswer && (<>
          <div className="sv-h2">What full marks looks like</div>
          {s.modelAnswer.introduction && <p style={{ color: 'var(--text2)', fontSize: '0.87rem', lineHeight: 1.75, margin: '0 0 12px' }}>{s.modelAnswer.introduction}</p>}
          {(s.modelAnswer.body ?? []).map((b, i) => <p key={i} style={{ color: 'var(--text2)', fontSize: '0.87rem', lineHeight: 1.75, margin: '0 0 12px' }}>{b}</p>)}
          {s.modelAnswer.conclusion && <p style={{ color: 'var(--text2)', fontSize: '0.87rem', lineHeight: 1.75, margin: 0 }}>{s.modelAnswer.conclusion}</p>}
        </>)}

        {s.overall && (<>
          <div className="sv-h2">Overall</div>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>{s.overall}</p>
        </>)}

        <Link href="/evaluate" onClick={onClose}
          style={{ display: 'block', textAlign: 'center', marginTop: 28, padding: '12px',
            borderRadius: 8, background: 'var(--accent)', color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>
          Get your answer marked like this &rarr;
        </Link>
      </div>
    </div>,
    document.body
  );
}
