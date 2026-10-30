'use client';
import { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useSyllabusTracker } from '@/hooks/useSyllabusTracker';
import { useLang } from '@/lib/i18n/LangContext';
import { localNote, sectionName } from '@/lib/notesHi';
import { SECTIONS, sectionByName, type SectionKey } from './sections';

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
 *
 * In Hindi mode the cards show the Hindi topic list (lib/notesHi), and the
 * search looks through both languages, so "अकबर" and "Akbar" both find it.
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
  const { langHi } = useLang();
  const L = (en: string, hi: string) => (langHi ? hi : en);
  const roman = (p: 1 | 2) => (p === 1 ? 'I' : 'II');

  // The pool keeps the English for routes and sections; `view` is what the card shows.
  const pool = useMemo(() => (onlySection ? notes.filter((n) => n.section === onlySection) : notes)
    .map((n) => ({ ...n, view: localNote(n, true) })), [notes, onlySection]);
  const papers = ([1, 2] as const).filter((p) => pool.some((n) => n.paper === p));
  const count = (p: 1 | 2) => pool.filter((n) => n.paper === p).length;
  const tabs = !onlySection && papers.length > 1;

  const shown = useMemo(() => {
    if (!q) return tabs ? pool.filter((n) => n.paper === paper) : pool;
    const has = (t: string) => t.toLowerCase().includes(q);
    return pool.filter((n) =>
      has(n.title) || has(n.description) || n.subtopics.some(has) ||
      has(n.view.title) || has(n.view.description) || n.view.subtopics.some(has));
  }, [pool, paper, q, tabs]);

  // Sections in the order the notes run, each keeping its topics' order.
  const sections = useMemo(() => {
    const out: { key: string; name: string; paper: 1 | 2; notes: typeof shown }[] = [];
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
            placeholder={L('Find a topic, a historian or an idea', 'कोई विषय, इतिहासकार या विचार खोजें')}
            aria-label={L('Search the notes', 'नोट्स खोजें')}
            type="search"
          />
          {query && <button type="button" className="nb2-clear" onClick={() => setQuery('')} aria-label={L('Clear search', 'खोज हटाएँ')}>✕</button>}
        </label>
        {!q && tabs && (
          <div className="nb2-tabs" role="tablist" aria-label={L('Papers', 'प्रश्नपत्र')}>
            {papers.map((p) => (
              <button key={p} role="tab" aria-selected={paper === p} className={`nb2-tab${paper === p ? ' on' : ''}`} onClick={() => setPaper(p)}>
                {L(`Paper ${roman(p)}`, `प्रश्नपत्र ${roman(p)}`)}<span>{count(p)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {q && (
        <p className="nb2-found" aria-live="polite">
          {langHi
            ? (shown.length ? `${shown.length} ${shown.length === 1 ? 'विषय' : 'विषयों'} में “${query.trim()}” मिला` : `किसी विषय में “${query.trim()}” नहीं मिला।`)
            : shown.length
              ? `${shown.length} ${shown.length === 1 ? 'topic mentions' : 'topics mention'} “${query.trim()}”`
              : `No topic mentions “${query.trim()}”.`}
        </p>
      )}

      {q && !shown.length && (
        <Link href={`/chat?q=${encodeURIComponent(query.trim())}`} className="nb2-ask ds-card ds-card-link">
          <span className="nb2-ask-title">{L('Ask the AI instead', 'इसके बजाय AI से पूछें')}</span>
          <span className="nb2-ask-text">{langHi
            ? `AI मानक इतिहास पुस्तकों में “${query.trim()}” खोजेगा और दिखाएगा कि यह कहाँ मिला।`
            : `It will look for “${query.trim()}” in the standard history books and show you where it found it.`}</span>
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
                  <h2 className="nb2-section-name">{meta ? <Link href={meta.href}>{sectionName(sec.name, langHi)}</Link> : sectionName(sec.name, langHi)}</h2>
                  <span className="nb2-section-meta">
                    {q ? `${L('Paper', 'प्रश्नपत्र')} ${roman(sec.paper)} · ` : ''}{sec.notes.length} {langHi ? 'विषय' : sec.notes.length === 1 ? 'topic' : 'topics'}
                    {secDone > 0 ? ` · ${secDone} ${L('studied', 'पढ़े')}` : ''}
                  </span>
                </div>
              )}
              <div className="nb2-cards">
                {sec.notes.map((n) => {
                  const isDone = done(n);
                  const v = langHi ? n.view : n;
                  return (
                    <div key={n.slug} className={`nb2-card${isDone ? ' done' : ''}`}>
                      <span className="nb2-card-top">
                        <button
                          type="button"
                          className="nb2-n"
                          onClick={() => toggle(n.slug)}
                          aria-pressed={isDone}
                          aria-label={langHi
                            ? (isDone ? `${v.title}: पढ़ लिया। हटाने के लिए टैप करें।` : `${v.title} को पढ़ा हुआ चिह्नित करें`)
                            : (isDone ? `${n.title}: studied. Tap to untick.` : `Mark ${n.title} as studied`)}
                          title={isDone ? L('Studied. Tap to untick.', 'पढ़ लिया। हटाने के लिए टैप करें।') : L('Mark as studied', 'पढ़ा हुआ चिह्नित करें')}
                        >
                          <span className="nb2-n-num">{n.topic}</span>
                          <svg className="nb2-n-tick" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                        </button>
                        <Link href={`/notes/${n.slug}`} className="nb2-title">{v.title}</Link>
                      </span>
                      <span className="nb2-desc">{v.description}</span>
                      {v.subtopics.length > 0 && (
                        <span className="nb2-subs">
                          {v.subtopics.slice(0, 3).map((x) => <span key={x}>{x}</span>)}
                          {v.subtopics.length > 3 && <span className="more">+{v.subtopics.length - 3}</span>}
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

/**
 * The other three parts of the syllabus, as links under a section page's
 * title. Here rather than in NotesIndex because the names and the label
 * follow the reader's language, which only the browser knows.
 */
export function SectionLinks({ current }: { current: SectionKey }) {
  const { langHi } = useLang();
  return (
    <nav className="ni-siblings" aria-label={langHi ? 'पाठ्यक्रम के अन्य भाग' : 'Other parts of the syllabus'}>
      {SECTIONS.filter((s) => s.key !== current).map((s) => (
        <Link key={s.key} href={s.href} style={{ ['--st' as string]: `var(--tint-${s.key})` }}><span aria-hidden="true" />{sectionName(s.name, langHi)}</Link>
      ))}
    </nav>
  );
}
