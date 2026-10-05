'use client';
import { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useSyllabusTracker } from '@/hooks/useSyllabusTracker';
import { sectionByName } from './sections';

export type BrowserNote = {
  slug: string; title: string; topic: number; paper: 1 | 2; section: string;
  description: string; subtopics: string[];
};

/**
 * The notes: a box to find a topic by any word in it, the papers as tabs,
 * and each section a row of topic cards. Typing searches everything shown on
 * the page at once; with nothing typed, the tabs decide what shows. A section
 * page passes `onlySection` and gets that section alone, without tabs.
 *
 * Each card's number is also its "studied" tick: tap it to mark the topic
 * done, the same tick the reader and the dashboard use.
 *
 * ?paper=2 opens on Paper II (/paper2 redirects there), and switching tabs
 * writes the choice back to the address, so a link or a refresh keeps it.
 */
const subscribe = (cb: () => void) => { window.addEventListener('popstate', cb); return () => window.removeEventListener('popstate', cb); };
const paperInUrl = (): 1 | 2 => (new URLSearchParams(window.location.search).get('paper') === '2' ? 2 : 1);

export default function NotesBrowser({ notes, onlySection }: { notes: BrowserNote[]; onlySection?: string }) {
  const fromUrl = useSyncExternalStore(subscribe, paperInUrl, () => 1 as const);
  const [chosen, setChosen] = useState<1 | 2 | null>(null);
  const paper = chosen ?? fromUrl;
  const setPaper = (p: 1 | 2) => {
    setChosen(p);
    const url = new URL(window.location.href);
    if (p === 2) url.searchParams.set('paper', '2'); else url.searchParams.delete('paper');
    window.history.replaceState(window.history.state, '', url);
  };
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const { toggle, isCompleted, mounted } = useSyllabusTracker();
  const done = (n: BrowserNote) => mounted && isCompleted(n.slug);

  const pool = useMemo(() => (onlySection ? notes.filter((n) => n.section === onlySection) : notes), [notes, onlySection]);
  const papers = ([1, 2] as const).filter((p) => pool.some((n) => n.paper === p));
  const count = (p: 1 | 2) => pool.filter((n) => n.paper === p).length;
  const tabs = !onlySection && papers.length > 1;

  const shown = useMemo(() => {
    if (!q) return tabs ? pool.filter((n) => n.paper === paper) : pool;
    return pool.filter((n) =>
      n.title.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q) ||
      n.subtopics.some((s) => s.toLowerCase().includes(q)));
  }, [pool, paper, q, tabs]);

  // Sections in the order the notes run, each keeping its topics' order.
  const sections = useMemo(() => {
    const out: { key: string; name: string; paper: 1 | 2; notes: BrowserNote[] }[] = [];
    for (const n of shown) {
      const key = `${n.paper}-${n.section}`;
      let sec = out.find((x) => x.key === key);
      if (!sec) { sec = { key, name: n.section, paper: n.paper, notes: [] }; out.push(sec); }
      sec.notes.push(n);
    }
    return out;
  }, [shown]);

  return (
    <div className="nb2">
      <div className="nb2-bar">
        <label className="nb2-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a topic, a historian or an idea"
            aria-label="Search the notes"
            type="search"
          />
          {query && <button type="button" className="nb2-clear" onClick={() => setQuery('')} aria-label="Clear search">✕</button>}
        </label>
        {!q && tabs && (
          <div className="nb2-tabs" role="tablist" aria-label="Papers">
            {papers.map((p) => (
              <button key={p} role="tab" aria-selected={paper === p} className={`nb2-tab${paper === p ? ' on' : ''}`} onClick={() => setPaper(p)}>
                Paper {p === 1 ? 'I' : 'II'}<span>{count(p)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {q && (
        <p className="nb2-found" aria-live="polite">
          {shown.length
            ? `${shown.length} ${shown.length === 1 ? 'topic mentions' : 'topics mention'} “${query.trim()}”`
            : `No topic mentions “${query.trim()}”.`}
        </p>
      )}

      {q && !shown.length && (
        <Link href={`/chat?q=${encodeURIComponent(query.trim())}`} className="nb2-ask ds-card ds-card-link">
          <span className="nb2-ask-title">Ask the AI instead</span>
          <span className="nb2-ask-text">It will look for “{query.trim()}” in the standard history books and show you where it found it.</span>
        </Link>
      )}

      <div className="nb2-sections">
        {sections.map((sec) => {
          const meta = sectionByName(sec.name);
          const tint = meta ? { ['--t' as string]: `var(--tint-${meta.key})`, ['--w' as string]: `var(--wash-${meta.key})` } : undefined;
          const secDone = sec.notes.filter(done).length;
          return (
            <section key={sec.key} className={`nb2-section${onlySection ? ' solo' : ''}`} style={tint}>
              {!onlySection && (
                <div className="nb2-section-head">
                  <h2 className="nb2-section-name">{meta ? <Link href={meta.href}>{sec.name}</Link> : sec.name}</h2>
                  <span className="nb2-section-meta">
                    {q ? `Paper ${sec.paper === 1 ? 'I' : 'II'} · ` : ''}{sec.notes.length} {sec.notes.length === 1 ? 'topic' : 'topics'}
                    {secDone > 0 ? ` · ${secDone} studied` : ''}
                  </span>
                </div>
              )}
              <div className="nb2-cards">
                {sec.notes.map((n) => {
                  const isDone = done(n);
                  return (
                    <div key={n.slug} className={`nb2-card${isDone ? ' done' : ''}`}>
                      <span className="nb2-card-top">
                        <button
                          type="button"
                          className="nb2-n"
                          onClick={() => toggle(n.slug)}
                          aria-pressed={isDone}
                          aria-label={isDone ? `${n.title}: studied. Tap to untick.` : `Mark ${n.title} as studied`}
                          title={isDone ? 'Studied. Tap to untick.' : 'Mark as studied'}
                        >
                          <span className="nb2-n-num">{n.topic}</span>
                          <svg className="nb2-n-tick" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                        </button>
                        <Link href={`/notes/${n.slug}`} className="nb2-title">{n.title}</Link>
                      </span>
                      <span className="nb2-desc">{n.description}</span>
                      {n.subtopics.length > 0 && (
                        <span className="nb2-subs">
                          {n.subtopics.slice(0, 3).map((x) => <span key={x}>{x}</span>)}
                          {n.subtopics.length > 3 && <span className="more">+{n.subtopics.length - 3}</span>}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
