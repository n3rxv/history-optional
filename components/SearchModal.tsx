'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { allNotes } from '@/lib/notes';
import { noteContent } from '@/lib/noteContent';
import { supabase } from '@/lib/supabase';
import { pyqs } from '@/lib/pyqs';

const QUICK_JUMPS = [
  { label: 'Paper I Notes',    sub: 'Sources to 1707',        href: '/paper1',        icon: '📄' },
  { label: 'Paper II Notes',   sub: '1707 to Present',        href: '/paper2',        icon: '📄' },
  { label: 'PYQs',             sub: 'Previous year questions', href: '/pyqs',          icon: '❓' },
  { label: 'Historiography',   sub: 'Historians & debates',   href: '/historiography', icon: '🏛️' },
  { label: 'Timeline',         sub: 'Chronological events',   href: '/timeline',      icon: '📅' },
  { label: 'AI Chat',          sub: 'Ask anything',           href: '/chat',          icon: '🤖' },
  { label: 'Evaluate',         sub: 'Answer evaluation',      href: '/evaluate',      icon: '✍️' },
  { label: 'Dashboard',        sub: 'Your progress',          href: '/dashboard',     icon: '📊' },
];

function highlight(text: string, query: string) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(212,168,67,0.35)', color: 'inherit', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchScore(text: string, q: string): number {
  const t = text.toLowerCase();
  const s = q.toLowerCase();
  if (t.startsWith(s)) return 3;
  if (t.includes(s)) return 2;
  return 0;
}

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [historians, setHistorians] = useState<Array<{ id: string; title: string; period: string; positions: Array<{ historian_name: string; school: string }> }>>([]);

  // Fetch historiography once on mount
  useEffect(() => {
    supabase
      .from('debates')
      .select('id, title, period, positions(historian_name, school)')
      .then(({ data }) => { if (data) setHistorians(data as any); });
  }, []);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search results
  const results = useCallback(() => {
    const q = query.trim();
    if (!q) return { notes: [], pyqs: [] };

    const notes = allNotes
      .map(n => {
        const bodyText = stripHtml(noteContent[n.slug] || '');
        const bodyScore = matchScore(bodyText, q);
        const snippet = bodyScore > 0 ? (() => {
          const idx = bodyText.toLowerCase().indexOf(q.toLowerCase());
          if (idx === -1) return '';
          return '…' + bodyText.slice(Math.max(0, idx - 40), idx + 80) + '…';
        })() : '';
        const score = Math.max(
          matchScore(n.title, q) * 3,
          matchScore(n.description, q) * 2,
          ...(n.subtopics || []).map(s => matchScore(s, q)),
          bodyScore > 0 ? 1 : 0,
        );
        return { ...n, score, snippet };
      })
      .filter(n => n.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const pyqResults = pyqs
      .map(p => {
        const score = Math.max(
          matchScore(p.question, q) * 2,
          matchScore(p.topic, q),
          matchScore(p.section, q),
        );
        return { ...p, score };
      })
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    const historianResults = historians
      .map(h => {
        const nameMatches = (h.positions || []).filter((p: any) =>
          matchScore(p.historian_name, q) > 0
        );
        const titleScore = matchScore(h.title, q);
        const score = Math.max(titleScore * 3, nameMatches.length > 0 ? 2 : 0);
        return { ...h, score, matchedHistorians: nameMatches.map((p: any) => p.historian_name) };
      })
      .filter(h => h.score > 0)
      .slice(0, 4);

    return { notes, pyqs: pyqResults, historians: historianResults };
  }, [query]);

  const { notes, pyqs: pyqResults, historians: historianResults } = results();
  const hasResults = notes.length > 0 || pyqResults.length > 0 || (historianResults?.length ?? 0) > 0;

  // Flat list for keyboard nav
  const flatItems: Array<{ type: 'jump' | 'note' | 'pyq'; href: string; idx: number }> = [];
  if (!query.trim()) {
    QUICK_JUMPS.forEach((j, i) => flatItems.push({ type: 'jump', href: j.href, idx: i }));
  } else {
    notes.forEach((n, i) => flatItems.push({ type: 'note', href: `/notes/${n.slug}`, idx: i }));
    pyqResults.forEach((p, i) => flatItems.push({ type: 'pyq', href: `/pyqs?q=${encodeURIComponent(p.topic)}`, idx: i }));
    (historianResults || []).forEach((h, i) => flatItems.push({ type: 'historian' as any, href: `/historiography?q=${encodeURIComponent(h.title)}`, idx: i }));
  }

  useEffect(() => { setSelected(0); }, [query]);

  const navigate = useCallback((href: string) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flatItems.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && flatItems[selected]) navigate(flatItems[selected].href);
  };

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`) as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      title="Search (⌘K)"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 7, padding: '0.3rem 0.65rem',
        color: 'var(--text3)', cursor: 'pointer', fontSize: '0.78rem',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.2)'; el.style.color = 'var(--text2)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.1)'; el.style.color = 'var(--text3)'; }}
    >
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2"/>
        <path d="M14.5 14.5L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      Search
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text3)' }}>⌘K</span>
    </button>
  );

  return (
    <div
      style={{ position: 'fixed', top: 57, left: 0, right: 0, bottom: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '8vh' }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{ width: '100%', maxWidth: 600, margin: '0 1rem', background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, boxShadow: '0 32px 80px rgba(0,0,0,0.8)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ color: 'var(--text3)', flexShrink: 0 }}>
            <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2"/>
            <path d="M14.5 14.5L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search notes, PYQs, flashcards, historians…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.95rem', fontFamily: 'var(--font-body)' }}
          />
          <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '2px 8px', color: 'var(--text3)', cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>esc</button>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 400, overflowY: 'auto', padding: '8px 0' }}>
          {!query.trim() && (
            <>
              <div style={{ padding: '4px 16px 6px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: 'var(--text3)', textTransform: 'uppercase' }}>Quick Jump</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '0 8px 8px' }}>
                {QUICK_JUMPS.map((j, i) => (
                  <button key={j.href} data-idx={i}
                    onClick={() => navigate(j.href)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: `1px solid ${selected === i ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`, background: selected === i ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s' }}
                    onMouseEnter={() => setSelected(i)}
                  >
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{j.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500 }}>{j.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{j.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {query.trim() && !hasResults && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)', fontSize: '0.85rem' }}>
              No results for <strong style={{ color: 'var(--text2)' }}>"{query}"</strong>
            </div>
          )}

          {notes.length > 0 && (
            <>
              <div style={{ padding: '8px 16px 4px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: 'var(--text3)', textTransform: 'uppercase' }}>Notes</div>
              {notes.map((note, i) => {
                const fi = flatItems.findIndex(f => f.type === 'note' && f.idx === i);
                const isSel = selected === fi;
                return (
                  <button key={note.slug} data-idx={fi}
                    onClick={() => navigate(`/notes/${note.slug}`)}
                    onMouseEnter={() => setSelected(fi)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: isSel ? 'rgba(255,255,255,0.06)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                  >
                    <span style={{ fontSize: '0.85rem', flexShrink: 0, color: 'var(--text3)' }}>📄</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {highlight(note.title, query)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(note as any).snippet || note.subtopics?.slice(0,4).join(', ')}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.65rem', background: note.paper === 1 ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)', color: note.paper === 1 ? '#93c5fd' : '#c4b5fd', border: `1px solid ${note.paper === 1 ? 'rgba(59,130,246,0.3)' : 'rgba(139,92,246,0.3)'}`, padding: '2px 7px', borderRadius: 4, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                      Paper {note.paper}
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {(historianResults?.length ?? 0) > 0 && (
            <>
              <div style={{ padding: '8px 16px 4px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: 'var(--text3)', textTransform: 'uppercase' }}>Historiography</div>
              {(historianResults ?? []).map((h, i) => {
                const fi = flatItems.findIndex(f => (f as any).type === 'historian' && f.idx === i);
                const isSel = selected === fi;
                return (
                  <button key={h.id} data-idx={fi}
                    onClick={() => navigate(`/historiography`)}
                    onMouseEnter={() => setSelected(fi)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: isSel ? 'rgba(255,255,255,0.06)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                  >
                    <span style={{ fontSize: '0.85rem', flexShrink: 0, color: 'var(--text3)' }}>🏛️</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {highlight(h.title, query)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.matchedHistorians.length > 0 ? h.matchedHistorians.join(', ') : h.period}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#a78bfa', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', padding: '2px 7px', borderRadius: 4, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>Debate</span>
                  </button>
                );
              })}
            </>
          )}

          {pyqResults.length > 0 && (
            <>
              <div style={{ padding: '8px 16px 4px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: 'var(--text3)', textTransform: 'uppercase' }}>PYQs</div>
              {pyqResults.map((pyq, i) => {
                const fi = flatItems.findIndex(f => f.type === 'pyq' && f.idx === i);
                const isSel = selected === fi;
                return (
                  <button key={i} data-idx={fi}
                    onClick={() => navigate(`/pyqs?q=${encodeURIComponent(pyq.topic)}`)}
                    onMouseEnter={() => setSelected(fi)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: isSel ? 'rgba(255,255,255,0.06)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                  >
                    <span style={{ fontSize: '0.85rem', flexShrink: 0, color: 'var(--text3)' }}>❓</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {highlight(pyq.question.slice(0, 80) + (pyq.question.length > 80 ? '…' : ''), query)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
                        {pyq.marks} marks · {pyq.section}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                      {pyq.year}
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 16, fontSize: '0.68rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
