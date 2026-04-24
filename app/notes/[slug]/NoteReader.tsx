'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { allNotes, getNoteBySlug, paper1Notes, paper2Notes } from '@/lib/notes';
import { getNoteContent } from '@/lib/noteContent';
import { supabase } from '@/lib/supabase';
import AnnotationToggle from '@/components/AnnotationToggle';
import TableOfContents from '@/components/TableOfContents';
import type { User } from '@supabase/supabase-js';

function injectHeadingIds(html: string): string {
  let h2count = 0;
  let h3count = 0;
  return html
    .replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_, attrs, inner) => {
      const text = inner.replace(/<[^>]+>/g, '').trim();
      const id = `toc-${h2count++}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
      return `<h2${attrs} id="${id}">${inner}</h2>`;
    })
    .replace(/<h3([^>]*)>([\s\S]*?)<\/h3>/gi, (_, attrs, inner) => {
      const text = inner.replace(/<[^>]+>/g, '').trim();
      const id = `toc-${h3count++}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
      return `<h3${attrs} id="${id}">${inner}</h3>`;
    });
}

type Highlight = { id: string; text: string; color: 'yellow' | 'green' | 'red' | 'blue' };
type StickyNote = { id: string; text: string; x: number; y: number };

const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Gold',  color: '#c9a84c' },
  { id: 'green',  label: 'Mint',  color: '#4cad7a' },
  { id: 'red',    label: 'Rose',  color: '#c94c4c' },
  { id: 'blue',   label: 'Sky',   color: '#4c8bc9' },
];

const SESSION_KEY = 'histopt_admin_v2';

function InlineEditorToolbar({ contentRef }: { contentRef: React.RefObject<HTMLDivElement | null> }) {
  const cmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) cmd('insertImage', url);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) cmd('createLink', url);
  };

  const insertTable = () => {
    const table = `<table style="border-collapse:collapse;width:100%;margin:1rem 0"><tr><td style="border:1px solid #d4a843;padding:8px">&nbsp;</td><td style="border:1px solid #d4a843;padding:8px">&nbsp;</td><td style="border:1px solid #d4a843;padding:8px">&nbsp;</td></tr><tr><td style="border:1px solid #d4a843;padding:8px">&nbsp;</td><td style="border:1px solid #d4a843;padding:8px">&nbsp;</td><td style="border:1px solid #d4a843;padding:8px">&nbsp;</td></tr></table>`;
    document.execCommand('insertHTML', false, table);
    contentRef.current?.focus();
  };

  const setColor = (color: string) => cmd('foreColor', color);
  const setHighlight = (color: string) => cmd('hiliteColor', color);
  const setFontSize = (size: string) => cmd('fontSize', size);

  const IconBtn = ({ title, onClick, children, danger }: { title: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) => (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30, borderRadius: 6, cursor: 'pointer',
        background: 'transparent', border: '1px solid transparent',
        color: danger ? '#f87171' : '#c9a84c',
        fontSize: '0.85rem', fontWeight: 700,
        transition: 'background 0.12s, border-color 0.12s, transform 0.1s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.background = danger ? 'rgba(248,113,113,0.12)' : 'rgba(212,168,67,0.13)';
        el.style.borderColor = danger ? 'rgba(248,113,113,0.3)' : 'rgba(212,168,67,0.35)';
        el.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.background = 'transparent';
        el.style.borderColor = 'transparent';
        el.style.transform = 'none';
      }}
    >
      {children}
    </button>
  );

  const Divider = () => (
    <div style={{
      width: 1, height: 22, margin: '0 4px', flexShrink: 0,
      background: 'linear-gradient(to bottom, transparent, rgba(212,168,67,0.25), transparent)',
    }} />
  );

  const Group = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1, padding: '0 2px' }}>
      {children}
    </div>
  );

  const StyledSelect = ({ onChange, defaultValue, children, width }: any) => (
    <select
      onMouseDown={e => e.stopPropagation()}
      onChange={onChange}
      defaultValue={defaultValue}
      style={{
        background: 'rgba(212,168,67,0.07)',
        border: '1px solid rgba(212,168,67,0.22)',
        color: '#c9a84c', borderRadius: 6, padding: '0 6px',
        fontSize: '0.73rem', fontWeight: 600,
        cursor: 'pointer', height: 30, width: width ?? 'auto',
        outline: 'none', letterSpacing: '0.02em',
        transition: 'border-color 0.12s',
      }}
    >
      {children}
    </select>
  );

  const ColorSwatch = ({ color, title, onClick, ring }: { color: string; title: string; onClick: () => void; ring?: string }) => (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      style={{
        width: 17, height: 17, borderRadius: 4,
        background: color,
        border: `2px solid ${ring ?? 'rgba(255,255,255,0.1)'}`,
        cursor: 'pointer', flexShrink: 0,
        transition: 'transform 0.1s, border-color 0.1s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.25)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = ring ?? 'rgba(255,255,255,0.1)'; }}
    />
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <span style={{
      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
      color: 'rgba(212,168,67,0.4)', textTransform: 'uppercase', userSelect: 'none',
    }}>{children}</span>
  );

  return (
    <div style={{
      position: 'sticky', top: 106, zIndex: 100,
      display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center',
      padding: '5px 10px',
      background: 'linear-gradient(135deg, rgba(15,13,9,0.98) 0%, rgba(22,19,12,0.98) 100%)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(212,168,67,0.18)',
      borderRadius: '0 0 10px 10px',
      marginBottom: '1.2rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,168,67,0.1)',
    }}>
      <Group>
        <IconBtn title="Undo (Cmd+Z)" onClick={() => cmd('undo')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </IconBtn>
        <IconBtn title="Redo (Cmd+Shift+Z)" onClick={() => cmd('redo')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
        </IconBtn>
      </Group>
      <Divider />

      <Group>
        <StyledSelect width={88} defaultValue="" onChange={(e: any) => { cmd('formatBlock', e.target.value); contentRef.current?.focus(); }}>
          <option value="" disabled>Style</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="p">Paragraph</option>
          <option value="blockquote">Quote</option>
          <option value="pre">Code</option>
        </StyledSelect>
        <StyledSelect width={52} defaultValue="" onChange={(e: any) => { setFontSize(e.target.value); contentRef.current?.focus(); }}>
          <option value="" disabled>Sz</option>
          <option value="1">10</option>
          <option value="2">13</option>
          <option value="3">16</option>
          <option value="4">18</option>
          <option value="5">24</option>
          <option value="6">32</option>
          <option value="7">48</option>
        </StyledSelect>
      </Group>
      <Divider />

      <Group>
        <IconBtn title="Bold (Cmd+B)" onClick={() => cmd('bold')}><b style={{fontFamily:'Georgia,serif',fontSize:'0.95rem'}}>B</b></IconBtn>
        <IconBtn title="Italic (Cmd+I)" onClick={() => cmd('italic')}><i style={{fontFamily:'Georgia,serif',fontSize:'0.95rem'}}>I</i></IconBtn>
        <IconBtn title="Underline (Cmd+U)" onClick={() => cmd('underline')}><span style={{textDecoration:'underline',fontFamily:'Georgia,serif',fontSize:'0.9rem'}}>U</span></IconBtn>
        <IconBtn title="Strikethrough" onClick={() => cmd('strikeThrough')}><s style={{fontFamily:'Georgia,serif',fontSize:'0.9rem'}}>S</s></IconBtn>
        <IconBtn title="Superscript" onClick={() => cmd('superscript')}><span style={{fontSize:'0.7rem'}}>x<sup style={{fontSize:'0.6rem'}}>2</sup></span></IconBtn>
        <IconBtn title="Subscript" onClick={() => cmd('subscript')}><span style={{fontSize:'0.7rem'}}>x<sub style={{fontSize:'0.6rem'}}>2</sub></span></IconBtn>
      </Group>
      <Divider />

      <Group>
        <IconBtn title="Align left" onClick={() => cmd('justifyLeft')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="2" rx="1"/><rect x="3" y="10" width="12" height="2" rx="1"/><rect x="3" y="15" width="18" height="2" rx="1"/><rect x="3" y="20" width="10" height="2" rx="1"/></svg>
        </IconBtn>
        <IconBtn title="Center" onClick={() => cmd('justifyCenter')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="2" rx="1"/><rect x="6" y="10" width="12" height="2" rx="1"/><rect x="3" y="15" width="18" height="2" rx="1"/><rect x="7" y="20" width="10" height="2" rx="1"/></svg>
        </IconBtn>
        <IconBtn title="Align right" onClick={() => cmd('justifyRight')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="2" rx="1"/><rect x="9" y="10" width="12" height="2" rx="1"/><rect x="3" y="15" width="18" height="2" rx="1"/><rect x="11" y="20" width="10" height="2" rx="1"/></svg>
        </IconBtn>
        <IconBtn title="Justify" onClick={() => cmd('justifyFull')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="2" rx="1"/><rect x="3" y="10" width="18" height="2" rx="1"/><rect x="3" y="15" width="18" height="2" rx="1"/><rect x="3" y="20" width="18" height="2" rx="1"/></svg>
        </IconBtn>
      </Group>
      <Divider />

      <Group>
        <IconBtn title="Bullet list" onClick={() => cmd('insertUnorderedList')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="4" cy="6" r="1.5"/><rect x="8" y="5" width="13" height="2" rx="1"/><circle cx="4" cy="12" r="1.5"/><rect x="8" y="11" width="13" height="2" rx="1"/><circle cx="4" cy="18" r="1.5"/><rect x="8" y="17" width="13" height="2" rx="1"/></svg>
        </IconBtn>
        <IconBtn title="Numbered list" onClick={() => cmd('insertOrderedList')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
        </IconBtn>
        <IconBtn title="Indent" onClick={() => cmd('indent')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><polyline points="3,9 6,12 3,15"/></svg>
        </IconBtn>
        <IconBtn title="Outdent" onClick={() => cmd('outdent')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><polyline points="7,9 4,12 7,15"/></svg>
        </IconBtn>
      </Group>
      <Divider />

      <Group>
        <IconBtn title="Insert link" onClick={insertLink}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </IconBtn>
        <IconBtn title="Insert image" onClick={insertImage}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
        </IconBtn>
        <IconBtn title="Insert table" onClick={insertTable}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
        </IconBtn>
        <IconBtn title="Horizontal rule" onClick={() => cmd('insertHorizontalRule')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/></svg>
        </IconBtn>
      </Group>
      <Divider />

      <Group>
        <SectionLabel>A</SectionLabel>
        <ColorSwatch color="#f8f8f2" title="White" onClick={() => setColor('#f8f8f2')} />
        <ColorSwatch color="#d4a843" title="Gold" onClick={() => setColor('#d4a843')} ring="rgba(212,168,67,0.5)" />
        <ColorSwatch color="#60a5fa" title="Blue" onClick={() => setColor('#60a5fa')} />
        <ColorSwatch color="#4ade80" title="Green" onClick={() => setColor('#4ade80')} />
        <ColorSwatch color="#f87171" title="Red" onClick={() => setColor('#f87171')} />
        <ColorSwatch color="#c084fc" title="Purple" onClick={() => setColor('#c084fc')} />
        <ColorSwatch color="#fb923c" title="Orange" onClick={() => setColor('#fb923c')} />
      </Group>
      <Divider />

      <Group>
        <SectionLabel>H</SectionLabel>
        <ColorSwatch color="rgba(212,168,67,0.4)" title="Gold highlight" onClick={() => setHighlight('rgba(212,168,67,0.4)')} ring="rgba(212,168,67,0.5)" />
        <ColorSwatch color="rgba(96,165,250,0.4)" title="Blue highlight" onClick={() => setHighlight('rgba(96,165,250,0.4)')} />
        <ColorSwatch color="rgba(74,222,128,0.4)" title="Green highlight" onClick={() => setHighlight('rgba(74,222,128,0.4)')} />
        <ColorSwatch color="rgba(248,113,113,0.4)" title="Red highlight" onClick={() => setHighlight('rgba(248,113,113,0.4)')} />
        <ColorSwatch color="rgba(192,132,252,0.4)" title="Purple highlight" onClick={() => setHighlight('rgba(192,132,252,0.4)')} />
      </Group>
      <Divider />

      <Group>
        <IconBtn title="Clear formatting" onClick={() => cmd('removeFormat')} danger>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7-4-4-7 7 4 4z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><line x1="2" y1="22" x2="22" y2="2"/></svg>
        </IconBtn>
        <IconBtn title="Remove link" onClick={() => cmd('unlink')} danger>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
        </IconBtn>
      </Group>
    </div>
  );
}

// ── SNOO AVATAR (per-account color from email hash) ──
function snooColor(email: string): string {
  const palette = [
    '#ff4500', // reddit orange
    '#51cf66', // mint green
    '#339af0', // sky blue
    '#cc5de8', // purple
    '#f59f00', // amber
    '#20c997', // teal
    '#ff6b6b', // coral
    '#74c0fc', // light blue
    '#a9e34b', // lime
    '#ffa94d', // peach
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function SnooAvatar({ email, size = 28 }: { email: string; size?: number }) {
  const c = snooColor(email);
  const bg = '#0f0f1a';
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill={bg}/>
      {/* Antenna ball */}
      <circle cx="43" cy="13" r="4.5" fill={c}/>
      {/* Antenna stick */}
      <line x1="39.5" y1="15.5" x2="33" y2="21" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Head */}
      <circle cx="32" cy="30" r="14" fill={c}/>
      {/* Eyes white */}
      <circle cx="27" cy="28" r="3.5" fill="white"/>
      <circle cx="37" cy="28" r="3.5" fill="white"/>
      {/* Pupils */}
      <circle cx="28" cy="28.5" r="1.8" fill={bg}/>
      <circle cx="38" cy="28.5" r="1.8" fill={bg}/>
      {/* Smile */}
      <path d="M27 34 Q32 38.5 37 34" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Ears outer */}
      <circle cx="18" cy="29" r="4.5" fill={c}/>
      <circle cx="46" cy="29" r="4.5" fill={c}/>
      {/* Ears inner */}
      <circle cx="18" cy="29" r="2.2" fill="#ff6b6b"/>
      <circle cx="46" cy="29" r="2.2" fill="#ff6b6b"/>
      {/* Body */}
      <ellipse cx="32" cy="51" rx="10" ry="6.5" fill={c}/>
    </svg>
  );
}



// ── SCROLLBAR TOC NAVIGATOR ──
type TocItem = { id: string; text: string; level: 2 | 3 };

function extractToc(html: string): TocItem[] {
  const items: TocItem[] = [];
  const h2re = /<h2[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/gi;
  const h3re = /<h3[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h3>/gi;
  const all: { idx: number; item: TocItem }[] = [];
  let m: RegExpExecArray | null;
  while ((m = h2re.exec(html)) !== null) {
    all.push({ idx: m.index, item: { id: m[1], text: m[2].replace(/<[^>]+>/g, '').trim(), level: 2 } });
  }
  while ((m = h3re.exec(html)) !== null) {
    all.push({ idx: m.index, item: { id: m[1], text: m[2].replace(/<[^>]+>/g, '').trim(), level: 3 } });
  }
  return all.sort((a, b) => a.idx - b.idx).map(x => x.item);
}

function ScrollbarTOC({ contentHtml }: { contentHtml: string }) {
  const [open, setOpen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [activeId, setActiveId] = useState('');
  const toc = extractToc(contentHtml);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight);
      setScrollPct(isNaN(pct) ? 0 : pct);

      // find active heading
      const headings = toc.map(t => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
      let active = '';
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= 120) active = h.id;
      }
      setActiveId(active);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [toc]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setOpen(false);
  };

  if (toc.length === 0) return null;

  const trackH = typeof window !== 'undefined' ? window.innerHeight - 120 : 600;
  const thumbTop = scrollPct * (trackH - 48);

  return (
    <>
      {/* Custom scrollbar track on right edge */}
      <div style={{
        position: 'fixed', right: 0, top: 60, width: 14, height: trackH,
        zIndex: 400, display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: 'linear-gradient(180deg, #050508 0%, #07070f 100%)',
        borderLeft: '1px solid rgba(59,130,246,0.08)',
      }}>
        {/* Track marks for each heading */}
        {toc.map(t => {
          const el = typeof window !== 'undefined' ? document.getElementById(t.id) : null;
          const docH = typeof window !== 'undefined' ? document.documentElement.scrollHeight - window.innerHeight : 1;
          const elTop = el ? el.offsetTop : 0;
          const pct = docH > 0 ? elTop / docH : 0;
          const top = pct * trackH;
          return (
            <div
              key={t.id}
              onClick={() => scrollTo(t.id)}
              title={t.text}
              style={{
                position: 'absolute',
                top,
                width: t.level === 2 ? 8 : 5,
                height: t.level === 2 ? 2 : 1.5,
                left: t.level === 2 ? 3 : 4.5,
                background: activeId === t.id
                  ? '#60a5fa'
                  : t.level === 2
                    ? 'rgba(59,130,246,0.45)'
                    : 'rgba(59,130,246,0.2)',
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'background 0.2s',
                boxShadow: activeId === t.id ? '0 0 6px #3b82f6' : 'none',
              }}
            />
          );
        })}

        {/* Thumb — click to open TOC panel */}
        <div
          onClick={() => setOpen(o => !o)}
          style={{
            position: 'absolute',
            top: thumbTop,
            width: 8,
            height: 48,
            left: 3,
            background: open
              ? 'linear-gradient(180deg, #93c5fd, #3b82f6)'
              : 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 40%, #1d4ed8 100%)',
            borderRadius: 6,
            cursor: 'pointer',
            boxShadow: open
              ? '0 0 16px rgba(96,165,250,0.9), 0 0 32px rgba(59,130,246,0.5)'
              : '0 0 8px rgba(59,130,246,0.5), 0 0 20px rgba(59,130,246,0.2)',
            border: '1px solid rgba(147,197,253,0.4)',
            transition: 'box-shadow 0.2s, background 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Grip lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 4, height: 1, background: 'rgba(255,255,255,0.6)', borderRadius: 1 }} />
            ))}
          </div>
        </div>
      </div>

      {/* TOC Panel */}
      {open && (
        <div style={{
          position: 'fixed', right: 18, top: 80, zIndex: 399,
          width: 280,
          background: 'linear-gradient(160deg, #08081a 0%, #05050e 100%)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 12,
          boxShadow: '0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
          overflow: 'hidden',
          animation: 'tocSlideIn 0.18s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <style>{`
            @keyframes tocSlideIn {
              from { opacity: 0; transform: translateX(12px) scale(0.97); }
              to   { opacity: 1; transform: translateX(0) scale(1); }
            }
            .toc-nav-item { transition: all 0.15s ease; }
            .toc-nav-item:hover { background: rgba(59,130,246,0.1) !important; color: #fff !important; }
            .toc-nav-item:hover .toc-nav-arrow { opacity: 1 !important; transform: translateX(3px) !important; }
          `}</style>

          {/* Header */}
          <div style={{
            padding: '0.85rem 1rem 0.75rem',
            borderBottom: '1px solid rgba(59,130,246,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(59,130,246,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
              <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(59,130,246,0.8)' }}>On this page</span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.75rem', lineHeight: 1, padding: '2px 4px' }}>✕</button>
          </div>

          {/* Progress bar */}
          <div style={{ height: 2, background: 'rgba(59,130,246,0.08)' }}>
            <div style={{ height: '100%', width: `${scrollPct * 100}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', transition: 'width 0.1s', boxShadow: '0 0 8px #3b82f6' }} />
          </div>

          {/* TOC items */}
          <div style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', padding: '0.5rem 0' }}>
            {toc.map(t => (
              <button
                key={t.id}
                onClick={() => scrollTo(t.id)}
                className="toc-nav-item"
                style={{
                  width: '100%', background: activeId === t.id ? 'rgba(59,130,246,0.12)' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  padding: t.level === 2 ? '0.55rem 1rem' : '0.42rem 1rem 0.42rem 1.75rem',
                  display: 'flex', alignItems: 'center', gap: 8,
                  borderLeft: activeId === t.id ? '2px solid #3b82f6' : '2px solid transparent',
                  color: activeId === t.id ? '#fff' : t.level === 2 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)',
                }}
              >
                {t.level === 2 ? (
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: activeId === t.id ? '#3b82f6' : 'rgba(59,130,246,0.4)', flexShrink: 0, boxShadow: activeId === t.id ? '0 0 6px #3b82f6' : 'none' }} />
                ) : (
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(59,130,246,0.25)', flexShrink: 0, marginLeft: 1 }} />
                )}
                <span style={{ fontSize: t.level === 2 ? '0.8rem' : '0.73rem', lineHeight: 1.4, fontFamily: 'var(--font-ui)', fontWeight: t.level === 2 ? 500 : 400, flex: 1 }}>{t.text}</span>
                <span className="toc-nav-arrow" style={{ fontSize: '0.65rem', color: 'rgba(59,130,246,0.5)', opacity: 0, transition: 'all 0.15s', transform: 'translateX(0)' }}>→</span>
              </button>
            ))}
          </div>

          {/* Footer scroll pct */}
          <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid rgba(59,130,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: 'rgba(59,130,246,0.45)', letterSpacing: '0.1em' }}>READ</span>
            <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#3b82f6', fontWeight: 600 }}>{Math.round(scrollPct * 100)}%</span>
          </div>
        </div>
      )}
    </>
  );
}

export default function NoteReader({ slug }: { slug: string }) {
  const note = getNoteBySlug(slug);
  const contentRef = useRef<HTMLDivElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [cloudContent, setCloudContent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [adminPassword, setAdminPassword] = useState<string|null>(null);
  useEffect(() => { setAdminPassword(sessionStorage.getItem(SESSION_KEY)); }, []);

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // ── AUTH: listen to session changes ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/google-callback?next=${encodeURIComponent(window.location.pathname)}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Fall back to localStorage
    try {
      const h = localStorage.getItem(`hl-${slug}`);
      const s = localStorage.getItem(`st-${slug}`);
      setHighlights(h ? JSON.parse(h) : []);
      setStickyNotes(s ? JSON.parse(s) : []);
    } catch {}
  };

  // ── LOAD ANNOTATIONS: Supabase if logged in, localStorage otherwise ──
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      // Load from Supabase
      fetch(`/api/user-annotations?user_id=${user.id}&slug=${slug}`)
        .then(r => r.json())
        .then(({ data }) => {
          if (data && data.length > 0 && data[0].data) {
            const ann = data[0].data;
            setHighlights(ann.highlights ?? []);
            setStickyNotes(ann.stickyNotes ?? []);
          } else {
            // No cloud annotations yet — migrate from localStorage
            try {
              const h = localStorage.getItem(`hl-${slug}`);
              const s = localStorage.getItem(`st-${slug}`);
              const localHighlights = h ? JSON.parse(h) : [];
              const localStickies = s ? JSON.parse(s) : [];
              setHighlights(localHighlights);
              setStickyNotes(localStickies);
              // Auto-migrate if there's something local worth saving
              if (localHighlights.length > 0 || localStickies.length > 0) {
                saveAnnotationsToCloud(user.id, localHighlights, localStickies);
              }
            } catch {}
          }
        })
        .catch(() => {
          // Fallback to localStorage on error
          try {
            const h = localStorage.getItem(`hl-${slug}`);
            const s = localStorage.getItem(`st-${slug}`);
            if (h) setHighlights(JSON.parse(h));
            if (s) setStickyNotes(JSON.parse(s));
          } catch {}
        });
    } else {
      // Not logged in — use localStorage
      try {
        const h = localStorage.getItem(`hl-${slug}`);
        const s = localStorage.getItem(`st-${slug}`);
        if (h) setHighlights(JSON.parse(h));
        if (s) setStickyNotes(JSON.parse(s));
      } catch {}
    }
  }, [user, authLoading, slug]);

  const saveAnnotationsToCloud = useCallback(async (userId: string, h: Highlight[], s: StickyNote[]) => {
    setSyncStatus('saving');
    try {
      const res = await fetch('/api/user-annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, note_slug: slug, data: { highlights: h, stickyNotes: s } }),
      });
      const result = await res.json();
      setSyncStatus(result.ok ? 'saved' : 'error');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  }, [slug]);

  // ── SAVE ANNOTATIONS: debounced, to Supabase if logged in, localStorage always ──
  useEffect(() => {
    if (!slug) return;
    // Always save to localStorage as backup
    localStorage.setItem(`hl-${slug}`, JSON.stringify(highlights));
    localStorage.setItem(`st-${slug}`, JSON.stringify(stickyNotes));
    // Debounced cloud save if logged in
    if (user) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveAnnotationsToCloud(user.id, highlights, stickyNotes);
      }, 1200);
    }
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [highlights, stickyNotes, slug, user, saveAnnotationsToCloud]);

  // Admin setup
  useEffect(() => {
    setIsAdmin(!!sessionStorage.getItem(SESSION_KEY));
  }, []);

  // Load cloud note override
  useEffect(() => {
    fetch(`/api/admin/note-content?slug=${slug}`)
      .then(r => r.json())
      .then(({ data }) => { if (data && data.length > 0) setCloudContent(data[0].content); })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (editMode && editableRef.current) {
      editableRef.current.innerHTML = cloudContent ?? getNoteContent(slug);
      editableRef.current.focus({ preventScroll: true });
    }
  }, [editMode]);

  const saveEdit = async () => {
    if (!editableRef.current || !adminPassword) return;
    const html = editableRef.current.innerHTML;
    setSaving(true);
    const res = await fetch('/api/admin/note-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': adminPassword },
      body: JSON.stringify({ slug, content: html }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) {
      setCloudContent(html);
      setSaveMsg('✓ Saved');
      setTimeout(() => setSaveMsg(''), 3000);
    } else {
      setSaveMsg('⚠ Save failed');
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const handleMouseUp = useCallback(() => {
    if (annotationMode !== 'highlight' || editMode) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { setShowToolbar(false); return; }
    const text = sel.toString().trim();
    if (!text || text.length < 2) { setShowToolbar(false); return; }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setSelectedText(text);
    setToolbarPos({ x: rect.left + rect.width / 2, y: rect.top - 50 + window.scrollY });
    setShowToolbar(true);
  }, [annotationMode, editMode]);

  const applyHighlight = (color: 'yellow'|'green'|'red'|'blue') => {
    if (!selectedText) return;
    setHighlights(prev => [...prev, { id: Date.now().toString(), text: selectedText, color }]);
    setShowToolbar(false);
    window.getSelection()?.removeAllRanges();
  };

  const getContent = () => {
    let c = cloudContent ?? getNoteContent(slug);
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

  if (!note) return (
    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text2)' }}>
      Topic not found. <Link href="/" style={{ color: 'var(--accent)' }}>← Home</Link>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 0, minWidth: sidebarOpen ? 240 : 0,
        borderRight: '1px solid #0d0d0d',
        background: 'linear-gradient(180deg, #06060f 0%, #070710 60%, #05050c 100%)',
        overflow: 'hidden', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        position: 'sticky', top: 60, height: 'calc(100vh - 60px)', overflowY: 'auto', flexShrink: 0,
        boxShadow: 'inset -1px 0 0 #111116',
      }}>
        <style>{`
          .sb-section-label {
            font-size: 0.6rem;
            font-family: var(--font-mono);
            text-transform: uppercase;
            letter-spacing: 0.18em;
            color: rgba(59,130,246,0.45);
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 1.2rem 0 0.5rem;
          }
          .sb-section-label::after {
            content: '';
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, rgba(59,130,246,0.2), transparent);
          }
          .sb-chip {
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 0.32rem 0.6rem;
            font-size: 0.76rem;
            color: rgba(255,255,255,0.5);
            border-left: 2px solid rgba(59,130,246,0.15);
            margin-bottom: 0.18rem;
            border-radius: 0 4px 4px 0;
            transition: all 0.15s ease;
            cursor: default;
          }
          .sb-chip:hover {
            background: rgba(59,130,246,0.07);
            border-left-color: rgba(59,130,246,0.5);
            color: rgba(255,255,255,0.85);
            transform: translateX(2px);
          }
          .sb-related-link {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 0.38rem 0.6rem;
            font-size: 0.76rem;
            color: rgba(255,255,255,0.45);
            text-decoration: none;
            border: 1px solid rgba(59,130,246,0.08);
            border-radius: 5px;
            margin-bottom: 0.28rem;
            background: rgba(59,130,246,0.03);
            transition: all 0.15s ease;
          }
          .sb-related-link:hover {
            background: rgba(59,130,246,0.1);
            border-color: rgba(59,130,246,0.3);
            color: #fff;
            transform: translateX(3px);
            box-shadow: 0 2px 12px rgba(59,130,246,0.12);
          }
          .sb-related-link .sb-arrow {
            font-size: 0.6rem;
            color: rgba(59,130,246,0.4);
            margin-left: auto;
            transition: transform 0.15s;
          }
          .sb-related-link:hover .sb-arrow {
            transform: translateX(3px);
            color: rgba(59,130,246,0.8);
          }
          .sb-hl-chip {
            padding: 0.3rem 0.55rem;
            font-size: 0.71rem;
            color: rgba(255,255,255,0.5);
            margin-bottom: 0.25rem;
            background: rgba(255,255,255,0.03);
            border-radius: 0 4px 4px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background 0.12s;
          }
          .sb-hl-chip:hover { background: rgba(255,255,255,0.06); }
          aside::-webkit-scrollbar { width: 3px; }
          aside::-webkit-scrollbar-track { background: transparent; }
          aside::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.2); border-radius: 2px; }
        `}</style>

        <div style={{ padding: '1.25rem 1rem', opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s' }}>

          {/* Topic badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '0.25rem 0.65rem', marginBottom: '0.75rem',
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)',
            borderRadius: 20,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 6px #3b82f6', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', color: 'rgba(59,130,246,0.75)', textTransform: 'uppercase' }}>{note.section} · Topic {note.topic}</span>
          </div>

          {/* Title */}
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '0.88rem',
            color: '#ffffff', fontWeight: 700, lineHeight: 1.4,
            marginBottom: '0.85rem',
            textShadow: '0 0 20px rgba(59,130,246,0.2)',
          }}>{note.title}</div>
          <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(59,130,246,0.25), transparent)', marginBottom: '0.2rem' }} />

          {note.subtopics && <>
            <div className="sb-section-label">Contents</div>
            {note.subtopics.map((s,i) => (
              <div key={i} className="sb-chip">
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(59,130,246,0.4)', flexShrink: 0 }} />
                {s}
              </div>
            ))}
          </>}

          {highlights.length > 0 && <>
            <div className="sb-section-label">Highlights ({highlights.length})</div>
            {highlights.map(h => (
              <div key={h.id} className="sb-hl-chip" style={{ borderLeft: `2px solid ${HIGHLIGHT_COLORS.find(c=>c.id===h.color)?.color}` }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.text.slice(0,36)}{h.text.length>36?'…':''}</span>
                <button onClick={() => setHighlights(p => p.filter(x=>x.id!==h.id))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: '0.68rem', flexShrink: 0, padding: '0 2px' }}>✕</button>
              </div>
            ))}
          </>}

          {related.length > 0 && <>
            <div className="sb-section-label">Related</div>
            {related.map(r => (
              <Link key={r.slug} href={`/notes/${r.slug}`} className="sb-related-link">
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                <span className="sb-arrow">→</span>
              </Link>
            ))}
          </>}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Toolbar */}
        <div style={{ borderBottom: '1px solid var(--border)', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--bg)', position: 'sticky', top: 60, zIndex: 30 }}>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: 4, fontSize: '0.8rem', lineHeight: 1, display: 'flex', alignItems: 'center' }}
          >
            {sidebarOpen ? '◂' : '▸'}
          </button>
          <Link href={`/paper${note.paper}`} style={{ color: 'var(--text3)', fontSize: '0.78rem', textDecoration: 'none' }}>Paper {note.paper}</Link>
          <span style={{ color: 'var(--border2)' }}>›</span>
          <span style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>{note.section}</span>
          <span style={{ color: 'var(--border2)' }}>›</span>
          <span style={{ color: 'var(--text2)', fontSize: '0.78rem' }}>{note.title}</span>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {isAdmin && !editMode && (
              <button onClick={() => { setAnnotationMode(null); setEditMode(true); }}
                style={{ background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.35)', color: '#d4a843', cursor: 'pointer', padding: '0.3rem 0.85rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                ✏️ Edit Note
              </button>
            )}
            {isAdmin && editMode && (
              <>
                <button onClick={saveEdit} disabled={saving}
                  style={{ background: saving ? 'rgba(212,168,67,0.06)' : 'rgba(81,207,102,0.12)', border: saving ? '1px solid rgba(212,168,67,0.2)' : '1px solid rgba(81,207,102,0.35)', color: saving ? '#d4a843' : '#51cf66', cursor: saving ? 'default' : 'pointer', padding: '0.3rem 0.85rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                  {saving ? '↑ Saving...' : '✓ Save'}
                </button>
                <button onClick={() => setEditMode(false)}
                  style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff8080', cursor: 'pointer', padding: '0.3rem 0.75rem', borderRadius: 4, fontSize: '0.75rem' }}>
                  ✕ Cancel
                </button>
                {saveMsg && <span style={{ fontSize: '0.75rem', color: '#51cf66' }}>{saveMsg}</span>}
              </>
            )}

            {!editMode && <>
              <div style={{ display: 'flex', gap: '0.2rem', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px' }}>
                <button onClick={() => setAnnotationMode(annotationMode==='highlight'?null:'highlight')} style={{ background: annotationMode==='highlight'?'var(--accent-dim)':'transparent', border: annotationMode==='highlight'?'1px solid var(--accent2)':'1px solid transparent', color: annotationMode==='highlight'?'var(--accent)':'var(--text2)', cursor: 'pointer', padding: '0.3rem 0.65rem', borderRadius: 4, fontSize: '0.75rem' }}>✏️ Highlight</button>
                <button onClick={() => setAnnotationMode(annotationMode==='sticky'?null:'sticky')} style={{ background: annotationMode==='sticky'?'var(--accent-dim)':'transparent', border: annotationMode==='sticky'?'1px solid var(--accent2)':'1px solid transparent', color: annotationMode==='sticky'?'var(--accent)':'var(--text2)', cursor: 'pointer', padding: '0.3rem 0.65rem', borderRadius: 4, fontSize: '0.75rem' }}>📌 Sticky</button>
              </div>
              {annotationMode==='highlight' && (
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {HIGHLIGHT_COLORS.map(c => <button key={c.id} onClick={() => setSelectedColor(c.id as any)} style={{ width: 18, height: 18, borderRadius: '50%', background: c.color, border: selectedColor===c.id?'2px solid white':'2px solid transparent', cursor: 'pointer', opacity: selectedColor===c.id?1:0.5 }} />)}
                </div>
              )}
              {highlights.length > 0 && (
                <button onClick={() => { if(confirm('Clear all highlights?')) setHighlights([]); }} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', cursor: 'pointer', padding: '0.3rem 0.65rem', borderRadius: 4, fontSize: '0.72rem' }}>Clear</button>
              )}
              <AnnotationToggle noteSlug={slug} />
              <Link href={`/chat?topic=${encodeURIComponent(note.title)}`} style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent2)', color: 'var(--accent)', padding: '0.3rem 0.85rem', borderRadius: 4, textDecoration: 'none', fontSize: '0.75rem' }}>Ask AI →</Link>
            </>}
          </div>
        </div>

        {/* Float highlight toolbar */}
        {showToolbar && !editMode && (
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
                <button onClick={() => { setStickyNotes(p=>[...p,{id:Date.now().toString(),text:stickyText,x:stickyPos.x,y:stickyPos.y}]); setShowStickyForm(false); setStickyText(''); }}
                  style={{ background: 'var(--accent)', color: '#0f0e0c', border: 'none', cursor: 'pointer', padding: '0.4rem 1rem', borderRadius: 4, fontWeight: 600 }}>Add</button>
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
            if (annotationMode==='sticky' && !editMode) {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setStickyPos({ x: e.clientX - rect.left, y: e.clientY - rect.top + window.scrollY });
              setShowStickyForm(true);
            }
          }}
        >
          {annotationMode==='sticky' && !editMode && (
            <div style={{ position: 'sticky', top: 120, zIndex: 40, marginBottom: '1rem', background: 'rgba(201,168,76,0.08)', border: '1px dashed var(--accent2)', borderRadius: 6, padding: '0.6rem 1rem', fontSize: '0.8rem', color: 'var(--accent)', textAlign: 'center' }}>
              📌 Click anywhere to place a sticky note
            </div>
          )}

          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            {editMode ? (
              <>
                <div style={{ marginBottom: '1rem', padding: '0.6rem 1rem', background: 'rgba(212,168,67,0.06)', border: '1px dashed rgba(212,168,67,0.3)', borderRadius: 6, fontSize: '0.78rem', color: '#d4a843', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>✏️ Editing mode — changes save permanently to cloud</span>
                  {cloudContent && (
                    <button onClick={async () => {
                      if (!confirm('Reset to original source content?')) return;
                      const pw = sessionStorage.getItem(SESSION_KEY);
                      await fetch('/api/admin/note-content', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-password': pw! }, body: JSON.stringify({ slug }) });
                      setCloudContent(null);
                      setEditMode(false);
                    }} style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(255,80,80,0.3)', color: '#ff8080', cursor: 'pointer', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem' }}>
                      Reset to original
                    </button>
                  )}
                </div>
                <InlineEditorToolbar contentRef={editableRef} />
                <div ref={editableRef} contentEditable suppressContentEditableWarning className="note-content"
                  style={{ outline: 'none', minHeight: 400, padding: '1rem', borderRadius: 6, border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(212,168,67,0.02)', caretColor: '#d4a843' }} />
              </>
            ) : (
              <>
                <TableOfContents contentHtml={processedContent} />
                <div className="note-content" dangerouslySetInnerHTML={{ __html: processedContent }} />
              </>
            )}

            {!editMode && related.length > 0 && (
              <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text3)', marginBottom: '0.75rem', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>Related Topics</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {related.map(r => (
                    <Link key={r.slug} href={`/notes/${r.slug}`} style={{ display: 'inline-block', padding: '0.35rem 0.85rem', fontSize: '0.78rem', color: 'var(--text2)', textDecoration: 'none', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, fontFamily: 'var(--font-ui)', transition: 'all 0.15s' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color='var(--accent)'; el.style.borderColor='var(--accent2)'; el.style.background='var(--accent-dim)'; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color='var(--text2)'; el.style.borderColor='var(--border)'; el.style.background='var(--bg2)'; }}>
                      → {r.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!editMode && (
            <div style={{ maxWidth: 760, margin: '3.5rem auto 0' }}>
              <style>{`
                .nav-card {
                  display: flex;
                  flex-direction: column;
                  gap: 6px;
                  padding: 1rem 1.25rem;
                  border-radius: 10px;
                  text-decoration: none;
                  background: linear-gradient(135deg, #07070f 0%, #0a0a18 100%);
                  border: 1px solid rgba(59,130,246,0.1);
                  flex: 1;
                  max-width: 48%;
                  transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
                  position: relative;
                  overflow: hidden;
                }
                .nav-card::before {
                  content: '';
                  position: absolute;
                  inset: 0;
                  background: linear-gradient(135deg, rgba(59,130,246,0.06), transparent);
                  opacity: 0;
                  transition: opacity 0.2s;
                }
                .nav-card:hover {
                  border-color: rgba(59,130,246,0.35);
                  box-shadow: 0 4px 24px rgba(59,130,246,0.12), 0 0 0 1px rgba(59,130,246,0.08);
                  transform: translateY(-2px);
                }
                .nav-card:hover::before { opacity: 1; }
                .nav-card:hover .nav-title { color: #fff; }
                .nav-card:hover .nav-arrow { color: #60a5fa; transform: translateX(3px); }
                .nav-card-right { text-align: right; }
                .nav-card-right:hover .nav-arrow { transform: translateX(-3px); }
                .nav-label {
                  font-size: 0.58rem;
                  font-family: var(--font-mono);
                  text-transform: uppercase;
                  letter-spacing: 0.16em;
                  color: rgba(59,130,246,0.45);
                  display: flex;
                  align-items: center;
                  gap: 5px;
                }
                .nav-title {
                  font-size: 0.88rem;
                  color: rgba(255,255,255,0.65);
                  font-family: var(--font-display);
                  font-weight: 600;
                  line-height: 1.35;
                  transition: color 0.2s;
                }
                .nav-arrow {
                  font-size: 0.75rem;
                  color: rgba(59,130,246,0.35);
                  transition: all 0.2s;
                  display: inline-block;
                }
              `}</style>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                {prev ? (
                  <Link href={`/notes/${prev.slug}`} className="nav-card">
                    <span className="nav-label"><span className="nav-arrow" style={{ display: 'inline-block' }}>←</span> Previous</span>
                    <span className="nav-title">{prev.title}</span>
                  </Link>
                ) : <div style={{ flex: 1 }} />}
                {next ? (
                  <Link href={`/notes/${next.slug}`} className="nav-card nav-card-right" style={{ alignItems: 'flex-end' }}>
                    <span className="nav-label">Next <span className="nav-arrow" style={{ display: 'inline-block' }}>→</span></span>
                    <span className="nav-title">{next.title}</span>
                  </Link>
                ) : <div style={{ flex: 1 }} />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollbar TOC */}
      {!editMode && <ScrollbarTOC contentHtml={processedContent} />}


    </div>
  );
}
