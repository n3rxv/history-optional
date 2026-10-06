'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import Link from 'next/link';
import { useAttemptedPyqs } from '@/hooks/useAttemptedPyqs';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import LoginPromptModal from '@/components/LoginPromptModal';
import { SECTIONS, type SectionKey } from '@/components/notes/sections';
import { PYQ_SECTIONS, pyqSection, tintFor, topicName, type ListPyq } from './sections';

type Filters = { q: string; part: '' | SectionKey; book: string; topic: string; year: string; marks: string; status: '' | 'done' | 'todo'; view: 'topic' | 'year' };
const EMPTY: Filters = { q: '', part: '', book: '', topic: '', year: '', marks: '', status: '', view: 'topic' };

/** Cards drawn at a time; more follow as the reader nears the end. */
const BATCH = 40;

/** Where a question's back link returns to, filters and all. */
export const LIST_KEY = 'ho-pyq-list';
/** How far down a given list (filters and all) the reader was. */
const posKey = () => `ho-pyq-pos:${window.location.search}`;

const PART_KEYS = SECTIONS.map((s) => s.key);
const sectionOrder = (value: string) => PYQ_SECTIONS.findIndex((s) => s.value === value);

/**
 * The filters as the address gives them. ?section= is one of the book's six
 * sections, such as "Paper I - Early Medieval": the old list wrote it, and the
 * section pages link here with it. It opens that section alone, under the
 * part of the syllabus it belongs to.
 */
function parse(search: string): Filters {
  const p = new URLSearchParams(search);
  const book = pyqSection(p.get('section') ?? '');
  const part = p.get('part') ?? book?.key ?? '';
  const status = p.get('status');
  return {
    q: (p.get('q') ?? '').slice(0, 200),
    part: (PART_KEYS as string[]).includes(part) ? (part as SectionKey) : '',
    book: book && book.key === part ? book.value : '',
    topic: p.get('topic') ?? '',
    year: p.get('year') ?? '',
    marks: p.get('marks') ?? '',
    status: status === 'done' || status === 'todo' ? status : '',
    view: p.get('view') === 'year' ? 'year' : 'topic',
  };
}
const subscribeUrl = (cb: () => void) => { window.addEventListener('popstate', cb); return () => window.removeEventListener('popstate', cb); };

/** The question with each occurrence of the search words marked. */
function highlight(text: string, q: string): ReactNode {
  if (q.length < 2) return text;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : p));
}

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-IN')} ${n === 1 ? one : many}`;

/**
 * Every past question, with a search box, the four parts of the syllabus as
 * tabs, and topic, year, marks and attempted-or-not to narrow by. Grouped by
 * topic and sub-topic by default, the way the PYQ book and most aspirants
 * work through them; by year on request.
 *
 * The filters live in the address, so Back from a question returns to the
 * list as it was left, and a filtered list can be shared. The server draws the
 * unfiltered list; the address is read as the page comes to life.
 *
 * Opening a question needs a free account, as it always has.
 */
export default function PyqBrowser({ questions, syllabus }: { questions: ListPyq[]; syllabus: Record<string, string[]> }) {
  const search = useSyncExternalStore(subscribeUrl, () => window.location.search, () => '');
  const fromUrl = useMemo(() => parse(search), [search]);
  const [own, setOwn] = useState<Filters | null>(null);
  const f = own ?? fromUrl;

  const [shown, setShown] = useState(BATCH);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const pendingScroll = useRef<number | null>(null);
  const { attempted, ready, toggle } = useAttemptedPyqs();
  const isDone = (x: ListPyq) => ready && attempted[x.id] !== undefined;
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();

  // Back from a question returns to the batches that were loaded and the
  // place in them, put back before the first paint.
  useLayoutEffect(() => {
    try {
      const key = posKey();
      const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null') as { shown?: number; y?: number; at?: number } | null;
      // Used once, and only soon after: the list reopened later from the
      // navbar should start at the top.
      sessionStorage.removeItem(key);
      if (saved && typeof saved.shown === 'number' && typeof saved.y === 'number' && Date.now() - (saved.at ?? 0) < 30 * 60_000) {
        pendingScroll.current = saved.y;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShown(Math.max(BATCH, saved.shown));
      }
    } catch { /* no saved place: start at the top */ }
  }, []);
  useLayoutEffect(() => {
    if (pendingScroll.current === null) return;
    window.scrollTo(0, pendingScroll.current);
    pendingScroll.current = null;
  }, [shown]);
  // Also where the question's back link returns to: the list as it is now,
  // which may have come with its filters in the link rather than been set here.
  const rememberPlace = () => {
    try {
      sessionStorage.setItem(posKey(), JSON.stringify({ shown, y: Math.round(window.scrollY), at: Date.now() }));
      sessionStorage.setItem(LIST_KEY, `${window.location.pathname}${window.location.search}`);
    } catch { /* storage blocked */ }
  };
  const openQuestion = (e: React.MouseEvent) => {
    if (!requireLogin('Sign in free to view PYQs and model answers.')) { e.preventDefault(); return; }
    rememberPlace();
  };

  const update = (next: Partial<Filters>) => {
    const merged = { ...f, ...next };
    // A tab is a part of the syllabus; it lets go of a single book section.
    if (next.part !== undefined) merged.book = '';
    // A topic from another part of the syllabus would leave an empty list
    // with no clue why; the part wins.
    if (next.part !== undefined && merged.topic && merged.part) {
      const t = questions.find((x) => x.topic === merged.topic);
      if (t && pyqSection(t.section)?.key !== merged.part) merged.topic = '';
    }
    setOwn(merged);
    setShown(BATCH);
    const params = new URLSearchParams();
    if (merged.q) params.set('q', merged.q);
    if (merged.book) params.set('section', merged.book);
    else if (merged.part) params.set('part', merged.part);
    if (merged.topic) params.set('topic', merged.topic);
    if (merged.year) params.set('year', merged.year);
    if (merged.marks) params.set('marks', merged.marks);
    if (merged.status) params.set('status', merged.status);
    if (merged.view === 'year') params.set('view', 'year');
    const url = `${window.location.pathname}${params.size ? `?${params}` : ''}`;
    window.history.replaceState(window.history.state, '', url);
    try { sessionStorage.setItem(LIST_KEY, url); } catch { /* the back link goes to the plain list */ }
  };

  const q = f.q.trim().toLowerCase();
  const filtered = useMemo(() => questions.filter((x) =>
    (!f.part || pyqSection(x.section)?.key === f.part) &&
    (!f.book || x.section === f.book) &&
    (!f.topic || x.topic === f.topic) &&
    (!f.year || String(x.year) === f.year) &&
    (!f.marks || String(x.marks) === f.marks) &&
    (!f.status || (f.status === 'done') === (ready && attempted[x.id] !== undefined)) &&
    // The sub-topic too: it is the finest label a reader can name, such as
    // "Kalhana" or "Feudalism Debate".
    (!q || x.question.toLowerCase().includes(q) || x.topic.toLowerCase().includes(q) || x.subtopic.toLowerCase().includes(q)),
  ), [questions, f.part, f.book, f.topic, f.year, f.marks, f.status, q, ready, attempted]);

  // The order the list reads in: the book's (section, topic, sub-topic,
  // newest first within it), or simply newest first.
  const ordered = useMemo(() => {
    const subOrder = new Map<string, number>();
    questions.forEach((x, i) => { const k = `${x.topic}|${x.subtopic}`; if (!subOrder.has(k)) subOrder.set(k, i); });
    return [...filtered].sort((a, b) => f.view === 'year'
      ? b.year - a.year || sectionOrder(a.section) - sectionOrder(b.section) || a.topic.localeCompare(b.topic)
      : sectionOrder(a.section) - sectionOrder(b.section) || a.topic.localeCompare(b.topic)
        || (subOrder.get(`${a.topic}|${a.subtopic}`)! - subOrder.get(`${b.topic}|${b.subtopic}`)!) || b.year - a.year);
  }, [filtered, questions, f.view]);

  // Totals across the whole filtered list, for the headings.
  const totals = useMemo(() => {
    const m = new Map<string, { n: number; done: number }>();
    for (const x of filtered) {
      for (const k of [`s:${x.section}`, `t:${x.topic}`, `y:${x.year}`]) {
        const v = m.get(k) ?? { n: 0, done: 0 };
        v.n++; if (ready && attempted[x.id] !== undefined) v.done++;
        m.set(k, v);
      }
    }
    return m;
  }, [filtered, ready, attempted]);

  const visible = ordered.slice(0, shown);

  // Load the next batch a little before the reader reaches the end.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || shown >= ordered.length) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) setShown((s) => s + BATCH); }, { rootMargin: '900px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [shown, ordered.length]);

  const years = useMemo(() => [...new Set(questions.map((x) => x.year))].sort((a, b) => b - a), [questions]);
  const marksOptions = useMemo(() => [...new Set(questions.map((x) => x.marks))].sort((a, b) => a - b), [questions]);
  const partCount = (k: SectionKey) => questions.filter((x) => pyqSection(x.section)?.key === k).length;
  const topicGroups = useMemo(() => PYQ_SECTIONS
    .filter((s) => (f.book ? s.value === f.book : !f.part || s.key === f.part))
    .map((s) => {
      const counts = new Map<string, number>();
      for (const x of questions) if (x.section === s.value) counts.set(x.topic, (counts.get(x.topic) ?? 0) + 1);
      return { section: s, topics: [...counts].sort(([a], [b]) => a.localeCompare(b)) };
    })
    .filter((g) => g.topics.length), [questions, f.part, f.book]);

  const filteredAtAll = Boolean(f.q || f.part || f.book || f.topic || f.year || f.marks || f.status);
  const doneHere = ready ? filtered.filter((x) => attempted[x.id] !== undefined).length : 0;

  const pickTopic = (topic: string) => {
    update({ topic });
    const top = listRef.current ? listRef.current.getBoundingClientRect().top + window.scrollY - 150 : 0;
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
  };

  const card = (x: ListPyq, view: Filters['view']) => {
    const meta = pyqSection(x.section);
    const done = isDone(x);
    return (
      <article key={x.id} className={`pq-card${done ? ' done' : ''}`} style={view === 'year' ? tintFor(meta?.key) : undefined}>
        <div className="pq-meta">
          {view === 'year' ? <span className="pq-sec">{meta?.short ?? x.section}</span> : <span className="pq-year-tag">{x.year}</span>}
          {x.source !== 'UPSC' && <span className="pq-src">{x.source}</span>}
          <span className="pq-marks">{x.marks} marks</span>
        </div>
        <h3 className="pq-q">
          <Link href={`/pyqs/${x.id}`} onClick={openQuestion}>{highlight(x.question, q)}</Link>
        </h3>
        <div className="pq-foot">
          {view === 'year' && (
            <button type="button" className={`pq-topic${f.topic === x.topic ? ' on' : ''}`} onClick={() => pickTopic(x.topic)} title={`Every question on ${topicName(x.topic)}`}>
              {topicName(x.topic)}
            </button>
          )}
          <span className="pq-foot-end">
            <button type="button" className={`pq-tick${done ? ' on' : ''}`} onClick={() => toggle(x.id)} aria-pressed={done}
              title={done ? 'Attempted. Tap to untick' : 'Mark as attempted'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {done ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <circle cx="12" cy="12" r="8" />}
              </svg>
              {done ? 'Attempted' : 'Mark attempted'}
            </button>
            <Link className="pq-write" href={`/evaluate?question=${encodeURIComponent(x.question)}&marks=${x.marks}`} onClick={rememberPlace}>
              Write an answer
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </span>
        </div>
      </article>
    );
  };

  // The visible cards under their headings: section, topic and sub-topic, or year.
  const body: ReactNode[] = [];
  if (f.view === 'year') {
    let year = -1; let items: ListPyq[] = [];
    const flush = () => {
      if (!items.length) return;
      const t = totals.get(`y:${year}`);
      body.push(
        <section key={`y${year}`} className="pq-group">
          <h2 className="pq-year-head">{year}<span>{plural(t?.n ?? 0, 'question')}</span></h2>
          <div className="pq-cards">{items.map((x) => card(x, 'year'))}</div>
        </section>,
      );
    };
    for (const x of visible) { if (x.year !== year) { flush(); year = x.year; items = []; } items.push(x); }
    flush();
  } else {
    let i = 0;
    while (i < visible.length) {
      const section = visible[i].section;
      const meta = pyqSection(section);
      const topics: ReactNode[] = [];
      while (i < visible.length && visible[i].section === section) {
        const topic = visible[i].topic;
        const subs: ReactNode[] = [];
        while (i < visible.length && visible[i].topic === topic) {
          const sub = visible[i].subtopic;
          const items: ListPyq[] = [];
          while (i < visible.length && visible[i].topic === topic && visible[i].subtopic === sub) items.push(visible[i++]);
          subs.push(
            <div key={sub || '-'} className="pq-sub">
              {sub && <h4 className="pq-sub-head">{sub}</h4>}
              <div className="pq-cards">{items.map((x) => card(x, 'topic'))}</div>
            </div>,
          );
        }
        const t = totals.get(`t:${topic}`);
        topics.push(
          <section key={topic} className="pq-topic-block">
            <div className="pq-topic-head">
              <h3>{topicName(topic)}</h3>
              <span className="pq-topic-count">
                {plural(t?.n ?? 0, 'question')}{t && t.done > 0 ? <span className={t.done === t.n ? 'all' : ''}> · {t.done === t.n ? 'all attempted' : `${t.done} attempted`}</span> : null}
              </span>
              {!f.topic && <button type="button" className="pq-only" onClick={() => pickTopic(topic)}>Only this topic</button>}
            </div>
            {syllabus[topic]?.length > 0 && (
              <p className="pq-syllabus">Syllabus: {syllabus[topic].map((s) => s.replace(/^Paper I+, /, '')).join('; ')}</p>
            )}
            {subs}
          </section>,
        );
      }
      const st = totals.get(`s:${section}`);
      body.push(
        <section key={section} className="pq-group" style={tintFor(meta?.key)}>
          <h2 className="pq-section-head">
            <span className="pq-section-dot" aria-hidden="true" />
            {meta?.name ?? section}
            <span>Paper {meta?.paper === 2 ? 'II' : 'I'} · {plural(st?.n ?? 0, 'question')}</span>
          </h2>
          {topics}
        </section>,
      );
    }
  }

  return (
    <div className="pq">
      <div className="pq-bar">
        <label className="pq-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input type="search" value={f.q} onChange={(e) => update({ q: e.target.value })}
            placeholder="Search, say “Akbar” or “feudalism”" aria-label="Search the past questions" />
          {f.q && <button type="button" className="pq-clear" onClick={() => update({ q: '' })} aria-label="Clear search">✕</button>}
        </label>
        <div className="pq-tabs" role="tablist" aria-label="Part of the syllabus">
          <button type="button" role="tab" aria-selected={!f.part} className={`pq-tab${!f.part ? ' on' : ''}`} onClick={() => update({ part: '' })}>All</button>
          {SECTIONS.map((s) => (
            <button key={s.key} type="button" role="tab" aria-selected={f.part === s.key} style={tintFor(s.key)}
              className={`pq-tab${f.part === s.key ? ' on' : ''}`} onClick={() => update({ part: s.key })}>
              {s.name.replace(' India', '').replace(' History', '')}<span>{partCount(s.key)}</span>
            </button>
          ))}
        </div>
        <div className="pq-selects">
          <select className={`pq-select pq-select-topic${f.topic ? ' set' : ''}`} value={f.topic} onChange={(e) => update({ topic: e.target.value })} aria-label="Topic">
            <option value="">Every topic</option>
            {topicGroups.map((g) => (
              <optgroup key={g.section.value} label={g.section.name}>
                {g.topics.map(([t, n]) => <option key={t} value={t}>{topicName(t)} ({n})</option>)}
              </optgroup>
            ))}
          </select>
          <select className={`pq-select${f.year ? ' set' : ''}`} value={f.year} onChange={(e) => update({ year: e.target.value })} aria-label="Year">
            <option value="">Every year</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className={`pq-select${f.marks ? ' set' : ''}`} value={f.marks} onChange={(e) => update({ marks: e.target.value })} aria-label="Marks">
            <option value="">Any marks</option>
            {marksOptions.map((m) => <option key={m} value={m}>{m} marks</option>)}
          </select>
          <select className={`pq-select pq-select-status${f.status ? ' set' : ''}`} value={f.status} onChange={(e) => update({ status: e.target.value as Filters['status'] })} aria-label="Attempted or not">
            <option value="">All questions</option>
            <option value="todo">Not attempted yet</option>
            <option value="done">Attempted</option>
          </select>
        </div>
      </div>

      <div className="pq-status" aria-live="polite">
        <span>
          {plural(filtered.length, 'question')}
          {f.book && !f.topic && <> in <strong>{pyqSection(f.book)?.name}</strong></>}
          {f.topic && <> on <strong>{topicName(f.topic)}</strong></>}
          {doneHere > 0 && <span className="pq-status-done"> · {doneHere.toLocaleString('en-IN')} attempted</span>}
        </span>
        <span className="pq-status-end">
          <span className="pq-view" role="group" aria-label="Group the questions by">
            <button type="button" className={f.view === 'topic' ? 'on' : ''} aria-pressed={f.view === 'topic'} onClick={() => update({ view: 'topic' })}>By topic</button>
            <button type="button" className={f.view === 'year' ? 'on' : ''} aria-pressed={f.view === 'year'} onClick={() => update({ view: 'year' })}>By year</button>
          </span>
          {filteredAtAll && <button type="button" className="pq-reset" onClick={() => update({ ...EMPTY, view: f.view })}>Clear filters</button>}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="pq-empty">
          <p>No question matches all of that. Try fewer filters, or a shorter search.</p>
          {f.q.trim() && (
            <Link href={`/chat?q=${encodeURIComponent(f.q.trim())}`} className="pq-empty-ask ds-card ds-card-link">
              <strong>Ask the AI about “{f.q.trim()}”</strong>
              <span>It answers from the standard history books and shows you where.</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="pq-list" ref={listRef}>
          {body}
          {shown < ordered.length && (
            <div ref={sentinel} className="pq-more">
              <button type="button" className="ds-btn ds-btn-line ds-btn-sm" onClick={() => setShown((s) => s + BATCH)}>
                Show more ({(ordered.length - shown).toLocaleString('en-IN')} left)
              </button>
            </div>
          )}
        </div>
      )}

      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
    </div>
  );
}
