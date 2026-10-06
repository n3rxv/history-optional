'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { MapChapter, MapChapterSites, MapSite } from '@/lib/mapBook';
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
const variants = (name: string) => name.split(/[/,]|\salso known as\s|\sया\s|\sor\s/i).map((s) => s.trim()).filter((s) => s.length > 2);
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
function Quiz({ pool, all, hi, format }: { pool: MapSite[]; all: MapSite[]; hi: boolean; format: 'pick' | 'type' }) {
  const T = (en: string, h: string) => (hi ? h : en);
  const [round, setRound] = useState(() => newRound(pool, all));
  const [chosen, setChosen] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [hideClue, setHideClue] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { site, options } = round;
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
    setChosen(null); setTyped(''); setHideClue(false);
    if (format === 'type') requestAnimationFrame(() => inputRef.current?.focus());
  };
  const accuracy = score.total ? Math.round((score.right / score.total) * 100) : 0;

  return (
    <div className="mp-quiz">
      <div className="mp-quiz-head">
        <span className="mp-quiz-prompt">{T('Which place is marked on the map?', 'मैप पर कौन-सा स्थल चिह्नित है?')}</span>
        <span className="mp-quiz-score">
          {streak >= 3 && <span className="mp-streak">{T(`${streak} in a row`, `लगातार ${streak}`)}</span>}
          <span>{T(`${score.right} of ${score.total} right`, `${score.total} में ${score.right} सही`)}{score.total > 0 ? ` · ${accuracy}%` : ''}</span>
          {score.total > 0 && <button type="button" className="mp-link" onClick={() => { setScore({ right: 0, total: 0 }); setStreak(0); next(); }}>{T('Start over', 'फिर से शुरू करें')}</button>}
        </span>
      </div>

      <MappingMap sites={[site]} selected={answered ? site.name : null} onPick={() => {}} outline fixed quiet />

      {site.about && (
        <div className="mp-clue">
          <div className="mp-clue-head">
            <span>{T('A clue', 'संकेत')}</span>
            <button type="button" className="mp-link" onClick={() => setHideClue((h) => !h)}>{hideClue ? T('Show', 'दिखाएँ') : T('Hide', 'छिपाएँ')}</button>
          </div>
          {!hideClue && <p>{clueFor(site)}</p>}
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
        <div className={`mp-answer${right ? ' right' : ''}`}>
          <div className="mp-answer-top">
            <strong>{right ? T('Right', 'सही') : T('Not quite', 'सही नहीं')}: {site.label}</strong>
            <span>{site.place}</span>
          </div>
          {clueFor(site) !== site.about && <p>{site.about}</p>}
          {site.asked.length > 0 && <p className="mp-asked">{T('Asked by UPSC in', 'UPSC ने पूछा')} {site.asked.join(', ')}</p>}
          <button type="button" className="ds-btn ds-btn-solid ds-btn-sm" onClick={next}>{T('Next place', 'अगला स्थल')}</button>
        </div>
      )}
    </div>
  );
}

// ─── A chapter ───
function Chapter({ chapter, open, onToggle, sites, selected, onPick, askedOnly, onToggleAsked, outline, grid, hi }: {
  chapter: MapChapter; open: boolean; onToggle: () => void; sites: MapSite[] | null; selected: string | null; onPick: (name: string) => void;
  askedOnly: boolean; onToggleAsked: () => void; outline: boolean; grid: boolean; hi: boolean;
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
                    <MappingMap sites={shown} selected={selected} onPick={onPick} outline={outline} grid={grid} />
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

// ─── The page ───
export default function MapBrowser({ chapters, total }: { chapters: MapChapter[]; total: number }) {
  const { langHi: hi } = useLang();
  const T = (en: string, h: string) => (hi ? h : en);
  const lang = hi ? 'hi' : 'en';
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();

  const [mode, setMode] = useState<'browse' | 'quiz'>('browse');
  const [part, setPart] = useState(PARTS[1].key);
  const [open, setOpen] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [askedOnly, setAskedOnly] = useState(false);
  const [askedFor, setAskedFor] = useState<Record<string, boolean>>({});
  const [outline, setOutline] = useState(false);
  const [grid, setGrid] = useState(false);
  const [quizAsked, setQuizAsked] = useState(false);
  const [quizChapter, setQuizChapter] = useState('all');
  const [quizFormat, setQuizFormat] = useState<'pick' | 'type'>('pick');

  // The view is kept for the tab, so a refresh comes back to the same part,
  // the same chapters open and the same switches.
  useRefreshSafe(
    'ho_mapping_v2',
    { mode, part, open, selected, search, askedOnly, askedFor, outline, grid, quizAsked, quizChapter, quizFormat },
    (v) => {
      setMode(v.mode); if (PARTS.some((p) => p.key === v.part)) setPart(v.part);
      setOpen(v.open); setSelected(v.selected); setSearch(v.search); setAskedOnly(v.askedOnly); setAskedFor(v.askedFor);
      setOutline(v.outline); setGrid(v.grid); setQuizAsked(v.quizAsked); setQuizChapter(v.quizChapter); setQuizFormat(v.quizFormat);
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

  const quizPool = useMemo(() => {
    const src = quizChapter === 'all' ? all : (byKey?.[quizChapter] ?? []);
    return src.filter((s) => !quizAsked || s.asked.length > 0);
  }, [all, byKey, quizChapter, quizAsked]);

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

  // On a phone the parts scroll sideways; keep the one picked in view.
  const partsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = partsRef.current, tab = row?.querySelector<HTMLElement>('.mp-part.on');
    if (!row || !tab || row.scrollWidth <= row.clientWidth) return;
    const left = tab.offsetLeft - row.offsetLeft, right = left + tab.offsetWidth;
    if (left < row.scrollLeft || right > row.scrollLeft + row.clientWidth) row.scrollTo({ left: Math.max(0, left - 16), behavior: 'smooth' });
  }, [part, mode]);

  const partChapters = chapters.filter((c) => c.part === part && (!askedOnly || c.asked > 0));
  const asked = chapters.reduce((n, c) => n + c.asked, 0);

  return (
    <div className="mp ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="mp-hero">
        <div className="ds-container">
          <h1 className="ds-h1 mp-h1">{T('Map practice', 'मैप अभ्यास')}</h1>
          <p className="ds-lede mp-lede">
            {hi
              ? <>मैप सिलेबस के सभी {total} स्थल, {chapters.filter((c) => c.number > 0).length} अध्यायों में। जो {asked} स्थल UPSC पूछ चुका है वे <span className="mp-amber">पीले</span> हैं।</>
              : <>All {total} places in the map syllabus, in {chapters.filter((c) => c.number > 0).length} chapters from the first fossils to the UNESCO sites. The {asked} that UPSC has already asked are marked in <span className="mp-amber">amber</span>.</>}
          </p>
          <div className="mp-hero-row">
            <div className="mp-modes" role="tablist" aria-label={T('View', 'दृश्य')}>
              <button type="button" role="tab" aria-selected={mode === 'browse'} className={`mp-mode${mode === 'browse' ? ' on' : ''}`} onClick={() => setMode('browse')}>{T('Browse', 'देखें')}</button>
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

        {mode === 'quiz' ? (
          <>
            <div className="mp-filters">
              <div className="mp-seg" role="radiogroup" aria-label={T('Answer by', 'उत्तर कैसे दें')}>
                <button type="button" role="radio" aria-checked={quizFormat === 'pick'} className={quizFormat === 'pick' ? 'on' : ''} onClick={() => setQuizFormat('pick')}>{T('Four options', 'चार विकल्प')}</button>
                <button type="button" role="radio" aria-checked={quizFormat === 'type'} className={quizFormat === 'type' ? 'on' : ''} onClick={() => setQuizFormat('type')}>{T('Type the name', 'नाम लिखें')}</button>
              </div>
              <select className={`mp-select${quizChapter !== 'all' ? ' set' : ''}`} value={quizChapter} onChange={(e) => setQuizChapter(e.target.value)} aria-label={T('Chapter', 'अध्याय')}>
                <option value="all">{T('Every chapter', 'सभी अध्याय')}</option>
                {chapters.map((c) => <option key={c.key} value={c.key}>{c.number > 0 ? `${c.number}. ` : ''}{hi && c.topicHi ? c.topicHi : c.topic}</option>)}
              </select>
              <Switch on={quizAsked} onClick={() => setQuizAsked((v) => !v)} tone="amber">{T('Only those asked', 'केवल पूछे गए')}</Switch>
            </div>
            {!byKey ? (
              !loadFailed && <div className="mp-map-wait"><OwlLoader size="small" label={T('Loading the places', 'स्थल लोड हो रहे हैं')} /></div>
            ) : quizPool.length >= 4 ? (
              // A new pool is a new quiz.
              <Quiz key={`${lang}-${quizChapter}-${quizAsked}-${quizFormat}`} pool={quizPool} all={all} hi={hi} format={quizFormat} />
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
                <Switch on={outline} onClick={() => setOutline((v) => !v)}>{T('No boundaries', 'सीमा रहित')}</Switch>
                <Switch on={grid} onClick={() => setGrid((v) => !v)}>{T('Grid', 'ग्रिड')}</Switch>
              </div>
              <span className="mp-legend" aria-hidden="true"><i className="dot" />{T('Place', 'स्थल')}<i className="dot amber" />{T('Asked by UPSC', 'UPSC में पूछा गया')}</span>
            </div>

            {partChapters.map((c) => (
              <Chapter key={c.key} chapter={c} open={open.includes(c.key)} onToggle={() => toggle(c.key)}
                sites={byKey ? (byKey[c.key] ?? []) : null} selected={selected} onPick={(name) => setSelected((p) => (p === name ? null : name))}
                askedOnly={askedFor[c.key] ?? askedOnly} onToggleAsked={() => setAskedFor((p) => ({ ...p, [c.key]: !(p[c.key] ?? askedOnly) }))}
                outline={outline} grid={grid} hi={hi} />
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
.mp-seg { display: inline-flex; gap: 4px; padding: 4px; border-radius: var(--radius-full); background: var(--ds-soft); border: 1px solid var(--border); }
.mp-seg button { padding: 7px 14px; border: none; border-radius: var(--radius-full); background: none; color: var(--text2); font: inherit; font-size: 0.9rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
.mp-seg button.on { background: var(--ds-card); color: var(--text); box-shadow: var(--elev-1); }
.mp-quiz { display: flex; flex-direction: column; gap: var(--space-4); max-width: 860px; }
.mp-quiz-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-2); }
.mp-quiz-prompt { font-size: 1.1rem; font-weight: 800; }
.mp-quiz-score { display: inline-flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); font-size: 0.92rem; color: var(--text2); font-variant-numeric: tabular-nums; }
.mp-streak { padding: 2px 10px; border-radius: var(--radius-full); background: var(--premium-wash); color: var(--premium-text); font-weight: 700; }
.mp-link { background: none; border: none; padding: 0; font: inherit; font-size: 0.88rem; font-weight: 600; color: var(--accent-text); cursor: pointer; }
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
.mp-answer { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-2); padding: var(--space-4) var(--space-5); border-radius: var(--radius-lg); background: var(--danger-wash); }
.mp-answer.right { background: var(--success-wash); }
.mp-answer-top { align-self: stretch; display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px var(--space-3); }
.mp-answer-top span { font-size: 0.84rem; color: var(--text3); }
.mp-answer p { margin: 0; line-height: 1.6; color: var(--text2); }
.mp-answer p.mp-asked { font-size: 0.88rem; font-weight: 600; color: var(--warning-text); }
.mp-answer .ds-btn { margin-top: var(--space-2); }

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
  .mp-options { grid-template-columns: minmax(0, 1fr); }
  .mp-answer { padding: var(--space-4); }
}
@media (prefers-reduced-motion: reduce) { .mp-chev, .mp-switch-track, .mp-switch-track span { transition: none; } }
`;
