'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import Link from '@/components/Link';
import { useRouter } from 'next/navigation';
import { useAttemptedPyqs } from '@/hooks/useAttemptedPyqs';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import LoginPromptModal from '@/components/LoginPromptModal';
import { SECTIONS, type SectionKey } from '@/components/notes/sections';
import { PYQ_SECTIONS, pyqSection, sourceLabel, tintFor, topicName, type ListPyq } from './sections';
import { useLang } from '@/lib/i18n/LangContext';
import { usePyqHi, topicLabel } from '@/lib/pyqHi';

const SECTION_SHORT_HI: Record<SectionKey, string> = { ancient: 'प्राचीन', medieval: 'मध्यकालीन', modern: 'आधुनिक', world: 'विश्व' };

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
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** Where each heading sits in the page, for the jump list beside it. */
const topicId = (section: string, topic: string) => `pq-t${sectionOrder(section)}-${slug(topic)}`;
const subId = (section: string, topic: string, sub: string) => `pq-s${sectionOrder(section)}-${slug(topic)}-${slug(sub)}`;
const yearId = (year: number) => `pq-y${year}`;
type Jump = { id: string; label: string; n: number; done: number; at: number };
/** Where the sticky filters end once stuck, so a heading is not hidden under them. */
const filtersBottom = () => {
  const bar = document.querySelector<HTMLElement>('.pq-bar');
  if (!bar || getComputedStyle(bar).position !== 'sticky') return 64;
  return (parseFloat(getComputedStyle(bar).top) || 0) + bar.offsetHeight;
};

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
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const jumpListRef = useRef<HTMLOListElement>(null);
  const pendingJump = useRef<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const pendingScroll = useRef<number | null>(null);
  const { attempted, ready, toggle } = useAttemptedPyqs();
  const isDone = (x: ListPyq) => ready && attempted[x.id] !== undefined;
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();

  // Hindi mode: the questions, topics and sub-topics in Hindi once the Hindi
  // bank has loaded, and the page's own words in Hindi straight away.
  const { langHi } = useLang();
  const hi = usePyqHi(langHi);
  const L = (en: string, h: string) => (langHi ? h : en);
  const qText = (x: ListPyq) => hi?.q[x.id] ?? x.question;
  const tName = (t: string) => topicLabel(t, hi);
  const subName = (sub: string) => hi?.subtopics[sub] ?? sub;
  const secName = (value: string) => { const m = pyqSection(value); return (langHi ? m?.nameHi : m?.name) ?? value; };
  const nQ = (n: number) => (langHi ? `${n.toLocaleString('en-IN')} प्रश्न` : plural(n, 'question'));
  const signInMsg = L('Sign in free to view PYQs and model answers.', 'PYQ और आदर्श उत्तर देखने के लिए निःशुल्क साइन इन करें।');

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
    if (!requireLogin(signInMsg)) { e.preventDefault(); return; }
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
    (!q || x.question.toLowerCase().includes(q) || x.topic.toLowerCase().includes(q) || x.subtopic.toLowerCase().includes(q)
      // In Hindi mode the Hindi is searched too, so "अकबर" finds Akbar.
      || (hi !== null && ((hi.q[x.id] ?? '').includes(q) || (hi.topics[x.topic] ?? '').includes(q) || (hi.subtopics[x.subtopic] ?? '').includes(q)))),
  ), [questions, f.part, f.book, f.topic, f.year, f.marks, f.status, q, ready, attempted, hi]);

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

  // The index beside the list: the topics in view, or the years, or one
  // topic's sub-topics, each with its count and a jump to its heading.
  const jumps = useMemo(() => {
    const groups: { key: string; name?: string; tint?: SectionKey; items: Jump[] }[] = [];
    const seen = new Map<string, Jump>();
    ordered.forEach((x, i) => {
      let key = 'all'; let id: string; let label: string; let name: string | undefined; let tint: SectionKey | undefined;
      if (f.view === 'year') { id = yearId(x.year); label = String(x.year); }
      else if (f.topic) { if (!x.subtopic) return; id = subId(x.section, x.topic, x.subtopic); label = hi?.subtopics[x.subtopic] ?? x.subtopic; }
      else { const m = pyqSection(x.section); key = x.section; name = (langHi ? m?.nameHi : m?.name) ?? x.section; tint = m?.key; id = topicId(x.section, x.topic); label = topicLabel(x.topic, hi); }
      let item = seen.get(id);
      if (!item) {
        let g = groups[groups.length - 1];
        if (!g || g.key !== key) { g = { key, name, tint, items: [] }; groups.push(g); }
        item = { id, label, n: 0, done: 0, at: i };
        seen.set(id, item);
        g.items.push(item);
      }
      item.n++;
      if (ready && attempted[x.id] !== undefined) item.done++;
    });
    return groups;
  }, [ordered, f.view, f.topic, ready, attempted, hi, langHi]);
  const jumpCount = jumps.reduce((n, g) => n + g.items.length, 0);

  // A heading lands just below the sticky filters, whose height varies with
  // the width. One further down than the cards drawn so far is drawn first.
  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return false;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - filtersBottom() - 12, behavior: 'smooth' });
    return true;
  };
  const jumpTo = (j: Jump) => {
    if (scrollToHeading(j.id)) return;
    pendingJump.current = j.id;
    setShown((s) => Math.max(s, (Math.floor(j.at / BATCH) + 2) * BATCH));
  };
  useEffect(() => {
    const id = pendingJump.current;
    if (!id) return;
    pendingJump.current = null;
    scrollToHeading(id);
  }, [shown]);

  // Which heading the reader is under, marked in the index, which keeps it in sight.
  const [here, setHere] = useState('');
  useEffect(() => {
    if (!window.matchMedia('(min-width: 1001px)').matches) return;
    const els = jumps.flatMap((g) => g.items).map((j) => document.getElementById(j.id)).filter((el): el is HTMLElement => el !== null);
    let frame = 0;
    const measure = () => {
      frame = 0;
      const line = filtersBottom() + 40;
      let id = els[0]?.id ?? '';
      for (const el of els) { if (el.getBoundingClientRect().top <= line) id = el.id; else break; }
      setHere(id);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
    frame = requestAnimationFrame(measure);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, [jumps, shown]);
  useEffect(() => {
    const list = jumpListRef.current;
    const item = list?.querySelector<HTMLElement>(`[data-jump="${here}"]`);
    if (!list || !item) return;
    const top = item.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    if (top < list.scrollTop || top > list.scrollTop + list.clientHeight - item.offsetHeight) list.scrollTop = top - list.clientHeight / 3;
  }, [here]);

  const untried = ready ? filtered.filter((x) => attempted[x.id] === undefined) : filtered;
  const pickOne = () => {
    if (!untried.length || !requireLogin(signInMsg)) return;
    rememberPlace();
    router.push(`/pyqs/${untried[Math.floor(Math.random() * untried.length)].id}`);
  };

  const card = (x: ListPyq, view: Filters['view']) => {
    const meta = pyqSection(x.section);
    const done = isDone(x);
    return (
      <article key={x.id} className={`pq-card${done ? ' done' : ''}`} style={view === 'year' ? tintFor(meta?.key) : undefined}>
        <div className="pq-meta">
          {view === 'year' ? <span className="pq-sec">{(langHi ? meta?.shortHi : meta?.short) ?? x.section}</span> : <span className="pq-year-tag">{x.year}</span>}
          {x.source !== 'UPSC' && <span className="pq-src">{sourceLabel(x.source, langHi)}</span>}
          <span className="pq-marks">{x.marks} {L('marks', 'अंक')}</span>
        </div>
        <h3 className="pq-q">
          <Link href={`/pyqs/${x.id}`} onClick={openQuestion} lang={hi?.q[x.id] ? 'hi' : undefined}>{highlight(qText(x), q)}</Link>
        </h3>
        <div className="pq-foot">
          {view === 'year' && (
            <button type="button" className={`pq-topic${f.topic === x.topic ? ' on' : ''}`} onClick={() => pickTopic(x.topic)} title={L(`Every question on ${topicName(x.topic)}`, `${tName(x.topic)} के सभी प्रश्न`)}>
              {tName(x.topic)}
            </button>
          )}
          <span className="pq-foot-end">
            <button type="button" className={`pq-tick${done ? ' on' : ''}`} onClick={() => toggle(x.id)} aria-pressed={done}
              title={done ? L('Attempted. Tap to untick', 'हल किया। हटाने के लिए टैप करें') : L('Mark as attempted', 'हल किया चिह्नित करें')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {done ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <circle cx="12" cy="12" r="8" />}
              </svg>
              {done ? L('Attempted', 'हल किया') : L('Mark attempted', 'हल किया चिह्नित करें')}
            </button>
            <Link className="pq-write" href={`/evaluate?question=${encodeURIComponent(qText(x))}&marks=${x.marks}`} onClick={rememberPlace}>
              {L('Write an answer', 'उत्तर लिखें')}
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
        <section key={`y${year}`} id={yearId(year)} className="pq-group">
          <h2 className="pq-year-head">{year}<span>{nQ(t?.n ?? 0)}</span></h2>
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
            <div key={sub || '-'} id={sub ? subId(section, topic, sub) : undefined} className="pq-sub">
              {sub && <h4 className="pq-sub-head">{subName(sub)}</h4>}
              <div className="pq-cards">{items.map((x) => card(x, 'topic'))}</div>
            </div>,
          );
        }
        const t = totals.get(`t:${topic}`);
        topics.push(
          <section key={topic} id={topicId(section, topic)} className="pq-topic-block">
            <div className="pq-topic-head">
              <h3>{tName(topic)}</h3>
              <span className="pq-topic-count">
                {nQ(t?.n ?? 0)}{t && t.done > 0 ? <span className={t.done === t.n ? 'all' : ''}> · {t.done === t.n ? L('all attempted', 'सभी हल किए') : L(`${t.done} attempted`, `${t.done} हल किए`)}</span> : null}
              </span>
              {!f.topic && <button type="button" className="pq-only" onClick={() => pickTopic(topic)}>{L('Only this topic', 'केवल यह विषय')}</button>}
            </div>
            {syllabus[topic]?.length > 0 && (
              <p className="pq-syllabus">{L('Syllabus', 'पाठ्यक्रम')}: {syllabus[topic].map((s) => (hi?.syllabus[s] ?? s).replace(/^(Paper|प्रश्नपत्र) I+, /, '')).join(', ')}</p>
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
            {secName(section)}
            <span>{L('Paper', 'प्रश्नपत्र')} {meta?.paper === 2 ? 'II' : 'I'} · {nQ(st?.n ?? 0)}</span>
          </h2>
          {topics}
        </section>,
      );
    }
  }

  return (
    <div className="pq">
      <div className="pq-main">
      <div className="pq-bar">
        <label className="pq-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input type="search" value={f.q} onChange={(e) => update({ q: e.target.value })}
            placeholder={L('Search, say “Akbar” or “feudalism”', 'खोजें, जैसे “अकबर” या “सामंतवाद”')} aria-label={L('Search the past questions', 'पिछले प्रश्न खोजें')} />
          {f.q && <button type="button" className="pq-clear" onClick={() => update({ q: '' })} aria-label={L('Clear search', 'खोज हटाएँ')}>✕</button>}
        </label>
        <div className="pq-tabs" role="tablist" aria-label={L('Part of the syllabus', 'पाठ्यक्रम का भाग')}>
          <button type="button" role="tab" aria-selected={!f.part} className={`pq-tab${!f.part ? ' on' : ''}`} onClick={() => update({ part: '' })}>{L('All', 'सभी')}</button>
          {SECTIONS.map((s) => (
            <button key={s.key} type="button" role="tab" aria-selected={f.part === s.key} style={tintFor(s.key)}
              className={`pq-tab${f.part === s.key ? ' on' : ''}`} onClick={() => update({ part: s.key })}>
              {langHi ? SECTION_SHORT_HI[s.key] : s.name.replace(' India', '').replace(' History', '')}<span>{partCount(s.key)}</span>
            </button>
          ))}
        </div>
        <div className="pq-selects">
          <select className={`pq-select pq-select-topic${f.topic ? ' set' : ''}`} value={f.topic} onChange={(e) => update({ topic: e.target.value })} aria-label={L('Topic', 'विषय')}>
            <option value="">{L('Every topic', 'सभी विषय')}</option>
            {topicGroups.map((g) => (
              <optgroup key={g.section.value} label={langHi ? g.section.nameHi : g.section.name}>
                {g.topics.map(([t, n]) => <option key={t} value={t}>{tName(t)} ({n})</option>)}
              </optgroup>
            ))}
          </select>
          <select className={`pq-select${f.year ? ' set' : ''}`} value={f.year} onChange={(e) => update({ year: e.target.value })} aria-label={L('Year', 'वर्ष')}>
            <option value="">{L('Every year', 'सभी वर्ष')}</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className={`pq-select${f.marks ? ' set' : ''}`} value={f.marks} onChange={(e) => update({ marks: e.target.value })} aria-label={L('Marks', 'अंक')}>
            <option value="">{L('Any marks', 'कोई भी अंक')}</option>
            {marksOptions.map((m) => <option key={m} value={m}>{m} {L('marks', 'अंक')}</option>)}
          </select>
          <select className={`pq-select pq-select-status${f.status ? ' set' : ''}`} value={f.status} onChange={(e) => update({ status: e.target.value as Filters['status'] })} aria-label={L('Attempted or not', 'हल किए या नहीं')}>
            <option value="">{L('All questions', 'सभी प्रश्न')}</option>
            <option value="todo">{L('Not attempted yet', 'अभी हल नहीं किए')}</option>
            <option value="done">{L('Attempted', 'हल किए')}</option>
          </select>
        </div>
      </div>

      <div className="pq-status" aria-live="polite">
        <span>
          {nQ(filtered.length)}
          {f.book && !f.topic && <>{L(' in ', ' · ')}<strong>{secName(f.book)}</strong></>}
          {f.topic && <>{L(' on ', ' · ')}<strong>{tName(f.topic)}</strong></>}
          {doneHere > 0 && <span className="pq-status-done"> · {doneHere.toLocaleString('en-IN')} {L('attempted', 'हल किए')}</span>}
        </span>
        <span className="pq-status-end">
          <span className="pq-view" role="group" aria-label={L('Group the questions by', 'प्रश्नों का समूह')}>
            <button type="button" className={f.view === 'topic' ? 'on' : ''} aria-pressed={f.view === 'topic'} onClick={() => update({ view: 'topic' })}>{L('By topic', 'विषयवार')}</button>
            <button type="button" className={f.view === 'year' ? 'on' : ''} aria-pressed={f.view === 'year'} onClick={() => update({ view: 'year' })}>{L('By year', 'वर्षवार')}</button>
          </span>
          {filteredAtAll && <button type="button" className="pq-reset" onClick={() => update({ ...EMPTY, view: f.view })}>{L('Clear filters', 'फ़िल्टर हटाएँ')}</button>}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="pq-empty">
          <p>{L('No question matches all of that. Try fewer filters, or a shorter search.', 'इन सभी से मेल खाता कोई प्रश्न नहीं मिला। कम फ़िल्टर या छोटी खोज आज़माएँ।')}</p>
          {f.q.trim() && (
            <Link href={`/chat?q=${encodeURIComponent(f.q.trim())}`} className="pq-empty-ask ds-card ds-card-link">
              <strong>{L(`Ask the AI about “${f.q.trim()}”`, `“${f.q.trim()}” के बारे में AI से पूछें`)}</strong>
              <span>{L('It answers from the standard history books and shows you where.', 'यह मानक इतिहास पुस्तकों से उत्तर देता है और स्रोत भी बताता है।')}</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="pq-list" ref={listRef}>
          {body}
          {shown < ordered.length && (
            <div ref={sentinel} className="pq-more">
              <button type="button" className="ds-btn ds-btn-line ds-btn-sm" onClick={() => setShown((s) => s + BATCH)}>
                {L('Show more', 'और दिखाएँ')} ({(ordered.length - shown).toLocaleString('en-IN')} {L('left', 'बाक़ी')})
              </button>
            </div>
          )}
        </div>
      )}
      </div>

      {filtered.length > 0 && (
        <aside className="pq-aside" aria-label={L('This list at a glance', 'यह सूची एक नज़र में')}>
          <div className="pq-side">
            <h2>{filteredAtAll ? L('In this list', 'इस सूची में') : L('Your progress', 'आपकी प्रगति')}</h2>
            <p className="pq-side-big">{langHi
              ? <>{nQ(filtered.length)} में से <strong>{doneHere.toLocaleString('en-IN')}</strong> हल किए</>
              : <><strong>{doneHere.toLocaleString('en-IN')}</strong> of {plural(filtered.length, 'question')} attempted</>}</p>
            <div className="pq-side-bar" aria-hidden="true"><span style={{ width: `${(doneHere / filtered.length) * 100}%` }} /></div>
            {untried.length > 0
              ? <button type="button" className="ds-btn ds-btn-line ds-btn-sm pq-side-pick" onClick={pickOne}>{L('Pick one I have not tried', 'ऐसा प्रश्न चुनें जो अभी हल नहीं किया')}</button>
              : <p className="pq-side-note">{L('Every one of these attempted.', 'ये सभी हल किए जा चुके हैं।')}</p>}
          </div>
          {jumpCount > 1 && (
            <div className="pq-side pq-side-jumps">
              <h2>{f.view === 'year' ? L('Jump to a year', 'वर्ष पर जाएँ') : f.topic ? L('Jump to a sub-topic', 'उप-विषय पर जाएँ') : L('Jump to a topic', 'विषय पर जाएँ')}</h2>
              <ol className="pq-jump" ref={jumpListRef}>
                {jumps.map((g) => (
                  <li key={g.key} style={g.tint ? tintFor(g.tint) : undefined}>
                    {g.name && jumps.length > 1 && <span className="pq-jump-sec"><i aria-hidden="true" />{g.name}</span>}
                    <ol>
                      {g.items.map((j) => (
                        <li key={j.id}>
                          <button type="button" data-jump={j.id} className={here === j.id ? 'on' : ''} aria-current={here === j.id ? 'location' : undefined} onClick={() => jumpTo(j)}>
                            <span className="pq-jump-name">{j.label}</span>
                            <span className={`pq-jump-n${j.done && j.done === j.n ? ' all' : ''}`}>{j.done ? `${j.done}/${j.n}` : j.n}</span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>
      )}

      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />
    </div>
  );
}
