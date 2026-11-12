'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { MapChapter, MapChapterSites, MapSite } from '@/lib/mapBook';
import type { MapBase } from '@/components/MappingMap';
import { askedByChapter, bookEntry, close, nameVariants, norm as normName, paper, paperYears, repeatedPlaces, upscHints, type AskedPlace } from '@/lib/mapPapers';
import { useLang } from '@/lib/i18n/LangContext';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { useRefreshSafe } from '@/hooks/useRefreshSafe';
import LoginPromptModal from '@/components/LoginPromptModal';
import OwlLoader from '@/components/OwlLoader';

const MappingMap = dynamic(() => import('@/components/MappingMap'), {
  ssr: false,
  loading: () => <div className="mp-map-wait"><OwlLoader size="small" label="Loading the map" /></div>,
});

const PARTS: { key: string; en: string; hi: string }[] = [
  { key: 'Reference', en: 'Reference', hi: 'संदर्भ' },
  { key: 'Pre-Historic Era', en: 'Pre-Historic', hi: 'प्रागैतिहासिक' },
  { key: 'Proto-Historic Era', en: 'Proto-Historic', hi: 'आद्य-ऐतिहासिक' },
  { key: 'Historic Era', en: 'Historic', hi: 'ऐतिहासिक' },
  { key: 'Theme-Based Sites', en: 'Themes', hi: 'विषय-आधारित' },
];

// The sites, fetched once per language per visit.
const books = new Map<string, Promise<MapChapterSites[]>>();
function loadBook(lang: 'en' | 'hi') {
  let p = books.get(lang);
  if (!p) {
    p = fetch(`/api/map-book/${lang}`).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
    p.catch(() => books.delete(lang));
    books.set(lang, p);
  }
  return p;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const variants = (name: string) => name.split(/[/,()]|\salso known as\s|\sया\s|\sor\s/i).map((s) => s.trim()).filter((s) => s.length > 2);
const norm = (s: string) => s.normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const away = (a: MapSite, b: MapSite) => Math.hypot(a.lat - b.lat, a.lng - b.lng);

/** The significance with the name and the place masked, cut to two sentences. */
function clueFor(site: MapSite): string {
  let clue = site.about || '';
  for (const v of [...variants(site.label), ...variants(site.name)]) clue = clue.replace(new RegExp(escapeRe(v), 'gi'), '___');
  for (const part of site.place.split(',').map((p) => p.trim()).filter((p) => p.length > 3)) clue = clue.replace(new RegExp(escapeRe(part), 'gi'), '___');
  const sentences = clue.match(/[^.!?।]+[.!?।]+/g) || [clue];
  return sentences.slice(0, 2).join(' ').trim();
}

/**
 * Three wrong answers near the right one, so the map has to be read, not
 * guessed from the region. A place within about 5 km, or sharing a word of its
 * name ("Sopara" and "Nala Sopara"), is the same place under another name and
 * is never offered as a wrong answer to itself.
 */
function distractors(site: MapSite, all: MapSite[]): MapSite[] {
  const own = site.name.toLowerCase().split(/[/\-,\s]+/).filter((t) => t.length > 3);
  const out: MapSite[] = [];
  for (const s of [...all].sort((a, b) => away(site, a) - away(site, b))) {
    if (s.name === site.name || away(site, s) < 0.05) continue;
    if (s.name.toLowerCase().split(/[/\-,\s]+/).some((t) => t.length > 3 && own.includes(t))) continue;
    if (out.some((o) => away(o, s) < 0.05 || o.name === s.name)) continue;
    out.push(s);
    if (out.length === 3) break;
  }
  return out;
}

function newRound(pool: MapSite[], all: MapSite[], after?: string) {
  const from = after && pool.length > 1 ? pool.filter((s) => s.name !== after) : pool;
  const site = from[Math.floor(Math.random() * from.length)];
  return { site, options: shuffle([site, ...distractors(site, all)]) };
}

// ─── Quiz ───
function Quiz({ pool, all, hi, format, base, grid }: { pool: MapSite[]; all: MapSite[]; hi: boolean; format: 'pick' | 'type'; base: MapBase; grid: boolean }) {
  const T = (en: string, h: string) => (hi ? h : en);
  const [round, setRound] = useState(() => newRound(pool, all));
  const [chosen, setChosen] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  // Open or shut by the reader, for this place only. Unset, the clue is shut
  // when UPSC's own hint is there to go on, as it would be in the exam.
  const [clueOpen, setClueOpen] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const quizRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const { site, options } = round;
  const hints = useMemo(() => site.hints ?? upscHints(site), [site]);
  const clue = clueFor(site);
  // On a past paper's quiz the text is UPSC's hint, so there is no clue beyond it.
  const hasClue = !!site.about && !hints.some((h) => h.hint === site.about);
  const showClue = clueOpen ?? hints.length === 0;
  const answered = chosen !== null;
  const right = answered && (format === 'pick'
    ? chosen === site.name
    : [...variants(site.name), ...variants(site.label), site.name, site.label].some((v) => norm(v) === norm(chosen)));

  const answer = (value: string) => {
    if (answered || !value.trim()) return;
    setChosen(value);
    const ok = format === 'pick' ? value === site.name : [...variants(site.name), ...variants(site.label), site.name, site.label].some((v) => norm(v) === norm(value));
    setScore((p) => ({ right: p.right + (ok ? 1 : 0), total: p.total + 1 }));
    setStreak((p) => (ok ? p + 1 : 0));
  };
  const next = () => {
    setRound(newRound(pool, all, site.name));
    setChosen(null); setTyped(''); setClueOpen(null);
    // Back up to the map if reading the answer took the reader below it.
    const top = quizRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 64) window.scrollTo({ top: window.scrollY + top - 76, behavior: 'smooth' });
    if (format === 'type') requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  };
  // The verdict and the next button come into view once answered.
  useEffect(() => {
    if (answered) answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [answered]);
  const accuracy = score.total ? Math.round((score.right / score.total) * 100) : 0;

  return (
    <div className="mp-quiz" ref={quizRef}>
      <div className="mp-quiz-head">
        <span className="mp-quiz-prompt">{T('Which place is marked on the map?', 'मैप पर कौन-सा स्थल चिह्नित है?')}</span>
        <span className="mp-quiz-score">
          {streak >= 3 && <span className="mp-streak">{T(`${streak} in a row`, `लगातार ${streak}`)}</span>}
          <span>{T(`${score.right} of ${score.total} right`, `${score.total} में ${score.right} सही`)}{score.total > 0 ? ` · ${accuracy}%` : ''}</span>
          {score.total > 0 && <button type="button" className="mp-link" onClick={() => { setScore({ right: 0, total: 0 }); setStreak(0); next(); }}>{T('Start over', 'फिर से शुरू करें')}</button>}
        </span>
      </div>

      <div className="mp-quiz-map">
        <MappingMap sites={[site]} selected={answered ? site.name : null} onPick={() => {}} base={base} grid={grid} fixed quiet />
      </div>

      {(hints.length > 0 || hasClue) && (
        <div className="mp-prompt">
          {hints.length > 0 && (
            <div className="mp-upsc">
              <span className="mp-upsc-head">{T(hints.length > 1 ? 'In UPSC papers' : 'In the UPSC paper', 'UPSC प्रश्नपत्र में')}</span>
              <ul>
                {hints.map((h) => <li key={h.hint}><b>{h.years.join(', ')}</b><span lang="en">{h.hint}</span></li>)}
              </ul>
            </div>
          )}
          {hasClue && (
            <div className="mp-clue">
              <div className="mp-clue-head">
                <span>{T('A clue', 'संकेत')}</span>
                <button type="button" className="mp-link" aria-expanded={showClue} onClick={() => setClueOpen(!showClue)}>{showClue ? T('Hide', 'छिपाएँ') : T('Show', 'दिखाएँ')}</button>
              </div>
              {showClue && <p>{clue}</p>}
            </div>
          )}
        </div>
      )}

      {format === 'pick' ? (
        <div className="mp-options">
          {options.map((o) => {
            const state = answered ? (o.name === site.name ? ' right' : o.name === chosen ? ' wrong' : ' faded') : '';
            return (
              <button key={o.name} type="button" className={`mp-option${state}`} onClick={() => answer(o.name)} disabled={answered}>
                <span>{o.label}</span>
                {answered && <small>{o.place}</small>}
              </button>
            );
          })}
        </div>
      ) : (
        <form className="mp-type" onSubmit={(e) => { e.preventDefault(); answer(typed); }}>
          <input ref={inputRef} value={typed} onChange={(e) => setTyped(e.target.value)} disabled={answered}
            className={answered ? (right ? 'right' : 'wrong') : ''} placeholder={T('Type the place’s name', 'स्थल का नाम लिखें')} aria-label={T('The place’s name', 'स्थल का नाम')} autoComplete="off" />
          <button type="submit" className="ds-btn ds-btn-solid" disabled={answered || !typed.trim()}>{T('Check', 'जाँचें')}</button>
        </form>
      )}

      {answered && (
        <div ref={answerRef} className={`mp-answer${right ? ' right' : ''}`}>
          <div className="mp-answer-top">
            <strong>{right ? T('Right', 'सही') : T('Not quite', 'सही नहीं')}: {site.label}</strong>
            <span>{site.place}</span>
          </div>
          {hasClue && (!showClue || clue !== site.about) && <p>{site.about}</p>}
          {/* The hints above give their years, but a past paper's gives only its own. */}
          {site.asked.length > 0 && (!hints.length || site.hints) && <p className="mp-asked">{T('Asked by UPSC in', 'UPSC ने पूछा')} {site.asked.join(', ')}</p>}
          <button type="button" className="ds-btn ds-btn-solid ds-btn-sm" onClick={next}>{T('Next place', 'अगला स्थल')}</button>
        </div>
      )}
    </div>
  );
}

// ─── A chapter ───
function Chapter({ chapter, open, onToggle, sites, selected, onPick, askedOnly, onToggleAsked, mapBase, grid, hi }: {
  chapter: MapChapter; open: boolean; onToggle: () => void; sites: MapSite[] | null; selected: string | null; onPick: (name: string) => void;
  askedOnly: boolean; onToggleAsked: () => void; mapBase: MapBase; grid: boolean; hi: boolean;
}) {
  const T = (en: string, h: string) => (hi ? h : en);
  const [region, setRegion] = useState('All');
  const listRef = useRef<HTMLDivElement>(null);
  const base = useMemo(() => (sites ?? []).filter((s) => !askedOnly || s.asked.length > 0), [sites, askedOnly]);
  const regions = useMemo(() => ['All', ...[...new Set(base.map((s) => s.region))].sort()], [base]);
  const shown = region === 'All' || !regions.includes(region) ? base : base.filter((s) => s.region === region);
  const picked = shown.find((s) => s.name === selected);

  // However a place is picked (a dot on the map, a search result, a refresh),
  // the list beside the map scrolls to it, the list only and not the page,
  // and only when it is out of view. It used to follow only the map's dots.
  useEffect(() => {
    const list = listRef.current;
    const item = [...(list?.querySelectorAll<HTMLElement>('[data-site]') ?? [])].find((el) => el.dataset.site === selected);
    if (!list || !item || list.scrollHeight <= list.clientHeight) return;
    // The list is positioned, so an item's offsetTop is measured from it.
    const top = item.offsetTop, bottom = top + item.offsetHeight;
    if (top < list.scrollTop || bottom > list.scrollTop + list.clientHeight) list.scrollTo({ top: Math.max(0, top - 8), behavior: 'smooth' });
  }, [selected, sites, shown.length]);

  return (
    <section id={`ch-${chapter.key}`} className={`mp-section${open ? ' open' : ''}`}>
      <button type="button" className="mp-section-head" onClick={onToggle} aria-expanded={open}>
        {chapter.number > 0 && <span className="mp-num">{chapter.number}</span>}
        <span className="mp-section-title">{hi && chapter.topicHi ? chapter.topicHi : chapter.topic}</span>
        <span className="mp-section-meta">
          {T(`${chapter.count} places`, `${chapter.count} स्थल`)}
          {chapter.asked > 0 && <span className="mp-asked-n">{T(`${chapter.asked} asked`, `${chapter.asked} पूछे गए`)}</span>}
        </span>
        <svg className="mp-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="mp-section-body">
          {!sites ? (
            <div className="mp-map-wait"><OwlLoader size="small" label={T('Loading the places', 'स्थल लोड हो रहे हैं')} /></div>
          ) : (
            <>
              <div className="mp-tools">
                {chapter.asked > 0 && (
                  <button type="button" className={`mp-chip${askedOnly ? ' on' : ''}`} aria-pressed={askedOnly} onClick={onToggleAsked}>
                    {T('Only those asked', 'केवल पूछे गए')}
                  </button>
                )}
                {regions.length > 2 && (
                  <select className={`mp-select${region !== 'All' ? ' set' : ''}`} value={regions.includes(region) ? region : 'All'} onChange={(e) => setRegion(e.target.value)} aria-label={T('State or country', 'राज्य या देश')}>
                    {regions.map((r) => <option key={r} value={r}>{r === 'All' ? T('Every state', 'सभी राज्य') : r}</option>)}
                  </select>
                )}
                <span className="mp-count">{T(`${shown.length} shown`, `${shown.length} दिख रहे`)}</span>
              </div>
              {shown.length === 0 ? (
                <p className="mp-few">{askedOnly ? T('No place in this chapter has been asked yet.', 'इस अध्याय का कोई स्थल अभी तक नहीं पूछा गया।') : T('No places here.', 'यहाँ कोई स्थल नहीं।')}</p>
              ) : (
                <div className="mp-split">
                  <div className="mp-map-col">
                    <MappingMap sites={shown} selected={selected} onPick={onPick} base={mapBase} grid={grid} />
                    {picked && (
                      <div className="mp-picked">
                        <div className="mp-place-top"><strong>{picked.label}</strong>{picked.asked.length > 0 && <span className="mp-year">{picked.asked.join(', ')}</span>}</div>
                        <span className="mp-place-where">{picked.place}</span>
                        <p>{picked.about}</p>
                      </div>
                    )}
                  </div>
                  <div className="mp-list" ref={listRef}>
                    {shown.map((s) => {
                      const on = selected === s.name;
                      return (
                        <button key={s.name} data-site={s.name} type="button" className={`mp-place${on ? ' on' : ''}${s.asked.length ? ' asked' : ''}`} onClick={() => onPick(s.name)} aria-expanded={on}>
                          <span className="mp-place-top">
                            <strong>{s.label}</strong>
                            {s.asked.length > 0 && <span className="mp-year">{s.asked.join(', ')}</span>}
                          </span>
                          <span className="mp-place-where">{s.place}</span>
                          {on && <span className="mp-place-sig">{s.about}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

const Switch = ({ on, onClick, children, tone }: { on: boolean; onClick: () => void; children: React.ReactNode; tone?: 'amber' }) => (
  <button type="button" role="switch" aria-checked={on} className={`mp-switch${on ? ' on' : ''}${tone ? ` ${tone}` : ''}`} onClick={onClick}>
    <span className="mp-switch-track" aria-hidden="true"><span /></span>{children}
  </button>
);

const BASES: { key: MapBase; en: string; hi: string }[] = [
  { key: 'political', en: 'Political', hi: 'राजनीतिक' },
  { key: 'physical', en: 'Physical', hi: 'भौतिक' },
  { key: 'outline', en: 'No boundaries', hi: 'सीमा रहित' },
];
const BaseSeg = ({ value, onChange, hi }: { value: MapBase; onChange: (b: MapBase) => void; hi: boolean }) => (
  <div className="mp-seg mp-base" role="radiogroup" aria-label={hi ? 'मैप का प्रकार' : 'Map type'}>
    {BASES.map((b) => (
      <button key={b.key} type="button" role="radio" aria-checked={value === b.key} className={value === b.key ? 'on' : ''} onClick={() => onChange(b.key)}>{hi ? b.hi : b.en}</button>
    ))}
  </div>
);

/** The chapter keys a quiz source stands for: null for every chapter or a past paper, else the chapters picked. */
const quizKeys = (source: string) => (source === 'all' || source.startsWith('y-') ? null : source.split(',').filter(Boolean));

/**
 * What the quiz asks from: every chapter, one past paper, or any mix of
 * chapters, so a reader revising a part can take all its chapters at once.
 * Choices are a draft until Start, so the quiz isn't restarted on every tick.
 * As `pyq`, it picks the chapters for a test of their past questions, with
 * each chapter's count of places asked.
 */
function ChapterPicker({ value, onChange, chapters, places, hi, pyq }: { value: string; onChange: (v: string) => void; chapters: MapChapter[]; places: (source: string) => number; hi: boolean; pyq?: Record<string, number> }) {
  const T = (en: string, h: string) => (hi ? h : en);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const startRef = useRef<HTMLButtonElement>(null);
  const name = (c: MapChapter) => `${c.number > 0 ? `${c.number}. ` : ''}${hi && c.topicHi ? c.topicHi : c.topic}`;
  const parts = PARTS.map((p) => ({ ...p, chapters: chapters.filter((c) => c.part === p.key) })).filter((p) => p.chapters.length);

  const label = (() => {
    if (!value) return '';
    if (value === 'all') return T('All', 'सभी');
    const yr = /^y-(\d{4})$/.exec(value);
    if (yr) return T(`${yr[1]} paper`, `${yr[1]} प्रश्नपत्र`);
    const keys = quizKeys(value) ?? [];
    if (keys.length === 1) { const c = chapters.find((ch) => ch.key === keys[0]); if (c) return name(c); }
    const whole = parts.find((p) => p.chapters.length === keys.length && p.chapters.every((c) => keys.includes(c.key)));
    if (whole) return T(`All ${whole.en}`, `पूरा ${whole.hi}`);
    return T(`${keys.length} chapters`, `${keys.length} अध्याय`);
  })();

  // "All chapters" ticks every box. Unticking it clears them all, so a few can
  // be picked from scratch. Ticking every box by hand is the same as All.
  const allKeys = chapters.map((c) => c.key);
  const picked = draft === 'all' ? allKeys : (quizKeys(draft) ?? []);
  const setKeys = (keys: string[]) => setDraft(keys.length === allKeys.length ? 'all' : allKeys.filter((k) => keys.includes(k)).join(','));
  const allOn = draft === 'all', someOn = picked.length > 0;
  const toggle = (key: string) => setKeys(picked.includes(key) ? picked.filter((k) => k !== key) : [...picked, key]);
  const togglePart = (keys: string[]) => setKeys(keys.every((k) => picked.includes(k)) ? picked.filter((k) => !keys.includes(k)) : [...new Set([...picked, ...keys])]);
  const count = open ? places(draft) : 0;
  const min = pyq ? 1 : 4;

  const show = () => { setDraft(value); setOpen(true); };
  useEffect(() => {
    if (!open) return;
    startRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button type="button" className={`mp-select mp-pick${value && value !== 'all' ? ' set' : ''}`} onClick={show} aria-haspopup="dialog" aria-label={label ? `${T('Choose chapters', 'अध्याय चुनें')}: ${label}` : T('Choose chapters', 'अध्याय चुनें')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6l2 2 3-3M3 13l2 2 3-3M3 20l2 2 3-3M12 6h9M12 13h9M12 20h9" /></svg>
        <span className="mp-pick-t">{T('Choose chapters', 'अध्याय चुनें')}</span>
        {label && <span className="mp-pick-sum">{label}</span>}
      </button>
      {open && (
        <div className="ds-overlay" onClick={() => setOpen(false)}>
          <div className="ds-modal mp-cp" role="dialog" aria-modal="true" aria-labelledby="mp-cp-title" onClick={(e) => e.stopPropagation()}>
            <div className="mp-cp-head">
              <h2 id="mp-cp-title" className="ds-modal-title">{T('Choose what to practise', 'अभ्यास के लिए चुनें')}</h2>
              <p className="ds-modal-text">{pyq
                ? T('Tick as many chapters as you like, a whole part, or all of them. Every place UPSC has asked from them goes into one test.', 'जितने चाहें उतने अध्याय, पूरा भाग या सभी अध्याय चुनें। इनसे UPSC ने जो भी स्थल पूछे, सब एक ही टेस्ट में आएँगे।')
                : T('Tick as many chapters as you like, a whole part, or all of them, and they go into one quiz.', 'जितने चाहें उतने अध्याय, पूरा भाग या सभी अध्याय चुनें, सब एक ही क्विज़ में आएँगे।')}</p>
            </div>
            <div className="mp-cp-body">
              {!pyq && <div className="mp-cp-quick">
                <span className="mp-cp-or">{T('Or take a past paper', 'या पिछला प्रश्नपत्र लें')}</span>
                <select className={`mp-select${draft.startsWith('y-') ? ' set' : ''}`} value={draft.startsWith('y-') ? draft : ''} onChange={(e) => setDraft(e.target.value || 'all')} aria-label={T('A past paper', 'पिछला प्रश्नपत्र')}>
                  <option value="">{T('Choose a year', 'वर्ष चुनें')}</option>
                  {paperYears.map((y) => <option key={y} value={`y-${y}`}>{T(`${y} paper`, `${y} प्रश्नपत्र`)}</option>)}
                </select>
              </div>}
              <label className="mp-cp-row part mp-cp-all">
                <input type="checkbox" checked={allOn} ref={(el) => { if (el) el.indeterminate = someOn && !allOn; }} onChange={() => setDraft(allOn ? '' : 'all')} />
                <span>{T('All chapters', 'सभी अध्याय')}</span>
                <span className="mp-cp-n">{T(`${allKeys.length} chapters`, `${allKeys.length} अध्याय`)}</span>
              </label>
              {parts.map((p) => {
                const keys = p.chapters.map((c) => c.key);
                const all = keys.every((k) => picked.includes(k)), some = keys.some((k) => picked.includes(k));
                return (
                  <fieldset key={p.key} className="mp-cp-part">
                    <legend className="mp-cp-legend">
                      <label className="mp-cp-row part">
                        <input type="checkbox" checked={all} ref={(el) => { if (el) el.indeterminate = some && !all; }} onChange={() => togglePart(keys)} />
                        <span>{hi ? p.hi : p.en}</span>
                        <span className="mp-cp-n">{T(`${keys.length} chapter${keys.length === 1 ? '' : 's'}`, `${keys.length} अध्याय`)}</span>
                      </label>
                    </legend>
                    {p.chapters.map((c) => (
                      <label key={c.key} className="mp-cp-row">
                        <input type="checkbox" checked={picked.includes(c.key)} onChange={() => toggle(c.key)} />
                        <span>{name(c)}</span>
                        <span className="mp-cp-n">{pyq ? T(`${pyq[c.key] ?? 0} asked`, `${pyq[c.key] ?? 0} पूछे गए`) : c.count}</span>
                      </label>
                    ))}
                  </fieldset>
                );
              })}
            </div>
            <div className="mp-cp-foot">
              <button type="button" className="ds-btn ds-btn-line" onClick={() => setOpen(false)}>{T('Cancel', 'रद्द करें')}</button>
              <button type="button" ref={startRef} className="ds-btn ds-btn-solid" disabled={count < min} onClick={() => { onChange(draft); setOpen(false); }}>
                {!draft ? T('Tick a chapter', 'कोई अध्याय चुनें') : count < min ? T('Too few places', 'स्थल बहुत कम हैं')
                  : pyq ? T(`Start test, ${count} place${count === 1 ? '' : 's'}`, `टेस्ट शुरू करें, ${count} स्थल`)
                  : T(`Start quiz, ${count} places`, `क्विज़ शुरू करें, ${count} स्थल`)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * The map book's notes for a past paper's answer, when the book has the place
 * within about 100 km of the paper's pin, or of the place itself where UPSC's
 * dot is elsewhere (`site`).
 */
function noteFor(p: { answer: string; lat: number; lng: number; site?: { lat: number; lng: number } }, all: MapSite[]) {
  const at = { answer: p.answer, ...(p.site ?? { lat: p.lat, lng: p.lng }) };
  const b = bookEntry(at, all);
  return b && Math.hypot(b.lat - at.lat, b.lng - at.lng) < 1 ? b : undefined;
}

/** A typed answer is right if it is one of the answer's names, give or take two letters of spelling. */
function typedRight(typed: string, names: string[]) {
  const t = normName(typed);
  if (t.length < 3) return false;
  return names.flatMap((n) => [n, ...nameVariants(n)]).map(normName).some((v) => v === t || close(v, t));
}

// ─── A map test: places marked on the map, each with UPSC's hint ───
type TestItem = {
  n: number;
  hint: string;
  /** The hint's year, when the places come from more than one paper. */
  year?: number;
  /** The names that count as right. */
  names: string[];
  site: MapSite;
  note?: string;
  /** The other years it was asked. */
  also: number[];
  /** Its hints in those years. */
  more?: { year: number; hint: string }[];
};

/** Study it with the answers, or test yourself: type each name, or show it. */
function TestSheet({ items, summary, view, base, grid, hi }: { items: TestItem[]; summary: React.ReactNode; view: 'study' | 'test'; base: MapBase; grid: boolean; hi: boolean }) {
  const T = (en: string, h: string) => (hi ? h : en);
  const sites = useMemo(() => items.map((it) => it.site), [items]);
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState<Record<number, string>>({});
  const [result, setResult] = useState<Record<number, 'right' | 'wrong' | 'shown'>>({});
  const listRef = useRef<HTMLDivElement>(null);
  const total = items.length;
  const rightN = Object.values(result).filter((r) => r === 'right').length;
  const doneN = Object.keys(result).length;
  const pick = (name: string) => setSelected((s) => (s === name ? null : name));
  const picked = items.find((it) => it.site.name === selected);

  useEffect(() => {
    const list = listRef.current;
    const item = [...(list?.querySelectorAll<HTMLElement>('[data-site]') ?? [])].find((el) => el.dataset.site === selected);
    if (!list || !item || list.scrollHeight <= list.clientHeight) return;
    const top = item.offsetTop, bottom = top + item.offsetHeight;
    if (top < list.scrollTop || bottom > list.scrollTop + list.clientHeight) list.scrollTo({ top: Math.max(0, top - 8), behavior: 'smooth' });
  }, [selected]);

  const check = (it: TestItem) => setResult((r) => ({ ...r, [it.n]: typedRight(typed[it.n] ?? '', [...it.names, it.site.label]) ? 'right' : 'wrong' }));
  const hint = (it: TestItem) => (it.year ? <span><b className="pp-yr">{it.year}</b>{it.hint}</span> : it.hint);
  const also = (it: TestItem) => it.also.length > 0 && <span className="mp-year">{T('Also', 'यह भी')} {it.also.join(', ')}</span>;
  const more = (it: TestItem) => !!it.more?.length && <span className="pp-hints">{it.more.map((h) => <span key={`${h.year}-${h.hint}`}><b>{h.year}</b> {h.hint}</span>)}</span>;

  return (
    <div className="pp">
      <div className="pp-summary">
        {summary}
        {view === 'test' && (
          <span className="pp-score">
            {T(`${rightN} of ${total} right`, `${total} में ${rightN} सही`)}{doneN > 0 && doneN < total ? T(` · ${doneN} tried`, ` · ${doneN} किए`) : ''}
            {doneN < total && <button type="button" className="mp-link" onClick={() => setResult((r) => Object.fromEntries(items.map((it) => [it.n, r[it.n] ?? 'shown'])))}>{T('Show all answers', 'सभी उत्तर दिखाएँ')}</button>}
            {doneN > 0 && <button type="button" className="mp-link" onClick={() => { setResult({}); setTyped({}); }}>{T('Start over', 'फिर से शुरू करें')}</button>}
          </span>
        )}
      </div>
      <div className="mp-split">
        <div className="mp-map-col">
          <MappingMap sites={sites} selected={selected} onPick={pick} base={base} grid={grid} quiet={view === 'test'} />
          {picked && (
            <div className="mp-picked">
              <div className="mp-place-top"><strong>{picked.n}. {view === 'test' && !result[picked.n] ? picked.hint : picked.site.label}</strong></div>
              {(view === 'study' || result[picked.n]) && <>
                {picked.site.place && <span className="mp-place-where">{picked.site.place}</span>}
                <p>{picked.hint}</p>
              </>}
            </div>
          )}
        </div>
        <div className="mp-list pp-list" ref={listRef}>
          {items.map((it) => {
            const s = it.site;
            const on = selected === s.name;
            if (view === 'study') {
              return (
                <button key={s.name} data-site={s.name} type="button" className={`mp-place pp-item${on ? ' on' : ''}`} onClick={() => pick(s.name)} aria-expanded={on}>
                  <span className="pp-hint"><span className="pp-n">{it.n}</span>{hint(it)}</span>
                  <span className="mp-place-top">
                    <strong>{s.label}</strong>
                    {also(it)}
                  </span>
                  {s.place && <span className="mp-place-where">{s.place}</span>}
                  {it.note && <span className="pp-dispute">{it.note}</span>}
                  {on && more(it)}
                  {on && s.about && <span className="mp-place-sig">{s.about}</span>}
                </button>
              );
            }
            const r = result[it.n];
            return (
              <div key={s.name} data-site={s.name} className={`mp-place pp-item pp-test${on ? ' on' : ''}${r ? ` ${r}` : ''}`}>
                <button type="button" className="pp-hint pp-hint-btn" onClick={() => pick(s.name)} aria-label={T(`Show place ${it.n} on the map`, `स्थल ${it.n} मैप पर दिखाएँ`)}>
                  <span className="pp-n">{it.n}</span>{hint(it)}
                </button>
                {r ? (
                  <div className="pp-result">
                    <span>{r === 'right' ? T('Right', 'सही') : r === 'wrong' ? T('Not quite', 'सही नहीं') : T('Answer', 'उत्तर')}: <strong>{s.label}</strong></span>
                    {r === 'wrong' && typed[it.n] && <small>{T('You wrote', 'आपने लिखा')} “{typed[it.n]}”</small>}
                    {it.note && <small className="pp-dispute">{it.note}</small>}
                    {it.more?.length ? more(it) : also(it)}
                  </div>
                ) : (
                  <form className="pp-try" onSubmit={(e) => { e.preventDefault(); if ((typed[it.n] ?? '').trim()) check(it); }}>
                    <input value={typed[it.n] ?? ''} onChange={(e) => setTyped((t) => ({ ...t, [it.n]: e.target.value }))} onFocus={() => setSelected(s.name)}
                      placeholder={T('Your answer', 'आपका उत्तर')} aria-label={T(`Your answer for place ${it.n}`, `स्थल ${it.n} का आपका उत्तर`)} autoComplete="off" />
                    <button type="submit" className="ds-btn ds-btn-solid ds-btn-sm" disabled={!(typed[it.n] ?? '').trim()}>{T('Check', 'जाँचें')}</button>
                    <button type="button" className="mp-link" onClick={() => setResult((x) => ({ ...x, [it.n]: 'shown' }))}>{T('Show', 'दिखाएँ')}</button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── One past paper ───
function PaperView({ year, view, base, grid, hi, all }: { year: number; view: 'study' | 'test'; base: MapBase; grid: boolean; hi: boolean; all: MapSite[] }) {
  const T = (en: string, h: string) => (hi ? h : en);
  const items: TestItem[] = useMemo(() => paper(year).map((p) => {
    const b = noteFor(p, all);
    return {
      n: p.number, hint: p.hint, names: [p.answer], note: p.note, also: p.askedIn.filter((y) => y !== year),
      site: { name: `${year}-${p.number}`, label: (hi && b?.label) || p.answer, place: b?.place ?? '', about: b?.about ?? '', asked: p.askedIn, lat: p.lat, lng: p.lng, region: '', num: p.number },
    };
  }), [all, hi, year]);
  const before = items.filter((it) => it.site.asked.some((y) => y < year)).length;
  const summary = <>
    <span>{T(`${year}, Paper I, Question 1: twenty places`, `${year}, प्रश्नपत्र I, प्रश्न 1: बीस स्थल`)}</span>
    {before > 0 && <span className="mp-asked-n">{T(`${before} of them asked before`, `इनमें से ${before} पहले भी पूछे गए`)}</span>}
  </>;
  return <TestSheet items={items} summary={summary} view={view} base={base} grid={grid} hi={hi} />;
}

// ─── Every place UPSC has asked from the chapters picked ───
// Each place once, under its latest hint, newest first: a place asked in four
// papers is one question, with the other years' hints shown with the answer.
function ChapterPaper({ places, view, base, grid, hi, all }: { places: AskedPlace[]; view: 'study' | 'test'; base: MapBase; grid: boolean; hi: boolean; all: MapSite[] }) {
  const T = (en: string, h: string) => (hi ? h : en);
  const items: TestItem[] = useMemo(() => places.map((p, i) => {
    const b = noteFor({ answer: p.name, lat: p.lat, lng: p.lng, site: p.site }, all);
    const [latest, ...older] = p.hints;
    return {
      n: i + 1, hint: latest.hint, year: latest.year, names: p.answers, note: latest.note, also: p.years.filter((y) => y !== latest.year), more: older,
      site: { name: `c-${i + 1}`, label: (hi && b?.label) || p.name, place: b?.place ?? '', about: b?.about ?? '', asked: p.years, lat: p.lat, lng: p.lng, region: '', num: i + 1 },
    };
  }), [places, all, hi]);
  const twice = places.filter((p) => p.years.length > 1).length;
  const summary = <>
    <span>{T(`${places.length} place${places.length === 1 ? '' : 's'} UPSC has asked from them, newest first`, `इनसे UPSC द्वारा पूछे गए ${places.length} स्थल, नए पहले`)}</span>
    {twice > 0 && <span className="mp-asked-n">{T(`${twice} asked more than once`, `${twice} एक से अधिक बार पूछे गए`)}</span>}
  </>;
  return <TestSheet items={items} summary={summary} view={view} base={base} grid={grid} hi={hi} />;
}

// ─── The places UPSC keeps asking ───
function RepeatsView({ base, grid, hi, all }: { base: MapBase; grid: boolean; hi: boolean; all: MapSite[] }) {
  const T = (en: string, h: string) => (hi ? h : en);
  const [min, setMin] = useState(3);
  const every = useMemo(() => repeatedPlaces(), []);
  const list = useMemo(() => every.filter((r) => r.years.length >= min), [every, min]);
  const sites: MapSite[] = useMemo(() => list.map((r, i) => {
    const b = noteFor({ answer: r.name, lat: r.lat, lng: r.lng }, all);
    return { name: `r-${r.name}`, label: (hi && b?.label) || r.name, place: b?.place ?? '', about: b?.about ?? '', asked: r.years, lat: r.lat, lng: r.lng, region: '', num: i + 1 };
  }), [list, all, hi]);
  const [selected, setSelected] = useState<string | null>(null);
  const picked = sites.find((s) => s.name === selected);
  const counts = [2, 3, 4].map((n) => ({ n, size: every.filter((r) => r.years.length >= n).length }));
  return (
    <div className="pp">
      <div className="pp-summary">
        <span>{T('Places UPSC has asked more than once since 2013, most asked first', '2013 से UPSC ने जो स्थल एक से अधिक बार पूछे, सबसे अधिक पूछे गए पहले')}</span>
        <div className="mp-seg" role="radiogroup" aria-label={T('How often', 'कितनी बार')}>
          {counts.map(({ n, size }) => (
            <button key={n} type="button" role="radio" aria-checked={min === n} className={min === n ? 'on' : ''} onClick={() => { setMin(n); setSelected(null); }}>
              {T(`${n}+ times`, `${n}+ बार`)} <small>{size}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="mp-split">
        <div className="mp-map-col">
          <MappingMap sites={sites} selected={selected} onPick={(n) => setSelected((s) => (s === n ? null : n))} base={base} grid={grid} />
          {picked && (
            <div className="mp-picked">
              <div className="mp-place-top"><strong>{picked.num}. {picked.label}</strong><span className="mp-year">{picked.asked.join(', ')}</span></div>
              {picked.place && <span className="mp-place-where">{picked.place}</span>}
            </div>
          )}
        </div>
        <div className="mp-list pp-list">
          {list.map((r, i) => {
            const s = sites[i];
            const on = selected === s.name;
            return (
              <button key={s.name} data-site={s.name} type="button" className={`mp-place pp-item${on ? ' on' : ''}`} onClick={() => setSelected((x) => (x === s.name ? null : s.name))} aria-expanded={on}>
                <span className="mp-place-top">
                  <strong><span className="pp-n">{i + 1}</span>{s.label}</strong>
                  <span className="mp-year">{T(`${r.years.length} times`, `${r.years.length} बार`)}</span>
                </span>
                <span className="mp-place-where">{r.years.join(', ')}{s.place ? ` · ${s.place}` : ''}</span>
                {on ? (
                  <span className="pp-hints">{r.hints.map((h) => <span key={`${h.year}-${h.hint}`}><b>{h.year}</b> {h.hint}</span>)}</span>
                ) : (
                  <span className="pp-hint-last">{T('Latest hint', 'हाल का संकेत')}: {r.hints[0].hint}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── The page ───
export default function MapBrowser({ chapters }: { chapters: MapChapter[] }) {
  const { langHi: hi } = useLang();
  const T = (en: string, h: string) => (hi ? h : en);
  const lang = hi ? 'hi' : 'en';
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();

  const [mode, setMode] = useState<'browse' | 'papers' | 'quiz'>('browse');
  const [part, setPart] = useState(PARTS[1].key);
  const [open, setOpen] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [askedOnly, setAskedOnly] = useState(false);
  const [askedFor, setAskedFor] = useState<Record<string, boolean>>({});
  const [base, setBase] = useState<MapBase>('political');
  const [grid, setGrid] = useState(false);
  const [quizBase, setQuizBase] = useState<MapBase>('outline');
  const [paperYear, setPaperYear] = useState<number | 'repeats' | 'chapters'>(paperYears[0]);
  const [paperChapters, setPaperChapters] = useState('');
  const [paperView, setPaperView] = useState<'study' | 'test'>('study');
  const [quizAsked, setQuizAsked] = useState(false);
  const [quizChapter, setQuizChapter] = useState('all');
  const [quizFormat, setQuizFormat] = useState<'pick' | 'type'>('pick');

  // The view is kept for the tab, so a refresh comes back to the same part,
  // the same chapters open and the same switches.
  useRefreshSafe(
    'ho_mapping_v3',
    { mode, part, open, selected, search, askedOnly, askedFor, base, grid, quizBase, quizAsked, quizChapter, quizFormat, paperYear, paperView, paperChapters },
    (v) => {
      setMode(v.mode); if (PARTS.some((p) => p.key === v.part)) setPart(v.part);
      setOpen(v.open); setSelected(v.selected); setSearch(v.search); setAskedOnly(v.askedOnly); setAskedFor(v.askedFor);
      setBase(v.base); setGrid(v.grid); setQuizBase(v.quizBase); setQuizAsked(v.quizAsked); setQuizChapter(v.quizChapter); setQuizFormat(v.quizFormat);
      if (v.paperYear === 'repeats' || v.paperYear === 'chapters' || paperYears.includes(v.paperYear)) setPaperYear(v.paperYear);
      setPaperView(v.paperView);
      if (typeof v.paperChapters === 'string') setPaperChapters(v.paperChapters);
    },
  );

  const [book, setBook] = useState<{ lang: string; byKey: Record<string, MapSite[]> } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    loadBook(lang).then(
      (data) => { if (live) setBook({ lang, byKey: Object.fromEntries(data.map((c) => [c.key, c.sites])) }); },
      () => { if (live) setFailed(lang); },
    );
    return () => { live = false; };
  }, [lang, attempt]);
  const byKey = book?.lang === lang ? book.byKey : null;
  const loadFailed = failed === lang && !byKey;

  const all = useMemo(() => {
    if (!byKey) return [];
    const seen = new Map<string, MapSite>();
    for (const sites of Object.values(byKey)) for (const s of sites) if (!seen.has(s.name)) seen.set(s.name, s);
    return [...seen.values()];
  }, [byKey]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2 || !byKey) return [];
    const out: { site: MapSite; chapter: MapChapter }[] = [];
    for (const ch of chapters) for (const s of byKey[ch.key] ?? []) {
      if (s.name.toLowerCase().includes(q) || s.label.toLowerCase().includes(q)) out.push({ site: s, chapter: ch });
      if (out.length === 20) return out;
    }
    return out;
  }, [search, byKey, chapters]);

  // A past paper's quiz: its twenty places, each with UPSC's hint from that paper.
  // Chapters picked together are merged, a place in two of them asked once.
  const poolFor = useCallback((source: string): MapSite[] => {
    const yr = /^y-(\d{4})$/.exec(source);
    if (yr) {
      return paper(Number(yr[1])).map((p) => {
        const b = noteFor(p, all);
        return { name: p.answer, label: (hi && b?.label) || p.answer, place: b?.place ?? '', about: p.hint, hints: [{ years: [p.year], hint: p.hint }], asked: p.askedIn, lat: p.lat, lng: p.lng, region: '' };
      });
    }
    const keys = quizKeys(source);
    let src = all;
    if (keys) {
      const seen = new Map<string, MapSite>();
      for (const k of keys) for (const s of byKey?.[k] ?? []) if (!seen.has(s.name)) seen.set(s.name, s);
      src = [...seen.values()];
    }
    return src.filter((s) => !quizAsked || s.asked.length > 0);
  }, [all, byKey, quizAsked, hi]);
  const quizPool = useMemo(() => poolFor(quizChapter), [poolFor, quizChapter]);

  // Past papers by chapter: the places asked from the chapters picked, each
  // once, newest first. Chapters UPSC has never asked from are left out.
  const askedIn = useMemo(() => (byKey ? askedByChapter(byKey, chapters) : null), [byKey, chapters]);
  const askedCounts = useMemo(() => Object.fromEntries(Object.entries(askedIn ?? {}).map(([k, v]) => [k, v.length])), [askedIn]);
  const askedChapters = useMemo(() => chapters.filter((c) => askedCounts[c.key] > 0), [chapters, askedCounts]);
  const askedFrom = useCallback((source: string): AskedPlace[] => {
    if (!askedIn) return [];
    const picked = new Set<AskedPlace>();
    for (const k of quizKeys(source) ?? Object.keys(askedIn)) for (const p of askedIn[k] ?? []) picked.add(p);
    return [...picked].sort((a, b) => b.years[0] - a.years[0] || a.name.localeCompare(b.name));
  }, [askedIn]);
  const chapterPaper = useMemo(() => askedFrom(paperChapters), [askedFrom, paperChapters]);

  const toggle = (key: string) => {
    if (!requireLogin('Sign in free to explore the Map Reference.')) return;
    setOpen((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));
  };
  const jumpTo = (chapter: MapChapter, site: MapSite) => {
    if (!requireLogin('Sign in free to explore the Map Reference.')) return;
    setPart(chapter.part);
    setOpen((p) => (p.includes(chapter.key) ? p : [...p, chapter.key]));
    setSelected(site.name);
    setSearch('');
    setTimeout(() => document.getElementById(`ch-${chapter.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  };
  const toQuiz = () => {
    if (mode === 'quiz') return;
    if (!requireLogin('Sign in free to access Map Quiz mode.')) return;
    setMode('quiz');
  };
  const toPapers = () => {
    if (mode === 'papers') return;
    if (!requireLogin('Sign in free to see every past map paper.')) return;
    setMode('papers');
  };
  const yearsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = yearsRef.current, tab = row?.querySelector<HTMLElement>('.mp-part.on');
    if (!row || !tab || row.scrollWidth <= row.clientWidth) return;
    const left = tab.offsetLeft - row.offsetLeft, right = left + tab.offsetWidth;
    if (left < row.scrollLeft || right > row.scrollLeft + row.clientWidth) row.scrollTo({ left: Math.max(0, left - 16), behavior: 'smooth' });
  }, [paperYear, mode]);

  // On a phone the parts scroll sideways; keep the one picked in view.
  const partsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = partsRef.current, tab = row?.querySelector<HTMLElement>('.mp-part.on');
    if (!row || !tab || row.scrollWidth <= row.clientWidth) return;
    const left = tab.offsetLeft - row.offsetLeft, right = left + tab.offsetWidth;
    if (left < row.scrollLeft || right > row.scrollLeft + row.clientWidth) row.scrollTo({ left: Math.max(0, left - 16), behavior: 'smooth' });
  }, [part, mode]);

  const partChapters = chapters.filter((c) => c.part === part && (!askedOnly || c.asked > 0));

  return (
    <div className="mp ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="mp-hero">
        <div className="ds-container">
          <h1 className="ds-h1 mp-h1">{T('Map practice', 'मैप अभ्यास')}</h1>
          <p className="ds-lede mp-lede">
            {hi
              ? <>मैप सिलेबस का हर स्थल, अध्याय दर अध्याय, और 2013 से हर साल का मैप प्रश्न। जो UPSC पूछ चुका है वे <span className="mp-amber">पीले</span> रंग में हैं, शुरुआत उन्हीं से करें।</>
              : <>Every place on the map syllabus, chapter by chapter, and every year&rsquo;s map question since 2013. The ones UPSC has already asked are in <span className="mp-amber">amber</span>, so start with those.</>}
          </p>
          <div className="mp-hero-row">
            <div className="mp-modes" role="tablist" aria-label={T('View', 'दृश्य')}>
              <button type="button" role="tab" aria-selected={mode === 'browse'} className={`mp-mode${mode === 'browse' ? ' on' : ''}`} onClick={() => setMode('browse')}>{T('Browse', 'देखें')}</button>
              <button type="button" role="tab" aria-selected={mode === 'papers'} className={`mp-mode${mode === 'papers' ? ' on' : ''}`} onClick={toPapers}>{T('Past papers', 'पिछले प्रश्नपत्र')}</button>
              <button type="button" role="tab" aria-selected={mode === 'quiz'} className={`mp-mode${mode === 'quiz' ? ' on' : ''}`} onClick={toQuiz}>{T('Quiz', 'क्विज़')}</button>
            </div>
            <Link href="/evaluate?mode=map" className="mp-check">
              <span>{T('Have your map answer checked', 'अपना मैप उत्तर जँचवाएँ')}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        </div>
      </header>

      <div className="ds-container mp-body">
        {loadFailed && (
          <div className="mp-error">
            <span>{T('The places did not load.', 'स्थल लोड नहीं हुए।')}</span>
            <button type="button" className="ds-btn ds-btn-line ds-btn-sm" onClick={() => setAttempt((n) => n + 1)}>{T('Try again', 'फिर कोशिश करें')}</button>
          </div>
        )}

        {mode === 'papers' ? (
          <>
            <div className="mp-parts" ref={yearsRef} role="tablist" aria-label={T('Year', 'वर्ष')}>
              <button type="button" role="tab" aria-selected={paperYear === 'repeats'} className={`mp-part pp-repeats${paperYear === 'repeats' ? ' on' : ''}`} onClick={() => setPaperYear('repeats')}>{T('Most repeated', 'सबसे ज़्यादा दोहराए गए')}</button>
              <button type="button" role="tab" aria-selected={paperYear === 'chapters'} className={`mp-part pp-repeats${paperYear === 'chapters' ? ' on' : ''}`} onClick={() => setPaperYear('chapters')}>{T('By chapter', 'अध्याय अनुसार')}</button>
              {paperYears.map((y) => (
                <button key={y} type="button" role="tab" aria-selected={paperYear === y} className={`mp-part${paperYear === y ? ' on' : ''}`} onClick={() => setPaperYear(y)}>{y}</button>
              ))}
            </div>
            <div className="mp-bar">
              <div className="mp-switches">
                {paperYear === 'chapters' && askedIn && (
                  <ChapterPicker value={paperChapters} onChange={setPaperChapters} chapters={askedChapters} places={(source) => askedFrom(source).length} hi={hi} pyq={askedCounts} />
                )}
                {paperYear !== 'repeats' && (
                  <div className="mp-seg" role="radiogroup" aria-label={T('Study or test', 'पढ़ें या जाँचें')}>
                    <button type="button" role="radio" aria-checked={paperView === 'study'} className={paperView === 'study' ? 'on' : ''} onClick={() => setPaperView('study')}>{T('Study', 'पढ़ें')}</button>
                    <button type="button" role="radio" aria-checked={paperView === 'test'} className={paperView === 'test' ? 'on' : ''} onClick={() => setPaperView('test')}>{T('Test yourself', 'ख़ुद को जाँचें')}</button>
                  </div>
                )}
                <BaseSeg value={base} onChange={setBase} hi={hi} />
                <Switch on={grid} onClick={() => setGrid((v) => !v)}>{T('Grid', 'ग्रिड')}</Switch>
              </div>
            </div>
            <p className="pp-note">{T('UPSC prints only a hint for each place it marks, never the name. The names here are the generally accepted answers.', 'UPSC हर चिह्नित स्थल के लिए केवल संकेत देता है, नाम नहीं। यहाँ दिए नाम आमतौर पर स्वीकार किए गए उत्तर हैं।')}</p>
            {paperYear === 'repeats'
              ? <RepeatsView base={base} grid={grid} hi={hi} all={all} />
              : paperYear === 'chapters'
                ? (!askedIn
                  ? !loadFailed && <div className="mp-map-wait"><OwlLoader size="small" label={T('Loading the places', 'स्थल लोड हो रहे हैं')} /></div>
                  : chapterPaper.length === 0
                    ? <p className="mp-few">{T('Choose chapters, say Hominid Fossil Sites, Palaeolithic Era and Neolithic Period, and every place UPSC has asked from them is marked on the map with its hint, to study or to test yourself.', 'अध्याय चुनें, जैसे होमिनिड जीवाश्म स्थल, प्रागैतिहासिक पाषाण युग और नवपाषाण काल, और इनसे UPSC ने जो भी स्थल पूछे, वे अपने संकेत के साथ मैप पर दिखेंगे, पढ़ने या ख़ुद को जाँचने के लिए।')}</p>
                    // New chapters or a new view start the test afresh.
                    : <ChapterPaper key={`${paperChapters}-${paperView}`} places={chapterPaper} view={paperView} base={base} grid={grid} hi={hi} all={all} />)
                // A new year or view starts the paper afresh.
                : <PaperView key={`${paperYear}-${paperView}`} year={paperYear} view={paperView} base={base} grid={grid} hi={hi} all={all} />}
          </>
        ) : mode === 'quiz' ? (
          <>
            <div className="mp-filters">
              <div className="mp-seg" role="radiogroup" aria-label={T('Answer by', 'उत्तर कैसे दें')}>
                <button type="button" role="radio" aria-checked={quizFormat === 'pick'} className={quizFormat === 'pick' ? 'on' : ''} onClick={() => setQuizFormat('pick')}>{T('Four options', 'चार विकल्प')}</button>
                <button type="button" role="radio" aria-checked={quizFormat === 'type'} className={quizFormat === 'type' ? 'on' : ''} onClick={() => setQuizFormat('type')}>{T('Type the name', 'नाम लिखें')}</button>
              </div>
              <ChapterPicker value={quizChapter} onChange={setQuizChapter} chapters={chapters} places={(source) => poolFor(source).length} hi={hi} />
              {!quizChapter.startsWith('y-') && <Switch on={quizAsked} onClick={() => setQuizAsked((v) => !v)} tone="amber">{T('Only those asked', 'केवल पूछे गए')}</Switch>}
              <BaseSeg value={quizBase} onChange={setQuizBase} hi={hi} />
              <Switch on={grid} onClick={() => setGrid((v) => !v)}>{T('Grid', 'ग्रिड')}</Switch>
            </div>
            {!byKey ? (
              !loadFailed && <div className="mp-map-wait"><OwlLoader size="small" label={T('Loading the places', 'स्थल लोड हो रहे हैं')} /></div>
            ) : quizPool.length >= 4 ? (
              // A new pool is a new quiz.
              <Quiz key={`${lang}-${quizChapter}-${quizAsked}-${quizFormat}`} pool={quizPool} all={all} hi={hi} format={quizFormat} base={quizBase} grid={grid} />
            ) : (
              <p className="mp-few">{T('That leaves fewer than four places to choose between. Pick another chapter or show every place.', 'चुनने के लिए चार से कम स्थल बचते हैं। दूसरा अध्याय चुनें या सभी स्थल दिखाएँ।')}</p>
            )}
          </>
        ) : (
          <>
            <div className="mp-search-wrap">
              <label className="mp-search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={T('Find a place, say “Inamgaon”', 'कोई स्थल खोजें, जैसे “इनामगाँव”')} aria-label={T('Find a place', 'स्थल खोजें')} />
              </label>
              {search.trim().length >= 2 && (
                <div className="mp-results">
                  {!byKey ? <p className="mp-results-note">{T('Loading the places…', 'स्थल लोड हो रहे हैं…')}</p>
                    : results.length === 0 ? <p className="mp-results-note">{T(`No place matches “${search.trim()}”.`, `“${search.trim()}” से कोई स्थल नहीं मिला।`)}</p>
                    : results.map(({ site, chapter }) => (
                      <button key={`${chapter.key}-${site.name}`} type="button" className="mp-result" onClick={() => jumpTo(chapter, site)}>
                        <strong>{site.label}</strong>
                        <span>{hi && chapter.topicHi ? chapter.topicHi : chapter.topic} · {site.place}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div className="mp-parts" ref={partsRef} role="tablist" aria-label={T('Part of the syllabus', 'सिलेबस का भाग')}>
              {PARTS.map((p) => (
                <button key={p.key} type="button" role="tab" aria-selected={part === p.key} className={`mp-part${part === p.key ? ' on' : ''}`} onClick={() => setPart(p.key)}>{hi ? p.hi : p.en}</button>
              ))}
            </div>

            <div className="mp-bar">
              <div className="mp-switches">
                <Switch on={askedOnly} onClick={() => { setAskedOnly((v) => !v); setAskedFor({}); }} tone="amber">{T('Only those asked', 'केवल पूछे गए')}</Switch>
                <BaseSeg value={base} onChange={setBase} hi={hi} />
                <Switch on={grid} onClick={() => setGrid((v) => !v)}>{T('Grid', 'ग्रिड')}</Switch>
              </div>
              <span className="mp-legend" aria-hidden="true"><i className="dot" />{T('Place', 'स्थल')}<i className="dot amber" />{T('Asked by UPSC', 'UPSC में पूछा गया')}</span>
            </div>

            {partChapters.map((c) => (
              <Chapter key={c.key} chapter={c} open={open.includes(c.key)} onToggle={() => toggle(c.key)}
                sites={byKey ? (byKey[c.key] ?? []) : null} selected={selected} onPick={(name) => setSelected((p) => (p === name ? null : name))}
                askedOnly={askedFor[c.key] ?? askedOnly} onToggleAsked={() => setAskedFor((p) => ({ ...p, [c.key]: !(p[c.key] ?? askedOnly) }))}
                mapBase={base} grid={grid} hi={hi} />
            ))}
          </>
        )}
      </div>
      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
    </div>
  );
}

const CSS = `
.mp { background: var(--bg); min-height: 70vh; padding-bottom: clamp(48px, 9vh, 96px); --map-h: 440px; }
.mp-hero { padding: clamp(28px, 5vh, 52px) 0 clamp(16px, 3vh, 24px); background: linear-gradient(180deg, color-mix(in srgb, var(--accent-dim) 60%, var(--bg)) 0%, var(--bg) 100%); }
.mp-h1 { font-size: clamp(2rem, 4.4vw, 3rem); margin: 0 0 var(--space-2); }
.mp-lede { max-width: 700px; }
.mp-amber { color: var(--warning-text); font-weight: 700; }
.mp-hero-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3) var(--space-5); margin-top: var(--space-5); }
.mp-modes { display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--radius-full); background: var(--ds-soft); border: 1px solid var(--border); }
.mp-mode { min-width: 96px; padding: 9px 18px; border: none; border-radius: var(--radius-full); background: none; color: var(--text2); font: inherit; font-size: 0.94rem; font-weight: 700; cursor: pointer; transition: background 0.18s, color 0.18s, box-shadow 0.18s; }
.mp-mode.on { background: var(--ds-card); color: var(--text); box-shadow: var(--elev-1); }
.mp-mode:focus-visible, .mp-part:focus-visible, .mp-switch:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.mp-check { display: inline-flex; align-items: center; gap: 6px; font-size: 0.94rem; font-weight: 600; color: var(--accent-text); text-decoration: none; }
.mp-check:hover span { text-decoration: underline; text-underline-offset: 3px; }
.mp-body { padding-top: var(--space-4); }
.mp-error { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-4); padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--danger-wash); color: var(--danger-text); font-weight: 600; }

.mp-search-wrap { position: relative; max-width: 640px; margin-bottom: var(--space-4); }
.mp-search { display: flex; align-items: center; gap: var(--space-2); height: 48px; padding: 0 var(--space-4); background: var(--ds-card); border: 1.5px solid var(--border2); border-radius: var(--radius-full); color: var(--text3); transition: border-color 0.15s, box-shadow 0.15s; }
.mp-search:focus-within { border-color: color-mix(in srgb, var(--accent) 65%, transparent); box-shadow: 0 0 0 4px var(--accent-glow); }
.mp-search input { flex: 1; min-width: 0; height: 100%; border: none; outline: none; background: none; color: var(--text); font: inherit; font-size: 1rem; }
.mp-results { position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 1000; max-height: 340px; overflow-y: auto; padding: 6px; background: var(--ds-card); border: 1px solid var(--border2); border-radius: var(--radius-lg); box-shadow: var(--elev-3); }
.mp-result { width: 100%; display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border: none; border-radius: var(--radius-md); background: none; color: var(--text); font: inherit; text-align: left; cursor: pointer; }
.mp-result:hover, .mp-result:focus-visible { background: var(--accent-dim); outline: none; }
.mp-result span { font-size: 0.82rem; color: var(--text3); }
.mp-results-note { margin: 0; padding: 10px 12px; color: var(--text2); font-size: 0.92rem; }
.mp-few { margin: var(--space-3) 0 0; color: var(--text2); }

.mp-parts { display: flex; gap: var(--space-2); margin-bottom: var(--space-3); overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.mp-parts::-webkit-scrollbar { display: none; }
.mp-part { flex-shrink: 0; min-height: 40px; padding: 0 var(--space-4); border: 1.5px solid var(--border2); border-radius: var(--radius-full); background: var(--ds-card); color: var(--text2); font: inherit; font-size: 0.92rem; font-weight: 700; white-space: nowrap; cursor: pointer; transition: border-color 0.15s, background 0.15s, color 0.15s; }
.mp-part:hover { color: var(--text); border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
.mp-part.on { border-color: var(--accent); background: var(--accent-dim); color: var(--accent-text); }
.mp-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-2) var(--space-4); margin-bottom: var(--space-4); }
.mp-switches { display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-4); }
.mp-switch { display: inline-flex; align-items: center; gap: 8px; min-height: 36px; padding: 0; border: none; background: none; color: var(--text2); font: inherit; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
.mp-switch-track { position: relative; width: 36px; height: 20px; flex-shrink: 0; border-radius: var(--radius-full); background: var(--border2); transition: background 0.2s; }
.mp-switch-track span { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); transition: transform 0.2s; }
.mp-switch.on { color: var(--text); }
.mp-switch.on .mp-switch-track { background: var(--accent); }
.mp-switch.amber.on .mp-switch-track { background: var(--warning-text); }
.mp-switch.on .mp-switch-track span { transform: translateX(16px); }
.mp-legend { display: inline-flex; align-items: center; gap: 6px; font-size: 0.84rem; color: var(--text3); }
.mp-legend .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); border: 1.5px solid #fff; box-shadow: 0 0 0 1px var(--border2); }
.mp-legend .dot.amber { margin-left: 8px; background: var(--warning-text); }

.mp-section { margin-bottom: var(--space-3); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
.mp-section.open { box-shadow: var(--elev-1); }
.mp-section-head { width: 100%; display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-5); border: none; border-radius: var(--radius-xl); background: none; color: var(--text); font: inherit; text-align: left; cursor: pointer; }
.mp-section-head:hover { background: var(--ds-soft); }
.mp-num { width: 30px; height: 30px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--accent-dim); color: var(--accent-text); font-size: 0.84rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.mp-section-title { flex: 1; min-width: 0; font-size: 1.02rem; font-weight: 800; }
.mp-section-meta { display: inline-flex; flex-wrap: wrap; justify-content: flex-end; gap: 4px var(--space-2); font-size: 0.86rem; color: var(--text3); white-space: nowrap; }
.mp-asked-n { color: var(--warning-text); font-weight: 600; }
.mp-chev { flex-shrink: 0; color: var(--text3); transition: transform 0.2s; }
.mp-section.open .mp-chev { transform: rotate(180deg); }
.mp-section-body { padding: 0 var(--space-5) var(--space-5); }
.mp-tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); margin-bottom: var(--space-3); }
.mp-chip { min-height: 36px; padding: 0 14px; border: 1px solid var(--border2); border-radius: var(--radius-full); background: var(--bg); color: var(--text2); font: inherit; font-size: 0.88rem; font-weight: 600; cursor: pointer; }
.mp-chip.on { border-color: color-mix(in srgb, var(--warning-text) 50%, transparent); background: var(--warning-wash); color: var(--warning-text); }
.mp-count { margin-left: auto; font-size: 0.86rem; color: var(--text3); }
.mp-select { appearance: none; -webkit-appearance: none; max-width: 100%; height: 36px; padding: 0 34px 0 14px; background: var(--bg) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 13px center; border: 1px solid var(--border2); border-radius: var(--radius-full); color: var(--text); font: inherit; font-size: 0.88rem; font-weight: 500; cursor: pointer; text-overflow: ellipsis; }
.mp-select.set { border-color: color-mix(in srgb, var(--accent) 50%, transparent); background-color: var(--accent-dim); color: var(--accent-text); font-weight: 600; }
.mp-split { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: var(--space-4); align-items: start; }
.mp-map-col { min-width: 0; }
.mp-map-wait { height: var(--map-h); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--ds-soft); }
.mp-picked { display: none; }
.mp-list { display: flex; flex-direction: column; gap: 6px; max-height: var(--map-h); overflow-y: auto; padding-right: 2px; position: relative; }
.mp-place { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--bg); color: var(--text); font: inherit; text-align: left; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.mp-place:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.mp-place.on { border-color: var(--accent); background: var(--accent-dim); }
.mp-place-top { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-2); }
.mp-place-top strong { font-size: 0.95rem; }
.mp-year { flex-shrink: 0; padding: 1px 8px; border-radius: var(--radius-full); background: var(--warning-wash); color: var(--warning-text); font-size: 0.76rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.mp-place-where { font-size: 0.84rem; color: var(--text3); }
.mp-place-sig { margin-top: 4px; font-size: 0.9rem; line-height: 1.55; color: var(--text2); }

.mp-filters { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-3); margin-bottom: var(--space-4); }
.mp-filters .mp-select { height: 40px; max-width: 280px; background-color: var(--ds-card); }
.mp-pick { display: inline-flex; align-items: center; gap: 8px; min-width: 0; max-width: 380px; white-space: nowrap; text-align: left; }
.mp-filters .mp-pick { max-width: 380px; }
.mp-pick svg { flex-shrink: 0; }
.mp-pick-t { flex-shrink: 0; font-weight: 600; }
.mp-pick-sum { min-width: 0; overflow: hidden; text-overflow: ellipsis; color: var(--text3); font-weight: 500; }
.mp-pick.set .mp-pick-sum { color: inherit; font-weight: 700; }
.mp-pick-sum::before { content: '·'; margin-right: 8px; color: var(--text3); font-weight: 500; }
.mp-cp-or { font-size: 0.86rem; color: var(--text2); }
.mp-cp-all { margin-top: var(--space-4); }
/* The chapter picker: a dialog whose list scrolls between a fixed head and foot. */
.mp-cp { max-width: 540px; padding: 0; display: flex; flex-direction: column; overflow: hidden; }
.mp-cp-head { padding: var(--space-6) var(--space-6) var(--space-4); }
.mp-cp-body { flex: 1; min-height: 0; overflow-y: auto; padding: 0 var(--space-6) var(--space-4); }
.mp-cp-quick { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
.mp-cp-quick .mp-select { height: 36px; background-color: var(--ds-card); }
.mp-cp-part { margin: var(--space-4) 0 0; padding: 0; border: none; min-width: 0; }
.mp-cp-legend { width: 100%; padding: 0; }
.mp-cp-row { display: flex; align-items: center; gap: var(--space-3); min-height: 40px; padding: 2px 0; font-size: 0.92rem; color: var(--text); cursor: pointer; }
.mp-cp-row.part { font-weight: 700; border-bottom: 1px solid var(--border); margin-bottom: 2px; }
.mp-cp-row input { width: 18px; height: 18px; margin: 0; flex-shrink: 0; accent-color: var(--accent); cursor: pointer; }
.mp-cp-n { margin-left: auto; padding-left: var(--space-2); flex-shrink: 0; color: var(--text3); font-size: 0.8rem; font-weight: 500; font-variant-numeric: tabular-nums; }
.mp-cp-foot { display: flex; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--border); background: var(--ds-card); }
.mp-cp-foot .ds-btn { flex: 1; min-height: 44px; border-radius: var(--radius-md); }
.mp-cp-foot .ds-btn-solid { flex: 2; }
.mp-seg { display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--radius-full); background: var(--ds-soft); border: 1px solid var(--border); }
.mp-seg button { padding: 7px 14px; border: none; border-radius: var(--radius-full); background: none; color: var(--text2); font: inherit; font-size: 0.9rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
.mp-seg button.on { background: var(--ds-card); color: var(--text); box-shadow: var(--elev-1); }
.mp-quiz { display: flex; flex-direction: column; gap: var(--space-4); max-width: 860px; }
.mp-quiz-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-2); }
.mp-quiz-prompt { font-size: 1.1rem; font-weight: 800; }
.mp-quiz-score { display: inline-flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); font-size: 0.92rem; color: var(--text2); font-variant-numeric: tabular-nums; }
.mp-streak { padding: 2px 10px; border-radius: var(--radius-full); background: var(--premium-wash); color: var(--premium-text); font-weight: 700; }
.mp-link { background: none; border: none; padding: 0; font: inherit; font-size: 0.88rem; font-weight: 600; color: var(--accent-text); cursor: pointer; }
.mp-prompt { display: flex; flex-direction: column; gap: var(--space-3); }
.mp-upsc { padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--warning-wash); }
.mp-upsc-head { font-size: 0.88rem; font-weight: 700; color: var(--warning-text); }
.mp-upsc ul { margin: 4px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 4px; }
.mp-upsc li { display: flex; align-items: baseline; gap: var(--space-2); font-size: 1.02rem; font-weight: 600; line-height: 1.45; color: var(--text); }
.mp-upsc b { flex-shrink: 0; font-size: 0.84rem; font-weight: 800; color: var(--warning-text); font-variant-numeric: tabular-nums; }
.mp-clue { padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--ds-soft); }
.mp-clue-head { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.88rem; font-weight: 700; color: var(--text2); }
.mp-clue p { margin: 4px 0 0; line-height: 1.6; }
.mp-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-2); }
.mp-option { display: flex; flex-direction: column; gap: 2px; min-height: 52px; padding: var(--space-3) var(--space-4); border: 1.5px solid var(--border2); border-radius: var(--radius-lg); background: var(--ds-card); color: var(--text); font: inherit; font-size: 0.98rem; font-weight: 600; text-align: left; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.mp-option small { font-size: 0.8rem; font-weight: 500; opacity: 0.8; }
.mp-option:hover:not(:disabled) { border-color: var(--accent); background: var(--accent-dim); }
.mp-option:disabled { cursor: default; }
.mp-option.right { border-color: var(--success-text); background: var(--success-wash); color: var(--success-text); }
.mp-option.wrong { border-color: var(--danger-text); background: var(--danger-wash); color: var(--danger-text); }
.mp-option.faded { opacity: 0.55; }
.mp-type { display: flex; gap: var(--space-2); }
.mp-type input { flex: 1; min-width: 0; height: 48px; padding: 0 var(--space-4); border: 1.5px solid var(--border2); border-radius: var(--radius-lg); background: var(--ds-card); color: var(--text); font: inherit; font-size: 1rem; outline: none; }
.mp-type input:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); box-shadow: 0 0 0 3px var(--accent-glow); }
.mp-type input.right { border-color: var(--success-text); }
.mp-type input.wrong { border-color: var(--danger-text); }
.mp-type .ds-btn { min-height: 48px; }
.mp-answer { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-2); padding: var(--space-4) var(--space-5); border-radius: var(--radius-lg); background: var(--danger-wash); scroll-margin-bottom: 96px; }
.mp-answer.right { background: var(--success-wash); }
.mp-answer-top { align-self: stretch; display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px var(--space-3); }
.mp-answer-top span { font-size: 0.84rem; color: var(--text3); }
.mp-answer p { margin: 0; line-height: 1.6; color: var(--text2); }
.mp-answer p.mp-asked { font-size: 0.88rem; font-weight: 600; color: var(--warning-text); }
.mp-answer .ds-btn { margin-top: var(--space-2); }
.mp-bar .mp-switches { align-items: center; }
.mp-base button { padding: 6px 12px; font-size: 0.86rem; }
.mp-part.pp-repeats { border-color: color-mix(in srgb, var(--warning-text) 45%, transparent); color: var(--warning-text); }
.mp-part.pp-repeats.on { border-color: var(--warning-text); background: var(--warning-wash); color: var(--warning-text); }
.pp-note { margin: 0 0 var(--space-3); font-size: 0.86rem; color: var(--text3); }
.pp-summary { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-4); margin-bottom: var(--space-3); font-weight: 700; }
.pp-summary .mp-seg small { margin-left: 4px; font-weight: 600; color: var(--text3); }
.pp-score { display: inline-flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); margin-left: auto; font-weight: 600; color: var(--text2); font-variant-numeric: tabular-nums; }
.pp-list { gap: 8px; }
.pp-item { gap: 4px; }
.pp-hint { display: flex; align-items: flex-start; gap: 8px; font-size: 0.88rem; line-height: 1.45; color: var(--text2); }
.pp-n { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; margin-right: 6px; padding: 0 5px; border-radius: var(--radius-full); border: 1.5px solid var(--text2); background: var(--ds-card); color: var(--text); font-size: 0.74rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.pp-hint .pp-n { margin-right: 0; }
.mp-place.on .pp-n { border-color: var(--accent); background: var(--accent); color: var(--accent-on); }
.pp-hint-btn { width: 100%; padding: 0; border: none; background: none; font: inherit; font-size: 0.92rem; text-align: left; color: var(--text); cursor: pointer; }
.pp-test { cursor: default; }
.pp-test.right { border-color: color-mix(in srgb, var(--success-text) 50%, transparent); background: var(--success-wash); }
.pp-test.wrong { border-color: color-mix(in srgb, var(--danger-text) 45%, transparent); background: var(--danger-wash); }
.pp-test.shown { border-color: color-mix(in srgb, var(--warning-text) 45%, transparent); background: var(--warning-wash); }
.pp-try { display: flex; align-items: center; gap: var(--space-2); margin-top: 4px; }
.pp-try input { flex: 1; min-width: 0; height: 38px; padding: 0 var(--space-3); border: 1.5px solid var(--border2); border-radius: var(--radius-md); background: var(--ds-card); color: var(--text); font: inherit; font-size: 0.94rem; outline: none; }
.pp-try input:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); box-shadow: 0 0 0 3px var(--accent-glow); }
.pp-result { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px var(--space-3); margin-top: 4px; font-size: 0.92rem; }
.pp-result small { color: var(--text3); }
.pp-hints { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; font-size: 0.88rem; line-height: 1.45; color: var(--text2); }
.pp-hints b { font-variant-numeric: tabular-nums; color: var(--text); margin-right: 4px; }
.pp-hint-last { font-size: 0.86rem; color: var(--text3); }
.pp-dispute { font-size: 0.82rem; line-height: 1.45; color: var(--warning-text); }
.pp-yr { margin-right: 6px; color: var(--warning-text); font-weight: 800; font-variant-numeric: tabular-nums; }
.pp-result .pp-hints { flex-basis: 100%; }
.mp-bar .mp-pick { height: 40px; background-color: var(--ds-card); }
.mp-cp-body > .mp-cp-all:first-child { margin-top: 0; }
.pp-result .pp-dispute { flex-basis: 100%; }
.mp-place-top strong { display: inline-flex; align-items: center; }
/* On a wide screen the map takes the left and the question sits beside it. */
@media (min-width: 1001px) {
  .mp-quiz { --map-h: 560px; display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(340px, 1fr); grid-template-rows: auto auto auto auto 1fr; grid-template-areas: "map head" "map clue" "map pick" "map answer" "map ."; gap: var(--space-4) var(--space-6); align-items: start; max-width: none; }
  .mp-quiz-map { grid-area: map; position: sticky; top: 84px; }
  .mp-quiz-head { grid-area: head; flex-direction: column; align-items: flex-start; }
  .mp-quiz-prompt { font-size: 1.3rem; }
  .mp-prompt { grid-area: clue; }
  .mp-options, .mp-type { grid-area: pick; }
  .mp-answer { grid-area: answer; }
}

@media (max-width: 900px) {
  .mp-split { grid-template-columns: minmax(0, 1fr); }
  .mp-list { max-height: none; overflow: visible; }
  /* On a phone the list is below the map: what was tapped shows right under it. */
  .mp-picked { display: flex; flex-direction: column; gap: 2px; margin-top: var(--space-3); padding: var(--space-3) var(--space-4); border: 1px solid var(--accent); border-radius: var(--radius-lg); background: var(--accent-dim); }
  .mp-picked p { margin: 4px 0 0; font-size: 0.92rem; line-height: 1.55; color: var(--text2); }
}
@media (max-width: 640px) {
  .mp { --map-h: 340px; }
  .mp-hero-row { flex-direction: column; align-items: stretch; }
  .mp-modes { display: flex; }
  .mp-mode { flex: 1; padding: 8px 6px; }
  .mp-check { justify-content: center; }
  .mp-section-head { padding: var(--space-3) var(--space-4); gap: var(--space-2); }
  .mp-section-meta { flex-direction: column; align-items: flex-end; gap: 0; font-size: 0.8rem; }
  .mp-section-body { padding: 0 var(--space-3) var(--space-4); }
  .mp-legend { display: none; }
  .mp-filters .mp-seg { display: flex; width: 100%; }
  .mp-filters .mp-seg button { flex: 1; }
  .mp-filters .mp-select { flex: 1; max-width: none; }
  .mp-filters .mp-pick { flex: 1 1 100%; max-width: none; }
  .mp-cp-head { padding: var(--space-5) var(--space-5) var(--space-3); }
  .mp-cp-body { padding: 0 var(--space-5) var(--space-3); }
  .mp-cp-foot { padding: var(--space-3) var(--space-5); }
  .mp-options { grid-template-columns: minmax(0, 1fr); }
  .mp-answer { padding: var(--space-4); }
}
@media (prefers-reduced-motion: reduce) { .mp-chev, .mp-switch-track, .mp-switch-track span { transition: none; } }
`;
