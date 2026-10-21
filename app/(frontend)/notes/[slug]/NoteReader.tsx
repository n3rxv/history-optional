'use client';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, signInWithGoogle } from '@/lib/firebase';
import { useLang } from '@/lib/i18n/LangContext';
import { localNote, noteTitle } from '@/lib/notesHi';
import { rememberNote } from '@/lib/lastNote';
import { useSyllabusTracker } from '@/hooks/useSyllabusTracker';
import { useNoteSearch } from '@/hooks/useNoteSearch';
import SidebarNotes from '@/components/SidebarNotes';
import NoteAnnotationCanvas from '@/components/NoteAnnotationCanvas';
import OwlLoader from '@/components/OwlLoader';
import Mascot from '@/components/Mascot';
import { sectionByName } from '@/components/notes/sections';
import InlineEditorToolbar from './InlineEditorToolbar';

/**
 * One note: the page most of the site's reading happens on, and most of it on
 * a phone. Laid out like DistilledCrux's reader: a contents sidebar that sits
 * beside the note on a desktop and slides over it on a phone, one bar of
 * actions, the note, and a way on at the end.
 *
 * What the reader can do here: read it in Hindi, highlight, pin sticky notes,
 * draw on the page, keep margin notes in the sidebar, find a word, tick the
 * topic off. Highlights and sticky notes follow the account (/api/user-
 * annotations); drawings and margin notes stay in this browser. An admin can
 * edit the English body in place.
 *
 * The whole note needs a free account, as it always has: signed out, the
 * first screenful shows under a sign-in card.
 */

export type ReaderNote = {
  slug: string; title: string; paper: 1 | 2; section: string; topic: number;
  description: string; subtopics?: string[];
};
type NavLink = { slug: string; title: string };
type Color = 'yellow' | 'green' | 'red' | 'blue';
type Highlight = { id: string; text: string; color: Color };
type StickyNote = { id: string; text: string; x: number; y: number };
type TocEntry = { id: string; text: string; level: 2 | 3 };

const SESSION_KEY = 'histopt_admin_v2';

const HIGHLIGHT_COLORS: { id: Color; label: string; color: string }[] = [
  { id: 'yellow', label: 'Gold', color: '#c9a84c' },
  { id: 'green', label: 'Mint', color: '#4cad7a' },
  { id: 'red', label: 'Rose', color: '#c94c4c' },
  { id: 'blue', label: 'Sky', color: '#4c8bc9' },
];

// Below this width the sidebar floats over the note instead of sitting beside it.
const FLOATING_QUERY = '(max-width: 1024px)';
const subscribeWidth = (cb: () => void) => {
  const mq = window.matchMedia(FLOATING_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const floating = () => typeof window !== 'undefined' && window.matchMedia(FLOATING_QUERY).matches;

const subscribeScroll = (cb: () => void) => {
  window.addEventListener('scroll', cb, { passive: true });
  window.addEventListener('resize', cb);
  return () => { window.removeEventListener('scroll', cb); window.removeEventListener('resize', cb); };
};
/** How far down the page, 0 to 1, rounded so a scroll of a pixel is not a re-render. */
const readScroll = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.round(Math.min(1, Math.max(0, window.scrollY / max)) * 500) / 500 : 0;
};
const useScrollFraction = () => useSyncExternalStore(subscribeScroll, readScroll, () => 0);
const useViewportHeight = () => useSyncExternalStore(subscribeScroll, () => window.innerHeight, () => 0);

/** Whether the site footer is on screen, where Find would sit on its links. */
let footerSeen = false;
const subscribeFooter = (cb: () => void) => {
  const el = document.querySelector('footer.ft');
  if (!el) return () => {};
  const io = new IntersectionObserver(([e]) => { footerSeen = e.isIntersecting; cb(); });
  io.observe(el);
  return () => io.disconnect();
};

const noSubscribe = () => () => {};
const readAdminToken = () => { try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; } };

const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
};

/** Minutes to read a note at an unhurried 200 words a minute. */
function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function injectHeadingIds(html: string): string {
  let h2count = 0;
  let h3count = 0;
  return html
    .replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_, attrs, inner) => {
      const text = inner.replace(/<[^>]+>/g, '').trim();
      const id = `toc-h2-${h2count++}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
      return `<h2${attrs} id="${id}">${inner}</h2>`;
    })
    .replace(/<h3([^>]*)>([\s\S]*?)<\/h3>/gi, (_, attrs, inner) => {
      const text = inner.replace(/<[^>]+>/g, '').trim();
      const id = `toc-h3-${h3count++}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
      return `<h3${attrs} id="${id}">${inner}</h3>`;
    });
}

/**
 * Display-only clean-up of the note HTML (the admin editor gets it as stored).
 *
 * The notes were converted from documents that typed their own bullets: each
 * item starts with "•", and a sub-point is a flat item indented by an inline
 * padding and started with "◦". With the browser's bullet as well, every line
 * had two. The typed ones come off; the CSS gives the indented items a
 * sub-point's bullet and indent.
 *
 * A few admin edits also carry colours pasted from a dark editor (near-white
 * text, pale backgrounds) that vanish or glare in the other theme. Literal
 * colours go; the editor's own var(--token) colours follow the theme and stay.
 */
function tidyNote(html: string): string {
  return html
    .replace(/(<li[^>]*>(?:\s|&nbsp;|<(?:p|strong|b|em|i|span)(?:\s[^>]*)?>)*)[•◦▪●○·](?:\s|&nbsp;)*/g, '$1')
    .replace(/\sstyle="([^"]*)"/g, (_m, css: string) => {
      const kept = css.split(';').filter(d => !/^\s*(color|background(-color)?)\s*:\s*(#|rgb)/i.test(d)).join(';').trim();
      return kept ? ` style="${kept}"` : '';
    });
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };

/**
 * The headings, in order, read straight off the HTML. Done with a regex
 * rather than DOMParser so it runs on the server too, and the contents list
 * is in the first paint instead of arriving after it.
 */
function extractToc(html: string): TocEntry[] {
  const out: TocEntry[] = [];
  const re = /<h([23])[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[3].replace(/<[^>]+>/g, '').replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e: string) => ENTITIES[e]).trim();
    if (text) out.push({ id: m[2], text, level: m[1] === '2' ? 2 : 3 });
  }
  return out;
}

/**
 * Paint the stored highlights back onto the HTML. Only the text between tags
 * is rewritten: run over the whole string, a highlight of a word like "style"
 * rewrote a tag and broke the markup for the rest of the note.
 */
function applyHighlights(html: string, highlights: Highlight[]): string {
  let result = html;
  for (const h of highlights) {
    const needle = new RegExp(h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const mark = `<mark class="pp-hl pp-hl-${h.color}">${h.text}</mark>`;
    result = result.replace(/>([^<]+)</g, (_m, text: string) => `>${text.replace(needle, mark)}<`);
  }
  return result;
}

const readLocal = (slug: string): { highlights: Highlight[]; stickies: StickyNote[] } => {
  try {
    return {
      highlights: JSON.parse(localStorage.getItem(`hl-${slug}`) ?? '[]'),
      stickies: JSON.parse(localStorage.getItem(`st-${slug}`) ?? '[]'),
    };
  } catch {
    return { highlights: [], stickies: [] };
  }
};

// ── Current section ──────────────────────────────────────────
/**
 * The section being read: the last heading that has passed under the navbar.
 * Looked up on each scroll, because highlighting re-renders the note and a
 * heading held from before is detached.
 */
function useActiveHeading(entries: TocEntry[]) {
  const [activeId, setActiveId] = useState('');
  useEffect(() => {
    if (!entries.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      let id = entries[0].id;
      for (const { id: hid } of entries) {
        const el = document.getElementById(hid);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 130) id = hid; else break;
      }
      setActiveId(id);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, [entries]);
  return activeId;
}

/** A thin bar under the navbar that fills as the reader goes down the note. */
function ReadingProgress() {
  const pct = useScrollFraction();
  return <div className="nr-progress" aria-hidden="true"><span style={{ transform: `scaleX(${pct})` }} /></div>;
}

/** The contents as a card above the note, for when the sidebar is shut. */
function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const { langHi } = useLang();
  const [open, setOpen] = useState(false);
  const activeId = useActiveHeading(entries);
  if (!entries.length) return null;
  let h2i = 0;
  return (
    <div className={`nr-toc${open ? ' open' : ''}`}>
      <button type="button" className="nr-toc-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>{langHi ? 'इस पृष्ठ पर' : 'On this page'}</span>
        <span className="nr-toc-count">{entries.filter(e => e.level === 2).length} {langHi ? 'खंड' : 'sections'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nr-toc-chev" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <nav className="nr-toc-list">
          {entries.map(entry => {
            if (entry.level === 2) h2i++;
            return (
              <a key={entry.id} href={'#' + entry.id}
                className={`nr-toc-link${entry.level === 3 ? ' sub' : ''}${activeId === entry.id ? ' on' : ''}`}
                onClick={e => { e.preventDefault(); scrollToId(entry.id); }}>
                {entry.level === 2 && <span className="nr-toc-n">{h2i}</span>}
                <span>{entry.text}</span>
              </a>
            );
          })}
        </nav>
      )}
    </div>
  );
}

/** The same headings, laid out for the sidebar. */
function SidebarTOC({ entries, onNavigate }: { entries: TocEntry[]; onNavigate?: () => void }) {
  const { langHi } = useLang();
  const activeId = useActiveHeading(entries);

  // A long list runs past the bottom of the panel; keep the current section
  // in view as the reader goes down the note.
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const box = nav?.closest<HTMLElement>('.nr-sidebar-inner');
    const on = nav?.querySelector<HTMLElement>('.sb-toc-link.on');
    if (!box || !on) return;
    const b = on.getBoundingClientRect(), c = box.getBoundingClientRect();
    if (b.top < c.top + 40 || b.bottom > c.bottom - 40) box.scrollTop += b.top - c.top - c.height / 3;
  }, [activeId]);

  if (!entries.length) return null;
  return (
    <>
      <div className="sb-section-label">{langHi ? 'विषय-सूची' : 'Contents'}</div>
      <nav className="sb-toc" ref={navRef}>
        {entries.map(t => (
          <button key={t.id} type="button"
            className={'sb-toc-link' + (t.level === 3 ? ' sub' : '') + (activeId === t.id ? ' on' : '')}
            onClick={() => {
              // On a phone the panel covers the note and locks its scrolling,
              // so it shuts first; two frames let the unlock land.
              onNavigate?.();
              requestAnimationFrame(() => requestAnimationFrame(() => scrollToId(t.id)));
            }}>
            <span className="sb-toc-dot" />
            <span>{t.text}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

/**
 * A reading rail down the right edge on a desktop: a tick for each heading
 * where it sits in the note, and a thumb for where the reader is. A tick
 * jumps to its heading; the thumb opens the contents.
 */
function ScrollRail({ entries }: { entries: TocEntry[] }) {
  const { langHi } = useLang();
  const pct = useScrollFraction();
  const vh = useViewportHeight();
  const [open, setOpen] = useState(false);
  const activeId = useActiveHeading(entries);

  // vh is 0 on the server and while hydrating, so the ticks, which are placed
  // from the live layout, only ever render in the browser.
  if (!entries.length || !vh) return null;
  const THUMB = 46;
  const trackH = vh - 160;
  const docH = document.documentElement.scrollHeight - vh;

  return (
    <div className="nr-rail" aria-hidden="true">
      <div className="nr-rail-track" style={{ height: trackH }}>
        {entries.map(t => {
          const el = document.getElementById(t.id);
          const y = el ? el.getBoundingClientRect().top + window.scrollY - 120 : 0;
          const top = docH > 0 ? Math.min(1, Math.max(0, y / docH)) * (trackH - THUMB) : 0;
          const on = activeId === t.id;
          return (
            <button key={t.id} type="button" tabIndex={-1} className={`nr-rail-tick${t.level === 3 ? ' sub' : ''}${on ? ' on' : ''}`}
              onClick={() => scrollToId(t.id)} title={t.text} style={{ top }} />
          );
        })}
        <button type="button" tabIndex={-1} className={`nr-rail-thumb${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)} title={langHi ? 'विषय-सूची' : 'Contents'}
          style={{ top: pct * (trackH - THUMB), height: THUMB }}>
          <span /><span /><span />
        </button>
      </div>

      {open && (
        <div className="nr-rail-panel" role="dialog" aria-label={langHi ? 'विषय-सूची' : 'Contents'}>
          <div className="nr-rail-panel-head">
            <span className="nr-rail-dot" />
            <span className="nr-rail-panel-title">{langHi ? 'इस पृष्ठ पर' : 'On this page'}</span>
            <button type="button" className="nr-rail-close" onClick={() => setOpen(false)} aria-label={langHi ? 'विषय-सूची बंद करें' : 'Close contents'}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="nr-rail-progress"><div style={{ width: `${pct * 100}%` }} /></div>
          <nav className="nr-rail-list" aria-label="Headings">
            {entries.map(t => (
              <button key={t.id} type="button"
                className={'nr-rail-link' + (t.level === 3 ? ' sub' : '') + (activeId === t.id ? ' on' : '')}
                onClick={() => { scrollToId(t.id); setOpen(false); }}>
                <span className="nr-rail-bullet" />
                <span className="nr-rail-text">{t.text}</span>
                <span className="nr-rail-arrow">→</span>
              </button>
            ))}
          </nav>
          <div className="nr-rail-foot"><span>Read</span><span>{Math.round(pct * 100)}%</span></div>
        </div>
      )}
    </div>
  );
}

const Icon = {
  contents: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1.8" y="2.5" width="12.4" height="11" rx="1.6" /><line x1="6.3" y1="2.5" x2="6.3" y2="13.5" /></svg>,
  pen: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>,
  sticky: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5z" /><path d="M15 3v6h6" /></svg>,
  draw: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 17c3-3 5-9 8-9s1 8 4 8 3-4 6-5" /></svg>,
  chat: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>,
  x: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>,
};

export default function NoteReader({
  note, initialContent = '', prev, next, related,
}: {
  note: ReaderNote;
  initialContent?: string;
  prev: NavLink | null;
  next: NavLink | null;
  related: NavLink[];
}) {
  const slug = note.slug;
  const meta = sectionByName(note.section);
  const { langHi, toggleLang } = useLang();
  // What the reader sees of the topic list (title, description, subtopics, section) in their language.
  const view = localNote(note, langHi);
  const L = (en: string, hi: string) => (langHi ? hi : en);
  const tracker = useSyllabusTracker();
  const isDone = tracker.mounted && tracker.isCompleted(slug);

  // ── Who is reading ──
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); }), []);
  const handleSignIn = async () => {
    try { await signInWithGoogle(); } catch (e) { console.error(e); }
  };
  const adminToken = useSyncExternalStore(noSubscribe, readAdminToken, () => null);

  // The home page offers a way back to the last note opened.
  useEffect(() => {
    rememberNote({ slug, title: note.title, section: note.section });
  }, [slug, note.title, note.section]);

  // ── Sidebar ──
  // Open beside the note on a desktop, shut on anything narrower, until the
  // reader picks. The server cannot know the width, so it renders neither and
  // the CSS (.sb-auto) applies the default before any script runs.
  const [sidebarChoice, setSidebarChoice] = useState<boolean | null>(null);
  const wide = useSyncExternalStore(subscribeWidth, () => !floating(), () => null);
  const sidebarOpen = sidebarChoice ?? wide;

  // Floating over the note, the sidebar is a modal in every way but history:
  // Back was the instinctive way out and left the note altogether. Opening
  // pushes an entry on the same URL; Back pops it and only shuts the panel.
  const sidebarEntry = useRef(false);
  const openSidebar = useCallback(() => {
    setSidebarChoice(true);
    if (floating() && !sidebarEntry.current) {
      window.history.pushState({ nrSidebar: true }, '');
      sidebarEntry.current = true;
    }
  }, []);
  const closeSidebar = useCallback(() => {
    if (sidebarEntry.current) window.history.back();
    else setSidebarChoice(false);
  }, []);
  useEffect(() => {
    const onPop = () => { if (sidebarEntry.current) { sidebarEntry.current = false; setSidebarChoice(false); } };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && floating() && sidebarEntry.current) closeSidebar(); };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('popstate', onPop); window.removeEventListener('keydown', onKey); };
  }, [closeSidebar]);
  // The note behind a floating sidebar should not scroll under it.
  useEffect(() => {
    if (!sidebarOpen || !floating()) return;
    const was = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = was; };
  }, [sidebarOpen]);

  // ── The body ──
  // English is in the server's HTML and current (an admin save re-renders the
  // page). Hindi is fetched when asked for, and nothing shows until it lands
  // rather than English flashing first.
  const [hindi, setHindi] = useState<{ slug: string; html: string } | null>(null);
  useEffect(() => {
    if (!langHi || hindi?.slug === slug) return;
    let cancelled = false;
    fetch(`/api/note-content?slug=${slug}&lang=hi`)
      .then(r => r.json())
      .then(({ content }) => { if (!cancelled) setHindi({ slug, html: content || '' }); })
      .catch(() => { if (!cancelled) setHindi({ slug, html: initialContent }); });
    return () => { cancelled = true; };
  }, [langHi, slug, hindi?.slug, initialContent]);
  const [savedHtml, setSavedHtml] = useState<string | null>(null);
  const hindiLoading = langHi && hindi?.slug !== slug;
  const content = langHi ? (hindiLoading ? '' : hindi!.html) : (savedHtml ?? initialContent);

  const processed = useMemo(() => injectHeadingIds(tidyNote(content)), [content]);
  const toc = useMemo(() => extractToc(processed), [processed]);

  // ── Highlights and sticky notes ──
  // They follow the account. Saving waits until this account's copy has
  // loaded, and only sends what changed: it used to post an empty list as
  // the page opened, which wiped a reader's highlights whenever the load was
  // slower than the save.
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [stickies, setStickies] = useState<StickyNote[]>([]);
  const loadedFor = useRef('');
  const lastSynced = useRef('');
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const key = `${slug}:${user.uid}`;
    const take = (h: Highlight[], s: StickyNote[], synced: boolean) => {
      if (cancelled) return;
      setHighlights(h);
      setStickies(s);
      lastSynced.current = synced ? JSON.stringify({ h, s }) : '';
      loadedFor.current = key;
    };
    user.getIdToken()
      .then(token => fetch(`/api/user-annotations?firebase_uid=${user.uid}&slug=${slug}`, { headers: { authorization: `Bearer ${token}` } }))
      .then(r => r.json())
      .then(({ data }) => {
        const saved = data?.[0]?.data;
        if (saved) take(saved.highlights ?? [], saved.stickyNotes ?? [], true);
        else {
          // Nothing in the account yet: bring this browser's copy across.
          const local = readLocal(slug);
          take(local.highlights, local.stickies, !local.highlights.length && !local.stickies.length);
        }
      })
      .catch(() => { const local = readLocal(slug); take(local.highlights, local.stickies, true); });
    return () => { cancelled = true; };
  }, [user, slug]);

  useEffect(() => {
    if (!user || loadedFor.current !== `${slug}:${user.uid}`) return;
    try {
      localStorage.setItem(`hl-${slug}`, JSON.stringify(highlights));
      localStorage.setItem(`st-${slug}`, JSON.stringify(stickies));
    } catch { /* storage full or blocked; the account copy still saves */ }
    const body = JSON.stringify({ h: highlights, s: stickies });
    if (body === lastSynced.current) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/user-annotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', authorization: `Bearer ${await user.getIdToken()}` },
          body: JSON.stringify({ firebase_uid: user.uid, note_slug: slug, data: { highlights, stickyNotes: stickies } }),
        });
        if (res.ok) lastSynced.current = body;
      } catch { /* offline; the next change tries again */ }
    }, 1200);
    return () => clearTimeout(t);
  }, [highlights, stickies, user, slug]);

  const display = useMemo(() => applyHighlights(processed, highlights), [processed, highlights]);

  // ── Annotating ──
  const [tool, setTool] = useState<'highlight' | 'sticky' | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [float, setFloat] = useState<{ x: number; y: number } | null>(null);
  const [overHighlight, setOverHighlight] = useState(false);
  const pendingText = useRef('');
  const noteRef = useRef<HTMLDivElement>(null);
  const contentBoxRef = useRef<HTMLDivElement>(null);
  const [stickyDraft, setStickyDraft] = useState<{ x: number; y: number; text: string } | null>(null);

  /**
   * Offer the colours for the current selection, if it is in the note. The
   * words are held because picking a colour can collapse the selection
   * before the click lands. On a touch screen the colours go under the
   * selection, since the phone's own menu takes the space above it.
   */
  const offerColours = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return false;
    const text = sel.toString().trim();
    const range = sel.getRangeAt(0);
    if (text.length < 2 || !noteRef.current?.contains(range.commonAncestorContainer)) return false;
    pendingText.current = text;
    setOverHighlight(highlights.some(h => h.text.includes(text) || text.includes(h.text)));
    const r = range.getBoundingClientRect();
    const touch = window.matchMedia('(pointer: coarse)').matches;
    const half = 120;
    setFloat({
      x: Math.min(Math.max(r.left + r.width / 2, half), window.innerWidth - half) + window.scrollX,
      y: (touch ? r.bottom + 14 : r.top - 52) + window.scrollY,
    });
    return true;
  }, [highlights]);

  // A phone selects by a long press, which fires no mouseup.
  useEffect(() => {
    if (tool !== 'highlight') return;
    let t = 0;
    const onChange = () => { clearTimeout(t); t = window.setTimeout(offerColours, 250); };
    document.addEventListener('selectionchange', onChange);
    return () => { document.removeEventListener('selectionchange', onChange); clearTimeout(t); };
  }, [tool, offerColours]);

  const applyHighlight = (color: Color) => {
    const text = pendingText.current;
    if (!text) return;
    setHighlights(p => [...p, { id: Date.now().toString(), text, color }]);
    pendingText.current = '';
    window.getSelection()?.removeAllRanges();
    setFloat(null);
  };
  const removeSelectedHighlight = () => {
    const text = pendingText.current;
    setHighlights(p => p.filter(h => !(h.text.includes(text) || text.includes(h.text))));
    pendingText.current = '';
    window.getSelection()?.removeAllRanges();
    setFloat(null);
  };

  const onContentClick = (e: React.MouseEvent) => {
    if (tool === 'sticky') {
      const box = contentBoxRef.current?.getBoundingClientRect();
      if (box) setStickyDraft({ x: Math.max(0, e.clientX - box.left - 20), y: e.clientY - box.top, text: '' });
      return;
    }
    if (tool !== 'highlight') return;
    // Tapping a highlight while highlighting takes it off, which is shorter
    // than reselecting exactly the words. Inert otherwise, so reading cannot
    // rub one out.
    const text = (e.target as HTMLElement).closest('mark.pp-hl')?.textContent?.trim();
    if (text && window.getSelection()?.isCollapsed) {
      setHighlights(p => p.filter(h => h.text !== text));
      setFloat(null);
    }
  };
  const onContentMouseUp = () => {
    if (tool === 'highlight' && !offerColours()) setFloat(null);
  };

  const pickTool = (t: 'highlight' | 'sticky' | 'draw' | null) => {
    setFloat(null);
    if (t === 'draw') { setTool(null); setDrawing(true); return; }
    setTool(t);
  };

  const jumpToHighlight = (text: string) => {
    const mark = [...(noteRef.current?.querySelectorAll<HTMLElement>('mark.pp-hl') ?? [])].find(m => m.textContent === text);
    if (!mark) return;
    if (floating()) closeSidebar();
    requestAnimationFrame(() => requestAnimationFrame(() =>
      window.scrollTo({ top: mark.getBoundingClientRect().top + window.scrollY - 160, behavior: 'smooth' })));
  };

  // ── Admin editing ──
  // English only: overrides are per note, not per language, so saving while
  // reading Hindi used to put the Hindi text over the English note.
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const editableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!editing || !editableRef.current) return;
    editableRef.current.innerHTML = savedHtml ?? initialContent;
    editableRef.current.focus({ preventScroll: true });
    // Filled once as editing starts; later renders must not reset the typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);
  const flash = (msg: string) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(''), 3000); };
  const saveEdit = async () => {
    if (!editableRef.current || !adminToken) return;
    const html = editableRef.current.innerHTML;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/note-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify({ slug, content: html }),
      });
      const data = await res.json();
      if (data.ok) { setSavedHtml(html); flash('Saved'); } else flash('Could not save');
    } catch { flash('Could not save'); }
    setSaving(false);
  };
  const resetEdit = async () => {
    if (!adminToken || !confirm('Throw away the edits and go back to the original note?')) return;
    // The server reads x-admin-token; this sent x-admin-password, so every
    // reset came back unauthorised.
    const res = await fetch('/api/admin/note-content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
      body: JSON.stringify({ slug }),
    });
    if (res.ok) window.location.reload(); else flash('Could not reset');
  };

  // ── Find in the note ──
  const noteSearch = useNoteSearch(noteRef);
  // Arriving from the site search with ?q=, open the finder on that word so
  // the reader lands on it rather than at the top of a long note. Read from
  // location, not useSearchParams, which would stop the notes prerendering.
  const openedFromUrl = useRef(false);
  useEffect(() => {
    if (openedFromUrl.current || hindiLoading || !processed.trim()) return;
    const q = new URLSearchParams(window.location.search).get('q') ?? '';
    if (q.length < 2) return;
    openedFromUrl.current = true;
    noteSearch.setOpen(true);
    noteSearch.setQuery(q);
    // noteSearch is a new object every render; listing it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hindiLoading, processed]);

  const gated = !user && !authLoading;
  const paperLabel = note.paper === 1 ? 'I' : 'II';
  const tint = meta ? { ['--t' as string]: `var(--tint-${meta.key})`, ['--w' as string]: `var(--wash-${meta.key})` } : undefined;
  const notesHref = note.paper === 2 ? '/notes?paper=2' : '/notes';
  const askHref = `/chat?topic=${encodeURIComponent(note.title)}`;
  const showDone = tracker.mounted && !gated && !editing;
  const footerInView = useSyncExternalStore(subscribeFooter, () => footerSeen, () => false);

  return (
    <div className={'nr-shell ds' + (sidebarOpen === null ? ' sb-auto' : sidebarOpen ? ' with-sidebar' : '')} style={tint}>
      <style>{NR_CSS}</style>
      <ReadingProgress />

      {/* ── Sidebar ── */}
      <div className="nr-backdrop" onClick={closeSidebar} aria-hidden="true" />
      <aside className="nr-sidebar" aria-label="About this note">
        <div className="nr-sidebar-inner">
          <button type="button" className="nr-sb-close" onClick={closeSidebar} aria-label="Close the sidebar">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
          <div className="sb-head">
            <span className="sb-chip"><span className="sb-chip-dot" />{L(`Paper ${paperLabel} · Topic ${note.topic}`, `प्रश्नपत्र ${paperLabel} · विषय ${note.topic}`)}</span>
            <h2 className="sb-title">{view.title}</h2>
            {meta ? <Link href={meta.href} className="sb-sub">{view.section}</Link> : <p className="sb-sub">{view.section}</p>}
          </div>

          {!editing && <SidebarTOC entries={toc} onNavigate={() => { if (floating()) closeSidebar(); }} />}

          {highlights.length > 0 && (
            <>
              <div className="sb-section-label">{L('Your highlights', 'आपके हाइलाइट')} ({highlights.length})</div>
              <div className="sb-hls">
                {highlights.map(h => (
                  <div key={h.id} className="sb-hl" style={{ ['--sw' as string]: HIGHLIGHT_COLORS.find(c => c.id === h.color)?.color }}>
                    <button type="button" className="sb-hl-text" onClick={() => jumpToHighlight(h.text)} title={L('Go to it', 'वहाँ जाएँ')}>{h.text}</button>
                    <button type="button" className="sb-hl-x" onClick={() => setHighlights(p => p.filter(x => x.id !== h.id))} aria-label={L('Remove this highlight', 'यह हाइलाइट हटाएँ')}>{Icon.x}</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {(prev || next) && (
            <>
              <div className="sb-section-label">{L('Before and after', 'पहले और बाद में')}</div>
              <nav className="sb-related">
                {prev && <Link className="sb-rel" href={`/notes/${prev.slug}`}><span className="sb-rel-dir">{L('Previous', 'पिछला')}</span><span className="sb-rel-title">{noteTitle(prev.slug, prev.title, langHi)}</span></Link>}
                {next && <Link className="sb-rel" href={`/notes/${next.slug}`}><span className="sb-rel-dir">{L('Next', 'अगला')}</span><span className="sb-rel-title">{noteTitle(next.slug, next.title, langHi)}</span></Link>}
              </nav>
            </>
          )}

          {related.length > 0 && (
            <>
              <div className="sb-section-label">{L(`More from ${note.section}`, `${view.section} से और`)}</div>
              <nav className="sb-more">
                {related.map(r => <Link key={r.slug} href={`/notes/${r.slug}`}>{noteTitle(r.slug, r.title, langHi)}</Link>)}
              </nav>
            </>
          )}

          <SidebarNotes slug={slug} langHi={langHi} />
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="nr-main">
        <div className="nr-bar">
          <button type="button" className={`nr-pill nr-sb-toggle${sidebarOpen ? ' on' : ''}`}
            onClick={() => (sidebarOpen ?? !floating() ? closeSidebar() : openSidebar())}
            aria-expanded={sidebarOpen ?? undefined} aria-label={L('Contents', 'विषय-सूची')} title={L('Show or hide the contents', 'विषय-सूची दिखाएँ या छिपाएँ')}>
            {Icon.contents}<span>{L('Contents', 'विषय-सूची')}</span>
          </button>

          <nav className="nr-crumbs" aria-label="Breadcrumb">
            <Link href={notesHref}>{L('Notes', 'नोट्स')}</Link>
            {meta && <><span aria-hidden="true">›</span><Link href={meta.href}>{view.section}</Link></>}
          </nav>

          <div className="nr-bar-actions">
            {editing ? (
              <>
                {saveMsg && <span className="nr-save-msg">{saveMsg}</span>}
                <button type="button" className="nr-pill" onClick={() => setEditing(false)}><span className="keep">Done</span></button>
                <button type="button" className="ds-btn ds-btn-solid ds-btn-sm" onClick={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </>
            ) : (
              <>
                <button type="button" className="nr-pill lang" onClick={toggleLang} lang={langHi ? 'en' : 'hi'}
                  title={langHi ? 'Read this note in English' : 'इस नोट को हिंदी में पढ़ें'}>
                  <span className="keep">{langHi ? 'English' : 'हिंदी'}</span>
                </button>
                {showDone && (
                  <button type="button" className={`nr-pill${isDone ? ' on done' : ''}`} onClick={() => tracker.toggle(slug)} aria-pressed={isDone}
                    aria-label={isDone ? L('Studied. Tap to untick', 'पढ़ लिया। हटाने के लिए टैप करें') : L('Mark as studied', 'पढ़ा हुआ चिह्नित करें')} title={isDone ? L('Studied. Tap to untick', 'पढ़ लिया। हटाने के लिए टैप करें') : L('Mark this topic as studied', 'इस विषय को पढ़ा हुआ चिह्नित करें')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />{isDone && <path d="M8 12.5l2.8 2.8L16.5 9.5" />}
                    </svg>
                    <span>{isDone ? L('Studied', 'पढ़ लिया') : L('Mark studied', 'पढ़ा चिह्नित करें')}</span>
                  </button>
                )}
                {!gated && (
                  <button type="button" className={`nr-pill${tool || drawing ? ' on gold' : ''}`} onClick={() => pickTool(tool ? null : 'highlight')}
                    aria-pressed={!!tool} aria-label={L('Annotate', 'टिप्पणी करें')}>
                    {Icon.pen}<span>{L('Annotate', 'टिप्पणी करें')}</span>
                  </button>
                )}
                {adminToken && !langHi && (
                  <button type="button" className="nr-pill" onClick={() => { pickTool(null); setEditing(true); }} aria-label="Edit this note">
                    {Icon.edit}<span>Edit</span>
                  </button>
                )}
                <Link className="nr-pill accent" href={askHref}>{Icon.chat}<span>{L('Ask the AI', 'AI से पूछें')}</span></Link>
              </>
            )}
          </div>
        </div>

        {/* ── Annotation tools ── */}
        {tool && (
          <div className="nr-tools">
            <div className="nr-tools-tabs" role="tablist" aria-label={L('Annotation tools', 'टिप्पणी के साधन')}>
              <button type="button" role="tab" aria-selected={tool === 'highlight'} className={tool === 'highlight' ? 'on' : ''} onClick={() => pickTool('highlight')}>{Icon.pen}{L('Highlight', 'हाइलाइट')}</button>
              <button type="button" role="tab" aria-selected={tool === 'sticky'} className={tool === 'sticky' ? 'on' : ''} onClick={() => pickTool('sticky')}>{Icon.sticky}{L('Sticky note', 'स्टिकी नोट')}</button>
              <button type="button" role="tab" aria-selected={false} onClick={() => pickTool('draw')}>{Icon.draw}{L('Draw', 'चित्र बनाएँ')}</button>
            </div>
            <span className="nr-tools-hint">
              {tool === 'highlight'
                ? (highlights.length ? L('Select words to highlight them. Tap a highlight to take it off.', 'हाइलाइट करने के लिए शब्द चुनें। हाइलाइट हटाने के लिए उस पर टैप करें।') : L('Select some words, then pick a colour.', 'कुछ शब्द चुनें, फिर एक रंग चुनें।'))
                : L('Tap the note where you want the sticky note.', 'नोट में वहाँ टैप करें जहाँ आप स्टिकी नोट लगाना चाहते हैं।')}
            </span>
            {tool === 'highlight' && highlights.length > 0 && (
              <button type="button" className="nr-tools-clear" onClick={() => { if (confirm(L('Remove all your highlights from this note?', 'इस नोट से अपने सभी हाइलाइट हटाएँ?'))) setHighlights([]); }}>{L('Clear all', 'सब हटाएँ')}</button>
            )}
            <button type="button" className="nr-tools-x" onClick={() => pickTool(null)} aria-label={L('Close the tools', 'साधन बंद करें')}>{Icon.x}</button>
          </div>
        )}

        {float && (
          <div className="nr-float" style={{ left: float.x, top: float.y }}>
            {HIGHLIGHT_COLORS.map(c => (
              <button key={c.id} type="button" onMouseDown={e => e.preventDefault()} onClick={() => applyHighlight(c.id)}
                title={c.label} aria-label={`Highlight in ${c.label}`} className="nr-float-swatch" style={{ ['--sw' as string]: c.color }} />
            ))}
            {overHighlight && (
              <>
                <span className="nr-float-rule" />
                <button type="button" onMouseDown={e => e.preventDefault()} onClick={removeSelectedHighlight} title="Remove highlight" aria-label="Remove highlight" className="nr-float-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H9L4 15a2 2 0 0 1 0-3l8-8a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-7 7" /><path d="M6 13l6 6" /></svg>
                </button>
              </>
            )}
            <span className="nr-float-rule" />
            <button type="button" onClick={() => setFloat(null)} className="nr-float-btn" aria-label="Close">{Icon.x}</button>
          </div>
        )}

        {!editing && <ScrollRail entries={toc} />}

        {/* ── The note ── */}
        <div ref={contentBoxRef} className={`nr-content${tool === 'sticky' ? ' placing' : ''}`}
          onMouseUp={onContentMouseUp} onClick={onContentClick}>
          <article className="nr-article">
            <header className="nr-head">
              <div className="nr-meta">
                <span className="nr-paper">{L(`Paper ${paperLabel}`, `प्रश्नपत्र ${paperLabel}`)}</span>
                <span>{L(`Topic ${note.topic}`, `विषय ${note.topic}`)}</span>
                {content && <span>{L(`${readingMinutes(content)} min read`, `पढ़ने में ${readingMinutes(content)} मिनट`)}</span>}
              </div>
              <h1 className="nr-title">{view.title}</h1>
              <p className="nr-desc">{view.description}</p>
              {view.subtopics.length > 0 && (
                <div className="nr-subs">{view.subtopics.map(st => <span key={st}>{st}</span>)}</div>
              )}
            </header>

            {editing ? (
              <>
                <div className="nr-edit-note">
                  <span>Editing the English note. Saving publishes it for everyone.</span>
                  <button type="button" onClick={resetEdit}>Go back to the original</button>
                </div>
                <InlineEditorToolbar contentRef={editableRef} />
                <div ref={editableRef} contentEditable suppressContentEditableWarning className="note-content nr-editable" />
              </>
            ) : (
              <>
                <TableOfContents entries={toc} />
                <div className="nr-body">
                  {hindiLoading && <OwlLoader label="नोट्स लोड हो रहे हैं" />}
                  <div ref={noteRef} className="note-content" lang={langHi ? 'hi' : 'en'}
                    dangerouslySetInnerHTML={{ __html: hindiLoading ? '' : (display || '<p class="nr-empty">These notes are on their way. Check back soon.</p>') }}
                    style={gated ? { maxHeight: '140vh', overflow: 'hidden', pointerEvents: 'none', userSelect: 'none' } : undefined}
                  />
                  {gated && display && (
                    <div className="nr-gate">
                      <div className="nr-gate-card">
                        <Mascot pose="reading" width={76} />
                        <div className="nr-gate-title">Sign in to keep reading</div>
                        <p>A free account opens every note, and keeps your highlights and progress with you.</p>
                        <button type="button" onClick={handleSignIn} className="ds-btn ds-btn-solid nr-gate-btn">Sign in free</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {!gated && !editing && display && (
              <>
                {showDone && (
                  <div className={`nr-finish${isDone ? ' done' : ''}`}>
                    <span className="nr-finish-text">
                      <strong>{isDone ? 'Marked as studied' : 'Finished this topic?'}</strong>
                      <span>{isDone ? 'It counts towards your syllabus on the notes page and your dashboard.' : 'Tick it off and it counts towards your syllabus.'}</span>
                    </span>
                    <button type="button" className={`ds-btn ds-btn-sm ${isDone ? 'ds-btn-ghost' : 'ds-btn-solid'}`} onClick={() => tracker.toggle(slug)}>
                      {isDone ? 'Untick' : 'Mark as studied'}
                    </button>
                  </div>
                )}
                <Link href={askHref} className="nr-ask">
                  <span className="nr-ask-text">
                    <strong>Still unsure about something here?</strong>
                    <span>Ask the AI. It answers from the standard books and shows you where.</span>
                  </span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              </>
            )}

            {!editing && (prev || next) && (
              <nav className="nr-pager" aria-label="More notes">
                {prev ? (
                  <Link href={`/notes/${prev.slug}`} className="nr-pager-link">
                    <span className="nr-pager-dir">← Previous</span>
                    <span className="nr-pager-title">{prev.title}</span>
                  </Link>
                ) : <span />}
                {next ? (
                  <Link href={`/notes/${next.slug}`} className="nr-pager-link next">
                    <span className="nr-pager-dir">Next →</span>
                    <span className="nr-pager-title">{next.title}</span>
                  </Link>
                ) : <span />}
              </nav>
            )}
          </article>

          {/* Sticky notes, pinned where the reader tapped. */}
          {!gated && !editing && stickies.map(s => (
            <div key={s.id} className="nr-sticky" style={{ left: `min(${s.x}px, calc(100% - 228px))`, top: s.y }} onClick={e => e.stopPropagation()} onMouseUp={e => e.stopPropagation()}>
              <button type="button" className="nr-sticky-x" onClick={() => setStickies(p => p.filter(x => x.id !== s.id))} aria-label="Remove this sticky note">{Icon.x}</button>
              <textarea value={s.text} aria-label="Sticky note"
                onChange={e => setStickies(p => p.map(x => x.id === s.id ? { ...x, text: e.target.value } : x))} />
            </div>
          ))}
        </div>

        {/* ── A new sticky note ── */}
        {stickyDraft && (
          <div className="ds-overlay" onClick={() => setStickyDraft(null)}>
            <div className="ds-modal nr-sticky-modal" role="dialog" aria-label="New sticky note" onClick={e => e.stopPropagation()}>
              <div className="ds-modal-head">
                <h2>New sticky note</h2>
                <button type="button" className="ds-x" onClick={() => setStickyDraft(null)} aria-label="Close">{Icon.x}</button>
              </div>
              <textarea className="ds-input nr-sticky-input" autoFocus value={stickyDraft.text} placeholder="Write your note"
                onChange={e => setStickyDraft(d => d && { ...d, text: e.target.value })} />
              <div className="nr-sticky-actions">
                <button type="button" className="ds-btn ds-btn-ghost" onClick={() => setStickyDraft(null)}>Cancel</button>
                <button type="button" className="ds-btn ds-btn-solid" disabled={!stickyDraft.text.trim()} onClick={() => {
                  const { x, y, text } = stickyDraft;
                  setStickies(p => [...p, { id: Date.now().toString(), text: text.trim(), x, y }]);
                  setStickyDraft(null);
                }}>Pin it</button>
              </div>
            </div>
          </div>
        )}

        <NoteAnnotationCanvas noteSlug={slug} active={drawing} onToggle={() => setDrawing(false)} />

        {/* ── Find in the note ── */}
        {noteSearch.open && (
          <div className="nr-find-panel">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ color: 'var(--text3)', flexShrink: 0 }}>
              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" /><path d="M14.5 14.5L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input autoFocus value={noteSearch.query} onChange={e => noteSearch.setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') noteSearch.jump(e.shiftKey ? -1 : 1); if (e.key === 'Escape') noteSearch.close(); }}
              placeholder="Find in this note" aria-label="Find in this note" />
            {noteSearch.total > 0 && <span className="nr-find-count">{noteSearch.current} of {noteSearch.total}</span>}
            {noteSearch.query.length >= 2 && noteSearch.total === 0 && <span className="nr-find-none">Not found</span>}
            <div className="nr-find-nav">
              <button type="button" onClick={() => noteSearch.jump(-1)} disabled={noteSearch.total === 0} title="Previous (Shift+Enter)" aria-label="Previous match" className="nr-find-step">↑</button>
              <button type="button" onClick={() => noteSearch.jump(1)} disabled={noteSearch.total === 0} title="Next (Enter)" aria-label="Next match" className="nr-find-step">↓</button>
            </div>
            <button type="button" onClick={noteSearch.close} className="nr-find-esc" aria-label="Close">{Icon.x}</button>
          </div>
        )}
        {!noteSearch.open && !gated && !editing && !drawing && display && (
          <button type="button" onClick={() => noteSearch.setOpen(true)} title="Find in this note (⌘F)" className={`nr-find-fab${footerInView ? ' away' : ''}`} tabIndex={footerInView ? -1 : undefined}>
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" /><path d="M14.5 14.5L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            <span>Find</span>
            <kbd>⌘F</kbd>
          </button>
        )}
      </div>
    </div>
  );
}

const NR_CSS = `
/* Highlights. The user-agent style for mark sets a black text colour, so
   colour is inherited from the prose, and each theme gets its own alpha: a
   tint that reads as a highlight on white reads as mud on near-black. */
.nr-shell .note-content mark.pp-hl { color: inherit; border-radius: 3px; padding: 0 1px; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.nr-shell .note-content mark.pp-hl-yellow { background: rgba(201,168,76,0.30); }
.nr-shell .note-content mark.pp-hl-green  { background: rgba(76,173,122,0.30); }
.nr-shell .note-content mark.pp-hl-red    { background: rgba(201,76,76,0.32); }
.nr-shell .note-content mark.pp-hl-blue   { background: rgba(76,139,201,0.32); }
[data-theme="light"] .nr-shell .note-content mark.pp-hl-yellow { background: rgba(201,168,76,0.42); }
[data-theme="light"] .nr-shell .note-content mark.pp-hl-green  { background: rgba(76,173,122,0.36); }
[data-theme="light"] .nr-shell .note-content mark.pp-hl-red    { background: rgba(201,76,76,0.30); }
[data-theme="light"] .nr-shell .note-content mark.pp-hl-blue   { background: rgba(76,139,201,0.32); }

/* ── The note's own type. Scoped to the reader, which outranks the older
   site-wide .note-content rules still used by posts and current affairs;
   the !important ones answer theirs. ── */
.nr-shell .note-content { font-size: 1.06rem; line-height: 1.8; color: var(--text); overflow-wrap: break-word; }
.nr-shell .note-content h1, .nr-shell .note-content h2, .nr-shell .note-content h3, .nr-shell .note-content h4 { font-family: var(--font-ui); -webkit-text-fill-color: currentColor !important; text-transform: none; letter-spacing: -0.01em; }
.nr-shell .note-content h1 { font-size: 1.7rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1.25; margin: 2.4rem 0 1rem; padding: 0 0 0.5rem; border-bottom: 2px solid var(--t); color: var(--text) !important; }
.nr-shell .note-content h2 { font-size: 1.42rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1.3; margin: 2.8rem 0 0.9rem; padding-left: 14px; border-left: 4px solid var(--t); color: var(--text) !important; scroll-margin-top: 90px; }
.nr-shell .note-content h3 { font-size: 1.14rem; font-weight: 700; line-height: 1.4; margin: 1.9rem 0 0.6rem; padding: 0; border: none; color: var(--t) !important; scroll-margin-top: 90px; }
.nr-shell .note-content h4 { font-size: 1.02rem !important; font-weight: 700; line-height: 1.45; margin: 1.5rem 0 0.4rem; color: var(--text) !important; }
.nr-shell .note-content p, .nr-shell .note-content li { font-size: inherit; line-height: inherit; color: var(--text); }
.nr-shell .note-content p { margin: 0 0 1rem; }
.nr-shell .note-content > :first-child { margin-top: 0; }
.nr-shell .note-content ul, .nr-shell .note-content ol { margin: 0.4rem 0 1.1rem 1.4rem; padding: 0; }
/* .ds clears list styles for its own lists; the note's are real lists. */
.nr-shell .note-content ul { list-style: disc; }
.nr-shell .note-content ol { list-style: decimal; }
.nr-shell .note-content ul ul { list-style: circle; }
.nr-shell .note-content li { margin-bottom: 0.45rem; }
.nr-shell .note-content li > p { margin: 0; }
/* A sub-point written as an indented item of the same list (see tidyNote). */
.nr-shell .note-content li[style*="padding-left"] { padding-left: 0 !important; margin-left: 1.4em; list-style-type: circle; }
.nr-shell .note-content li::marker, .nr-shell .note-content ul ul li::marker { color: var(--t); }
.nr-shell .note-content ul ul, .nr-shell .note-content ol ol { margin-top: 0.3rem; margin-bottom: 0.3rem; }
.nr-shell .note-content strong { font-weight: 700; color: var(--text); }
.nr-shell .note-content em { color: var(--text2); }
.nr-shell .note-content a { color: var(--accent-text); }
.nr-shell .note-content blockquote { margin: 1.6rem 0; padding: 1rem 1.25rem; background: var(--w); border-left: 4px solid var(--t); border-radius: 0 12px 12px 0; color: var(--text); font-style: normal; }
.nr-shell .note-content blockquote::before { content: none; }
.nr-shell .note-content blockquote p:last-child { margin-bottom: 0; }
.nr-shell .note-content table { display: block; width: 100%; max-width: 100%; overflow-x: auto; border-collapse: collapse; margin: 1.8rem 0; font-size: 0.92rem; border: 1px solid var(--border2); border-radius: 12px; }
.nr-shell .note-content table > * { display: table; width: 100%; }
.nr-shell .note-content th { background: var(--ds-soft); color: var(--text); padding: 0.7rem 1rem; text-align: left; font-family: var(--font-ui); font-size: 0.86rem; font-weight: 700; letter-spacing: 0; text-transform: none; border: none; border-bottom: 1px solid var(--border2); }
.nr-shell .note-content td { padding: 0.65rem 1rem; border: none; border-top: 1px solid var(--border); vertical-align: top; line-height: 1.65; }
.nr-shell .note-content tr:nth-child(even) td { background: color-mix(in srgb, var(--ds-soft) 60%, transparent); }
.nr-shell .note-content tr:hover td { background: inherit; }
.nr-shell .note-content hr { border: none; border-top: 1px solid var(--border2); margin: 2.5rem 0; }
.nr-shell .note-content img { max-width: 100%; height: auto; border-radius: 12px; }
.nr-empty { color: var(--text3); }

/* ── Reading progress ── */
.nr-progress { position: fixed; top: 60px; left: 0; right: 0; height: 3px; z-index: 101; pointer-events: none; }
.nr-progress span { display: block; height: 100%; background: var(--t); transform-origin: left; transition: transform 0.1s linear; }

/* ── Shell: a sidebar that collapses to nothing, and the note. No
   background of its own, so drawings on the canvas behind it stay visible. ── */
/* The room at the foot is on the column, not the shell, so the sidebar runs
   right down to the footer instead of stopping short of it. */
.nr-shell { display: flex; align-items: flex-start; width: 100%; }
.nr-main { flex: 1; min-width: 0; padding-bottom: 5rem; }
.nr-sidebar {
  width: 0; min-width: 0; flex-shrink: 0;
  position: sticky; top: 60px; height: calc(100vh - 60px);
  overflow: hidden; background: var(--ds-soft); border-right: 1px solid transparent;
  transition: width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1), border-color 0.25s;
}
.nr-shell.with-sidebar .nr-sidebar { width: 268px; min-width: 268px; border-right-color: var(--border); }
/* Before hydration, and until the reader toggles it: open beside the note on
   a desktop, closed on anything narrower. */
@media (min-width: 1025px) {
  .nr-shell.sb-auto .nr-sidebar { width: 268px; min-width: 268px; border-right-color: var(--border); }
  .nr-shell.sb-auto .nr-sb-toggle { color: var(--t); border-color: color-mix(in srgb, var(--t) 40%, transparent); background: var(--w); }
}
.nr-sidebar-inner { height: 100%; overflow-y: auto; overscroll-behavior: contain; padding: var(--space-5) var(--space-4) var(--space-10); width: 268px; }
.nr-backdrop { display: none; }
.nr-sb-close { display: none; position: absolute; top: 0.7rem; right: 0.7rem; z-index: 2; width: 32px; height: 32px; align-items: center; justify-content: center; background: var(--ds-card); border: 1px solid var(--border2); border-radius: var(--radius-full); color: var(--text2); cursor: pointer; }
@media (max-width: 1024px) {
  .nr-sidebar { position: fixed; top: 60px; left: 0; z-index: 120; height: calc(100dvh - 60px); width: 0; background: var(--bg); }
  .nr-shell.with-sidebar .nr-sidebar { width: 300px; min-width: 300px; max-width: 86vw; box-shadow: var(--elev-3); }
  .nr-sidebar-inner { width: 300px; max-width: 86vw; padding-top: 3rem; }
  .nr-sb-close { display: inline-flex; }
  .nr-shell.with-sidebar .nr-backdrop { display: block; position: fixed; inset: 0; z-index: 110; background: color-mix(in srgb, #000 45%, transparent); -webkit-tap-highlight-color: transparent; }
}
/* The tab bar sits over the foot of the panel on a phone. */
@media (max-width: 768px) {
  .nr-sidebar-inner { padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px) + var(--space-8)); }
}

/* ── Sidebar contents ── */
.sb-head { padding-bottom: var(--space-4); margin-bottom: var(--space-2); border-bottom: 1px solid var(--border); }
.sb-chip { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px 3px 8px; border-radius: var(--radius-full); background: var(--ds-card); border: 1px solid var(--border); font-size: 0.74rem; font-weight: 600; color: var(--text2); }
.sb-chip-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--t); flex-shrink: 0; }
.sb-title { font-size: 1.02rem; font-weight: 800; letter-spacing: -0.01em; line-height: 1.3; margin: var(--space-3) 0 var(--space-1); }
.sb-sub { display: inline-block; font-size: 0.82rem; color: var(--text3); margin: 0; line-height: 1.4; text-decoration: none; }
a.sb-sub:hover { color: var(--t); }
.sb-section-label { display: block; margin: var(--space-5) 0 var(--space-2); font-size: 0.74rem; font-weight: 700; color: var(--text3); }
.sb-toc { display: flex; flex-direction: column; gap: 1px; }
.sb-toc-link {
  display: flex; align-items: flex-start; gap: 8px; width: 100%; text-align: left;
  background: none; border: none; border-radius: var(--radius-md); cursor: pointer;
  padding: 6px 8px; font-size: 0.85rem; line-height: 1.4; color: var(--text2);
  transition: background 0.15s, color 0.15s;
}
.sb-toc-link.sub { font-size: 0.8rem; color: var(--text3); padding-left: 22px; }
.sb-toc-link:hover { background: var(--ds-card); color: var(--text); }
.sb-toc-link.on { background: var(--w); color: var(--t); font-weight: 600; }
.sb-toc-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; margin-top: 0.5rem; background: var(--border3); }
.sb-toc-link.sub .sb-toc-dot { width: 4px; height: 4px; }
.sb-toc-link.on .sb-toc-dot, .sb-toc-link:hover .sb-toc-dot { background: var(--t); }
.sb-hls { display: flex; flex-direction: column; gap: 4px; }
.sb-hl { display: flex; align-items: center; gap: 4px; padding-left: 8px; border-left: 3px solid var(--sw); border-radius: 0 var(--radius-md) var(--radius-md) 0; background: var(--ds-card); }
.sb-hl-text { flex: 1; min-width: 0; padding: 6px 0; background: none; border: none; text-align: left; font-size: 0.82rem; color: var(--text2); cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sb-hl-text:hover { color: var(--text); }
.sb-hl-x { flex-shrink: 0; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; background: none; border: none; border-radius: 50%; color: var(--text3); cursor: pointer; }
.sb-hl-x:hover { color: var(--danger-text); }
.sb-related { display: flex; flex-direction: column; gap: 6px; }
.sb-rel { display: block; text-decoration: none; background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 8px 10px; transition: border-color 0.15s; }
.sb-rel:hover { border-color: color-mix(in srgb, var(--t) 45%, transparent); }
.sb-rel-dir { display: block; font-size: 0.72rem; font-weight: 600; color: var(--text3); margin-bottom: 2px; }
.sb-rel-title { display: block; font-size: 0.85rem; font-weight: 600; color: var(--text); line-height: 1.35; }
.sb-more { display: flex; flex-direction: column; }
.sb-more a { padding: 6px 8px; border-radius: var(--radius-md); font-size: 0.85rem; line-height: 1.4; color: var(--text2); text-decoration: none; }
.sb-more a:hover { background: var(--ds-card); color: var(--t); }

/* ── Margin notes (components/SidebarNotes) ── */
.sb-note-add { width: 100%; display: flex; align-items: center; gap: 6px; background: none; border: 1.5px dashed color-mix(in srgb, var(--accent) 35%, transparent); border-radius: var(--radius-md); padding: 8px 10px; font-size: 0.84rem; font-family: var(--font-ui); color: var(--accent-text); cursor: pointer; margin-bottom: var(--space-2); transition: background 0.15s, border-color 0.15s; }
.sb-note-add:hover { background: var(--accent-dim); border-style: solid; }
.sb-note { background: color-mix(in srgb, var(--premium-text) 6%, var(--ds-card)); border: 1px solid color-mix(in srgb, var(--premium-text) 22%, transparent); border-radius: var(--radius-md); padding: 10px; margin-bottom: var(--space-2); transition: border-color 0.15s, box-shadow 0.15s; }
.sb-note:focus-within { border-color: color-mix(in srgb, var(--premium-text) 50%, transparent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--premium-text) 12%, transparent); }
.sb-note-title, .sb-note-body { width: 100%; background: none; border: none; outline: none; color: var(--text); padding: 0; resize: none; font-family: var(--font-ui); }
.sb-note-title { font-size: 0.88rem; font-weight: 700; padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid color-mix(in srgb, var(--premium-text) 15%, transparent); }
.sb-note-body { font-size: 0.84rem; line-height: 1.6; min-height: 2.8em; }
.sb-note-title::placeholder, .sb-note-body::placeholder { color: var(--text3); font-weight: 400; }
.sb-note-foot { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 6px; font-size: 0.72rem; color: var(--text3); opacity: 0; transition: opacity 0.15s; }
.sb-note:hover .sb-note-foot, .sb-note:focus-within .sb-note-foot { opacity: 1; }
@media (hover: none) { .sb-note-foot { opacity: 1; } }
.sb-note-foot button { background: none; border: none; padding: 0; font: inherit; color: var(--text3); cursor: pointer; }
.sb-note-foot button:hover { color: var(--danger-text); }
.sb-note-confirm { display: flex; gap: 10px; }
.sb-note-confirm button:first-child { color: var(--danger-text); font-weight: 700; }
.sb-note-scope { margin: 0; text-align: right; font-size: 0.72rem; color: var(--text3); }

/* ── Bar ── */
.nr-bar { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2) var(--space-3); padding: var(--space-3) var(--space-6); border-bottom: 1px solid var(--border); }
.nr-pill {
  display: inline-flex; align-items: center; gap: 6px; min-height: 34px; padding: 0 var(--space-3);
  border-radius: var(--radius-full); border: 1px solid var(--border2); background: var(--ds-card);
  color: var(--text2); font-family: var(--font-ui); font-size: 0.86rem; font-weight: 600; text-decoration: none; cursor: pointer; white-space: nowrap;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.nr-pill:hover { color: var(--text); border-color: var(--border3); }
.nr-pill.on { color: var(--t); border-color: color-mix(in srgb, var(--t) 40%, transparent); background: var(--w); }
.nr-pill.on.gold { color: var(--premium-text); border-color: color-mix(in srgb, var(--premium-text) 40%, transparent); background: var(--premium-wash); }
.nr-pill.on.done { color: var(--success-text); border-color: color-mix(in srgb, var(--success-text) 40%, transparent); background: var(--success-wash); }
.nr-pill.accent { color: var(--accent-text); border-color: color-mix(in srgb, var(--accent) 35%, transparent); background: var(--accent-dim); }
.nr-pill.lang { font-weight: 700; }
.nr-crumbs { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 0.86rem; color: var(--text3); }
.nr-crumbs a { color: var(--text2); text-decoration: none; white-space: nowrap; }
.nr-crumbs a:hover { color: var(--accent-text); }
.nr-bar-actions { margin-left: auto; display: flex; align-items: center; gap: var(--space-2); }
.nr-save-msg { font-size: 0.86rem; font-weight: 600; color: var(--success-text); }

/* ── Annotation tools ── */
/* Held under the navbar while a tool is on, so the way out of it is always in reach. */
.nr-tools { position: sticky; top: 60px; z-index: 50; display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2) var(--space-4); padding: var(--space-2) var(--space-6); border-bottom: 1px solid var(--border); background: color-mix(in srgb, var(--premium-text) 9%, var(--bg)); font-size: 0.86rem; color: var(--text2); }
.nr-tools-tabs { display: flex; gap: 2px; padding: 3px; border-radius: var(--radius-full); background: var(--ds-card); border: 1px solid var(--border); }
.nr-tools-tabs button { display: inline-flex; align-items: center; gap: 6px; min-height: 30px; padding: 0 12px; border: none; border-radius: var(--radius-full); background: none; color: var(--text2); font: inherit; font-weight: 600; cursor: pointer; }
.nr-tools-tabs button:hover { color: var(--text); }
.nr-tools-tabs button.on { background: var(--premium-wash); color: var(--premium-text); }
.nr-tools-hint { flex: 1; min-width: 12rem; }
.nr-tools-clear { background: none; border: 1px solid var(--border2); border-radius: var(--radius-full); padding: 3px 12px; font: inherit; font-size: 0.8rem; color: var(--text2); cursor: pointer; }
.nr-tools-x { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 50%; background: none; color: var(--text3); cursor: pointer; }
.nr-tools-x:hover { background: var(--ds-card); color: var(--text); }
.nr-content.placing { cursor: copy; }
.nr-float {
  position: absolute; transform: translateX(-50%); z-index: 200;
  display: flex; align-items: center; gap: 6px; padding: 6px 8px;
  background: var(--ds-card); border: 1px solid var(--border2); border-radius: var(--radius-full); box-shadow: var(--elev-3);
}
.nr-float-swatch { width: 26px; height: 26px; border-radius: 50%; background: var(--sw); border: none; cursor: pointer; transition: transform 0.12s; }
.nr-float-swatch:hover { transform: scale(1.15); }
.nr-float-rule { width: 1px; height: 16px; background: var(--border2); }
.nr-float-btn { width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 50%; background: none; color: var(--text3); cursor: pointer; }
.nr-float-btn:hover { color: var(--text); background: var(--ds-soft); }

/* Sticky notes on the page */
.nr-sticky { position: absolute; z-index: 30; width: 220px; padding: 8px 10px 10px; background: color-mix(in srgb, var(--premium-text) 12%, var(--ds-card)); border: 1px solid color-mix(in srgb, var(--premium-text) 35%, transparent); border-radius: var(--radius-md); box-shadow: var(--elev-2); cursor: auto; }
.nr-sticky textarea { display: block; width: 100%; min-height: 64px; background: none; border: none; outline: none; resize: vertical; color: var(--text); font-family: var(--font-ui); font-size: 0.86rem; line-height: 1.5; }
.nr-sticky-x { float: right; width: 24px; height: 24px; margin: -2px -4px 0 4px; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 50%; background: none; color: var(--text3); cursor: pointer; }
.nr-sticky-x:hover { color: var(--danger-text); }
.nr-sticky-modal { max-width: 420px; }
.nr-sticky-input { min-height: 120px; resize: vertical; }
.nr-sticky-actions { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-4); }

/* ── The note ── */
.nr-content { position: relative; padding: var(--space-8) var(--space-6) 0; }
.nr-article { max-width: 740px; margin: 0 auto; }
.nr-head { margin-bottom: var(--space-6); }
.nr-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; font-size: 0.86rem; color: var(--text3); margin-bottom: var(--space-3); }
.nr-paper { padding: 2px 10px; border-radius: var(--radius-full); background: var(--w); color: var(--t); font-weight: 700; }
.nr-title { font-size: clamp(1.9rem, 4.2vw, 2.6rem); font-weight: 800; line-height: 1.15; letter-spacing: -0.03em; margin: 0 0 var(--space-3); }
.nr-desc { font-size: 1.08rem; line-height: 1.65; color: var(--text2); margin: 0 0 var(--space-4); }
.nr-subs { display: flex; flex-wrap: wrap; gap: 6px; }
.nr-subs span { padding: 3px 11px; border-radius: var(--radius-full); border: 1px solid var(--border); background: var(--ds-card); font-size: 0.8rem; color: var(--text2); }

.nr-toc { margin: 0 0 var(--space-6); border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--ds-card); overflow: hidden; }
.nr-toc-toggle { width: 100%; display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); border: none; background: none; cursor: pointer; font-family: var(--font-ui); font-size: 0.95rem; font-weight: 700; color: var(--text); text-align: left; }
.nr-toc-count { margin-left: auto; font-size: 0.82rem; font-weight: 500; color: var(--text3); }
.nr-toc-chev { color: var(--text3); transition: transform 0.2s; }
.nr-toc.open .nr-toc-chev { transform: rotate(180deg); }
.nr-toc-list { display: flex; flex-direction: column; gap: 1px; padding: var(--space-2) var(--space-2) var(--space-3); border-top: 1px solid var(--border); }
.nr-toc-link { display: flex; align-items: baseline; gap: 10px; padding: 6px 10px; border-radius: var(--radius-md); color: var(--text2); text-decoration: none; font-size: 0.92rem; line-height: 1.45; }
.nr-toc-link:hover { background: var(--ds-soft); color: var(--text); }
.nr-toc-link.sub { padding-left: 38px; font-size: 0.86rem; color: var(--text3); }
.nr-toc-link.on { color: var(--t); font-weight: 600; }
.nr-toc-n { min-width: 18px; font-size: 0.8rem; font-weight: 700; color: var(--t); }
/* With the sidebar open beside the note, its list already does this job. */
@media (min-width: 1025px) { .nr-shell.with-sidebar .nr-toc, .nr-shell.sb-auto .nr-toc { display: none; } }

.nr-body { position: relative; }
.nr-gate { position: absolute; bottom: 0; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; padding: 7rem 0 2.5rem; background: linear-gradient(to bottom, transparent 0%, var(--bg) 40%); pointer-events: auto; }
.nr-gate-card { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); max-width: 380px; margin: 0 var(--space-2); padding: var(--space-6); text-align: center; background: var(--ds-card); border: 1px solid var(--border2); border-radius: var(--radius-xl); box-shadow: var(--elev-3); }
.nr-gate-title { font-size: 1.15rem; font-weight: 800; }
.nr-gate-card p { margin: 0 0 var(--space-2); font-size: 0.92rem; line-height: 1.55; color: var(--text2); }
.nr-gate-btn { width: 100%; justify-content: center; }

.nr-edit-note { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2) var(--space-4); margin-bottom: var(--space-3); padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--warning-wash); color: var(--warning-text); font-size: 0.88rem; }
.nr-edit-note button { margin-left: auto; background: none; border: 1px solid color-mix(in srgb, var(--danger-text) 35%, transparent); border-radius: var(--radius-full); padding: 3px 12px; font: inherit; font-size: 0.82rem; color: var(--danger-text); cursor: pointer; }
.nr-editable { min-height: 400px; padding: var(--space-4); outline: none; border: 1px solid color-mix(in srgb, var(--warning-text) 30%, transparent); border-radius: var(--radius-lg); caret-color: var(--warning-text); }

.nr-finish { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-top: var(--space-10); padding: var(--space-4) var(--space-5); border-radius: var(--radius-xl); background: var(--ds-card); border: 1px solid var(--border); }
.nr-finish.done { background: var(--success-wash); border-color: color-mix(in srgb, var(--success-text) 30%, transparent); }
.nr-finish-text { display: flex; flex-direction: column; gap: 2px; }
.nr-finish-text strong { color: var(--text); font-size: 1rem; }
.nr-finish-text span { color: var(--text2); font-size: 0.92rem; }
.nr-finish + .nr-ask { margin-top: var(--space-3); }
.nr-ask { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-top: var(--space-10); padding: var(--space-4) var(--space-5); border-radius: var(--radius-xl); background: var(--accent-dim); border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent); color: var(--accent-text); text-decoration: none; transition: transform 0.15s; }
.nr-ask:hover { transform: translateY(-1px); }
.nr-ask svg { flex-shrink: 0; }
.nr-ask-text { display: flex; flex-direction: column; gap: 2px; }
.nr-ask-text strong { color: var(--text); font-size: 1rem; }
.nr-ask-text span { color: var(--text2); font-size: 0.92rem; }

.nr-pager { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-top: var(--space-6); }
.nr-pager-link { display: flex; flex-direction: column; gap: 4px; padding: var(--space-4) var(--space-5); border-radius: var(--radius-xl); border: 1px solid var(--border); background: var(--ds-card); text-decoration: none; transition: border-color 0.15s, box-shadow 0.15s; }
.nr-pager-link:hover { border-color: color-mix(in srgb, var(--t) 45%, transparent); box-shadow: var(--elev-1); }
.nr-pager-link.next { text-align: right; align-items: flex-end; }
.nr-pager-dir { font-size: 0.82rem; font-weight: 600; color: var(--t); }
.nr-pager-title { font-size: 1rem; font-weight: 700; color: var(--text); line-height: 1.35; }

/* ── Scroll rail (desktop) ── */
.nr-rail { display: none; }
@media (min-width: 1024px) { .nr-rail { display: block; } }
.nr-rail-track { position: fixed; right: 0; top: 96px; width: 14px; z-index: 90; background: var(--ds-soft); border-left: 1px solid var(--border); }
.nr-rail-tick { position: absolute; left: 2.5px; width: 9px; height: 2px; padding: 0; border: none; border-radius: 2px; cursor: pointer; background: color-mix(in srgb, var(--t) 45%, transparent); transition: background 0.2s, box-shadow 0.2s, transform 0.15s; }
.nr-rail-tick.sub { left: 4.5px; width: 5px; height: 1.5px; background: color-mix(in srgb, var(--t) 22%, transparent); }
.nr-rail-tick.on { background: var(--t); box-shadow: 0 0 6px var(--t); }
.nr-rail-tick:hover { transform: scaleX(1.6); }
.nr-rail-thumb { position: absolute; left: 3px; width: 8px; border: none; border-radius: 6px; cursor: pointer; padding: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; background: var(--t); box-shadow: 0 0 8px color-mix(in srgb, var(--t) 45%, transparent); transition: box-shadow 0.2s; }
.nr-rail-thumb.open { box-shadow: 0 0 16px color-mix(in srgb, var(--t) 80%, transparent); }
.nr-rail-thumb span { width: 4px; height: 1px; background: rgba(255,255,255,0.75); border-radius: 1px; }
@keyframes nrPanelIn { from { opacity: 0; transform: translateX(12px) scale(0.97); } to { opacity: 1; transform: none; } }
.nr-rail-panel { position: fixed; right: 24px; top: 88px; width: 290px; z-index: 91; background: var(--ds-card); border: 1px solid var(--border2); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--elev-3); animation: nrPanelIn 0.18s cubic-bezier(0.4,0,0.2,1); }
.nr-rail-panel-head { display: flex; align-items: center; gap: 8px; padding: 12px 14px 10px; border-bottom: 1px solid var(--border); }
.nr-rail-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; background: var(--t); }
.nr-rail-panel-title { flex: 1; font-size: 0.86rem; font-weight: 700; color: var(--t); }
.nr-rail-close { background: none; border: none; color: var(--text3); cursor: pointer; padding: 4px; display: flex; line-height: 0; border-radius: 50%; }
.nr-rail-close:hover { color: var(--text); background: var(--ds-soft); }
.nr-rail-progress { height: 3px; background: var(--ds-soft); }
.nr-rail-progress div { height: 100%; background: var(--t); transition: width 0.1s; }
.nr-rail-list { max-height: calc(100vh - 230px); overflow-y: auto; padding: 6px 0; }
.nr-rail-link { width: 100%; display: flex; align-items: center; gap: 8px; background: none; border: none; border-left: 2px solid transparent; cursor: pointer; text-align: left; padding: 8px 14px; color: var(--text); font-family: var(--font-ui); font-size: 0.86rem; font-weight: 500; transition: background 0.15s, color 0.15s; }
.nr-rail-link.sub { padding: 6px 14px 6px 26px; font-size: 0.8rem; font-weight: 400; color: var(--text2); }
.nr-rail-link:hover { background: var(--ds-soft); }
.nr-rail-link.on { background: var(--w); border-left-color: var(--t); color: var(--t); }
.nr-rail-bullet { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; background: color-mix(in srgb, var(--t) 40%, transparent); }
.nr-rail-link.sub .nr-rail-bullet { width: 4px; height: 4px; }
.nr-rail-link.on .nr-rail-bullet { background: var(--t); }
.nr-rail-text { flex: 1; line-height: 1.4; }
.nr-rail-arrow { font-size: 0.75rem; opacity: 0; transition: opacity 0.15s, transform 0.15s; color: var(--text3); }
.nr-rail-link:hover .nr-rail-arrow { opacity: 1; transform: translateX(3px); }
.nr-rail-foot { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; border-top: 1px solid var(--border); font-size: 0.78rem; color: var(--text3); }
.nr-rail-foot span:last-child { font-weight: 700; color: var(--t); }

/* ── Find in the note ── */
.nr-find-panel {
  position: fixed; bottom: calc(24px + env(safe-area-inset-bottom, 0px)); right: 24px; z-index: 300;
  display: flex; align-items: center; gap: 8px; min-width: 320px; max-width: calc(100vw - 32px);
  padding: 8px 8px 8px 14px; background: var(--ds-card); border: 1.5px solid color-mix(in srgb, var(--accent) 45%, transparent);
  border-radius: var(--radius-full); box-shadow: var(--elev-3);
}
.nr-find-panel input { flex: 1; min-width: 0; background: none; border: none; outline: none; color: var(--text); font-family: var(--font-ui); font-size: 0.95rem; }
.nr-find-count { font-size: 0.8rem; font-weight: 600; white-space: nowrap; color: var(--accent-text); background: var(--accent-dim); padding: 2px 10px; border-radius: var(--radius-full); }
.nr-find-none { font-size: 0.8rem; color: var(--danger-text); white-space: nowrap; }
.nr-find-nav { display: flex; gap: 2px; }
.nr-find-step, .nr-find-esc { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 50%; background: var(--ds-soft); color: var(--text2); cursor: pointer; font-size: 0.85rem; }
.nr-find-step:disabled { opacity: 0.4; cursor: default; }
.nr-find-fab {
  position: fixed; bottom: calc(24px + env(safe-area-inset-bottom, 0px)); right: 24px; z-index: 299;
  display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px;
  background: var(--ds-card); border: 1px solid var(--border2); border-radius: var(--radius-full);
  color: var(--text2); font-family: var(--font-ui); font-size: 0.86rem; font-weight: 600; cursor: pointer; box-shadow: var(--elev-2);
  transition: border-color 0.15s, color 0.15s, opacity 0.2s, transform 0.2s;
}
.nr-find-fab:hover { color: var(--accent-text); border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.nr-find-fab.away { opacity: 0; transform: translateY(8px); pointer-events: none; }
.nr-find-fab kbd { font-family: var(--font-ui); font-size: 0.72rem; color: var(--text3); padding: 1px 7px; border: 1px solid var(--border2); border-radius: var(--radius-full); }
@media (min-width: 1024px) { .nr-find-fab, .nr-find-panel { right: 34px; } }
@media (hover: none) { .nr-find-fab kbd { display: none; } }

/* ── Phones ── */
@media (max-width: 768px) {
  .nr-find-fab, .nr-find-panel { bottom: calc(64px + env(safe-area-inset-bottom, 0px) + 12px); right: 12px; }
}
@media (max-width: 640px) {
  .nr-bar { padding: var(--space-2) var(--space-4); }
  .nr-crumbs { display: none; }
  .nr-pill span:not(.keep) { display: none; }
  .nr-pill { min-width: 38px; padding: 0 10px; justify-content: center; }
  .nr-pill.accent span { display: inline; }
  .nr-tools { padding: var(--space-2) var(--space-4); gap: var(--space-2); }
  .nr-tools-tabs { order: 0; }
  .nr-tools-x { margin-left: auto; }
  .nr-tools-hint { order: 3; flex-basis: 100%; font-size: 0.82rem; }
  .nr-tools-clear { order: 4; }
  .nr-content { padding: var(--space-6) var(--space-4) 0; }
  .nr-shell .note-content { font-size: 1.02rem; }
  .nr-shell .note-content h2 { font-size: 1.28rem; }
  .nr-ask { padding: var(--space-4); }
  .nr-finish { flex-direction: column; align-items: stretch; padding: var(--space-4); }
  .nr-finish .ds-btn { justify-content: center; }
  .nr-pager { grid-template-columns: minmax(0, 1fr); }
  .nr-pager-link.next { text-align: left; align-items: flex-start; }
  .nr-find-panel { left: 12px; min-width: 0; }
  .nr-sticky { width: 190px; }
}
@media (prefers-reduced-motion: reduce) { .nr-sidebar, .nr-progress span, .nr-ask, .nr-rail-panel { transition: none; animation: none; } }
`;
