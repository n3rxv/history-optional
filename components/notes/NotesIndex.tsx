import Link from 'next/link';
import { allNotes } from '@/lib/notes';
import NotesBrowser, { type BrowserNote } from './NotesBrowser';
import StudiedRing from './StudiedRing';
import { SECTIONS, SectionIcon, type SectionKey } from './sections';

/**
 * Every page that lists notes: /notes, with Paper I and Paper II as tabs
 * (/paper1 and /paper2 redirect to it), and the four section pages. They used
 * to be seven separately written pages that had drifted in layout and in
 * what they showed; now each passes what it is about, and the browser
 * underneath is the same.
 */

type Variant = 'all' | SectionKey;

const BACK = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;

export default function NotesIndex({ variant }: { variant: Variant }) {
  const notes: BrowserNote[] = allNotes.map((n) => ({
    slug: n.slug, title: n.title, topic: n.topic, paper: n.paper as 1 | 2, section: n.section,
    description: n.description, subtopics: n.subtopics ?? [],
  }));
  const section = SECTIONS.find((s) => s.key === variant);

  const head = section
    ? {
        back: { href: section.paper === 1 ? '/notes' : '/notes?paper=2', label: `Paper ${section.paper === 1 ? 'I' : 'II'}` },
        title: `${section.name} notes`,
        lede: `${section.sub}, in ${notes.filter((n) => n.section === section.name).length} topics. Read them in order, or jump to the one you need.`,
        icon: section.key,
      }
    : { back: { href: '/', label: 'Home' }, title: 'Notes', lede: `Every topic in both papers. The historians and their arguments are worked into each one, so you don't need a separate book for them.`, icon: 'notes' as const };

  const tint = section ? { ['--t' as string]: `var(--tint-${section.key})`, ['--w' as string]: `var(--wash-${section.key})` } : { ['--t' as string]: 'var(--accent-text)', ['--w' as string]: 'var(--accent-wash)' };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: NOTES_INDEX_CSS }} />
      <div className="ni ds" style={tint}>
        <section className="ni-hero">
          <div className="ds-container ni-hero-row">
            <div className="ni-hero-main">
            <Link href={head.back.href} className="ds-back">{BACK}{head.back.label}</Link>
            <div className="ni-title">
              <span className="ni-icon" aria-hidden="true"><SectionIcon id={head.icon} size={24} /></span>
              <h1 className="ds-h1">{head.title}</h1>
            </div>
            <p className="ds-lede ni-lede">{head.lede}</p>
            {section && (
              <nav className="ni-siblings" aria-label="Other parts of the syllabus">
                {SECTIONS.filter((s) => s.key !== section.key).map((s) => (
                  <Link key={s.key} href={s.href} style={{ ['--st' as string]: `var(--tint-${s.key})` }}><span aria-hidden="true" />{s.name}</Link>
                ))}
              </nav>
            )}
            </div>
            <div className="ni-hero-side">
              <StudiedRing slugs={(section ? notes.filter((n) => n.section === section.name) : notes).map((n) => n.slug)} />
            </div>
          </div>
        </section>
        <section className="ni-body">
          <div className="ds-container">
            <NotesBrowser notes={notes} onlySection={section?.name} />
          </div>
        </section>
      </div>
    </>
  );
}

const NOTES_INDEX_CSS = `
.ni { background: var(--bg); min-height: 70vh; }
.ni-hero { padding: clamp(20px, 4vh, 44px) 0 clamp(20px, 3vh, 32px); background: linear-gradient(180deg, color-mix(in srgb, var(--w) 70%, var(--bg)) 0%, var(--bg) 100%); }
.ni-title { display: flex; align-items: center; gap: var(--space-3); margin: var(--space-4) 0 var(--space-2); }
.ni-title .ds-h1 { font-size: clamp(1.9rem, 4vw, 2.8rem); }
.ni-icon { width: 48px; height: 48px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 14px; background: var(--ds-card); color: var(--t); border: 1px solid var(--border); box-shadow: var(--elev-1); }
.ni-lede { max-width: 720px; }
.ni-hero-row { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-6); }
.ni-hero-main { min-width: 0; }
.ni-hero-side { flex-shrink: 0; padding-bottom: var(--space-1); }
.ni-siblings { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-4); }
.ni-siblings a { display: inline-flex; align-items: center; gap: 7px; min-height: 34px; padding: 0 var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-full); background: var(--ds-card); color: var(--text2); font-size: 0.86rem; text-decoration: none; transition: border-color 0.15s, color 0.15s; }
.ni-siblings a:hover { border-color: var(--st); color: var(--text); }
.ni-siblings a span { width: 8px; height: 8px; border-radius: 50%; background: var(--st); }
.ni-body { padding: var(--space-4) 0 clamp(48px, 9vh, 96px); }

/* Search and tabs */
.nb2-bar { position: sticky; top: 60px; z-index: 5; display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); padding: var(--space-3) 0; margin-bottom: var(--space-4); background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.nb2-search { flex: 1 1 340px; display: flex; align-items: center; gap: var(--space-2); height: 48px; padding: 0 var(--space-2) 0 var(--space-4); background: var(--ds-card); border: 1.5px solid var(--border2); border-radius: var(--radius-full); color: var(--text3); transition: border-color 0.15s, box-shadow 0.15s; }
.nb2-search:focus-within { border-color: color-mix(in srgb, var(--accent) 65%, transparent); box-shadow: 0 0 0 4px var(--accent-glow); }
.nb2-search input { flex: 1; min-width: 0; height: 100%; border: none; outline: none; background: none; color: var(--text); font-size: 1rem; }
.nb2-search input::-webkit-search-cancel-button { display: none; }
.nb2-clear { width: 32px; height: 32px; border: none; border-radius: 50%; background: var(--ds-soft); color: var(--text3); cursor: pointer; font-size: 0.8rem; }
.nb2-tabs { display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--radius-full); background: var(--ds-soft); border: 1px solid var(--border); }
.nb2-tab { display: inline-flex; align-items: center; gap: var(--space-2); padding: 9px 18px; border: none; border-radius: var(--radius-full); background: none; color: var(--text2); font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: background 0.18s, color 0.18s, box-shadow 0.18s; }
.nb2-tab span { min-width: 24px; padding: 1px 7px; border-radius: var(--radius-full); background: var(--ds-card); font-size: 0.78rem; font-weight: 600; color: var(--text3); }
.nb2-tab.on { background: var(--ds-card); color: var(--text); box-shadow: var(--elev-1); }
.nb2-tab.on span { background: var(--accent-dim); color: var(--accent-text); }
.nb2-progress { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-4); margin: 0 0 var(--space-2); font-size: 0.95rem; color: var(--text2); }
.nb2-progress strong { color: var(--text); }
.nb2-progress-bar { flex: 1 1 200px; max-width: 360px; height: 6px; border-radius: var(--radius-full); background: var(--ds-soft); overflow: hidden; }
.nb2-progress-bar span { display: block; height: 100%; border-radius: inherit; background: var(--success-text); }
.nb2-found { margin: 0 0 var(--space-4); font-size: 0.95rem; color: var(--text2); }
.nb2-ask { display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-5); margin-bottom: var(--space-6); max-width: 560px; }
.nb2-ask-title { font-weight: 700; color: var(--accent-text); }
.nb2-ask-text { font-size: 0.92rem; color: var(--text2); }

/* Sections: name on the left, the topics beside it */
.nb2-sections { display: flex; flex-direction: column; }
.nb2-section { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: var(--space-6); padding: var(--space-6) 0; border-top: 1px solid var(--border); }
.nb2-section:first-child { border-top: none; padding-top: var(--space-2); }
.nb2-section.solo { grid-template-columns: minmax(0, 1fr); padding-top: var(--space-2); }
.nb2-section-head { display: flex; flex-direction: column; gap: 2px; padding-top: var(--space-2); }
.nb2-section-name { margin: 0; font-size: 1rem; font-weight: 700; line-height: 1.35; }
.nb2-section-name a { color: var(--text); text-decoration: none; }
.nb2-section-name a:hover { color: var(--t); }
.nb2-section-meta { font-size: 0.84rem; font-weight: 600; color: var(--t); }
.nb2-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); }
.nb2-section.solo .nb2-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.nb2-card {
  position: relative; display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-4);
  background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl);
  color: var(--text); transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}
.nb2-card:hover { border-color: color-mix(in srgb, var(--t) 45%, transparent); box-shadow: var(--elev-2); transform: translateY(-1px); }
.nb2-card:has(.nb2-title:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px; }
.nb2-card-top { display: flex; align-items: center; gap: var(--space-3); }
/* The title is the link, stretched over the card; the tick sits above it. */
.nb2-title { font-weight: 700; font-size: 1rem; line-height: 1.35; color: var(--text); text-decoration: none; }
.nb2-title::after { content: ''; position: absolute; inset: 0; border-radius: inherit; }
.nb2-title:focus-visible { outline: none; }
.nb2-n {
  position: relative; z-index: 1; width: 30px; height: 30px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; padding: 0;
  border: 1.5px solid transparent; border-radius: var(--radius-circle); background: var(--w); color: var(--t); font-size: 0.8rem; font-weight: 700; cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.nb2-n-tick { display: none; }
.nb2-n:hover { border-color: var(--success-text); background: var(--success-wash); color: var(--success-text); }
.nb2-n:hover .nb2-n-num { display: none; }
.nb2-n:hover .nb2-n-tick { display: block; }
.nb2-n:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.nb2-card.done .nb2-n { background: var(--success-wash); color: var(--success-text); }
.nb2-card.done .nb2-n .nb2-n-num { display: none; }
.nb2-card.done .nb2-n .nb2-n-tick { display: block; }
.nb2-desc { font-size: 0.88rem; line-height: 1.55; color: var(--text2); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.nb2-subs { display: flex; flex-wrap: wrap; gap: 5px; margin-top: auto; padding-top: var(--space-1); }
.nb2-subs span { padding: 2px 9px; border-radius: var(--radius-full); border: 1px solid var(--border); background: var(--ds-soft); font-size: 0.74rem; color: var(--text2); }
.nb2-subs span.more { color: var(--text3); }

@media (max-width: 760px) {
  .ni-hero-row { flex-direction: column; align-items: stretch; gap: var(--space-4); }
  .ni-hero-side { padding-bottom: 0; }
}
@media (max-width: 960px) {
  .nb2-section { grid-template-columns: minmax(0, 1fr); gap: var(--space-3); }
  .nb2-section-head { flex-direction: row; align-items: baseline; gap: var(--space-2); padding-top: 0; }
  .nb2-section.solo .nb2-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .nb2-bar { gap: var(--space-2); }
  .nb2-search { flex-basis: 100%; height: 46px; }
  .nb2-tabs { display: flex; width: 100%; }
  .nb2-tab { flex: 1; justify-content: center; padding: 8px 10px; }
  .nb2-cards, .nb2-section.solo .nb2-cards { grid-template-columns: minmax(0, 1fr); gap: var(--space-2); }
  .nb2-card { padding: var(--space-3) var(--space-4); }
  .nb2-n { width: 34px; height: 34px; }
}
@media (hover: none) { .nb2-n:hover { border-color: transparent; background: var(--w); color: var(--t); } .nb2-n:hover .nb2-n-num { display: inline; } .nb2-n:hover .nb2-n-tick { display: none; } .nb2-card.done .nb2-n:hover { background: var(--success-wash); color: var(--success-text); } .nb2-card.done .nb2-n:hover .nb2-n-num { display: none; } .nb2-card.done .nb2-n:hover .nb2-n-tick { display: block; } }
@media (prefers-reduced-motion: reduce) { .nb2-card { transition: none; } .nb2-card:hover { transform: none; } }
`;
