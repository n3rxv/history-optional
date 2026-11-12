'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { allNotes, type Note } from '@/lib/notes';
import { SECTIONS, SectionIcon } from '@/components/notes/sections';
import type { PyqHit, DebateHit } from '@/app/api/search/route';
import { useLang } from '@/lib/i18n/LangContext';
import { NOTE_HI, SECTION_HI } from '@/lib/notesHi';
import { usePyqHi } from '@/lib/pyqHi';
import { pyqSection } from '@/components/pyq/sections';

/**
 * The site search: pages, notes, debates and PYQs, or the words handed to the
 * AI. Opens on ⌘K or Ctrl+K, from its own trigger, or from anything that
 * dispatches 'open-search' on window (the phone menu does, since the bar's
 * trigger is hidden there).
 *
 * Note titles, descriptions and sub-topics match here, from the small note
 * index. Note bodies, PYQs and the historiography bank are searched by
 * /api/search, so none of them ships to the browser and the bank is not read
 * from Supabase on every open.
 */

type Item = {
  key: string;
  label: string;
  hint?: string;
  /** label and hint in Hindi mode, for the fixed pages. */
  labelHi?: string;
  hintHi?: string;
  href: string;
  group: 'Ask' | 'Notes' | 'Debates' | 'PYQs' | 'Go to';
  icon: React.ReactNode;
};

const Glyph = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const G = {
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  notes: 'M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z',
  pyq: 'M9 4h6v3H9zM9 5.5H6.5A1.5 1.5 0 0 0 5 7v12.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V7a1.5 1.5 0 0 0-1.5-1.5H15M9 12h6M9 16h4',
  pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  test: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  debate: 'M7 8h10M7 12h6M4 4h16v12H8l-4 4z',
  time: 'M12 3v18M6 7h6M12 12h6M6 17h6',
  copy: 'M8 4h8l4 4v12H8zM16 4v4h4M4 8v12h4',
  cards: 'M4 7h12v12H4zM8 3h12v12',
  prelims: 'M5 12l4 4L19 6',
  news: 'M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5',
  book: 'M5 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM17 8h2v12',
  dash: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  plans: 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z',
};

const PAGES: Item[] = [
  { key: 'chat', label: 'AI Chat', hint: 'Your personal tutor for the syllabus', labelHi: 'AI चैट', hintHi: 'पाठ्यक्रम के लिए आपका निजी ट्यूटर', href: '/chat', group: 'Go to', icon: <Glyph d={G.chat} /> },
  { key: 'notes', label: 'Notes', hint: 'Every topic in both papers', labelHi: 'नोट्स', hintHi: 'दोनों प्रश्नपत्रों का हर विषय', href: '/notes', group: 'Go to', icon: <Glyph d={G.notes} /> },
  { key: 'pyqs', label: 'PYQs', hint: 'Every question since 1979', labelHi: 'पिछले प्रश्न', hintHi: '1979 से अब तक का हर प्रश्न', href: '/pyqs', group: 'Go to', icon: <Glyph d={G.pyq} /> },
  { key: 'evaluate', label: 'Get an answer checked', hint: 'Upload a handwritten answer', labelHi: 'उत्तर जँचवाएँ', hintHi: 'हाथ से लिखा उत्तर अपलोड करें', href: '/evaluate', group: 'Go to', icon: <Glyph d={G.pen} /> },
  { key: 'test', label: 'Test papers', hint: 'Timed papers in the Mains format', labelHi: 'टेस्ट पेपर', hintHi: 'मुख्य परीक्षा के प्रारूप में समयबद्ध प्रश्नपत्र', href: '/test', group: 'Go to', icon: <Glyph d={G.test} /> },
  { key: 'mapping', label: 'Map practice', hint: 'Every place on the map syllabus', labelHi: 'मानचित्र अभ्यास', hintHi: 'मानचित्र पाठ्यक्रम का हर स्थान', href: '/mapping', group: 'Go to', icon: <Glyph d={G.map} /> },
  { key: 'historiography', label: 'Historiography', hint: 'Who argued what, and in which book', labelHi: 'इतिहास-लेखन', hintHi: 'किसने क्या तर्क दिया, और किस पुस्तक में', href: '/historiography', group: 'Go to', icon: <Glyph d={G.debate} /> },
  { key: 'timeline', label: 'Timeline', hint: 'Indian and world history side by side', labelHi: 'समयरेखा', hintHi: 'भारतीय और विश्व इतिहास साथ-साथ', href: '/timeline', group: 'Go to', icon: <Glyph d={G.time} /> },
  { key: 'topper', label: 'Topper copies', hint: 'Real answer sheets, by topic', labelHi: 'टॉपर कॉपियाँ', hintHi: 'असली उत्तर पुस्तिकाएँ, विषय के अनुसार', href: '/topper-copies', group: 'Go to', icon: <Glyph d={G.copy} /> },
  { key: 'flashcards', label: 'Flashcards', hint: 'The facts that slip away', labelHi: 'फ़्लैशकार्ड', hintHi: 'वे तथ्य जो याद से फिसल जाते हैं', href: '/flashcards', group: 'Go to', icon: <Glyph d={G.cards} /> },
  { key: 'prelims', label: 'Prelims practice', hint: 'History MCQs, topic by topic', labelHi: 'प्रिलिम्स अभ्यास', hintHi: 'इतिहास के MCQ, विषय दर विषय', href: '/prelims', group: 'Go to', icon: <Glyph d={G.prelims} /> },
  { key: 'current', label: 'Current affairs', hint: 'History in the news', labelHi: 'समसामयिकी', hintHi: 'ख़बरों में इतिहास', href: '/current-affairs', group: 'Go to', icon: <Glyph d={G.news} /> },
  { key: 'books', label: 'Books', hint: 'The standard reading list', labelHi: 'पुस्तकें', hintHi: 'मानक पठन-सूची', href: '/resources', group: 'Go to', icon: <Glyph d={G.book} /> },
  { key: 'dashboard', label: 'Dashboard', hint: 'Your progress', labelHi: 'डैशबोर्ड', hintHi: 'आपकी प्रगति', href: '/dashboard', group: 'Go to', icon: <Glyph d={G.dash} /> },
  { key: 'pricing', label: 'Plans and pricing', labelHi: 'प्लान और क़ीमतें', href: '/pricing', group: 'Go to', icon: <Glyph d={G.plans} /> },
];

const SECTION_KEY = Object.fromEntries(SECTIONS.map((s) => [s.name, s.key]));

/** How well a note matches: title first, then its sub-topics, then its description. */
function noteScore(n: Note, q: string): number {
  const t = n.title.toLowerCase();
  if (t.startsWith(q)) return 100;
  if (t.includes(q)) return 80;
  if ((n.subtopics ?? []).some((s) => s.toLowerCase().includes(q))) return 60;
  if (n.description.toLowerCase().includes(q)) return 30;
  // A reader in Hindi mode may type the Hindi name.
  const hi = NOTE_HI[n.slug];
  if (hi) {
    if (hi.title.startsWith(q)) return 100;
    if (hi.title.includes(q)) return 80;
    if (hi.subtopics.some((s) => s.includes(q))) return 60;
    if (hi.description.includes(q)) return 30;
  }
  return 0;
}

const GROUP_HI: Record<Item['group'], string> = { Ask: 'पूछें', Notes: 'नोट्स', Debates: 'बहसें', PYQs: 'पिछले प्रश्न', 'Go to': 'यहाँ जाएँ' };
const PERIOD_HI: Record<string, string> = { 'Ancient India': 'प्राचीन भारत', 'Early Medieval': 'प्रारंभिक मध्यकाल', 'Medieval India': 'मध्यकालीन भारत', '18th Century / Early Modern': '18वीं सदी / प्रारंभिक आधुनिक', 'Modern India': 'आधुनिक भारत', 'World History': 'विश्व इतिहास' };

/** The label with the words searched for marked. */
function Marked({ text, q }: { text: string; q: string }) {
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  if (at === -1) return <>{text}</>;
  return <>{text.slice(0, at)}<mark className="cp-mark">{text.slice(at, at + q.length)}</mark>{text.slice(at + q.length)}</>;
}

export default function SearchModal({ label, trigger = true }: { label?: string; trigger?: boolean } = {}) {
  const router = useRouter();
  const { langHi } = useLang();
  const T = (en: string, hi: string) => (langHi ? hi : en);
  const [open, setOpen] = useState(false);
  // PYQ results in Hindi, from the Hindi bank, fetched the first time the box opens in Hindi mode.
  const pyqHi = usePyqHi(langHi && open);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState<{ q: string; snippets: Record<string, string>; pyqs: PyqHit[]; debates: DebateHit[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ⌘K / Ctrl+K toggles it; the phone menu opens it by event.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-search', onOpen);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('open-search', onOpen); };
  }, []);

  // A fresh box each time, focused, with the page behind held still (on iOS
  // it otherwise drags the overlay along with it).
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery('');
    setActive(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 10);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.clearTimeout(id); document.body.style.overflow = previous; };
  }, [open]);

  // Note bodies, PYQs and debates from the server, a beat after typing stops.
  // A reply for an earlier query is dropped rather than shown.
  const q = query.trim().toLowerCase();
  useEffect(() => {
    if (q.length < 2) return;
    let live = true;
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (!res.ok || !live) return;
        const data = await res.json();
        if (!live) return;
        const snippets: Record<string, string> = {};
        for (const hit of data.notes ?? []) snippets[hit.slug] = hit.snippet;
        setRemote({ q, snippets, pyqs: data.pyqs ?? [], debates: data.debates ?? [] });
      } catch { /* the local matches stand */ }
    }, 200);
    return () => { live = false; window.clearTimeout(timer); };
  }, [q]);
  const server = remote && remote.q === q ? remote : null;
  const searching = q.length >= 2 && !server;

  const items = useMemo<Item[]>(() => {
    const local = (it: Item): Item => (langHi ? { ...it, label: it.labelHi ?? it.label, hint: it.hintHi ?? it.hint } : it);
    if (!q) return PAGES.slice(0, 9).map(local);
    const words = query.trim();
    const ask: Item = { key: 'ask', label: langHi ? `AI से पूछें: “${words}”` : `Ask the AI: “${words}”`, hint: langHi ? 'आपका निजी ट्यूटर मानक पुस्तकों से उत्तर देता है' : 'Your personal tutor answers from the standard books', href: `/chat?q=${encodeURIComponent(words)}&send=1`, group: 'Ask', icon: <Glyph d={G.chat} /> };
    const snippets = server?.snippets ?? {};
    const notes: Item[] = allNotes
      .map((n) => ({ n, score: Math.max(noteScore(n, q), snippets[n.slug] ? 20 : 0) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ n }) => ({
        key: `note-${n.slug}`,
        label: (langHi && NOTE_HI[n.slug]?.title) || n.title,
        // The matched passage is from the English note, so Hindi mode shows where the note sits instead.
        hint: langHi
          ? `प्रश्नपत्र ${n.paper === 1 ? 'I' : 'II'} · ${SECTION_HI[n.section] ?? n.section}`
          : snippets[n.slug] ?? `Paper ${n.paper === 1 ? 'I' : 'II'} · ${n.section}`,
        // Opens scrolled to the match: the reader searched for a word, not a document.
        href: `/notes/${n.slug}?q=${encodeURIComponent(words)}`,
        group: 'Notes' as const,
        icon: SECTION_KEY[n.section] ? <SectionIcon id={SECTION_KEY[n.section]} size={16} /> : <Glyph d={G.notes} />,
      }));
    const debates: Item[] = (server?.debates ?? []).map((d) => ({
      key: `debate-${d.id}`,
      label: d.title,
      hint: d.matched.length ? d.matched.join(', ') : `${(langHi && PERIOD_HI[d.period]) || d.period} · ${d.historians.slice(0, 3).join(', ')}`,
      href: `/historiography?q=${encodeURIComponent(d.title)}`,
      group: 'Debates' as const,
      icon: <Glyph d={G.debate} />,
    }));
    // A question opens in the list, filtered by these words, so opening it
    // still asks a signed-out reader to sign in, as it always has.
    const pyqs: Item[] = (server?.pyqs ?? []).map((p) => ({
      key: `pyq-${p.id}`,
      label: pyqHi?.q[p.id] ?? p.question,
      hint: langHi
        ? `${p.year} · ${p.marks} अंक · ${pyqSection(p.section)?.nameHi ?? p.section}`
        : `${p.year} · ${p.marks} marks · ${p.section.replace(/^Paper I+ - /, '')}`,
      href: `/pyqs?q=${encodeURIComponent(words)}`,
      group: 'PYQs' as const,
      icon: <Glyph d={G.pyq} />,
    }));
    const pages = PAGES.filter((p) => [p.label, p.hint, p.labelHi, p.hintHi].some((x) => x?.toLowerCase().includes(q))).map(local);
    // Something that reads as a question goes to the AI first.
    const asking = /\?|^(why|how|what|explain|discuss|compare|examine|critically|who|when|is|does|did|evaluate|assess)\b|^(क्या|क्यों|कैसे|कौन|कब|किस)/.test(q);
    return asking ? [ask, ...notes, ...debates, ...pyqs, ...pages] : [...pages, ...notes, ...debates, ...pyqs, ask];
  }, [q, query, server, langHi, pyqHi]);

  // Keep the chosen row in view as the arrows move it.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const go = (item: Item | undefined) => {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  };

  // The trigger is styled by the navbar (.nb-search), its only host.
  if (!open) return trigger ? (
    <button className="nb-search" onClick={() => setOpen(true)} aria-label={T('Search the site', 'साइट में खोजें')}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
      <span className="nb-search-text">{label ?? T('Search notes, PYQs and historians', 'नोट्स, PYQ और इतिहासकार खोजें')}</span>
    </button>
  ) : null;

  // Rendered into document.body: the navbar carries a transform, which would
  // make it the containing block for this fixed panel.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="cp-scrim ds" onMouseDown={() => setOpen(false)}>
      <style dangerouslySetInnerHTML={{ __html: CP_CSS }} />
      <div className="cp" role="dialog" aria-modal="true" aria-label={T('Search', 'खोज')} onMouseDown={(e) => e.stopPropagation()}>
        <div className="cp-input">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              else if (e.key === 'Enter') { e.preventDefault(); go(items[active]); }
              else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
            }}
            placeholder={T('Search a topic, a historian or a question', 'कोई विषय, इतिहासकार या प्रश्न खोजें')}
            aria-label={T('Search', 'खोजें')}
            role="combobox"
            aria-expanded="true"
            aria-controls="cp-list"
            aria-activedescendant={items[active] ? `cp-${items[active].key}` : undefined}
          />
          <button type="button" className="cp-esc" onClick={() => setOpen(false)}>esc</button>
          <button type="button" className="cp-x" onClick={() => setOpen(false)} aria-label={T('Close search', 'खोज बंद करें')}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg></button>
        </div>
        <div className="cp-list" id="cp-list" role="listbox" ref={listRef}>
          {items.map((it, i) => {
            const head = i === 0 || items[i - 1].group !== it.group ? it.group : null;
            return (
              <div key={it.key}>
                {head && <div className="cp-group">{langHi ? GROUP_HI[head] : head}</div>}
                <button id={`cp-${it.key}`} data-i={i} role="option" aria-selected={i === active} className={`cp-item${i === active ? ' on' : ''}`}
                  onMouseMove={() => setActive(i)} onClick={() => go(it)}>
                  <span className="cp-icon">{it.icon}</span>
                  <span className="cp-text">
                    <span className="cp-label">{it.group === 'Ask' || it.group === 'Go to' ? it.label : <Marked text={it.label} q={q} />}</span>
                    {it.hint && <span className="cp-hint">{it.hint}</span>}
                  </span>
                  {i === active && <span className="cp-enter" aria-hidden="true">↵</span>}
                </button>
              </div>
            );
          })}
          {searching && <div className="cp-searching" aria-live="polite">{T('Looking through the notes, PYQs and debates…', 'नोट्स, PYQ और बहसों में खोज रहे हैं…')}</div>}
        </div>
        <div className="cp-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> {T('to move', 'से ऊपर-नीचे')}</span>
          <span><kbd>↵</kbd> {T('to open', 'से खोलें')}</span>
          <span><kbd>esc</kbd> {T('to close', 'से बंद करें')}</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const CP_CSS = `
.cp-scrim {
  position: fixed; inset: 0; z-index: 10001;
  background: color-mix(in srgb, var(--bg) 55%, transparent);
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  display: flex; justify-content: center; align-items: flex-start;
  padding: 12vh var(--space-4) var(--space-4);
  animation: cpFade 0.12s ease-out;
}
.cp {
  width: 100%; max-width: 640px; max-height: min(580px, 76vh);
  display: flex; flex-direction: column; overflow: hidden;
  background: var(--ds-card); border: 1px solid var(--border2); border-radius: var(--radius-xl);
  box-shadow: var(--elev-3);
  animation: cpRise 0.14s ease-out;
}
.cp-input { flex-shrink: 0; display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-4); height: 56px; border-bottom: 1px solid var(--border); color: var(--text3); }
.cp-input input { flex: 1; min-width: 0; height: 100%; border: none; outline: none; background: none; color: var(--text); font: inherit; font-size: 1.02rem; }
.cp-input input::placeholder { color: var(--text3); }
.cp kbd, .cp-esc { font-family: var(--font-ui); font-size: 0.7rem; color: var(--text3); padding: 1px 6px; border: 1px solid var(--border2); border-radius: var(--radius-xs, 4px); background: var(--ds-soft); }
.cp-esc { cursor: pointer; }
.cp-list { flex: 1; min-height: 0; overflow-y: auto; padding: var(--space-2); overscroll-behavior: contain; }
.cp-group { font-size: 0.74rem; font-weight: 700; color: var(--text3); padding: var(--space-3) var(--space-2) var(--space-1); }
.cp-item { width: 100%; display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2); border: none; background: none; border-radius: var(--radius-md); color: var(--text); font: inherit; text-align: left; cursor: pointer; }
.cp-item.on { background: var(--accent-dim); }
.cp-icon { width: 30px; height: 30px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-md); background: var(--ds-soft); color: var(--text2); border: 1px solid var(--border); }
.cp-item.on .cp-icon { color: var(--accent-text); border-color: color-mix(in srgb, var(--accent) 30%, transparent); }
.cp-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.cp-label { font-size: 0.94rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cp-hint { font-size: 0.78rem; color: var(--text3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cp-mark { background: color-mix(in srgb, var(--accent) 22%, transparent); color: inherit; border-radius: 3px; padding: 0 1px; }
.cp-enter { color: var(--accent-text); font-size: 0.85rem; }
.cp-searching { padding: var(--space-3) var(--space-2); font-size: 0.84rem; color: var(--text3); }
.cp-foot { flex-shrink: 0; display: flex; gap: var(--space-4); padding: var(--space-2) var(--space-4); border-top: 1px solid var(--border); font-size: 0.74rem; color: var(--text3); }
.cp-foot kbd { margin-right: 3px; }
@keyframes cpFade { from { opacity: 0; } }
@keyframes cpRise { from { opacity: 0; transform: translateY(6px) scale(0.99); } }
@media (max-width: 640px) {
  .cp-scrim { padding: var(--space-3); }
  .cp { max-height: 82vh; }
}
@media (hover: none) { .cp-foot, .cp-esc { display: none; } }
.cp-x { display: none; }
@media (hover: none) {
  /* No Esc key on a phone, and the sheet fills the screen: a plain close button. */
  .cp-x {
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
    width: 40px; height: 40px; margin-right: calc(-1 * var(--space-2));
    border: none; border-radius: 50%; background: var(--ds-soft); color: var(--text2); cursor: pointer;
  }
}
@media (prefers-reduced-motion: reduce) { .cp-scrim, .cp { animation: none; } }
`;
