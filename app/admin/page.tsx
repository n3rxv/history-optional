'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { allNotes as notes } from '@/lib/notes';
import { pyqs, type PYQ } from '@/lib/pyqData';

// ─── TYPES ───────────────────────────────────────────────────────────────────
type PostType = 'current-affairs' | 'new-note';
type Tab = 'notes' | 'posts' | 'analytics' | 'submissions' | 'notifications' | 'topper-copies' | 'settings';

interface Post {
  id: string; type: PostType; title: string; excerpt: string; content: string;
  tags: string[]; cover_image?: string; published_at: string; published: boolean;
}

// ─── API ─────────────────────────────────────────────────────────────────────
async function apiCall(url: string, method: string, body?: object, token?: string) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { 'x-admin-token': token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: #080808; }
      ::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: #d4a843; }

      /* ── SIDEBAR ITEMS ── */
      .sn {
        display: flex; align-items: center; gap: 9px;
        padding: 7px 10px; border-radius: 7px; cursor: pointer;
        font-size: 0.79rem; font-weight: 500; letter-spacing: 0.01em;
        color: #3a3a3a; font-family: 'Inter', sans-serif;
        transition: background 0.12s, color 0.12s, border-color 0.12s;
        border: 1px solid transparent; user-select: none;
      }
      .sn:hover { color: #777; background: rgba(0,0,0,0.025); }
      .sn.on {
        color: #e8c96a !important;
        background: rgba(212,168,67,0.09) !important;
        border-color: rgba(212,168,67,0.18) !important;
        box-shadow: inset 2px 0 0 #d4a843;
      }

      /* ── TOOLBAR BUTTONS ── */
      .tb {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 4px 8px; border-radius: 5px; cursor: pointer;
        font-size: 0.73rem; font-weight: 600;
        font-family: 'JetBrains Mono', monospace;
        color: #4a4a4a; background: #0f0f0f;
        border: 1px solid #1e1e1e;
        transition: all 0.08s ease;
        user-select: none; outline: none;
        position: relative; white-space: nowrap;
      }
      .tb:hover { color: #bbb; background: #181818; border-color: #2e2e2e; }
      .tb:active {
        color: #f0c96a !important;
        background: rgba(212,168,67,0.12) !important;
        border-color: rgba(212,168,67,0.4) !important;
        transform: scale(0.94);
        box-shadow: 0 0 0 3px rgba(212,168,67,0.08);
      }
      .tb.lit {
        color: #e8c96a;
        background: rgba(212,168,67,0.1);
        border-color: rgba(212,168,67,0.3);
        box-shadow: 0 0 8px rgba(212,168,67,0.15);
      }
      .tb.lit:hover { background: rgba(212,168,67,0.16); }
      .tb.lit:active { transform: scale(0.94); }
      .tb.danger { color: #f87171; background: rgba(248,113,113,0.07); border-color: rgba(248,113,113,0.2); }
      .tb.danger:hover { background: rgba(248,113,113,0.13); }
      .tb.danger:active { transform: scale(0.94); color: #fca5a5 !important; }

      /* ── NOTE LIST ITEMS ── */
      .ni {
        padding: 9px 14px 9px 16px; cursor: pointer;
        border-bottom: 1px solid #0d0d0d;
        border-left: 2px solid transparent;
        transition: background 0.1s, border-color 0.1s;
      }
      .ni:hover { background: rgba(0,0,0,0.02); }
      .ni.on {
        background: rgba(212,168,67,0.05) !important;
        border-left-color: #d4a843 !important;
      }

      /* ── EDITOR CONTENT STYLES (mirrors site) ── */
      .site-editor {
        font-family: 'Lora', Georgia, serif;
        font-size: 1.05rem;
        line-height: 1.85;
        color: #d8d0c0;
        caret-color: #d4a843;
      }
      .site-editor h1 {
        font-family: 'Lora', serif; font-size: 1.9rem; font-weight: 600;
        color: #f0e8d5; line-height: 1.25; margin: 1.6em 0 0.5em;
        border-bottom: 1px solid #2a2622; padding-bottom: 0.4em;
      }
      .site-editor h2 {
        font-family: 'Lora', serif; font-size: 1.4rem; font-weight: 600;
        color: #e8dcc8; line-height: 1.3; margin: 1.4em 0 0.4em;
      }
      .site-editor h3 {
        font-family: 'Lora', serif; font-size: 1.15rem; font-weight: 500;
        color: #d4a843; line-height: 1.35; margin: 1.2em 0 0.3em;
        letter-spacing: 0.01em;
      }
      .site-editor p { margin: 0 0 1em; }
      .site-editor strong { color: #f0e8d5; font-weight: 600; }
      .site-editor em { color: #c8b89a; font-style: italic; }
      .site-editor u { text-decoration-color: rgba(212,168,67,0.5); }
      .site-editor blockquote {
        border-left: 3px solid #d4a843; margin: 1.2em 0;
        padding: 0.6em 0 0.6em 1.2em;
        color: #a09070; font-style: italic;
        background: rgba(212,168,67,0.04);
        border-radius: 0 6px 6px 0;
      }
      .site-editor ul, .site-editor ol {
        padding-left: 1.5em; margin: 0.8em 0;
      }
      .site-editor li { margin-bottom: 0.35em; }
      .site-editor li::marker { color: #d4a843; }
      .site-editor a { color: #d4a843; text-decoration: underline; text-decoration-color: rgba(212,168,67,0.4); }
      .site-editor a:hover { text-decoration-color: #d4a843; }
      .site-editor img { max-width: 100%; border-radius: 8px; margin: 1em 0; display: block; }
      .site-editor code {
        font-family: 'JetBrains Mono', monospace; font-size: 0.85em;
        background: rgba(212,168,67,0.08); border: 1px solid rgba(212,168,67,0.15);
        padding: 1px 5px; border-radius: 3px; color: #e8c96a;
      }

      /* ── INPUTS ── */
      .inp {
        background: #0d0d0d; border: 1px solid #1e1e1e; border-radius: 7px;
        color: #ccc; font-size: 0.83rem; padding: 8px 11px;
        font-family: 'Inter', sans-serif; outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
        width: 100%;
      }
      .inp:focus { border-color: rgba(212,168,67,0.45); box-shadow: 0 0 0 3px rgba(212,168,67,0.07); }
      .inp::placeholder { color: #333; }

      /* ── ACTION BUTTONS ── */
      .btn-gold {
        padding: 7px 18px; border-radius: 7px; cursor: pointer;
        font-size: 0.8rem; font-weight: 600; font-family: 'Inter', sans-serif;
        background: rgba(212,168,67,0.12); border: 1px solid rgba(212,168,67,0.35);
        color: #e8c96a; transition: all 0.12s; outline: none;
      }
      .btn-gold:hover { background: rgba(212,168,67,0.2); border-color: rgba(212,168,67,0.55); }
      .btn-gold:active { transform: scale(0.97); }
      .btn-ghost {
        padding: 7px 14px; border-radius: 7px; cursor: pointer;
        font-size: 0.8rem; font-weight: 500; font-family: 'Inter', sans-serif;
        background: transparent; border: 1px solid #222; color: #555;
        transition: all 0.12s; outline: none;
      }
      .btn-ghost:hover { border-color: #333; color: #888; }
      .btn-ghost:active { transform: scale(0.97); }
      .btn-green {
        padding: 7px 16px; border-radius: 7px; cursor: pointer;
        font-size: 0.8rem; font-weight: 600; font-family: 'Inter', sans-serif;
        background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.3);
        color: #4ade80; transition: all 0.12s; outline: none;
      }
      .btn-green:hover { background: rgba(74,222,128,0.18); }
      .btn-green:active { transform: scale(0.97); }
      .btn-red {
        padding: 5px 11px; border-radius: 6px; cursor: pointer;
        font-size: 0.75rem; font-weight: 500; font-family: 'Inter', sans-serif;
        background: rgba(248,113,113,0.07); border: 1px solid rgba(248,113,113,0.2);
        color: #f87171; transition: all 0.12s; outline: none;
      }
      .btn-red:hover { background: rgba(248,113,113,0.14); }
      .btn-red:active { transform: scale(0.96); }

      /* ── SAVE INDICATOR ── */
      @keyframes savePulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      .saving-anim { animation: savePulse 1s infinite; }

      @keyframes fadeSlideIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
      .fsi { animation: fadeSlideIn 0.18s ease; }

      @keyframes dotPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }
      .live-dot { animation: dotPulse 2s ease infinite; }
    `}</style>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const SESSION_KEY = 'histopt_admin_v2';

function useAdminAuth() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) { setChecking(false); return; }
    fetch('/api/admin/verify-token', { headers: { 'x-admin-token': stored } })
      .then(r => { if (r.ok) { setAuthed(true); setToken(stored); } else { sessionStorage.removeItem(SESSION_KEY); } })
      .finally(() => setChecking(false));
  }, []);

  const login = async (pass: string) => {
    const result = await apiCall('/api/admin/verify-password', 'POST', { password: pass });
    if (result.ok) { sessionStorage.setItem(SESSION_KEY, result.token); setAuthed(true); setToken(result.token); return true; }
    return false;
  };
  const logout = () => {
    // Revoke server-side too; clearing sessionStorage alone left the token
    // usable for the rest of its eight hours.
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      fetch('/api/admin/logout', { method: 'POST', headers: { 'x-admin-token': stored } })
        .catch(() => {});
    }
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setToken('');
  };
  return { authed, checking, login, logout, token };
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (p: string) => Promise<boolean> }) {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const ok = await onLogin(pass);
    if (!ok) { setErr(true); setTimeout(() => setErr(false), 1500); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid #1e1e1e', borderRadius: 14, padding: '2.8rem 2.5rem', width: 360, textAlign: 'center', boxShadow: '0 0 60px rgba(212,168,67,0.04)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 20 }}>⚡</div>
        <h2 style={{ color: '#f0e8d5', fontFamily: 'Lora, serif', fontSize: '1.5rem', fontWeight: 500, marginBottom: 4 }}>Admin Panel</h2>
        <p style={{ color: 'var(--border2)', fontSize: '0.76rem', marginBottom: 28, fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>History Optional</p>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Password" className="inp"
          style={{ marginBottom: 12, border: err ? '1px solid rgba(248,113,113,0.5)' : undefined }} />
        <button onClick={submit} disabled={loading}
          style={{ width: '100%', padding: '0.72rem', borderRadius: 8, background: '#d4a843', border: 'none', color: '#000', fontSize: '0.88rem', fontWeight: 700, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'Inter, sans-serif', letterSpacing: '0.03em' }}>
          {loading ? 'Verifying...' : 'Enter →'}
        </button>
        {err && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: 10, fontFamily: 'Inter, sans-serif' }}>Wrong password</p>}
      </div>
    </div>
  );
}

// ─── TOOLBAR ──────────────────────────────────────────────────────────────────
function EditorToolbar({ editorRef, onImageInsert, onVideoInsert }: {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onImageInsert: () => void;
  onVideoInsert: () => void;
}) {
  const [active, setActive] = useState<Record<string, boolean>>({});

  const cmd = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    // Update active states
    setTimeout(() => {
      setActive({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      });
    }, 10);
  };

  // Track cursor position to update active states
  const updateActive = () => {
    setActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    });
  };

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.addEventListener('keyup', updateActive);
    el.addEventListener('mouseup', updateActive);
    el.addEventListener('selectionchange', updateActive);
    return () => {
      el.removeEventListener('keyup', updateActive);
      el.removeEventListener('mouseup', updateActive);
      el.removeEventListener('selectionchange', updateActive);
    };
  }, [editorRef.current]);

  const sep = () => <div style={{ width: 1, height: 16, background: 'var(--bg4)', margin: '0 3px', flexShrink: 0 }} />;

  const T = ({ label, title, action, k, isAccent }: { label: string; title: string; action: () => void; k?: string; isAccent?: boolean }) => (
    <button className={`tb ${active[k || ''] ? 'lit' : ''} ${isAccent ? 'lit' : ''}`} onClick={action} title={title}>{label}</button>
  );

  return (
    <div style={{ padding: '5px 12px', borderBottom: '1px solid #111', display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg)', minHeight: 38 }}
      onMouseDown={e => e.preventDefault()}>
      <T label="B" title="Bold (⌘B)" action={() => cmd('bold')} k="bold" />
      <T label="I" title="Italic (⌘I)" action={() => cmd('italic')} k="italic" />
      <T label="U" title="Underline (⌘U)" action={() => cmd('underline')} k="underline" />
      <T label="S" title="Strikethrough" action={() => cmd('strikeThrough')} k="strikeThrough" />
      {sep()}
      <T label="H1" title="Heading 1" action={() => cmd('formatBlock', 'h1')} />
      <T label="H2" title="Heading 2" action={() => cmd('formatBlock', 'h2')} />
      <T label="H3" title="Heading 3" action={() => cmd('formatBlock', 'h3')} />
      <T label="¶" title="Paragraph" action={() => cmd('formatBlock', 'p')} />
      {sep()}
      <T label="• List" title="Bullet list" action={() => cmd('insertUnorderedList')} k="insertUnorderedList" />
      <T label="1. List" title="Ordered list" action={() => cmd('insertOrderedList')} k="insertOrderedList" />
      <T label='" Quote' title="Blockquote" action={() => { cmd('formatBlock', 'blockquote'); }} />
      {sep()}
      <T label="A↓" title="Text color" action={() => { const c = prompt('Hex color (e.g. #e63946):'); if (c) cmd('foreColor', c); }} />
      <T label="HL" title="Highlight" action={() => { const c = prompt('Highlight color:') || '#2a2010'; cmd('hiliteColor', c); }} />
      <button className="tb" onClick={() => { const url = prompt('URL:'); if (url) cmd('createLink', url); }} title="Insert link">🔗</button>
      {sep()}
      <T label="↩" title="Undo (⌘Z)" action={() => cmd('undo')} />
      <T label="↪" title="Redo (⌘Y)" action={() => cmd('redo')} />
      <T label="✕ fmt" title="Clear formatting" action={() => cmd('removeFormat')} />
      {sep()}
      <button className="tb lit" onClick={onImageInsert} title="Insert image">🖼 Img</button>
      <button className="tb lit" onClick={onVideoInsert} title="Insert video">▶ Video</button>
    </div>
  );
}

// ─── NOTE EDITOR ──────────────────────────────────────────────────────────────
function NoteEditor({ token }: { token: string }) {
  const [selectedSlug, setSelectedSlug] = useState(notes[0]?.slug || '');
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [originalContent, setOriginalContent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'wysiwyg' | 'html'>('wysiwyg');
  const [htmlValue, setHtmlValue] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/admin/note-content', { headers: { 'x-admin-token': token } })
      .then(r => r.json())
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((row: { slug: string; content: string }) => { map[row.slug] = row.content; });
          setOverrides(map);
        }
      });
  }, [token]);

  useEffect(() => {
    if (!originalContent[selectedSlug]) {
      import('@/lib/noteContent').then(mod => {
        const content = (mod.noteContent as Record<string, string>)[selectedSlug] || '';
        setOriginalContent(prev => ({ ...prev, [selectedSlug]: content }));
      });
    }
  }, [selectedSlug]);

  const currentContent = useCallback(() =>
    overrides[selectedSlug] ?? originalContent[selectedSlug] ?? '',
  [overrides, selectedSlug, originalContent]);

  useEffect(() => {
    const content = currentContent();
    if (mode === 'wysiwyg' && editorRef.current) editorRef.current.innerHTML = content;
    else if (mode === 'html') setHtmlValue(content);
  }, [selectedSlug, mode, originalContent]);

  const saveToSupabase = async (html: string) => {
    setSaveStatus('saving');
    const res = await apiCall('/api/admin/note-content', 'POST', { slug: selectedSlug, content: html }, token);
    if (res.ok) {
      setOverrides(prev => ({ ...prev, [selectedSlug]: html }));
      setSaveStatus('saved');
    } else {
      setSaveStatus('error');
    }
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const scheduleAutoSave = (html: string) => {
    setSaveStatus('idle');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveToSupabase(html), 1500);
  };

  const onEditorInput = () => {
    if (!editorRef.current) return;
    scheduleAutoSave(editorRef.current.innerHTML);
  };

  const onHtmlChange = (val: string) => { setHtmlValue(val); scheduleAutoSave(val); };
  const switchToWysiwyg = () => { setMode('wysiwyg'); setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = htmlValue; }, 0); };
  const switchToHtml = () => { const html = editorRef.current?.innerHTML || currentContent(); setHtmlValue(html); setMode('html'); };

  const resetToOriginal = async () => {
    if (!confirm('Reset to original content? This will delete your cloud edits.')) return;
    await apiCall('/api/admin/note-content', 'DELETE', { slug: selectedSlug }, token);
    const updated = { ...overrides };
    delete updated[selectedSlug];
    setOverrides(updated);
    const orig = originalContent[selectedSlug] || '';
    if (mode === 'wysiwyg' && editorRef.current) editorRef.current.innerHTML = orig;
    else setHtmlValue(orig);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleImageInsert = () => imgInputRef.current?.click();
  const onImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if ((reader.result as string).length > 500_000) { alert('Image too large! Use under 500KB.'); return; }
      document.execCommand('insertHTML', false, `<img src="${reader.result}" style="max-width:100%;border-radius:8px;margin:12px 0;display:block;" />`);
      editorRef.current?.focus();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVideoInsert = () => {
    const url = prompt('YouTube URL or embed URL:'); if (!url) return;
    let embedUrl = url;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    document.execCommand('insertHTML', false,
      `<div style="position:relative;padding-bottom:56.25%;height:0;margin:16px 0;border-radius:10px;overflow:hidden;">
         <iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe>
       </div>`);
    editorRef.current?.focus();
  };

  // Group notes by section
  const sections = [...new Set(notes.map(n => n.section))].filter(Boolean);
  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.section?.toLowerCase().includes(search.toLowerCase())
  );

  const hasOverride = !!overrides[selectedSlug];
  const selectedNote = notes.find(n => n.slug === selectedSlug);

  const saveStatusEl = () => {
    if (saveStatus === 'saving') return <span className="saving-anim" style={{ color: '#d4a843', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace' }}>↑ saving…</span>;
    if (saveStatus === 'saved') return <span style={{ color: '#4ade80', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace' }}>✓ saved</span>;
    if (saveStatus === 'error') return <span style={{ color: '#f87171', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace' }}>⚠ failed</span>;
    return <span style={{ color: 'var(--border)', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace' }}>auto-saves</span>;
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', overflow: 'hidden' }}>
      <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageFile} />

      {/* ── NOTES SIDEBAR ── */}
      <div style={{ width: 255, flexShrink: 0, borderRight: '1px solid #141414', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
        {/* Search */}
        <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid #111' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--border)', fontSize: '0.75rem', pointerEvents: 'none' }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..."
              className="inp" style={{ paddingLeft: 26, fontSize: '0.78rem' }} />
          </div>
        </div>

        {/* Note list grouped by section */}
        <div style={{ overflow: 'auto', flex: 1 }}>
          {sections.map(section => {
            const sectionNotes = filteredNotes.filter(n => n.section === section);
            if (sectionNotes.length === 0) return null;
            return (
              <div key={section}>
                <div style={{ padding: '10px 14px 4px', color: 'var(--bg4)', fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.12em', userSelect: 'none' }}>
                  {section}
                </div>
                {sectionNotes.map(n => (
                  <div key={n.slug} onClick={() => setSelectedSlug(n.slug)}
                    className={`ni fsi ${selectedSlug === n.slug ? 'on' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: selectedSlug === n.slug ? '#e8c96a' : 'var(--border2)', fontSize: '0.8rem', flex: 1, fontFamily: 'Inter, sans-serif', fontWeight: selectedSlug === n.slug ? 500 : 400, lineHeight: 1.3 }}>
                        {n.title}
                      </span>
                      {overrides[n.slug] && (
                        <div title="Cloud edit saved" style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', flexShrink: 0, boxShadow: '0 0 4px rgba(74,222,128,0.5)' }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 14px', borderTop: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--bg4)', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace' }}>
            ☁ {Object.keys(overrides).length} edits
          </span>
          <span style={{ color: 'var(--bg4)', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace' }}>
            {filteredNotes.length} notes
          </span>
        </div>
      </div>

      {/* ── EDITOR AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

        {/* Topbar */}
        <div style={{ padding: '0 14px', height: 44, borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', flexShrink: 0 }}>
          {/* Note title + cloud badge */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--text3)', fontSize: '0.82rem', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedNote?.title || '—'}
            </span>
            {hasOverride && (
              <span style={{ padding: '1px 7px', borderRadius: 10, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
                ☁ cloud
              </span>
            )}
          </div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #1e1e1e', flexShrink: 0 }}>
            <button onClick={switchToWysiwyg}
              style={{ padding: '4px 12px', cursor: 'pointer', fontSize: '0.75rem', background: mode === 'wysiwyg' ? 'var(--bg3)' : 'transparent', color: mode === 'wysiwyg' ? '#e8c96a' : '#383838', border: 'none', fontFamily: 'Inter, sans-serif', fontWeight: 500, outline: 'none', transition: 'all 0.1s' }}>
              ✍ Edit
            </button>
            <button onClick={switchToHtml}
              style={{ padding: '4px 12px', cursor: 'pointer', fontSize: '0.75rem', background: mode === 'html' ? 'var(--bg3)' : 'transparent', color: mode === 'html' ? '#e8c96a' : '#383838', border: 'none', borderLeft: '1px solid #1e1e1e', fontFamily: 'JetBrains Mono, monospace', outline: 'none', transition: 'all 0.1s' }}>
              {'</>'}
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            {hasOverride && (
              <button onClick={resetToOriginal} className="btn-red" style={{ padding: '4px 10px', fontSize: '0.72rem' }}>
                Reset
              </button>
            )}
            {saveStatusEl()}
          </div>
        </div>

        {/* Toolbar (wysiwyg only) */}
        {mode === 'wysiwyg' && (
          <EditorToolbar editorRef={editorRef} onImageInsert={handleImageInsert} onVideoInsert={handleVideoInsert} />
        )}

        {/* WYSIWYG Editor — styled like the actual site */}
        {mode === 'wysiwyg' && (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={onEditorInput}
            className="site-editor"
            style={{
              flex: 1, overflow: 'auto',
              padding: '40px 60px 80px',
              outline: 'none',
              background: 'var(--bg)',
            }}
          />
        )}

        {/* HTML mode */}
        {mode === 'html' && (
          <textarea
            value={htmlValue}
            onChange={e => onHtmlChange(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1, padding: '20px 24px',
              background: 'var(--bg)', color: '#7dd3b0',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', lineHeight: 1.7,
              border: 'none', outline: 'none', resize: 'none',
            }}
          />
        )}

        {/* Status bar */}
        <div style={{ height: 24, padding: '0 14px', borderTop: '1px solid #0d0d0d', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ color: 'var(--bg4)', fontSize: '0.63rem', fontFamily: 'JetBrains Mono, monospace' }}>
            ☁ supabase · auto-persisted
          </span>
          <span style={{ color: 'var(--bg4)', fontSize: '0.63rem', fontFamily: 'JetBrains Mono, monospace' }}>
            {selectedNote?.section}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── POSTS MANAGER ────────────────────────────────────────────────────────────
function PostsManager({ token }: { token: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/blog-posts?all=true', { headers: { 'x-admin-token': token } })
      .then(r => r.json()).then(({ data }) => { if (data) setPosts(data); });
  }, [token]);

  const newPost = (type: PostType): Post => ({
    id: Date.now().toString(), type, title: '', excerpt: '',
    content: '<p>Start writing here...</p>', tags: [],
    published_at: new Date().toISOString(), published: false,
  });

  const openEdit = (post: Post) => {
    setEditing({ ...post }); setMode('edit');
    setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = post.content; }, 50);
  };

  const savePost = async () => {
    if (!editing) return;
    const content = editorRef.current?.innerHTML || editing.content;
    const updated = { ...editing, content };
    setSaving(true);
    const res = await apiCall('/api/admin/blog-posts', 'POST', updated, token);
    setSaving(false);
    if (res.ok) {
      const existing = posts.find(p => p.id === updated.id);
      setPosts(existing ? posts.map(p => p.id === updated.id ? updated : p) : [updated, ...posts]);
      setEditing(updated); setSavedMsg('✓ Saved'); setTimeout(() => setSavedMsg(''), 2000);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await apiCall('/api/admin/blog-posts', 'DELETE', { id }, token);
    setPosts(posts.filter(p => p.id !== id));
    if (editing?.id === id) { setEditing(null); setMode('list'); }
  };

  const togglePublish = async (id: string) => {
    const post = posts.find(p => p.id === id)!;
    const updated = { ...post, published: !post.published };
    await apiCall('/api/admin/blog-posts', 'POST', updated, token);
    setPosts(posts.map(p => p.id === id ? updated : p));
  };

  const handleImageInsert = () => imgInputRef.current?.click();
  const onImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { document.execCommand('insertHTML', false, `<img src="${reader.result}" style="max-width:100%;border-radius:8px;margin:12px 0;display:block;" />`); editorRef.current?.focus(); };
    reader.readAsDataURL(file); e.target.value = '';
  };
  const handleVideoInsert = () => {
    const url = prompt('YouTube URL:'); if (!url) return;
    let embedUrl = url;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    document.execCommand('insertHTML', false, `<div style="position:relative;padding-bottom:56.25%;height:0;margin:16px 0;border-radius:10px;overflow:hidden;"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe></div>`);
    editorRef.current?.focus();
  };
  const onCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !editing) return;
    const reader = new FileReader();
    reader.onload = () => setEditing(prev => prev ? { ...prev, cover_image: reader.result as string } : prev);
    reader.readAsDataURL(file); e.target.value = '';
  };

  if (mode === 'list') {
    const caPost = posts.filter(p => p.type === 'current-affairs');
    const nnPost = posts.filter(p => p.type === 'new-note');
    const PostCard = ({ p }: { p: Post }) => (
      <div className="fsi" style={{ background: 'var(--bg2)', border: '1px solid #141414', borderRadius: 8, padding: '11px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 0.1s' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--bg4)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bg3)')}>
        {p.cover_image && <img src={p.cover_image} alt="" style={{ width: 52, height: 38, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'var(--text2)', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Inter, sans-serif' }}>
            {p.title || <span style={{ color: 'var(--border2)' }}>Untitled</span>}
          </div>
          <div style={{ color: 'var(--border)', fontSize: '0.68rem', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
            {new Date(p.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', background: p.published ? 'rgba(74,222,128,0.08)' : 'rgba(0,0,0,0.03)', color: p.published ? '#4ade80' : '#444', border: p.published ? '1px solid rgba(74,222,128,0.2)' : '1px solid #1e1e1e', flexShrink: 0 }}>
          {p.published ? 'LIVE' : 'draft'}
        </span>
        <button onClick={() => togglePublish(p.id)} className="btn-ghost" style={{ padding: '3px 9px', fontSize: '0.72rem' }}>{p.published ? 'Unpublish' : 'Publish'}</button>
        <button onClick={() => openEdit(p)} className="btn-gold" style={{ padding: '3px 10px', fontSize: '0.75rem' }}>Edit</button>
        <button onClick={() => deletePost(p.id)} className="btn-red" style={{ padding: '3px 8px', fontSize: '0.72rem' }}>✕</button>
      </div>
    );

    return (
      <div style={{ padding: '24px 28px', maxWidth: 860 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button onClick={() => openEdit(newPost('current-affairs'))} className="btn-gold">+ Current Affairs</button>
          <button onClick={() => openEdit(newPost('new-note'))} className="btn-ghost" style={{ color: '#4ecdc4', borderColor: 'rgba(78,205,196,0.3)' }}>+ Article</button>
        </div>
        <div style={{ color: '#d4a843', fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Current Affairs ({caPost.length})</div>
        {caPost.length === 0 ? <div style={{ color: 'var(--bg4)', fontSize: '0.82rem', marginBottom: 20, fontFamily: 'Inter, sans-serif' }}>No posts yet.</div> : caPost.map(p => <PostCard key={p.id} p={p} />)}
        <div style={{ color: '#4ecdc4', fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '20px 0 10px' }}>Articles ({nnPost.length})</div>
        {nnPost.length === 0 ? <div style={{ color: 'var(--bg4)', fontSize: '0.82rem', fontFamily: 'Inter, sans-serif' }}>No articles yet.</div> : nnPost.map(p => <PostCard key={p.id} p={p} />)}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>
      <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageFile} />
      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onCoverFile} />
      <div style={{ padding: '0 14px', height: 44, borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', flexShrink: 0 }}>
        <button onClick={() => { savePost(); setMode('list'); }} className="btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>← Back</button>
        <span style={{ padding: '2px 9px', borderRadius: 10, fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(212,168,67,0.07)', border: '1px solid rgba(212,168,67,0.18)', color: '#d4a843' }}>
          {editing?.type === 'current-affairs' ? 'CURRENT AFFAIRS' : 'ARTICLE'}
        </span>
        <div style={{ flex: 1 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <span style={{ color: 'var(--border2)', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>Published</span>
          <input type="checkbox" checked={editing?.published || false}
            onChange={e => setEditing(prev => prev ? { ...prev, published: e.target.checked } : prev)}
            style={{ accentColor: '#4ade80' }} />
        </label>
        <button onClick={savePost} disabled={saving} className={savedMsg ? 'btn-green' : 'btn-gold'} style={{ minWidth: 70 }}>
          {saving ? 'Saving…' : savedMsg || 'Save'}
        </button>
      </div>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #0d0d0d', background: 'var(--bg)', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start', flexShrink: 0 }}>
        <div style={{ flex: 2, minWidth: 220 }}>
          <input value={editing?.title || ''} onChange={e => setEditing(prev => prev ? { ...prev, title: e.target.value } : prev)}
            placeholder="Post title..."
            style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #1e1e1e', color: '#e0d8c8', fontSize: '1.15rem', fontFamily: 'Lora, serif', fontWeight: 500, padding: '6px 0', outline: 'none' }} />
          <input value={editing?.excerpt || ''} onChange={e => setEditing(prev => prev ? { ...prev, excerpt: e.target.value } : prev)}
            placeholder="Short excerpt..."
            style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #111', color: 'var(--text3)', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', padding: '6px 0', outline: 'none', marginTop: 8 }} />
          <input value={editing?.tags.join(', ') || ''} onChange={e => setEditing(prev => prev ? { ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } : prev)}
            placeholder="Tags: Mughal, British Raj..."
            style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #0d0d0d', color: 'var(--text3)', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', padding: '6px 0', outline: 'none', marginTop: 6 }} />
        </div>
        <div onClick={() => coverInputRef.current?.click()}
          style={{ width: 110, height: 75, borderRadius: 7, border: '1px dashed #1e1e1e', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg2)', flexShrink: 0 }}>
          {editing?.cover_image
            ? <img src={editing.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ color: 'var(--border)', fontSize: '0.68rem', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>+ cover</span>}
        </div>
      </div>
      <EditorToolbar editorRef={editorRef} onImageInsert={handleImageInsert} onVideoInsert={handleVideoInsert} />
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        className="site-editor"
        style={{ flex: 1, padding: '36px 52px 80px', overflow: 'auto', outline: 'none', background: 'var(--bg)' }} />
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function Analytics({ token }: { token: string }) {
  const [overrideCount, setOverrideCount] = useState(0);
  const [postStats, setPostStats] = useState({ total: 0, published: 0 });
  const totalNotes = notes.length;
  const sections = [...new Set(notes.map(n => n.section))];

  useEffect(() => {
    fetch('/api/admin/note-content', { headers: { 'x-admin-token': token } }).then(r => r.json()).then(({ data }) => setOverrideCount(data?.length || 0));
    fetch('/api/admin/blog-posts?all=true', { headers: { 'x-admin-token': token } }).then(r => r.json()).then(({ data }) => {
      if (data) setPostStats({ total: data.length, published: data.filter((p: Post) => p.published).length });
    });
  }, [token]);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 780 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10, marginBottom: 24 }}>
        {[
          { v: totalNotes, l: 'Total Notes' },
          { v: notes.filter(n => n.paper === 1).length, l: 'Paper I' },
          { v: notes.filter(n => n.paper === 2).length, l: 'Paper II' },
          { v: sections.length, l: 'Sections' },
          { v: overrideCount, l: 'Cloud Edits' },
          { v: `${postStats.published}/${postStats.total}`, l: 'Posts Live' },
        ].map(({ v, l }) => (
          <div key={l} style={{ background: 'var(--bg2)', border: '1px solid #141414', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ color: '#d4a843', fontSize: '1.8rem', fontWeight: 600, fontFamily: 'Lora, serif', lineHeight: 1 }}>{v}</div>
            <div style={{ color: 'var(--text3)', fontSize: '0.75rem', marginTop: 8, fontFamily: 'Inter, sans-serif' }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--bg2)', border: '1px solid #141414', borderRadius: 10, padding: '18px 20px' }}>
        <div style={{ color: 'var(--bg4)', fontSize: '0.63rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16, fontFamily: 'JetBrains Mono, monospace' }}>Notes by Section</div>
        {sections.map(s => {
          const count = notes.filter(n => n.section === s).length;
          const pct = Math.round((count / totalNotes) * 100);
          return (
            <div key={s} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ color: 'var(--text3)', fontSize: '0.78rem', fontFamily: 'Inter, sans-serif' }}>{s}</span>
                <span style={{ color: 'var(--border2)', fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace' }}>{count}</span>
              </div>
              <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #d4a843, rgba(212,168,67,0.2))', borderRadius: 2 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings({ onLogout, token }: { onLogout: () => void; token: string }) {
  const [msg, setMsg] = useState('');

  const exportOverrides = async () => {
    const res = await fetch('/api/admin/note-content', { headers: { 'x-admin-token': token } });
    const { data } = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'note_overrides_backup.json' }).click();
  };

  const exportPosts = async () => {
    const res = await fetch('/api/admin/blog-posts?all=true', { headers: { 'x-admin-token': token } });
    const { data } = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'posts_backup.json' }).click();
  };

  const Row = ({ label, desc, action, btnLabel, danger }: { label: string; desc: string; action: () => void; btnLabel: string; danger?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #0d0d0d' }}>
      <div>
        <div style={{ color: 'var(--text3)', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>{label}</div>
        <div style={{ color: 'var(--border)', fontSize: '0.72rem', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>{desc}</div>
      </div>
      <button onClick={action} className={danger ? 'btn-red' : 'btn-gold'} style={{ marginLeft: 16 }}>{btnLabel}</button>
    </div>
  );

  return (
    <div style={{ padding: '24px 28px', maxWidth: 560 }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid #141414', borderRadius: 10, padding: '0 18px', marginBottom: 14 }}>
        <Row label="Export note overrides" desc="Download all cloud edits as JSON" btnLabel="Export" action={exportOverrides} />
        <Row label="Export posts" desc="Backup all articles & current affairs" btnLabel="Export" action={exportPosts} />
        <Row label="Sign out" desc="End admin session" btnLabel="Logout" action={onLogout} danger />
      </div>
      <div style={{ background: 'var(--bg2)', border: '1px solid #141414', borderRadius: 10, padding: '14px 18px' }}>
        {[['☁', 'Supabase · Mumbai'], ['🔐', 'HMAC server-side auth'], ['👥', 'Google OAuth (students)']].map(([icon, val]) => (
          <div key={val} style={{ color: 'var(--bg4)', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', marginBottom: 5 }}>{icon} {val}</div>
        ))}
      </div>
      {msg && <p style={{ color: '#4ade80', fontSize: '0.78rem', marginTop: 12, fontFamily: 'JetBrains Mono, monospace' }}>{msg}</p>}
    </div>
  );
}

// ─── SUBMISSIONS ──────────────────────────────────────────────────────────────
function Submissions({ token }: { token: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'contact' | 'bug'>('all');

  useEffect(() => {
    fetch('/api/admin/submissions', { headers: { 'x-admin-token': token } })
      .then(r => r.json()).then(({ data }) => { setRows(data || []); setLoading(false); });
  }, [token]);

  const deleteRow = async (id: string) => {
    if (!confirm('Delete?')) return;
    await fetch('/api/admin/submissions', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ id }) });
    setRows(r => r.filter(x => x.id !== id));
  };

  const visible = rows.filter(r => filter === 'all' || r.type === filter);
  if (loading) return <div style={{ padding: 32, color: 'var(--border2)', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ color: 'var(--text3)', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace' }}>{rows.length} total</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'contact', 'bug'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={f === filter ? 'btn-gold' : 'btn-ghost'}
              style={{ padding: '4px 12px', fontSize: '0.75rem' }}>
              {f === 'all' ? 'All' : f === 'contact' ? '✉ Contact' : '🐛 Bug'}
            </button>
          ))}
        </div>
      </div>
      {visible.length === 0
        ? <div style={{ color: 'var(--bg4)', fontSize: '0.85rem', padding: '32px 0', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>No submissions.</div>
        : visible.map(row => (
          <div key={row.id} className="fsi" style={{ background: 'var(--bg2)', border: '1px solid #141414', borderRadius: 9, padding: '13px 16px', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.63rem', fontFamily: 'JetBrains Mono, monospace', background: row.type === 'bug' ? 'rgba(248,113,113,0.07)' : 'rgba(212,168,67,0.07)', border: row.type === 'bug' ? '1px solid rgba(248,113,113,0.2)' : '1px solid rgba(212,168,67,0.2)', color: row.type === 'bug' ? '#f87171' : '#d4a843' }}>
                {row.type === 'bug' ? 'BUG' : 'CONTACT'}
              </span>
              {row.name && <span style={{ color: 'var(--text2)', fontSize: '0.85rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>{row.name}</span>}
              {row.email && <span style={{ color: 'var(--text3)', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>{row.email}</span>}
              <span style={{ marginLeft: 'auto', color: 'var(--bg4)', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace' }}>
                {new Date(row.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
              <button onClick={() => deleteRow(row.id)} className="btn-red" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>✕</button>
            </div>
            <p style={{ color: 'var(--text3)', fontSize: '0.83rem', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'Inter, sans-serif' }}>{row.message}</p>
          </div>
        ))}
    </div>
  );
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function NotificationsManager({ token }: { token: string }) {
  const [notifications, setNotifications] = useState<{id:string;title:string;link:string;type:string;created_at:string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', link: '', type: 'announcement' });
  const [msg, setMsg] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', link: '', type: 'announcement' });
  const [editSaving, setEditSaving] = useState(false);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/notifications-admin', { headers: { 'x-admin-token': token } });
    const { data } = await res.json();
    setNotifications(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.title.trim() || !form.link.trim()) { flash('Title and link required'); return; }
    setSaving(true);
    const res = await fetch('/api/notifications-admin', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify(form) });
    const data = await res.json(); setSaving(false);
    if (data.ok) { setForm({ title: '', link: '', type: 'announcement' }); flash('✓ Added'); load(); } else flash('⚠ Failed');
  };

  const remove = async (id: string) => {
    if (!confirm('Delete?')) return;
    await fetch('/api/notifications-admin', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ id }) });
    setNotifications(n => n.filter(x => x.id !== id));
  };

  const startEdit = (n: {id:string;title:string;link:string;type:string;created_at:string}) => { setEditingId(n.id); setEditForm({ title: n.title, link: n.link, type: n.type }); };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = async (id: string) => {
    if (!editForm.title.trim() || !editForm.link.trim()) { flash('Title and link required'); return; }
    setEditSaving(true);
    const res = await fetch('/api/notifications-admin', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ id, ...editForm }) });
    const data = await res.json(); setEditSaving(false);
    if (data.ok) { setNotifications(ns => ns.map(n => n.id === id ? { ...n, ...editForm } : n)); setEditingId(null); flash('✓ Updated'); } else flash('⚠ Failed');
  };

  const typeColor = (t: string) => t === 'note' ? '#4ecdc4' : t === 'current_affairs' ? '#818cf8' : '#d4a843';

  const SelectType = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select value={value} onChange={e => onChange(e.target.value)} className="inp" style={{ width: 'auto', cursor: 'pointer' }}>
      <option value="announcement">📢 Ann</option>
      <option value="note">📄 Note</option>
      <option value="current_affairs">📰 CA</option>
    </select>
  );

  return (
    <div style={{ padding: '24px 28px', maxWidth: 680 }}>
      {/* Add form */}
      <div style={{ background: 'var(--bg2)', border: '1px solid #141414', borderRadius: 10, padding: '16px 18px', marginBottom: 22 }}>
        <div style={{ color: 'var(--bg4)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>New Notification</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title — e.g. Bhakti Movement notes added" className="inp" />
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
              placeholder="/notes/bhakti-movement" className="inp" style={{ flex: 1 }} />
            <SelectType value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={add} disabled={saving} className="btn-gold">{saving ? 'Adding…' : '+ Add'}</button>
            {msg && <span style={{ fontSize: '0.75rem', color: msg.startsWith('✓') ? '#4ade80' : '#f87171', fontFamily: 'JetBrains Mono, monospace' }}>{msg}</span>}
          </div>
        </div>
      </div>

      {/* List */}
      {loading
        ? <div style={{ color: 'var(--border2)', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>Loading...</div>
        : notifications.length === 0
          ? <div style={{ color: 'var(--bg4)', textAlign: 'center', padding: '32px 0', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>No notifications yet.</div>
          : (
            <div>
              <div style={{ color: 'var(--bg4)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, fontFamily: 'JetBrains Mono, monospace' }}>{notifications.length} notifications</div>
              {notifications.map(n => editingId === n.id ? (
                <div key={n.id} className="fsi" style={{ background: 'var(--bg2)', border: '1px solid #222', borderRadius: 9, padding: '12px 14px', marginBottom: 7 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="inp" autoFocus />
                    <div style={{ display: 'flex', gap: 7 }}>
                      <input value={editForm.link} onChange={e => setEditForm(f => ({ ...f, link: e.target.value }))} className="inp" style={{ flex: 1 }} />
                      <SelectType value={editForm.type} onChange={v => setEditForm(f => ({ ...f, type: v }))} />
                    </div>
                    <div style={{ display: 'flex', gap: 7 }}>
                      <button onClick={() => saveEdit(n.id)} disabled={editSaving} className="btn-green">{editSaving ? 'Saving…' : '✓ Save'}</button>
                      <button onClick={cancelEdit} className="btn-ghost">Cancel</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={n.id} className="fsi" style={{ background: 'var(--bg2)', border: '1px solid #141414', borderRadius: 9, padding: '11px 14px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 10 }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--bg4)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bg3)')}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: typeColor(n.type), flexShrink: 0, boxShadow: `0 0 5px ${typeColor(n.type)}44` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#c0b8a8', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Inter, sans-serif' }}>{n.title}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 2, alignItems: 'center' }}>
                      <span style={{ color: 'var(--bg4)', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace' }}>{n.link}</span>
                      <span style={{ color: 'var(--bg4)', fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace', marginLeft: 'auto' }}>
                        {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => startEdit(n)} className="btn-ghost" style={{ padding: '3px 9px', fontSize: '0.72rem', color: '#818cf8', borderColor: 'rgba(129,140,248,0.2)' }}>✎</button>
                  <button onClick={() => remove(n.id)} className="btn-red" style={{ padding: '3px 8px', fontSize: '0.72rem' }}>✕</button>
                </div>
              ))}
            </div>
          )}
    </div>
  );
}


// ─── TOPPER COPIES ────────────────────────────────────────────────────────────
interface TopperCopy {
  id: string;
  question: string;
  drive_file_id: string;
  note: string | null;
  created_at: string;
  pyq_ids: number[];
}

const tcInp: React.CSSProperties = {
  width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a',
  borderRadius: 6, padding: '7px 10px', color: '#c0b8a8',
  fontFamily: 'Inter, sans-serif', fontSize: '0.83rem', outline: 'none',
};

function tcFilteredPyqs(search: string) {
  if (!search.trim()) return [];
  const s = search.toLowerCase();
  return pyqs.filter((q: PYQ) =>
    q.question.toLowerCase().includes(s) || q.topic.toLowerCase().includes(s)
  ).slice(0, 8);
}

function PYQPicker({
  selectedIds, onToggle, search, onSearch,
}: {
  selectedIds: number[];
  onToggle: (pid: number) => void;
  search: string;
  onSearch: (v: string) => void;
}) {
  const results = tcFilteredPyqs(search);
  const selectedPyqs = pyqs.filter((q: PYQ) => selectedIds.includes(q.id));
  return (
    <div>
      {selectedIds.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {selectedPyqs.map((q: PYQ) => (
            <span key={q.id} style={{
              background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.25)',
              borderRadius: 4, padding: '2px 8px', fontSize: '0.7rem',
              color: '#d4a843', fontFamily: 'JetBrains Mono, monospace',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }} onClick={() => onToggle(q.id)}>
              #{q.id} {q.question.slice(0, 40)}… ×
            </span>
          ))}
        </div>
      )}
      <input
        value={search}
        onChange={e => onSearch(e.target.value)}
        placeholder="Search PYQs to map (topic or keyword)…"
        style={tcInp}
      />
      {results.length > 0 && (
        <div style={{
          background: '#0a0a0a', border: '1px solid #1a1a1a',
          borderRadius: 6, marginTop: 4, maxHeight: 200, overflowY: 'auto',
        }}>
          {results.map((q: PYQ) => (
            <div
              key={q.id}
              onClick={() => onToggle(q.id)}
              style={{
                padding: '8px 10px', cursor: 'pointer', fontSize: '0.78rem',
                color: selectedIds.includes(q.id) ? '#d4a843' : '#888',
                background: selectedIds.includes(q.id) ? 'rgba(212,168,67,0.06)' : 'transparent',
                borderBottom: '1px solid #111',
                display: 'flex', gap: 8, alignItems: 'flex-start',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                color: '#444', flexShrink: 0, marginTop: 2,
              }}>#{q.id} · {q.year}</span>
              <span style={{ lineHeight: 1.4 }}>{q.question.slice(0, 90)}…</span>
              {selectedIds.includes(q.id) && <span style={{ marginLeft: 'auto', flexShrink: 0, color: '#d4a843' }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopperCopiesManager({ token }: { token: string }) {
  const [copies, setCopies] = useState<TopperCopy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pyqSearch, setPyqSearch] = useState('');
  const [editPyqSearch, setEditPyqSearch] = useState('');

  const emptyForm = { question: '', drive_file_id: '', note: '', pyq_ids: [] as number[] };
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/topper-copies', { headers: { 'x-admin-token': token } });
    const { data } = await res.json();
    setCopies(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const togglePyq = (ids: number[], pid: number): number[] =>
    ids.includes(pid) ? ids.filter(x => x !== pid) : [...ids, pid];

  const add = async () => {
    if (!form.question.trim()) { flash('⚠ Question required'); return; }
    if (!form.drive_file_id.trim()) { flash('⚠ Drive File ID required'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/topper-copies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) { setForm(emptyForm); setPyqSearch(''); flash('✓ Added'); load(); }
    else flash('⚠ ' + (data.error || 'Failed'));
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this topper copy?')) return;
    await fetch('/api/admin/topper-copies', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ id }),
    });
    setCopies(c => c.filter(x => x.id !== id));
    flash('✓ Deleted');
  };

  const startEdit = (c: TopperCopy) => {
    setEditingId(c.id);
    setEditForm({ question: c.question, drive_file_id: c.drive_file_id, note: c.note || '', pyq_ids: c.pyq_ids });
    setEditPyqSearch('');
  };

  const saveEdit = async (id: string) => {
    if (!editForm.question.trim() || !editForm.drive_file_id.trim()) { flash('⚠ Question and Drive ID required'); return; }
    setSaving(true);
    const res = await fetch('/api/admin/topper-copies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ id, ...editForm }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) { setEditingId(null); flash('✓ Updated'); load(); }
    else flash('⚠ ' + (data.error || 'Failed'));
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 720 }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid #141414', borderRadius: 10, padding: '16px 18px', marginBottom: 24 }}>
        <div style={{ color: 'var(--bg4)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>
          Add Topper Copy
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <textarea
            value={form.question}
            onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            placeholder="Test series question text&hellip;"
            rows={3}
            style={{ ...tcInp, resize: 'vertical' }}
          />
          <input
            value={form.drive_file_id}
            onChange={e => setForm(f => ({ ...f, drive_file_id: e.target.value.trim() }))}
            placeholder="Google Drive File ID (e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms)"
            style={tcInp}
          />
          <input
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Note (optional) — e.g. VISION IAS 2024 Test 3"
            style={tcInp}
          />
          <div>
            <div style={{ color: 'var(--bg4)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>
              Map to PYQs ({form.pyq_ids.length} selected)
            </div>
            <PYQPicker
              selectedIds={form.pyq_ids}
              onToggle={pid => setForm(f => ({ ...f, pyq_ids: togglePyq(f.pyq_ids, pid) }))}
              search={pyqSearch}
              onSearch={setPyqSearch}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={add} disabled={saving} className="btn-gold">
              {saving ? 'Adding&hellip;' : '+ Add Copy'}
            </button>
            {msg && <span style={{ fontSize: '0.75rem', color: msg.startsWith('✓') ? '#4ade80' : '#f87171', fontFamily: 'JetBrains Mono, monospace' }}>{msg}</span>}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--border2)', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>Loading&hellip;</div>
      ) : copies.length === 0 ? (
        <div style={{ color: 'var(--bg4)', textAlign: 'center', padding: '32px 0', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>No topper copies yet.</div>
      ) : (
        <div>
          <div style={{ color: 'var(--bg4)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, fontFamily: 'JetBrains Mono, monospace' }}>
            {copies.length} copies
          </div>
          {copies.map(c => editingId === c.id ? (
            <div key={c.id} style={{ background: 'var(--bg2)', border: '1px solid #222', borderRadius: 9, padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  value={editForm.question}
                  onChange={e => setEditForm(f => ({ ...f, question: e.target.value }))}
                  rows={3} style={{ ...tcInp, resize: 'vertical' }} autoFocus
                />
                <input
                  value={editForm.drive_file_id}
                  onChange={e => setEditForm(f => ({ ...f, drive_file_id: e.target.value.trim() }))}
                  placeholder="Drive File ID" style={tcInp}
                />
                <input
                  value={editForm.note}
                  onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Note (optional)" style={tcInp}
                />
                <div>
                  <div style={{ color: 'var(--bg4)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>
                    PYQ Mappings ({editForm.pyq_ids.length} selected)
                  </div>
                  <PYQPicker
                    selectedIds={editForm.pyq_ids}
                    onToggle={pid => setEditForm(f => ({ ...f, pyq_ids: togglePyq(f.pyq_ids, pid) }))}
                    search={editPyqSearch}
                    onSearch={setEditPyqSearch}
                  />
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button onClick={() => saveEdit(c.id)} disabled={saving} className="btn-green">{saving ? 'Saving&hellip;' : '✓ Save'}</button>
                  <button onClick={() => setEditingId(null)} className="btn-ghost">Cancel</button>
                </div>
              </div>
            </div>
          ) : (
            <div key={c.id} style={{
              background: 'var(--bg2)', border: '1px solid #141414', borderRadius: 9,
              padding: '11px 14px', marginBottom: 7,
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--bg4)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#141414')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#c0b8a8', fontSize: '0.84rem', fontFamily: 'Inter, sans-serif', lineHeight: 1.4, marginBottom: 4 }}>
                    {c.question.slice(0, 100)}{c.question.length > 100 ? '\u2026' : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ color: 'var(--bg4)', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace' }}>
                      {c.drive_file_id.slice(0, 20)}&hellip;
                    </span>
                    {c.note && (
                      <span style={{ color: '#818cf8', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace' }}>
                        &#128221; {c.note}
                      </span>
                    )}
                    {c.pyq_ids.length > 0 && (
                      <span style={{ color: '#d4a843', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace' }}>
                        &#128279; {c.pyq_ids.length} PYQ{c.pyq_ids.length > 1 ? 's' : ''}
                      </span>
                    )}
                    <span style={{ color: '#333', fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace', marginLeft: 'auto' }}>
                      {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <a
                    href={`https://drive.google.com/file/d/${c.drive_file_id}/preview`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.72rem', color: '#4ecdc4', fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', padding: '3px 8px', border: '1px solid rgba(78,205,196,0.2)', borderRadius: 4 }}
                  >&#8599;</a>
                  <button onClick={() => startEdit(c)} className="btn-ghost" style={{ padding: '3px 9px', fontSize: '0.72rem', color: '#818cf8', borderColor: 'rgba(129,140,248,0.2)' }}>&#9998;</button>
                  <button onClick={() => remove(c.id)} className="btn-red" style={{ padding: '3px 8px', fontSize: '0.72rem' }}>&#10005;</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { authed, checking, login, logout, token } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('notes');

  if (checking) return <><GlobalStyles /><div style={{ background: 'var(--bg)', minHeight: '100vh' }} /></>;
  if (!authed) return <><GlobalStyles /><LoginScreen onLogin={login} /></>;

  const NAV: { id: Tab; label: string; icon: string }[] = [
    { id: 'notes',         label: 'Note Editor',    icon: '✦' },
    { id: 'posts',         label: 'Posts',          icon: '◎' },
    { id: 'notifications', label: 'Notifications',  icon: '◉' },
    { id: 'submissions',   label: 'Submissions',    icon: '◇' },
    { id: 'topper-copies', label: 'Topper Copies',  icon: '🏆' },
    { id: 'analytics',     label: 'Analytics',      icon: '▦' },
    { id: 'settings',      label: 'Settings',       icon: '◌' },
  ];

  return (
    <>
      <GlobalStyles />
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden' }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width: 210, flexShrink: 0, background: 'var(--bg)', borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', height: '100vh' }}>
          {/* Logo */}
          <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #0d0d0d' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>⚡</div>
              <div>
                <div style={{ color: '#d4a843', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>HISTOPT</div>
                <div style={{ color: 'var(--bg4)', fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', marginTop: 1 }}>CMS v2</div>
              </div>
            </div>
          </div>

          {/* Live badge */}
          <div style={{ padding: '8px 14px', borderBottom: '1px solid #080808', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="live-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 4px rgba(74,222,128,0.5)' }} />
            <span style={{ color: 'var(--bg4)', fontSize: '0.63rem', fontFamily: 'JetBrains Mono, monospace' }}>LIVE · {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '8px 8px', overflow: 'auto' }}>
            {NAV.map(item => (
              <div key={item.id} onClick={() => setTab(item.id)} className={`sn ${tab === item.id ? 'on' : ''}`}>
                <span style={{ fontSize: '0.8rem', width: 14, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #0d0d0d' }}>
            <button onClick={logout}
              style={{ width: '100%', padding: '6px', borderRadius: 6, cursor: 'pointer', background: 'transparent', border: '1px solid #141414', color: 'var(--border)', fontSize: '0.73rem', fontFamily: 'Inter, sans-serif', transition: 'all 0.12s', outline: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bg4)'; e.currentTarget.style.color = '#555'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bg3)'; e.currentTarget.style.color = 'var(--border)'; }}>
              ⏻ Sign out
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {tab === 'notes'         && <NoteEditor token={token} />}
          {tab === 'posts'         && <PostsManager token={token} />}
          {tab === 'analytics'     && <Analytics token={token} />}
          {tab === 'submissions'   && <Submissions token={token} />}
          {tab === 'notifications' && <NotificationsManager token={token} />}
          {tab === 'topper-copies' && <TopperCopiesManager token={token} />}
          {tab === 'settings'      && <Settings onLogout={logout} token={token} />}
        </main>
      </div>
    </>
  );
}