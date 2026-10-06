'use client';
import { useMemo, useState } from 'react';
import { useLang } from '@/lib/i18n/LangContext';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import LoginPromptModal from '@/components/LoginPromptModal';
import { tintFor } from '@/components/pyq/sections';
import { timelineEvents, type TimelineEvent } from '@/lib/timeline';

/**
 * Indian and world history on one line, so an event can be placed beside
 * what was happening elsewhere. One column with a rail, read top to bottom on
 * a phone as on a desktop (the old two-sided layout halved every card), and
 * broken by century.
 */

const SECTIONS: { key: 'all' | 'ancient' | 'medieval' | 'modern' | 'world'; value: string; en: string; hi: string }[] = [
  { key: 'all', value: 'all', en: 'Everything', hi: 'सभी' },
  { key: 'ancient', value: 'Ancient India', en: 'Ancient India', hi: 'प्राचीन भारत' },
  { key: 'medieval', value: 'Medieval India', en: 'Medieval India', hi: 'मध्यकालीन भारत' },
  { key: 'modern', value: 'Modern India', en: 'Modern India', hi: 'आधुनिक भारत' },
  { key: 'world', value: 'World History', en: 'World History', hi: 'विश्व इतिहास' },
];
const KEY_OF: Record<string, 'ancient' | 'medieval' | 'modern' | 'world'> = { 'Ancient India': 'ancient', 'Medieval India': 'medieval', 'Modern India': 'modern', 'World History': 'world' };
const EVENTS = [...timelineEvents].sort((a, b) => a.year - b.year);
const CATEGORIES = [...new Set(EVENTS.map((e) => e.category))];

const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
/** "3rd millennium BCE", "4th century BCE", "1st century CE", "19th century". */
function eraOf(year: number): string {
  if (year <= -1000) return `${ordinal(Math.floor((-year - 1) / 1000) + 1)} millennium BCE`;
  if (year < 0) return `${ordinal(Math.floor((-year - 1) / 100) + 1)} century BCE`;
  const c = Math.floor((year - 1) / 100) + 1;
  return `${ordinal(c)} century${c <= 10 ? ' CE' : ''}`;
}

export default function Timeline() {
  const { langHi: hi } = useLang();
  const T = (en: string, h: string) => (hi ? h : en);
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();
  const [section, setSection] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return EVENTS.filter((e) => (section === 'all' || e.section === section) && (category === 'all' || e.category === category)
      && (!q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.yearLabel.toLowerCase().includes(q)));
  }, [section, category, search]);
  // Where a new century begins, for its heading.
  const rows = useMemo(() => shown.map((e, i) => ({ e, head: i === 0 || eraOf(shown[i - 1].year) !== eraOf(e.year) ? eraOf(e.year) : null })), [shown]);
  const categories = section === 'all' ? CATEGORIES : [...new Set(EVENTS.filter((e) => e.section === section).map((e) => e.category))];

  const toggle = (e: TimelineEvent) => {
    if (!requireLogin('Sign in free to explore the UPSC History timeline.')) return;
    setOpen((o) => (o === e.title ? null : e.title));
  };

  return (
    <div className="tl ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="tl-hero">
        <div className="ds-container">
          <h1 className="ds-h1 tl-h1">{T('Timeline', 'समयरेखा')}</h1>
          <p className="ds-lede tl-lede">{T(`${EVENTS.length} events from 2500 BCE to 1991, Indian and world history on one line, so you can place one beside the other in an answer.`, `2500 ईसा पूर्व से 1991 तक ${EVENTS.length} घटनाएँ, भारतीय और विश्व इतिहास एक साथ, ताकि उत्तर में एक को दूसरे के साथ रख सकें।`)}</p>
        </div>
      </header>

      <div className="ds-container">
        <div className="tl-controls">
          <div className="tl-sections" role="radiogroup" aria-label={T('Section', 'भाग')}>
            {SECTIONS.map((s) => (
              <button key={s.key} type="button" role="radio" aria-checked={section === s.value} className={`tl-section${section === s.value ? ' on' : ''}`}
                style={s.key === 'all' ? undefined : tintFor(s.key)} onClick={() => { setSection(s.value); setCategory('all'); }}>
                {s.key !== 'all' && <i aria-hidden="true" />}{hi ? s.hi : s.en}
              </button>
            ))}
          </div>
          <div className="tl-row">
            <label className="tl-search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={T('An event or a year, say “Plassey”', 'कोई घटना या वर्ष खोजें')} aria-label={T('Find an event', 'घटना खोजें')} />
            </label>
            <select className={`tl-select${category !== 'all' ? ' set' : ''}`} value={category} onChange={(e) => setCategory(e.target.value)} aria-label={T('Period', 'काल')}>
              <option value="all">{T('Every period', 'सभी काल')}</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="tl-count">{T(`${shown.length} events`, `${shown.length} घटनाएँ`)}</span>
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="tl-empty"><strong>{T('No event matches', 'कोई घटना नहीं मिली')}</strong><p>{T('Try another word, or show everything.', 'कोई दूसरा शब्द आज़माएँ या सब दिखाएँ।')}</p></div>
        ) : (
          <ol className="tl-list">
            {rows.map(({ e, head }) => {
              const isOpen = open === e.title;
              return (
                <li key={`${e.year}-${e.title}`} className="tl-item" style={tintFor(KEY_OF[e.section])}>
                  {head && <h2 className="tl-era">{head}</h2>}
                  <div className={`tl-event${isOpen ? ' open' : ''}`}>
                    <span className="tl-year">{e.yearLabel}</span>
                    <span className="tl-dot" aria-hidden="true" />
                    <button type="button" className="tl-card" onClick={() => toggle(e)} aria-expanded={isOpen}>
                      <span className="tl-card-top">
                        <span className="tl-year-chip">{e.yearLabel}</span>
                        <span className="tl-cat">{e.category}</span>
                      </span>
                      <span className="tl-title">{e.title}</span>
                      {isOpen && <span className="tl-desc">{e.description}</span>}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
    </div>
  );
}

const CSS = `
.tl { background: var(--bg); min-height: 70vh; padding-bottom: clamp(48px, 9vh, 96px); }
.tl-hero { padding: clamp(32px, 6vh, 64px) 0 clamp(16px, 3vh, 28px); background: linear-gradient(180deg, color-mix(in srgb, var(--accent-dim) 60%, var(--bg)) 0%, var(--bg) 100%); }
.tl-h1 { font-size: clamp(2.1rem, 4.6vw, 3.2rem); margin: 0 0 var(--space-3); }
.tl-lede { max-width: 700px; }
.tl-controls { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4) 0 var(--space-5); }
.tl-sections { display: flex; gap: var(--space-2); overflow-x: auto; scrollbar-width: none; }
.tl-sections::-webkit-scrollbar { display: none; }
.tl-section { flex-shrink: 0; display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 var(--space-4); border: 1.5px solid var(--border2); border-radius: var(--radius-full); background: var(--ds-card); color: var(--text2); font: inherit; font-size: 0.9rem; font-weight: 700; white-space: nowrap; cursor: pointer; }
.tl-section i { width: 9px; height: 9px; border-radius: 50%; background: var(--t); }
.tl-section.on { border-color: var(--t, var(--accent)); background: var(--w, var(--accent-dim)); color: var(--t, var(--accent-text)); }
.tl-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-3); }
.tl-search { flex: 1 1 320px; max-width: 520px; display: flex; align-items: center; gap: var(--space-2); height: 44px; padding: 0 var(--space-4); background: var(--ds-card); border: 1.5px solid var(--border2); border-radius: var(--radius-full); color: var(--text3); }
.tl-search:focus-within { border-color: color-mix(in srgb, var(--accent) 65%, transparent); box-shadow: 0 0 0 4px var(--accent-glow); }
.tl-search input { flex: 1; min-width: 0; height: 100%; border: none; outline: none; background: none; color: var(--text); font: inherit; font-size: 1rem; }
.tl-select { appearance: none; -webkit-appearance: none; height: 44px; max-width: 240px; padding: 0 32px 0 14px; background: var(--ds-card) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center; border: 1px solid var(--border2); border-radius: var(--radius-full); color: var(--text); font: inherit; font-size: 0.9rem; cursor: pointer; }
.tl-select.set { border-color: color-mix(in srgb, var(--accent) 50%, transparent); background-color: var(--accent-dim); color: var(--accent-text); font-weight: 600; }
.tl-count { font-size: 0.88rem; color: var(--text3); }

.tl-list { list-style: none; margin: 0; padding: 0; max-width: 860px; position: relative; }
.tl-era { margin: var(--space-6) 0 var(--space-3) 132px; font-size: 0.95rem; font-weight: 800; color: var(--text); }
.tl-item:first-child .tl-era { margin-top: 0; }
.tl-event { position: relative; display: grid; grid-template-columns: 110px 22px minmax(0, 1fr); align-items: start; column-gap: 0; }
.tl-event::before { content: ''; position: absolute; left: 120px; top: 0; bottom: 0; width: 2px; background: var(--border); }
.tl-year { padding-top: 14px; padding-right: var(--space-3); text-align: right; font-size: 0.88rem; font-weight: 700; color: var(--t); font-variant-numeric: tabular-nums; }
.tl-dot { position: relative; z-index: 1; width: 12px; height: 12px; margin: 17px 0 0 5px; border-radius: 50%; background: var(--bg); border: 2.5px solid var(--t); }
.tl-event.open .tl-dot { background: var(--t); }
.tl-card { margin: 4px 0; display: flex; flex-direction: column; gap: 4px; padding: var(--space-3) var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--ds-card); color: var(--text); font: inherit; text-align: left; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; }
.tl-card:hover { border-color: color-mix(in srgb, var(--t) 45%, transparent); }
.tl-event.open .tl-card { border-color: var(--t); box-shadow: var(--elev-1); }
.tl-card-top { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.tl-year-chip { display: none; padding: 1px 9px; border-radius: var(--radius-full); background: var(--w); color: var(--t); font-size: 0.78rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.tl-cat { font-size: 0.78rem; font-weight: 600; color: var(--text3); }
.tl-title { font-size: 1rem; font-weight: 700; line-height: 1.4; }
.tl-desc { margin-top: 4px; padding-top: var(--space-2); border-top: 1px solid var(--border); font-size: 0.93rem; line-height: 1.6; color: var(--text2); }
.tl-empty { padding: var(--space-8) var(--space-5); border-radius: var(--radius-xl); background: var(--ds-soft); text-align: center; max-width: 860px; }
.tl-empty p { margin: 4px 0 0; color: var(--text2); }

@media (max-width: 640px) {
  .tl-sections { margin-right: calc(-1 * var(--space-4)); padding-right: var(--space-4); }
  .tl-search { flex-basis: 100%; max-width: none; }
  .tl-select { flex: 1; max-width: none; }
  /* On a phone the year moves into the card, and the rail sits at the edge. */
  .tl-event { grid-template-columns: 20px minmax(0, 1fr); }
  .tl-event::before { left: 5px; }
  .tl-year { display: none; }
  .tl-dot { margin: 17px 0 0 0; }
  .tl-year-chip { display: inline-flex; }
  .tl-era { margin-left: 20px; }
}
@media (prefers-reduced-motion: reduce) { .tl-card { transition: none; } }
`;
