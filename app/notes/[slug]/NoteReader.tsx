'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { allNotes, getNoteBySlug, paper1Notes, paper2Notes } from '@/lib/notes';
import { getNoteContent } from '@/lib/noteContent';
import AnnotationToggle from '@/components/AnnotationToggle';
import TableOfContents from '@/components/TableOfContents';

// Inject anchor IDs into h2/h3 tags so TOC links work
function injectHeadingIds(html: string): string {
  let h2count = 0;
  let h3count = 0;
  return html
    .replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (_, attrs, inner) => {
      const text = inner.replace(/<[^>]+>/g, '').trim();
      const id = `toc-${h2count++}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
      return `<h2${attrs} id="${id}">${inner}</h2>`;
    })
    .replace(/<h3([^>]*)>(.*?)<\/h3>/gi, (_, attrs, inner) => {
      const text = inner.replace(/<[^>]+>/g, '').trim();
      const id = `toc-${h3count++}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
      return `<h3${attrs} id="${id}">${inner}</h3>`;
    });
}

type Highlight = {
  id: string;
  text: string;
  color: 'yellow' | 'green' | 'red' | 'blue';
};

type StickyNote = {
  id: string;
  text: string;
  x: number;
  y: number;
};

const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Gold',  color: '#c9a84c' },
  { id: 'green',  label: 'Mint',  color: '#4cad7a' },
  { id: 'red',    label: 'Rose',  color: '#c94c4c' },
  { id: 'blue',   label: 'Sky',   color: '#4c8bc9' },
];


export default function NoteReader({ slug }: { slug: string }) {
  const note = getNoteBySlug(slug);
  const contentRef = useRef<HTMLDivElement>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [selectedColor, setSelectedColor] = useState<'yellow'|'green'|'red'|'blue'>('yellow');
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [annotationMode, setAnnotationMode] = useState<'highlight'|'sticky'|null>('highlight');
  const [showStickyForm, setShowStickyForm] = useState(false);
  const [stickyPos, setStickyPos] = useState({ x: 200, y: 200 });
  const [stickyText, setStickyText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!slug) return;
    try {
      const h = localStorage.getItem(`hl-${slug}`);
      const s = localStorage.getItem(`st-${slug}`);
      if (h) setHighlights(JSON.parse(h));
      if (s) setStickyNotes(JSON.parse(s));
    } catch {}
  }, [slug]);

  useEffect(() => { if (slug) localStorage.setItem(`hl-${slug}`, JSON.stringify(highlights)); }, [highlights, slug]);
  useEffect(() => { if (slug) localStorage.setItem(`st-${slug}`, JSON.stringify(stickyNotes)); }, [stickyNotes, slug]);

  const handleMouseUp = useCallback(() => {
    if (annotationMode !== 'highlight') return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { setShowToolbar(false); return; }
    const text = sel.toString().trim();
    if (!text || text.length < 2) { setShowToolbar(false); return; }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setSelectedText(text);
    setToolbarPos({ x: rect.left + rect.width / 2, y: rect.top - 50 + window.scrollY });
    setShowToolbar(true);
  }, [annotationMode]);

  const applyHighlight = (color: 'yellow'|'green'|'red'|'blue') => {
    if (!selectedText) return;
    setHighlights(prev => [...prev, { id: Date.now().toString(), text: selectedText, color }]);
    setShowToolbar(false);
    window.getSelection()?.removeAllRanges();
  };

  const getContent = () => {
    let c = getNoteContent(slug);
    c = injectHeadingIds(c);
    highlights.forEach(h => {
      const esc = h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      c = c.replace(new RegExp(`(${esc})`, 'g'), `<mark class="hl-${h.color}">$1</mark>`);
    });
    return c;
  };

  const processedContent = getContent();

  const list = note?.paper === 1 ? paper1Notes : paper2Notes;
  const idx = list.findIndex(n => n.slug === slug);
  const prev = idx > 0 ? list[idx-1] : null;
  const next = idx < list.length-1 ? list[idx+1] : null;
  const related = list.filter(n => n.section === note?.section && n.slug !== slug).slice(0, 5);

  if (!note) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text2)' }}>Topic not found. <Link href="/" style={{ color: 'var(--accent)' }}>← Home</Link></div>;

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 0, minWidth: sidebarOpen ? 240 : 0,
        borderRight: '1px solid var(--border)', background: 'var(--bg2)',
        overflow: 'hidden', transition: 'all 0.2s',
        position: 'sticky', top: 60, height: 'calc(100vh - 60px)', overflowY: 'auto', flexShrink: 0,
      }}>
        <div style={{ padding: '1.25rem 1rem', opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s' }}>
          <div style={{ color: 'var(--text3)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>{note.section} • Topic {note.topic}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text)', fontWeight: 600, marginBottom: '1.25rem', lineHeight: 1.3 }}>{note.title}</div>
          {note.subtopics && <>
            <div style={{ color: 'var(--text3)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Contents</div>
            {note.subtopics.map((s,i) => <div key={i} style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem', color: 'var(--text2)', borderLeft: '2px solid var(--border)', marginBottom: '0.2rem', borderRadius: '0 3px 3px 0' }}>{s}</div>)}
          </>}
          {highlights.length > 0 && <>
            <div style={{ color: 'var(--text3)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '1.25rem 0 0.5rem' }}>My Highlights ({highlights.length})</div>
            {highlights.map(h => <div key={h.id} style={{ padding: '0.35rem 0.5rem', fontSize: '0.73rem', color: 'var(--text2)', borderLeft: `2px solid ${HIGHLIGHT_COLORS.find(c=>c.id===h.color)?.color}`, marginBottom: '0.3rem', background: 'var(--bg3)', borderRadius: '0 3px 3px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.text.slice(0,38)}{h.text.length>38?'…':''}</span>
              <button onClick={() => setHighlights(p => p.filter(x=>x.id!==h.id))} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '0.7rem', flexShrink: 0 }}>✕</button>
            </div>)}
          </>}
          {related.length > 0 && <>
            <div style={{ color: 'var(--text3)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '1.25rem 0 0.5rem' }}>Related</div>
            {related.map(r => <Link key={r.slug} href={`/notes/${r.slug}`} style={{ display: 'block', padding: '0.35rem 0.5rem', fontSize: '0.78rem', color: 'var(--text2)', textDecoration: 'none', marginBottom: '0.2rem', borderRadius: 4 }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='var(--accent)';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='var(--text2)';}}
            >→ {r.title}</Link>)}
          </>}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Toolbar */}
        <div style={{ borderBottom: '1px solid var(--border)', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--bg)', position: 'sticky', top: 60, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', padding: '0.3rem 0.55rem', borderRadius: 4, fontSize: '0.85rem' }}>{sidebarOpen ? '◁' : '▷'}</button>
          <Link href={`/paper${note.paper}`} style={{ color: 'var(--text3)', fontSize: '0.78rem', textDecoration: 'none' }}>Paper {note.paper}</Link>
          <span style={{ color: 'var(--border2)' }}>›</span>
          <span style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>{note.section}</span>
          <span style={{ color: 'var(--border2)' }}>›</span>
          <span style={{ color: 'var(--text2)', fontSize: '0.78rem' }}>{note.title}</span>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.2rem', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px' }}>
              <button onClick={() => setAnnotationMode(annotationMode==='highlight'?null:'highlight')} style={{ background: annotationMode==='highlight'?'var(--accent-dim)':'transparent', border: annotationMode==='highlight'?'1px solid var(--accent2)':'1px solid transparent', color: annotationMode==='highlight'?'var(--accent)':'var(--text2)', cursor: 'pointer', padding: '0.3rem 0.65rem', borderRadius: 4, fontSize: '0.75rem' }}>✏️ Highlight</button>
              <button onClick={() => setAnnotationMode(annotationMode==='sticky'?null:'sticky')} style={{ background: annotationMode==='sticky'?'var(--accent-dim)':'transparent', border: annotationMode==='sticky'?'1px solid var(--accent2)':'1px solid transparent', color: annotationMode==='sticky'?'var(--accent)':'var(--text2)', cursor: 'pointer', padding: '0.3rem 0.65rem', borderRadius: 4, fontSize: '0.75rem' }}>📌 Sticky</button>
            </div>
            {annotationMode==='highlight' && <div style={{ display: 'flex', gap: '0.3rem' }}>
              {HIGHLIGHT_COLORS.map(c => <button key={c.id} onClick={() => setSelectedColor(c.id as any)} style={{ width: 18, height: 18, borderRadius: '50%', background: c.color, border: selectedColor===c.id?'2px solid white':'2px solid transparent', cursor: 'pointer', opacity: selectedColor===c.id?1:0.5 }} />)}
            </div>}
            {highlights.length > 0 && <button onClick={() => { if(confirm('Clear all highlights?')) setHighlights([]); }} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', cursor: 'pointer', padding: '0.3rem 0.65rem', borderRadius: 4, fontSize: '0.72rem' }}>Clear</button>}

            {/* ── DIGITAL WRITING TOGGLE ── */}
            <AnnotationToggle noteSlug={slug} />

            <Link href={`/chat?topic=${encodeURIComponent(note.title)}`} style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent2)', color: 'var(--accent)', padding: '0.3rem 0.85rem', borderRadius: 4, textDecoration: 'none', fontSize: '0.75rem' }}>Ask AI →</Link>
          </div>
        </div>

        {/* Float toolbar on selection */}
        {showToolbar && (
          <div style={{ position: 'fixed', left: toolbarPos.x, top: toolbarPos.y, transform: 'translateX(-50%)', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '6px 10px', display: 'flex', gap: '6px', alignItems: 'center', zIndex: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
            {HIGHLIGHT_COLORS.map(c => <button key={c.id} onClick={() => applyHighlight(c.id as any)} style={{ width: 22, height: 22, borderRadius: '50%', background: c.color, border: '2px solid transparent', cursor: 'pointer' }} title={`Highlight ${c.label}`} />)}
            <button onClick={() => setShowToolbar(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
          </div>
        )}

        {/* Sticky form modal */}
        {showStickyForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '1.5rem', width: 340 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' }}>Add Sticky Note</div>
              <textarea value={stickyText} onChange={e=>setStickyText(e.target.value)} placeholder="Type your note..." autoFocus style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.6rem', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', resize: 'vertical', minHeight: 100, outline: 'none' }} />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowStickyForm(false)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', padding: '0.4rem 1rem', borderRadius: 4 }}>Cancel</button>
                <button onClick={() => { setStickyNotes(p=>[...p,{id:Date.now().toString(),text:stickyText,x:stickyPos.x,y:stickyPos.y}]); setShowStickyForm(false); setStickyText(''); }} style={{ background: 'var(--accent)', color: '#0f0e0c', border: 'none', cursor: 'pointer', padding: '0.4rem 1rem', borderRadius: 4, fontWeight: 600 }}>Add</button>
              </div>
            </div>
          </div>
        )}

        {/* Sticky notes */}
        {stickyNotes.map(s => (
          <div key={s.id} style={{ position: 'absolute', left: s.x, top: s.y, background: '#2a2408', border: '1px solid var(--accent2)', borderRadius: 4, padding: '8px 10px', zIndex: 100, minWidth: 180, maxWidth: 240, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
              <button onClick={() => setStickyNotes(p=>p.filter(x=>x.id!==s.id))} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
            </div>
            <textarea value={s.text} onChange={e=>setStickyNotes(p=>p.map(x=>x.id===s.id?{...x,text:e.target.value}:x))} style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', width: '100%', resize: 'none', minHeight: 60 }} />
          </div>
        ))}

        {/* Note content */}
        <div ref={contentRef} style={{ padding: '2.5rem 2rem', position: 'relative' }}
          onMouseUp={handleMouseUp}
          onClick={e => {
            if (annotationMode==='sticky') {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setStickyPos({ x: e.clientX - rect.left, y: e.clientY - rect.top + window.scrollY });
              setShowStickyForm(true);
            }
          }}
        >
          {annotationMode==='sticky' && <div style={{ position: 'sticky', top: 120, zIndex: 40, marginBottom: '1rem', background: 'rgba(201,168,76,0.08)', border: '1px dashed var(--accent2)', borderRadius: 6, padding: '0.6rem 1rem', fontSize: '0.8rem', color: 'var(--accent)', textAlign: 'center' }}>📌 Click anywhere to place a sticky note</div>}

          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            {/* Auto-generated Table of Contents */}
            <TableOfContents contentHtml={processedContent} />

            {/* Note body */}
            <div className="note-content" dangerouslySetInnerHTML={{ __html: processedContent }} />

            {/* Related Topics footer */}
            {related.length > 0 && (
              <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text3)', marginBottom: '0.75rem', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
                  Related Topics
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {related.map(r => (
                    <Link key={r.slug} href={`/notes/${r.slug}`} style={{
                      display: 'inline-block',
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.78rem',
                      color: 'var(--text2)',
                      textDecoration: 'none',
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      borderRadius: 20,
                      fontFamily: 'var(--font-ui)',
                      transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = 'var(--accent)';
                        el.style.borderColor = 'var(--accent2)';
                        el.style.background = 'var(--accent-dim)';
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = 'var(--text2)';
                        el.style.borderColor = 'var(--border)';
                        el.style.background = 'var(--bg2)';
                      }}
                    >
                      → {r.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prev/Next navigation */}
          <div style={{ maxWidth: 760, margin: '3rem auto 0', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            {prev ? <Link href={`/notes/${prev.slug}`} style={{ color: 'var(--text2)', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ color: 'var(--text3)', fontSize: '0.7rem' }}>← Previous</span>
              <span>{prev.title}</span>
            </Link> : <div/>}
            {next ? <Link href={`/notes/${next.slug}`} style={{ color: 'var(--text2)', textDecoration: 'none', fontSize: '0.85rem', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ color: 'var(--text3)', fontSize: '0.7rem' }}>Next →</span>
              <span>{next.title}</span>
            </Link> : <div/>}
          </div>
        </div>
      </div>
    </div>
  );
}
