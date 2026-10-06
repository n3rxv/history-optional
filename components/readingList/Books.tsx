'use client';
import { useState } from 'react';
import { BOOKS, type Book } from '@/lib/readingList';
import { tintFor } from '@/components/pyq/sections';

/**
 * The reading list: the standard books for each part of the syllabus, with a
 * free copy where one exists and where to buy it.
 */

const PARTS: { key: 'all' | Book['category']; label: string; tint?: 'ancient' | 'medieval' | 'modern' | 'world' }[] = [
  { key: 'all', label: 'Every part' },
  { key: 'Ancient', label: 'Ancient India', tint: 'ancient' },
  { key: 'Medieval', label: 'Medieval India', tint: 'medieval' },
  { key: 'Modern', label: 'Modern India', tint: 'modern' },
  { key: 'World', label: 'World History', tint: 'world' },
];
const TINT: Record<Book['category'], 'ancient' | 'medieval' | 'modern' | 'world'> = { Ancient: 'ancient', Medieval: 'medieval', Modern: 'modern', World: 'world' };
const NAME: Record<Book['category'], string> = { Ancient: 'Ancient India', Medieval: 'Medieval India', Modern: 'Modern India', World: 'World History' };

/** Each part of the syllabus has its own cover colour, fixed so it reads in either theme. */
const COVER: Record<Book['category'], string> = { Ancient: '#7a4b16', Medieval: '#8a2f2b', Modern: '#3b44a3', World: '#2e6a40' };
const MOTIFS = 4;
/** The same book always gets the same pattern; neighbours mostly differ. */
const motifOf = (title: string) => [...title].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7) % MOTIFS;

/** A cover drawn for the list: colour by part, the title large, the author at the foot. */
function Cover({ book }: { book: Book }) {
  const size = book.title.length > 44 ? 'xs' : book.title.length > 26 ? 'sm' : '';
  return (
    <div className={`bk-cover m${motifOf(book.title)}`} style={{ ['--c' as string]: COVER[book.category] }} aria-hidden="true">
      <span className="bk-cover-part">{NAME[book.category]}</span>
      <span className={`bk-cover-title ${size}`}>{book.title}</span>
      <span className="bk-cover-rule" />
      <span className="bk-cover-author">{book.author}</span>
    </div>
  );
}

const Ext = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;

export default function Books() {
  const [part, setPart] = useState<'all' | Book['category']>('all');
  const shown = part === 'all' ? BOOKS : BOOKS.filter((b) => b.category === part);

  return (
    <div className="bk ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="bk-hero">
        <div className="ds-container">
          <h1 className="ds-h1 bk-h1">Books</h1>
          <p className="ds-lede bk-lede">The standard books for each part of the syllabus, with a line on what each one is good for. Most of them you can read free online.</p>
        </div>
      </header>
      <div className="ds-container">
        <div className="bk-parts" role="radiogroup" aria-label="Part of the syllabus">
          {PARTS.map((p) => {
            const n = p.key === 'all' ? BOOKS.length : BOOKS.filter((b) => b.category === p.key).length;
            return (
              <button key={p.key} type="button" role="radio" aria-checked={part === p.key} className={`bk-part${part === p.key ? ' on' : ''}`} style={p.tint ? tintFor(p.tint) : undefined} onClick={() => setPart(p.key)}>
                {p.tint && <i aria-hidden="true" />}{p.label}<span>{n}</span>
              </button>
            );
          })}
        </div>
        <div className="bk-grid">
          {shown.map((b) => {
            return (
              <article key={b.title} className="bk-card" style={tintFor(TINT[b.category])}>
                <Cover book={b} />
                <div className="bk-text">
                  <span className="bk-part-name">{NAME[b.category]}</span>
                  <h2 className="bk-title">{b.title}</h2>
                  <span className="bk-author">{b.author}</span>
                  <p className="bk-desc">{b.description}</p>
                  <div className="bk-actions">
                    {b.archiveUrl && <a href={b.archiveUrl} target="_blank" rel="noopener noreferrer" className="ds-btn ds-btn-solid ds-btn-sm">Read it free <Ext /></a>}
                    <a href={b.buyUrl} target="_blank" rel="noopener noreferrer" className="ds-btn ds-btn-line ds-btn-sm">Buy it <Ext /></a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const CSS = `
.bk { background: var(--bg); min-height: 70vh; padding-bottom: clamp(48px, 9vh, 96px); }
.bk-hero { padding: clamp(32px, 6vh, 64px) 0 clamp(16px, 3vh, 28px); background: linear-gradient(180deg, color-mix(in srgb, var(--accent-dim) 60%, var(--bg)) 0%, var(--bg) 100%); }
.bk-h1 { font-size: clamp(2.1rem, 4.6vw, 3.2rem); margin: 0 0 var(--space-3); }
.bk-lede { max-width: 700px; }
.bk-parts { display: flex; gap: var(--space-2); padding: var(--space-4) 0 var(--space-5); overflow-x: auto; scrollbar-width: none; }
.bk-parts::-webkit-scrollbar { display: none; }
.bk-part { flex-shrink: 0; display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 var(--space-4); border: 1.5px solid var(--border2); border-radius: var(--radius-full); background: var(--ds-card); color: var(--text2); font: inherit; font-size: 0.9rem; font-weight: 700; white-space: nowrap; cursor: pointer; }
.bk-part i { width: 9px; height: 9px; border-radius: 50%; background: var(--t); }
.bk-part span { font-weight: 600; color: var(--text3); font-variant-numeric: tabular-nums; }
.bk-part.on { border-color: var(--t, var(--accent)); background: var(--w, var(--accent-dim)); color: var(--t, var(--accent-text)); }
.bk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: var(--space-4); }
.bk-card { display: flex; gap: var(--space-4); padding: var(--space-4); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
/* The drawn cover: a spine shadow down the left, a faint pattern, white type. */
.bk-cover { position: relative; width: 120px; flex-shrink: 0; aspect-ratio: 2 / 3; align-self: flex-start; display: flex; flex-direction: column; padding: 12px 10px 10px 16px; border-radius: 3px 7px 7px 3px; overflow: hidden; color: #fff; background-color: var(--c); box-shadow: 0 1px 2px rgba(0,0,0,0.18), 0 6px 16px -6px rgba(0,0,0,0.35); }
.bk-cover::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 9px; background: linear-gradient(90deg, rgba(0,0,0,0.32), rgba(0,0,0,0.08) 70%, rgba(255,255,255,0.12)); }
.bk-cover::after { content: ''; position: absolute; inset: 0; pointer-events: none; }
.bk-cover.m0::after { background: radial-gradient(circle at 82% 18%, transparent 0 22px, rgba(255,255,255,0.16) 23px 25px, transparent 26px 34px, rgba(255,255,255,0.1) 35px 36px, transparent 37px); }
.bk-cover.m1::after { background: repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 5px, transparent 5px 13px); -webkit-mask: linear-gradient(transparent 55%, #000 75%); mask: linear-gradient(transparent 55%, #000 75%); }
.bk-cover.m2::after { background: repeating-linear-gradient(135deg, rgba(255,255,255,0.07) 0 2px, transparent 2px 9px); -webkit-mask: linear-gradient(transparent 30%, #000 100%); mask: linear-gradient(transparent 30%, #000 100%); }
.bk-cover.m3::after { background: radial-gradient(ellipse 70% 38% at 50% 100%, rgba(255,255,255,0.16) 0 99%, transparent 100%), radial-gradient(ellipse 50% 26% at 50% 100%, rgba(0,0,0,0.12) 0 99%, transparent 100%); }
.bk-cover > span { position: relative; z-index: 1; }
.bk-cover-part { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.02em; opacity: 0.8; }
.bk-cover-title { margin-top: 10px; font-size: 0.86rem; font-weight: 800; line-height: 1.2; letter-spacing: -0.01em; overflow-wrap: anywhere; }
.bk-cover-title.sm { font-size: 0.74rem; }
.bk-cover-title.xs { font-size: 0.64rem; }
.bk-cover-rule { width: 22px; height: 2px; margin: 8px 0; border-radius: 2px; background: rgba(255,255,255,0.7); }
.bk-cover-author { margin-top: auto; font-size: 0.62rem; font-weight: 600; line-height: 1.25; opacity: 0.92; }
.bk-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.bk-part-name { font-size: 0.78rem; font-weight: 700; color: var(--t); }
.bk-title { margin: 0; font-size: 1.05rem; font-weight: 800; line-height: 1.3; }
.bk-author { font-size: 0.9rem; color: var(--text2); }
.bk-desc { margin: var(--space-2) 0 0; font-size: 0.9rem; line-height: 1.55; color: var(--text2); }
.bk-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: auto; padding-top: var(--space-3); }
@media (max-width: 900px) { .bk-grid { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 640px) {
  .bk-parts { margin-right: calc(-1 * var(--space-4)); padding-right: var(--space-4); }
  .bk-card { gap: var(--space-3); padding: var(--space-3); }
  .bk-cover { width: 92px; padding: 9px 7px 8px 13px; }
  .bk-cover-title { font-size: 0.72rem; }
  .bk-cover-title.sm { font-size: 0.64rem; }
  .bk-cover-title.xs { font-size: 0.56rem; }
  .bk-cover-author { font-size: 0.56rem; }
  .bk-desc { font-size: 0.88rem; }
}
`;
