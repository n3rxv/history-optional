'use client';
import { useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { pyqs, pyqYears, type PYQ } from '@/lib/pyqData';
import { allNotes } from '@/lib/notes';
import { useMemo } from 'react';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import { auth } from '@/lib/firebase';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { useAttemptedPyqs } from '@/hooks/useAttemptedPyqs';
import LoginPromptModal from '@/components/LoginPromptModal';
import Script from 'next/script';
import EmptyState from '@/components/EmptyState';
import OwlLoader from '@/components/OwlLoader';
import ModelAnswerModal from '@/components/ModelAnswerModal';
import { useRefreshSafe } from '@/hooks/useRefreshSafe';

// Early Medieval had no tab at all: 99 questions reachable only through "All"
// or the /pyqs/early-medieval page. India Since Independence is newly split out
// of Modern India, which had been carrying it as an unmarked 47-question block.
const TABS = [
  { label: 'All',            value: 'all' },
  { label: 'Ancient',        value: 'Paper I - Ancient India' },
  { label: 'Early Medieval', value: 'Paper I - Early Medieval' },
  { label: 'Medieval',       value: 'Paper I - Medieval India' },
  { label: 'Modern',         value: 'Paper II - Modern India' },
  { label: 'Since 1947',     value: 'Paper II - India Since Independence' },
  { label: 'World',          value: 'Paper II - World History' },
];

const SECTION_ORDER = TABS.filter(t => t.value !== 'all').map(t => t.value);
const MARK_OPTIONS = [10, 15, 20, 25, 30, 60];
const PYQ_YEAR = new Map(pyqs.map(q => [q.id, q.year]));
const NOTE_TITLE = new Map(allNotes.map(n => [n.slug, n.title]));
const NOTE_SECTION = new Map(allNotes.map(n => [n.slug, n.section]));
const NOTE_ORDER = new Map(allNotes.map((n, i) => [n.slug, i]));
const noteOrder = (slug: string) => NOTE_ORDER.get(slug) ?? allNotes.length;
// Topper copies are filed by notes topic, so their tabs are the notes' four
// sections; a copy is in whichever sections its topics are.
const TOPPER_TABS = [
  { label: 'All',      value: 'all' },
  { label: 'Ancient',  value: 'Ancient India' },
  { label: 'Medieval', value: 'Medieval India' },
  { label: 'Modern',   value: 'Modern India' },
  { label: 'World',    value: 'World History' },
];
const inTopperSection = (c: { topics: string[] }, section: string) =>
  section === 'all' || c.topics.some(t => NOTE_SECTION.get(t) === section);

function SectionTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '0.45rem 1rem', borderRadius: 6,
      border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
      background: active ? 'var(--accent-dim)' : 'var(--bg2)',
      color: active ? 'var(--accent)' : 'var(--text2)',
      fontFamily: 'var(--font-ui)', fontSize: '0.85rem',
      fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', gap: '0.4rem',
    }}>
      {label}
      <span style={{
        fontSize: '0.68rem',
        background: active ? 'var(--accent-dim)' : 'var(--bg3)',
        color: active ? 'var(--accent)' : 'var(--text3)',
        padding: '1px 6px', borderRadius: 10, fontFamily: 'var(--font-mono)',
      }}>{count}</span>
    </button>
  );
}
// Questions drawn at a time; Show more adds the next lot.
const LIST_PAGE = 60;


export default function PYQsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab]       = useState<string>('all');
  const [filterYear, setFilterYear]     = useState<number | 'all'>('all');
  const [filterMarks, setFilterMarks]   = useState<number | 'all'>('all');
  const [filterTopic, setFilterTopic]   = useState<string>('all');
  const [filterDone, setFilterDone]     = useState<'all' | 'done' | 'todo'>('all');
  const [search, setSearch]             = useState('');
  // Topper Copies mode and its filters ride in the URL as well (?topper=1
  // &tsection=&ttopic=), so Back from a copy returns to the copies and not
  // to the PYQs.
  const [showTopperCopies, setShowTopperCopies] = useState(false);
  const [topperSection, setTopperSection] = useState<string>('all');
  const [topperTopic, setTopperTopic] = useState<string>('all');

  // The filters live in the URL as well (?section=&topic=&year=&marks=
  // &status=&q=), so Back from a question lands on the same filtered list.
  // As state alone they were lost every time the page unmounted, and readers
  // had to pick their theme again after each question.
  //
  // Read on mount rather than with useSearchParams, which needs a Suspense
  // boundary and opts the page out of prerendering. A layout effect, so a
  // restored list replaces the full one before the first paint instead of
  // flashing it.
  const [filtersRestored, setFiltersRestored] = useState(false);
  useLayoutEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const section = p.get('section');
    if (section && SECTION_ORDER.includes(section)) setActiveTab(section);
    const topic = p.get('topic');
    if (topic && pyqs.some((q: PYQ) => q.topic === topic)) setFilterTopic(topic);
    const year = Number(p.get('year'));
    if (pyqYears.includes(year)) setFilterYear(year);
    const marks = Number(p.get('marks'));
    if (MARK_OPTIONS.includes(marks)) setFilterMarks(marks);
    const status = p.get('status');
    if (status === 'done' || status === 'todo') setFilterDone(status);
    const q = p.get('q');
    if (q) setSearch(q.slice(0, 200));
    if (p.get('topper') === '1') setShowTopperCopies(true);
    const tsection = p.get('tsection');
    if (tsection && tsection !== 'all' && TOPPER_TABS.some(t => t.value === tsection)) setTopperSection(tsection);
    const ttopic = p.get('ttopic');
    if (ttopic && allNotes.some(n => n.slug === ttopic)) setTopperTopic(ttopic);
    setFiltersRestored(true);
  }, []);

  useEffect(() => {
    // Not before the restore: the first run would write the defaults and
    // erase the very parameters it is about to read.
    if (!filtersRestored) return;
    const p = new URLSearchParams(window.location.search);
    const put = (key: string, value: string | number) => {
      if (value === 'all' || value === '') p.delete(key); else p.set(key, String(value));
    };
    put('section', activeTab);
    put('topic', filterTopic);
    put('year', filterYear);
    put('marks', filterMarks);
    put('status', filterDone);
    put('q', search.trim());
    put('topper', showTopperCopies ? '1' : '');
    put('tsection', showTopperCopies ? topperSection : 'all');
    put('ttopic', showTopperCopies ? topperTopic : 'all');
    const qs = p.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
    if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      // Replace, not push: each filter change is not a step Back should undo.
      window.history.replaceState(null, '', next);
    }
  }, [filtersRestored, activeTab, filterTopic, filterYear, filterMarks, filterDone, search, showTopperCopies, topperSection, topperTopic]);
  const [modelAnswerQ, setModelAnswerQ] = useState<PYQ | null>(null);
  const [topperCopies, setTopperCopies] = useState<{ id: string; question: string; note: string | null; pyq_ids: number[]; topics: string[] }[]>([]);
  const [topperLoading, setTopperLoading] = useState(false);
  const [topperSearch, setTopperSearch] = useState('');
  const [topperAccess, setTopperAccess] = useState<{ access: boolean; clicks: number; isPremium?: boolean; hasTopperAccess?: boolean } | null>(null);
  const [showTopperPaywall, setShowTopperPaywall] = useState(false);

  // Fetch topper access status on mount
  useEffect(() => {
    const checkAccess = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) { setTopperAccess({ access: false, clicks: 0 }); return; }
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/topper-access', { headers: { 'x-user-token': token } });
      const data = await res.json();
      setTopperAccess(data);
    };
    checkAccess();
  }, []);

  useEffect(() => {
    if (!showTopperCopies || topperCopies.length > 0) return;
    setTopperLoading(true);
    fetch('/api/topper-copies/all')
      .then(r => r.json())
      .then(d => setTopperCopies(d.data || []))
      .catch(() => {})
      .finally(() => setTopperLoading(false));
  }, [showTopperCopies]);

  // The notes topics that have copies, grouped by section in syllabus order,
  // and only the chosen section's once one is picked.
  const topperTopicGroups = useMemo(() => {
    const count = new Map<string, number>();
    for (const c of topperCopies) for (const t of c.topics) count.set(t, (count.get(t) ?? 0) + 1);
    return [...new Set(allNotes.map(n => n.section))]
      .filter(section => topperSection === 'all' || section === topperSection)
      .map(section => ({
        section,
        topics: allNotes
          .filter(n => n.section === section && count.has(n.slug))
          .map(n => ({ slug: n.slug, title: n.title, count: count.get(n.slug) ?? 0 })),
      }))
      .filter(g => g.topics.length > 0);
  }, [topperCopies, topperSection]);

  const { attempted, ready: attemptedReady, isAttempted, count: attemptedCount, toggle: toggleAttempted } = useAttemptedPyqs();
  const { GateModals, usage, showChatLimitModal } = useSubscriptionGate(() => {});
  const { isOpen: loginOpen, message: loginMsg, requireLogin, closeModal: closeLogin } = useLoginPrompt();

  const handleModelAnswer = (e: React.MouseEvent, q: PYQ) => {
    e.stopPropagation();
    if (!usage.subscribed) { showChatLimitModal(); return; }
    setModelAnswerQ(q);
  };

  const filtered = pyqs.filter((q: PYQ) => {
    if (activeTab !== 'all' && q.section !== activeTab) return false;
    if (filterTopic !== 'all' && q.topic !== filterTopic) return false;
    if (filterDone !== 'all') {
      const done = attempted[q.id] !== undefined;
      if (filterDone === 'done' ? !done : done) return false;
    }
    if (filterYear !== 'all' && q.year !== filterYear) return false;
    if (filterMarks !== 'all' && q.marks !== filterMarks) return false;
    if (search) {
      const s = search.toLowerCase();
      // Sub-topic too: it is the finest label a reader can name, e.g. "Kalhana"
      // or "Feudalism Debate", and searching for one should find the cluster.
      if (!q.question.toLowerCase().includes(s)
          && !q.topic.toLowerCase().includes(s)
          && !q.subtopic.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  /**
   * Topics for the dropdown, grouped by section.
   *
   * A flat alphabetical list was unreadable under "All": every section
   * numbers its topics from 01, so five different "01." entries from five
   * different sections sat next to each other with nothing saying which was
   * which. Grouping restores the book's order — sections in paper order,
   * topics numbered within them.
   */
  const topicGroups = useMemo(() => {
    const sections = activeTab === 'all' ? SECTION_ORDER : [activeTab];
    return sections.map(section => ({
      section,
      label: (TABS.find(t => t.value === section)?.label ?? section),
      topics: [...new Set(pyqs.filter((q: PYQ) => q.section === section).map((q: PYQ) => q.topic))]
        .sort((a, b) => a.localeCompare(b))
        .map(topic => ({
          topic,
          count: pyqs.filter((q: PYQ) => q.section === section && q.topic === topic).length,
        })),
    })).filter(g => g.topics.length > 0);
  }, [activeTab]);

  /**
   * Progress for whatever the reader is looking at.
   *
   * Scoped to the section tab rather than always the whole 1,584: someone
   * working through Modern India wants to see 40/422, not 40/1584, which would
   * make steady work look like no progress at all.
   *
   * Year, marks and the attempted filter itself are deliberately NOT applied —
   * the denominator has to stay still, or selecting "Not attempted" would
   * redefine the total and pin the bar to 0%.
   */
  const progress = useMemo(() => {
    const pool = activeTab === 'all'
      ? pyqs
      : pyqs.filter((q: PYQ) => q.section === activeTab);
    const scoped = filterTopic === 'all' ? pool : pool.filter((q: PYQ) => q.topic === filterTopic);
    const done = scoped.filter((q: PYQ) => attempted[q.id] !== undefined).length;
    return {
      done,
      total: scoped.length,
      pct: scoped.length ? Math.round((done / scoped.length) * 100) : 0,
      label: filterTopic !== 'all' ? filterTopic
           : activeTab === 'all' ? 'All questions'
           : (TABS.find(t => t.value === activeTab)?.label ?? activeTab),
    };
  }, [activeTab, filterTopic, attempted]);

  const topicCount = useMemo(
    () => topicGroups.reduce((n, g) => n + g.topics.length, 0),
    [topicGroups]
  );

  /**
   * Grouped for display: section -> topic -> sub-topic.
   *
   * Question ids follow the original ordering, and topics are not contiguous
   * in it — 61 topics reappear after another topic — so grouping has to be
   * explicit rather than relying on adjacency the way the old topic divider did.
   */
  const grouped = useMemo(() => {
    const byTopic = new Map<string, PYQ[]>();
    for (const q of filtered) {
      const key = `${q.section}||${q.topic}`;
      if (!byTopic.has(key)) byTopic.set(key, []);
      byTopic.get(key)!.push(q);
    }
    return [...byTopic.entries()]
      .sort(([a], [b]) => {
        const [secA, topA] = a.split('||'); const [secB, topB] = b.split('||');
        const d = SECTION_ORDER.indexOf(secA) - SECTION_ORDER.indexOf(secB);
        return d !== 0 ? d : topA.localeCompare(topB);   // "01." … "28." sorts naturally
      })
      .map(([key, qs]) => {
        const [section, topic] = key.split('||');
        const bySub = new Map<string, PYQ[]>();
        for (const q of qs) {
          if (!bySub.has(q.subtopic)) bySub.set(q.subtopic, []);
          bySub.get(q.subtopic)!.push(q);
        }
        return { section, topic, count: qs.length,
                 done: qs.filter(q => attempted[q.id] !== undefined).length,
                 syllabus: qs[0].syllabus,
                 subs: [...bySub.entries()] };
      });
  }, [filtered, attempted]);

  const isP1 = (section: string) => section.startsWith('Paper I');
  const clearAll = () => { setActiveTab('all'); setFilterTopic('all'); setFilterDone('all'); setFilterYear('all'); setFilterMarks('all'); setSearch(''); };
  // The list used to draw every match at once: all 1,584 questions unfiltered,
  // a page half a million pixels tall on a phone and 4.8 MB of HTML. It now
  // draws LIST_PAGE at a time. The count belongs to the filters it was raised
  // under, so changing them starts again from the top, and it is kept for the
  // tab so Back from a question finds the list as long as it was left.
  const listKey = [activeTab, filterTopic, filterYear, filterMarks, filterDone, search].join('|');
  const [shown, setShown] = useState({ key: '', n: LIST_PAGE });
  useRefreshSafe('ho_pyqs_shown_v1', shown, setShown);
  const listLimit = shown.key === listKey ? shown.n : LIST_PAGE;
  const visibleGroups = useMemo(() => {
    let left = listLimit;
    const out: typeof grouped = [];
    for (const g of grouped) {
      if (left <= 0) break;
      const subs: typeof g.subs = [];
      for (const [sub, qs] of g.subs) {
        if (left <= 0) break;
        const take = qs.slice(0, left);
        subs.push([sub, take]);
        left -= take.length;
      }
      out.push({ ...g, subs });
    }
    return out;
  }, [grouped, listLimit]);
  const listLeft = Math.max(0, filtered.length - listLimit);

  const hasFilters = activeTab !== 'all' || filterTopic !== 'all' || filterDone !== 'all' || filterYear !== 'all' || filterMarks !== 'all' || search;

  const selectStyle: React.CSSProperties = {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '0.5rem 0.75rem',
    color: 'var(--text)', fontSize: '0.875rem', cursor: 'pointer',
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
      <style>{`
        .shimmer-btn::before{content:"";position:absolute;top:0;left:-75%;width:50%;height:100%;background:linear-gradient(120deg,transparent 0%,rgba(255,255,255,0.13) 50%,transparent 100%);transform:skewX(-20deg);opacity:0;pointer-events:none;z-index:1;}
        .shimmer-btn:hover::before{opacity:1;animation:glass-shine 0.55s ease forwards;}
        @keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}
        .pyq-card{cursor:pointer;transition:background 0.15s;}
        .pyq-card:hover{background:var(--bg3)!important;}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          History Optional
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
              Previous Year Questions
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
              UPSC Mains 1979–2026 · {pyqs.length} questions · Click any question to view & submit answers
            </p>
          </div>
          {/* Both are page-level actions, so they sit together. Topper Copies
              used to live down in the tab row, where it read as an eighth tab
              and then wrapped onto a line of its own. */}
          <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0, marginTop: '0.25rem', flexWrap: 'wrap' }}>
            <button onClick={() => setShowTopperCopies(p => !p)} style={{
              background: 'transparent',
              color: showTopperCopies ? 'var(--accent)' : 'var(--text2)',
              border: `1px solid ${showTopperCopies ? 'var(--accent)' : 'var(--border)'}`,
              padding: '0.55rem 1.1rem', borderRadius: 6,
              fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}>{showTopperCopies ? '← Back to PYQs' : 'Topper Copies'}</button>
            <Link href="/test" style={{
              background: 'var(--accent)', color: 'var(--accent-on)',
              padding: '0.55rem 1.25rem', borderRadius: 6,
              fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              whiteSpace: 'nowrap',
              position: 'relative', overflow: 'hidden',
            }} className="shimmer-btn">Start Test →</Link>
          </div>
        </div>
      </div>

      {/* Sections. Topper Copies has its own: the PYQ tabs follow the book's
          sections, which copies are not filed by. A topic chosen under one
          section is meaningless under another, so a tab resets it — here
          rather than in an effect on the tab, which also fired when the
          filters were restored from the URL and threw the restored topic away. */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {showTopperCopies
          ? TOPPER_TABS.map(tab => (
              <SectionTab key={tab.value} label={tab.label}
                count={topperCopies.filter(c => inTopperSection(c, tab.value)).length}
                active={topperSection === tab.value}
                onClick={() => { setTopperSection(tab.value); setTopperTopic('all'); }} />
            ))
          : TABS.map(tab => (
              <SectionTab key={tab.value} label={tab.label}
                count={tab.value === 'all' ? pyqs.length : pyqs.filter((q: PYQ) => q.section === tab.value).length}
                active={activeTab === tab.value}
                onClick={() => { setActiveTab(tab.value); setFilterTopic('all'); }} />
            ))}
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.25rem',
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          value={showTopperCopies ? topperSearch : search}
          onChange={e => showTopperCopies ? setTopperSearch(e.target.value) : setSearch(e.target.value)}
          placeholder={showTopperCopies ? 'Search topper copies…' : 'Search questions or topics...'}
          style={{
            flex: 1, minWidth: 200, background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '0.5rem 0.85rem',
            color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none',
          }}
        />
        {showTopperCopies && (
          <select value={topperTopic} onChange={e => setTopperTopic(e.target.value)}
            style={{ ...selectStyle, maxWidth: 280 }} aria-label="Filter topper copies by topic">
            <option value="all">All Topics</option>
            {topperTopicGroups.map(g => (
              <optgroup key={g.section} label={g.section}>
                {g.topics.map(t => <option key={t.slug} value={t.slug}>{t.title} ({t.count})</option>)}
              </optgroup>
            ))}
          </select>
        )}
        {!showTopperCopies && <>
        <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)}
          style={{ ...selectStyle, maxWidth: 260 }}
          title={activeTab === 'all' ? 'All topics across every section' : `Topics in ${activeTab}`}>
          <option value="all">All Topics ({topicCount})</option>
          {topicGroups.map(g => (
            <optgroup key={g.section} label={g.label}>
              {g.topics.map(({ topic, count }) => (
                <option key={g.section + topic} value={topic}>{topic} ({count})</option>
              ))}
            </optgroup>
          ))}
        </select>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : +e.target.value)} style={selectStyle}>
          <option value="all">All Years</option>
          {pyqYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMarks} onChange={e => setFilterMarks(e.target.value === 'all' ? 'all' : +e.target.value)} style={selectStyle}>
          <option value="all">All Marks</option>
          {MARK_OPTIONS.map(m => <option key={m} value={m}>{m} marks</option>)}
        </select>
        {/* Marking without filtering would be half a feature: the point of
            ticking questions off is being able to see what is left. */}
        <select value={filterDone} onChange={e => setFilterDone(e.target.value as 'all' | 'done' | 'todo')} style={selectStyle}>
          <option value="all">All Questions</option>
          <option value="todo">Not attempted</option>
          <option value="done">Attempted</option>
        </select>
        </>}
        {(showTopperCopies ? topperSection !== 'all' || topperTopic !== 'all' || topperSearch : hasFilters) && (
          <button onClick={showTopperCopies ? () => { setTopperSection('all'); setTopperTopic('all'); setTopperSearch(''); } : clearAll} style={{
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text3)', cursor: 'pointer',
            padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.8rem',
          }}>Clear ✕</button>
        )}
      </div>

      {showTopperCopies ? (
        <div style={{ marginTop: '0.5rem' }}>
          {topperLoading && (
            <OwlLoader label="Loading topper copies" />
          )}
          {!topperLoading && topperCopies.length === 0 && (
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '3rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📚</div>
              <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem' }}>No topper copies yet</div>
              <div style={{ color: 'var(--text3)', fontSize: '0.82rem', marginTop: '0.4rem' }}>Check back soon.</div>
            </div>
          )}
          {!topperLoading && topperCopies.length > 0 && (() => {
            const filtered = topperCopies.filter(c => {
              if (!inTopperSection(c, topperSection)) return false;
              if (topperTopic !== 'all' && !c.topics.includes(topperTopic)) return false;
              if (!topperSearch.trim()) return true;
              const s = topperSearch.toLowerCase();
              return c.question.toLowerCase().includes(s) || (c.note?.toLowerCase().includes(s) ?? false);
            });
            // Grouped by notes topic in syllabus order, so sections follow in
            // order too, as on the PYQ list. A copy filed under two topics shows
            // once, under the first one the filters allow. Within a topic,
            // copies answering the same PYQ sit together, and copies that
            // answer none come last.
            const fits = (t: string) =>
              (topperSection === 'all' || NOTE_SECTION.get(t) === topperSection) && (topperTopic === 'all' || t === topperTopic);
            const firstPyq = (c: { pyq_ids: number[] }) => (c.pyq_ids.length ? Math.min(...c.pyq_ids) : Number.MAX_SAFE_INTEGER);
            const byTopic = new Map<string, typeof filtered>();
            for (const c of filtered) {
              const home = c.topics.filter(fits).sort((x, y) => noteOrder(x) - noteOrder(y))[0] ?? '';
              byTopic.set(home, [...(byTopic.get(home) ?? []), c]);
            }
            const groups = [...byTopic.entries()]
              .sort(([x], [y]) => noteOrder(x) - noteOrder(y))
              .map(([slug, copies]) => ({
                slug,
                copies: copies.sort((x, y) => firstPyq(x) - firstPyq(y) || x.question.localeCompare(y.question)),
              }));
            return (
              <div>
                <div style={{ color: 'var(--text3)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  {filtered.length} of {topperCopies.length} copies
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  {groups.map(g => (
                    <div key={g.slug || '_none'}>
                      <div style={{ marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <h2 style={{
                            fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600,
                            color: 'var(--text)', margin: 0,
                          }}>{g.slug ? NOTE_TITLE.get(g.slug) ?? g.slug : 'Other copies'}</h2>
                          <span style={{
                            fontSize: '0.63rem', fontFamily: 'var(--font-mono)', color: 'var(--text3)',
                            border: '1px solid var(--border)', padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                          }}>{g.copies.length} {g.copies.length === 1 ? 'copy' : 'copies'}</span>
                          {topperSection === 'all' && g.slug && (
                            <span style={{ fontSize: '0.63rem', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
                              {NOTE_SECTION.get(g.slug)}
                            </span>
                          )}
                          {g.slug && (
                            <Link href={`/notes/${g.slug}`} style={{
                              marginLeft: 'auto', fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
                              color: 'var(--accent)', textDecoration: 'none',
                            }}>Notes &rarr;</Link>
                          )}
                        </div>
                        <div style={{ height: 1, background: 'var(--border)', marginTop: '0.7rem' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {g.copies.map(c => (
                          <div key={c.id} style={{
                            background: 'var(--bg2)', border: '1px solid var(--border)',
                            borderRadius: 8, padding: '1.1rem 1.4rem',
                            borderLeft: '3px solid color-mix(in srgb, var(--accent) 50%, transparent)',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ color: 'var(--text)', fontSize: '0.93rem', lineHeight: 1.6, marginBottom: c.note ? '0.5rem' : '0.75rem' }}>
                                  {c.question}
                                </p>
                                {c.note && (
                                  <p style={{ color: 'var(--text3)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem' }}>
                                    &#128221; {c.note}
                                  </p>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                  {c.topics.filter(slug => slug !== g.slug).map(slug => (
                                    <Link
                                      key={slug}
                                      href={`/notes/${slug}`}
                                      style={{
                                        fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                                        color: 'var(--text2)', background: 'var(--bg3)',
                                        border: '1px solid var(--border)',
                                        padding: '2px 8px', borderRadius: 3, textDecoration: 'none',
                                      }}
                                    >
                                      {NOTE_TITLE.get(slug) ?? slug}
                                    </Link>
                                  ))}
                                  {c.pyq_ids.map((pid: number) => (
                                    <a
                                      key={pid}
                                      href={`/pyqs/${pid}`}
                                      style={{
                                        fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                                        color: 'color-mix(in srgb, var(--accent) 80%, transparent)',
                                        background: 'var(--accent-dim)',
                                        border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                                        padding: '2px 8px', borderRadius: 3,
                                        textDecoration: 'none', cursor: 'pointer',
                                      }}
                                    >
                                      &#128279; PYQ {PYQ_YEAR.get(pid) ?? ''}{' '}&#8599;
                                    </a>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={async () => {
                                  const currentUser = auth.currentUser;
                                  if (!currentUser) { requireLogin('Login to view topper copies'); return; }
                                  // Opening the copy is what spends a free view, and the
                                  // copy endpoint counts it. Here only decide between the
                                  // copy and the paywall.
                                  if (topperAccess?.access) {
                                    window.location.href = `/pyqs/topper/${c.id}`;
                                    return;
                                  }
                                  const token = await currentUser.getIdToken();
                                  const res = await fetch('/api/topper-access', { headers: { 'x-user-token': token } });
                                  const data = await res.json();
                                  setTopperAccess(data);
                                  if (data.access) window.location.href = `/pyqs/topper/${c.id}`;
                                  else setShowTopperPaywall(true);
                                }}
                                style={{
                                  flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                  background: 'var(--accent-dim)',
                                  border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                                  color: 'var(--accent)', borderRadius: 6,
                                  padding: '0.45rem 1rem', fontSize: '0.8rem',
                                  cursor: 'pointer', fontFamily: 'var(--font-mono)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                View Copy &#8594;
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
      <div>
      {/* Count */}
      {/* Progress. attemptedReady gates the whole block: localStorage cannot
          be read during prerender, so drawing a bar before the first read
          would show 0% to someone who has marked hundreds. Nothing is shown
          until the reader has marked something — an empty bar on a first
          visit is just noise. */}
      {attemptedReady && attemptedCount > 0 && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '0.85rem 1.1rem', marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text2)', fontSize: '0.82rem' }}>
              {progress.label}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text3)' }}>
              <span style={{ color: 'var(--success-text)' }}>{progress.done}</span>
              {' / '}{progress.total} attempted
              <span style={{ marginLeft: '0.5rem', color: progress.pct >= 100 ? 'var(--success-text)' : 'var(--text3)' }}>
                {progress.pct}%
              </span>
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progress.done}
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-label={`${progress.label} attempted`}
            style={{ height: 6, borderRadius: 3, background: 'var(--bg3)', overflow: 'hidden' }}
          >
            <div style={{
              width: `${progress.pct}%`, height: '100%',
              background: progress.pct >= 100
                ? 'var(--success-text)'
                : 'linear-gradient(90deg, var(--success-text) 0%, var(--success-text) 100%)',
              borderRadius: 3, transition: 'width 0.3s ease',
            }} />
          </div>
          {/* Whole-bank figure when the bar is showing a slice, so the overall
              number never disappears just because a filter is on. */}
          {(activeTab !== 'all' || filterTopic !== 'all') && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
              {attemptedCount} of {pyqs.length} across the whole bank
              {' '}({Math.round((attemptedCount / pyqs.length) * 100)}%)
            </div>
          )}
        </div>
      )}

      <div style={{ color: 'var(--text3)', fontSize: '0.8rem', marginBottom: '1rem' }}>
        Showing {filtered.length} of {pyqs.length} questions
      </div>

      {/* Questions, grouped topic -> sub-topic */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {visibleGroups.map(group => {
          // The colour says how heavily UPSC has mined this topic. It was
          // already here, applied to a "topic" that was really the section, so
          // every question in a paper carried the same badge.
          const c = group.count;
          const badgeColor  = c >= 8 ? 'var(--danger-text)' : c >= 5 ? 'var(--warning-text)' : c >= 3 ? 'var(--warning-text)' : 'var(--text3)';
          const badgeBg     = c >= 8 ? 'color-mix(in srgb, var(--danger-text) 8%, transparent)' : c >= 5 ? 'color-mix(in srgb, var(--warning-text) 8%, transparent)' : c >= 3 ? 'color-mix(in srgb, var(--warning-text) 8%, transparent)' : 'rgba(0,0,0,0.04)';
          const badgeBorder = c >= 8 ? 'color-mix(in srgb, var(--danger-text) 30%, transparent)'  : c >= 5 ? 'color-mix(in srgb, var(--warning-text) 30%, transparent)'  : c >= 3 ? 'color-mix(in srgb, var(--warning-text) 30%, transparent)'  : 'var(--border)';
          return (
            <div key={group.section + group.topic}>
              {/* Topic header */}
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <h2 style={{
                    fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600,
                    color: 'var(--text)', margin: 0,
                  }}>{group.topic}</h2>
                  <span style={{
                    fontSize: '0.63rem', fontFamily: 'var(--font-mono)', color: badgeColor,
                    background: badgeBg, border: `1px solid ${badgeBorder}`,
                    padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                  }}>asked {group.count}&times;</span>
                  {attemptedReady && group.done > 0 && (
                    <span style={{
                      fontSize: '0.63rem', fontFamily: 'var(--font-mono)',
                      color: group.done === group.count ? 'var(--success-text)' : 'var(--text3)',
                      background: group.done === group.count ? 'var(--success-wash)' : 'transparent',
                      border: `1px solid ${group.done === group.count ? 'color-mix(in srgb, var(--success-text) 35%, transparent)' : 'var(--border)'}`,
                      padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap',
                    }}>
                      {group.done === group.count ? '\u2713 all done' : `${group.done}/${group.count} done`}
                    </span>
                  )}
                  {activeTab === 'all' && (
                    <span style={{ fontSize: '0.63rem', fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
                      {group.section.replace('Paper I - ', 'P1 · ').replace('Paper II - ', 'P2 · ')}
                    </span>
                  )}
                </div>
                {/* The official syllabus item this topic answers to. The book
                    groups pedagogically; UPSC's own wording is what the exam
                    is set from, so both are shown. */}
                {group.syllabus.length > 0 && (
                  <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {group.syllabus.map(sy => (
                      <span key={sy} style={{
                        fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
                        color: 'var(--text3)', background: 'var(--bg3)',
                        border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 3,
                      }}>Syllabus &middot; {sy}</span>
                    ))}
                  </div>
                )}
                <div style={{ height: 1, background: 'var(--border)', marginTop: '0.7rem' }} />
              </div>

              {group.subs.map(([sub, qs]) => (
                <div key={sub || '_none'} style={{ marginBottom: '1rem' }}>
                  {sub && (
                    <div style={{
                      fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
                      color: 'var(--text2)', letterSpacing: '0.03em',
                      margin: '0 0 0.5rem', paddingLeft: '0.1rem',
                    }}>{sub} <span style={{ color: 'var(--text3)' }}>&middot; {qs.length}</span></div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {qs.map((q: PYQ) => (
                      <div key={q.id}>
                <div
                  className="pyq-card"
                  onClick={() => { if (requireLogin('Sign in free to view PYQs and model answers.')) router.push(`/pyqs/${q.id}`); }}
                  style={{
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '1.25rem 1.5rem',
                    borderLeft: `3px solid ${isP1(q.section) ? 'var(--accent)' : 'var(--blue, var(--accent))'}`,
                  }}
                >
                  {/* Badges + year */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{
                        background: isP1(q.section) ? 'var(--accent-dim)' : 'color-mix(in srgb, var(--accent) 12%, transparent)',
                        color: isP1(q.section) ? 'var(--accent)' : 'var(--blue, var(--accent))',
                        border: `1px solid ${isP1(q.section) ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'color-mix(in srgb, var(--accent) 30%, transparent)'}`,
                        fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                        padding: '2px 8px', borderRadius: 3, letterSpacing: '0.04em',
                      }}>
                        {q.section.replace('Paper I - ', 'P1 · ').replace('Paper II - ', 'P2 · ')}
                      </span>
                      <span style={{
                        background: 'var(--bg3)', color: 'var(--text3)',
                        fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                        padding: '2px 8px', borderRadius: 3, border: '1px solid var(--border)',
                      }}>{q.marks}M</span>
                      {q.source !== 'UPSC' && (
                        <span style={{
                          background: 'var(--success-wash)', color: 'var(--success-text)',
                          fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                          padding: '2px 8px', borderRadius: 3, border: '1px solid color-mix(in srgb, var(--success-text) 25%, transparent)',
                        }}>{q.source}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                      <span style={{ color: 'var(--text3)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{q.year}</span>
                      {/* stopPropagation: the whole card is a link to the
                          question, and ticking one off is not asking to open it. */}
                      <button
                        onClick={e => { e.stopPropagation(); toggleAttempted(q.id); }}
                        title={isAttempted(q.id) ? 'Marked attempted — click to undo' : 'Mark as attempted'}
                        aria-pressed={isAttempted(q.id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          background: isAttempted(q.id) ? 'var(--success-wash)' : 'transparent',
                          border: `1px solid ${isAttempted(q.id) ? 'color-mix(in srgb, var(--success-text) 45%, transparent)' : 'var(--border)'}`,
                          color: isAttempted(q.id) ? 'var(--success-text)' : 'var(--text3)',
                          borderRadius: 4, padding: '2px 8px', cursor: 'pointer',
                          fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                          transition: 'all 0.12s', whiteSpace: 'nowrap',
                        }}
                      >
                        <span style={{ fontSize: '0.8rem', lineHeight: 1 }}>
                          {isAttempted(q.id) ? '\u2713' : '\u25a2'}
                        </span>
                        {isAttempted(q.id) ? 'Done' : 'Mark'}
                      </button>
                    </div>
                  </div>

                  {/* Question */}
                  <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '0.75rem' }}>
                    {q.question}
                  </p>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text3)', fontSize: '0.73rem' }}>{q.topic}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={e => handleModelAnswer(e, q)}
                        className="shimmer-btn"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          color: usage.subscribed ? 'var(--accent)' : 'var(--text3)',
                          fontSize: '0.78rem', cursor: 'pointer',
                          background: usage.subscribed ? 'var(--accent-dim)' : 'var(--bg3)',
                          border: usage.subscribed ? '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' : '1px solid var(--border)',
                          padding: '3px 10px', borderRadius: 4,
                          position: 'relative', overflow: 'hidden',
                        }}
                      >
                        {!usage.subscribed && (
                          <span style={{
                            fontSize: '0.58rem', fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.08em', color: 'var(--warning-text)',
                            background: 'var(--warning-wash)',
                            border: '1px solid color-mix(in srgb, var(--warning-text) 30%, transparent)',
                            padding: '1px 5px', borderRadius: 3,
                          }}>PRO</span>
                        )}
                        Model Answer
                      </button>
                      <Link
                        href={`/chat?q=${encodeURIComponent(q.question)}`}
                        onClick={e => e.stopPropagation()}
                        style={{
                          color: 'var(--accent)', fontSize: '0.78rem', textDecoration: 'none',
                          background: 'var(--accent-dim)',
                          border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                          padding: '3px 10px', borderRadius: 4,
                          position: 'relative', overflow: 'hidden',
                        }}
                        className="shimmer-btn"
                      >Ask AI →</Link>
                    </div>
                  </div>
                </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {listLeft > 0 && (
          <button
            onClick={() => setShown({ key: listKey, n: listLimit + LIST_PAGE })}
            style={{
              alignSelf: 'center', padding: '0.7rem 1.4rem', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border2)', background: 'var(--bg2)', color: 'var(--text)',
              fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Show {Math.min(LIST_PAGE, listLeft)} more · {listLeft} left
          </button>
        )}

        {filtered.length === 0 && (
          <EmptyState
            title="No questions match these filters"
            action={
              <button onClick={() => { setFilterYear('all'); setFilterMarks('all'); setFilterTopic('all'); setFilterDone('all'); setSearch(''); }}>
                Clear the filters
              </button>
            }
          >
            Nothing UPSC has asked fits this search and these filters. Try fewer words, or widen the year, marks or topic.
          </EmptyState>
        )}
      </div>

      {/* Section pages. These are real links, so they are what a crawler
          follows to reach /pyqs/<section>; the tabs above are client-side
          filters and lead nowhere. They used to sit above the <h1>, which put
          six links before the page had said what it was. */}
      <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
          Browse by section
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Ancient India', href: '/pyqs/ancient-india' },
            { label: 'Early Medieval', href: '/pyqs/early-medieval' },
            { label: 'Medieval India', href: '/pyqs/medieval-india' },
            { label: 'Modern India', href: '/pyqs/modern-india' },
            { label: 'Since 1947', href: '/pyqs/india-since-independence' },
            { label: 'World History', href: '/pyqs/world-history' },
          ].map(({ label, href }) => (
            <a key={href} href={href} style={{
              padding: '0.35rem 0.9rem', borderRadius: 6,
              border: '1px solid var(--border)', background: 'var(--bg2)',
              color: 'var(--text2)', fontSize: '0.8rem', textDecoration: 'none',
              fontFamily: 'var(--font-ui)',
            }}>{label} PYQs →</a>
          ))}
        </div>
      </div>
      </div>
      )}
      <GateModals />
      {showTopperPaywall && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }} onClick={() => setShowTopperPaywall(false)}>
          <div style={{
            background: 'var(--bg)',
            border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
            borderRadius: 16, padding: '2.5rem 2rem', maxWidth: 420, width: '100%',
            textAlign: 'center',
            boxShadow: '0 0 0 1px color-mix(in srgb, var(--accent) 10%, transparent), 0 24px 60px rgba(0,0,0,0.5)',
          }} onClick={e => e.stopPropagation()}>
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--accent-dim)',
              border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', margin: '0 auto 1.25rem',
            }}>📋</div>
            <h3 style={{
              color: 'var(--text)', fontFamily: 'var(--font-display)',
              fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem',
            }}>
              5 free previews used
            </h3>
            <p style={{ color: 'var(--text3)', fontSize: '0.875rem', marginBottom: '0.75rem', lineHeight: 1.65 }}>
              Get unlimited access to all topper copies
            </p>
            <div style={{
              background: 'var(--accent-dim)',
              border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
              borderRadius: 10, padding: '0.85rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}>
              <span style={{ color: 'var(--accent)', fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹799</span>
              <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>/year · one-time unlock</span>
            </div>
            <button
              onClick={async () => {
                const currentUser = auth.currentUser;
                if (!currentUser) return;
                if (!(window as any).Razorpay) {
                  alert('Payment SDK not loaded. Please refresh and try again.');
                  return;
                }
                const token = await currentUser.getIdToken();
                const res = await fetch('/api/razorpay/topper-order', {
                  method: 'POST',
                  headers: { 'x-user-token': token },
                });
                const order = await res.json();
                if (!res.ok) {
                  alert('Order creation failed: ' + (order.error || 'Unknown error'));
                  return;
                }
                const rzp = new (window as any).Razorpay({
                  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                  amount: order.amount,
                  currency: order.currency,
                  order_id: order.orderId,
                  name: 'History Optional',
                  description: 'Topper Copies Access — 1 Year',
                  handler: async (response: any) => {
                    const verifyRes = await fetch('/api/razorpay/topper-verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-user-token': token },
                      body: JSON.stringify(response),
                    });
                    const v = await verifyRes.json();
                    if (v.ok) {
                      setTopperAccess({ access: true, clicks: 0, hasTopperAccess: true });
                      setShowTopperPaywall(false);
                    }
                  },
                });
                rzp.open();
              }}
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent))',
                border: 'none',
                color: 'var(--accent-on)', borderRadius: 10, padding: '0.85rem 2rem',
                fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-mono)', width: '100%',
                boxShadow: '0 4px 20px color-mix(in srgb, var(--accent) 35%, transparent)',
                transition: 'opacity 0.15s',
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseOut={e => (e.currentTarget.style.opacity = '1')}
            >
              🔓 Unlock for ₹799/year
            </button>
            <button
              onClick={() => setShowTopperPaywall(false)}
              style={{
                marginTop: '0.6rem', background: 'none', border: 'none',
                color: 'var(--text3)', fontSize: '0.78rem', cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      <LoginPromptModal isOpen={loginOpen} onClose={closeLogin} message={loginMsg} />

      {modelAnswerQ && (
        <ModelAnswerModal
          question={modelAnswerQ.question}
          marks={modelAnswerQ.marks}
          cacheKey={String(modelAnswerQ.id)}
          onClose={() => setModelAnswerQ(null)}
        />
      )}
    </div>
    </>
  );
}
