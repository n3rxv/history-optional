'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { allNotes as notes } from '@/lib/notes';
import { noteContent } from '@/lib/noteContent';

const ADMIN_KEY   = 'histopt_admin_v1';
const EDITS_KEY   = 'histopt_note_edits';
const POSTS_KEY   = 'histopt_posts';       // current affairs + new notes

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type PostType = 'current-affairs' | 'new-note';

interface Post {
  id: string;
  type: PostType;
  title: string;
  excerpt: string;
  content: string;      // full HTML
  tags: string[];
  coverImage?: string;  // base64 or URL
  publishedAt: string;  // ISO string
  published: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function loadPosts(): Post[] {
  try { return JSON.parse(localStorage.getItem(POSTS_KEY) || '[]'); } catch { return []; }
}
function savePosts(posts: Post[]) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}
function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
function useAdminAuth() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  useEffect(() => { setAuthed(sessionStorage.getItem(ADMIN_KEY) === 'true'); setChecking(false); }, []);
  const login  = (pass: string) => { if (pass === 'admin123') { sessionStorage.setItem(ADMIN_KEY, 'true'); setAuthed(true); return true; } return false; };
  const logout = () => { sessionStorage.removeItem(ADMIN_KEY); setAuthed(false); };
  return { authed, checking, login, logout };
}

function LoginScreen({ onLogin }: { onLogin: (p: string) => boolean }) {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState(false);
  const submit = () => { if (!onLogin(pass)) { setErr(true); setTimeout(() => setErr(false), 1500); } };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
      <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 12, padding: '2.5rem', width: 340, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚙️</div>
        <h2 style={{ color: '#fff', fontFamily: 'serif', fontSize: '1.4rem', marginBottom: 4 }}>Admin Panel</h2>
        <p style={{ color: '#555', fontSize: '0.8rem', marginBottom: 24 }}>History Optional</p>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Password"
          style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: 7, background: '#111', border: err ? '1px solid #f55' : '1px solid #2a2a2a', color: '#fff', fontSize: '0.9rem', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
        <button onClick={submit} style={{ width: '100%', padding: '0.65rem', borderRadius: 7, background: '#d4a843', border: 'none', color: '#000', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}>Enter</button>
        {err && <p style={{ color: '#f55', fontSize: '0.78rem', marginTop: 8 }}>Wrong password</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: WYSIWYG EDITOR TOOLBAR HOOK
// ─────────────────────────────────────────────────────────────────────────────
function EditorToolbar({ editorRef, onImageInsert, onVideoInsert }: {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onImageInsert: () => void;
  onVideoInsert: () => void;
}) {
  const cmd = (command: string, value?: string) => { document.execCommand(command, false, value); editorRef.current?.focus(); };
  const fmtBtn = (label: string, action: () => void, title: string) => (
    <button onClick={action} title={title} style={{ padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#bbb' }}>{label}</button>
  );
  return (
    <div style={{ padding: '6px 14px', borderBottom: '1px solid #111', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', background: '#050505' }}>
      {fmtBtn('B', () => cmd('bold'), 'Bold')}
      {fmtBtn('I', () => cmd('italic'), 'Italic')}
      {fmtBtn('U', () => cmd('underline'), 'Underline')}
      <div style={{ width: 1, height: 18, background: '#222', margin: '0 2px' }} />
      {fmtBtn('H1', () => cmd('formatBlock', 'h1'), 'Heading 1')}
      {fmtBtn('H2', () => cmd('formatBlock', 'h2'), 'Heading 2')}
      {fmtBtn('H3', () => cmd('formatBlock', 'h3'), 'Heading 3')}
      {fmtBtn('P',  () => cmd('formatBlock', 'p'),  'Paragraph')}
      <div style={{ width: 1, height: 18, background: '#222', margin: '0 2px' }} />
      {fmtBtn('• List',  () => cmd('insertUnorderedList'), 'Bullet list')}
      {fmtBtn('1. List', () => cmd('insertOrderedList'),   'Numbered list')}
      <div style={{ width: 1, height: 18, background: '#222', margin: '0 2px' }} />
      {fmtBtn('↩', () => cmd('undo'), 'Undo')}
      {fmtBtn('↪', () => cmd('redo'), 'Redo')}
      {fmtBtn('✕ fmt', () => cmd('removeFormat'), 'Clear formatting')}
      <button onClick={() => { const url = prompt('URL:'); if (url) cmd('createLink', url); }}
        style={{ padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#bbb' }}>🔗</button>
      <div style={{ width: 1, height: 18, background: '#222', margin: '0 2px' }} />
      <button onClick={onImageInsert} title="Insert image"
        style={{ padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', color: '#d4a843' }}>🖼 Image</button>
      <button onClick={onVideoInsert} title="Insert video"
        style={{ padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', color: '#d4a843' }}>▶ Video</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTE EDITOR TAB
// ─────────────────────────────────────────────────────────────────────────────
function NoteEditor() {
  const [selectedSlug, setSelectedSlug] = useState(notes[0]?.slug || '');
  const [localEdits, setLocalEdits] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'wysiwyg' | 'html'>('wysiwyg');
  const [htmlValue, setHtmlValue] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { const raw = localStorage.getItem(EDITS_KEY); if (raw) setLocalEdits(JSON.parse(raw)); } catch {}
  }, []);

  const currentContent = useCallback(() =>
    localEdits[selectedSlug] || (noteContent as Record<string, string>)[selectedSlug] || '',
  [localEdits, selectedSlug]);

  useEffect(() => {
    const content = currentContent();
    if (mode === 'wysiwyg' && editorRef.current) editorRef.current.innerHTML = content;
    else if (mode === 'html') setHtmlValue(content);
  }, [selectedSlug, mode]);

  const saveContent = (html: string) => {
    const updated = { ...localEdits, [selectedSlug]: html };
    setLocalEdits(updated);
    localStorage.setItem(EDITS_KEY, JSON.stringify(updated));
    setSaved(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaved(false), 2000);
  };

  const onEditorInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveContent(html), 800);
  };

  const onHtmlChange = (val: string) => {
    setHtmlValue(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveContent(val), 800);
  };

  const switchToWysiwyg = () => { saveContent(htmlValue); setMode('wysiwyg'); setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = htmlValue; }, 0); };
  const switchToHtml    = () => { const html = editorRef.current?.innerHTML || currentContent(); saveContent(html); setHtmlValue(html); setMode('html'); };

  const reset = () => {
    const original = (noteContent as Record<string, string>)[selectedSlug] || '';
    const updated = { ...localEdits }; delete updated[selectedSlug];
    setLocalEdits(updated); localStorage.setItem(EDITS_KEY, JSON.stringify(updated));
    if (mode === 'wysiwyg' && editorRef.current) editorRef.current.innerHTML = original;
    else setHtmlValue(original);
  };

  // Insert image into editor at cursor
  const handleImageInsert = () => imgInputRef.current?.click();

  const onImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const b64 = await fileToBase64(file);
    document.execCommand('insertHTML', false, `<img src="${b64}" style="max-width:100%;border-radius:6px;margin:8px 0;" />`);
    editorRef.current?.focus();
    e.target.value = '';
  };

  // Insert video (YouTube embed or upload)
  const handleVideoInsert = () => {
    const url = prompt('YouTube URL or video embed URL:');
    if (!url) return;
    let embedUrl = url;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    document.execCommand('insertHTML', false,
      `<div style="position:relative;padding-bottom:56.25%;height:0;margin:12px 0;border-radius:8px;overflow:hidden;">
         <iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe>
       </div>`
    );
    editorRef.current?.focus();
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) || n.section?.toLowerCase().includes(search.toLowerCase())
  );
  const hasLocalEdit = !!localEdits[selectedSlug];
  const selectedNote = notes.find(n => n.slug === selectedSlug);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>
      <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageFile} />

      {/* Sidebar */}
      <div style={{ width: 250, flexShrink: 0, borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', background: '#030303' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #1a1a1a' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..."
            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, background: '#111', border: '1px solid #2a2a2a', color: '#ccc', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          {filteredNotes.map(n => (
            <div key={n.slug} onClick={() => setSelectedSlug(n.slug)} style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #0d0d0d', background: selectedSlug === n.slug ? '#141414' : 'transparent', borderLeft: selectedSlug === n.slug ? '2px solid #d4a843' : '2px solid transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: selectedSlug === n.slug ? '#d4a843' : '#ccc', fontSize: '0.82rem', fontWeight: selectedSlug === n.slug ? 600 : 400 }}>{n.title}</span>
                {localEdits[n.slug] && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#51cf66', flexShrink: 0 }} />}
              </div>
              <div style={{ color: '#333', fontSize: '0.7rem', marginTop: 2 }}>{n.section}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 12px', borderTop: '1px solid #1a1a1a', fontSize: '0.72rem', color: '#333' }}>
          {Object.keys(localEdits).length} local edits
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 8, background: '#050505' }}>
          <span style={{ color: '#555', fontSize: '0.82rem' }}>
            {selectedNote?.title}
            {hasLocalEdit && <span style={{ color: '#51cf66', marginLeft: 6 }}>● edited</span>}
          </span>
          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #222', marginLeft: 8 }}>
            <button onClick={switchToWysiwyg} style={{ padding: '4px 12px', cursor: 'pointer', fontSize: '0.78rem', background: mode === 'wysiwyg' ? '#1a1a1a' : 'transparent', color: mode === 'wysiwyg' ? '#d4a843' : '#555', border: 'none' }}>✍ Edit</button>
            <button onClick={switchToHtml}    style={{ padding: '4px 12px', cursor: 'pointer', fontSize: '0.78rem', background: mode === 'html'    ? '#1a1a1a' : 'transparent', color: mode === 'html'    ? '#d4a843' : '#555', border: 'none', borderLeft: '1px solid #222' }}>‹/› HTML</button>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            {hasLocalEdit && <button onClick={reset} style={{ padding: '4px 10px', borderRadius: 5, cursor: 'pointer', fontSize: '0.78rem', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff8080' }}>Reset</button>}
            <span style={{ fontSize: '0.75rem', color: saved ? '#51cf66' : '#2a2a2a', transition: 'color 0.3s' }}>{saved ? '✓ Saved' : 'Auto-saves'}</span>
          </div>
        </div>

        {mode === 'wysiwyg' && <EditorToolbar editorRef={editorRef} onImageInsert={handleImageInsert} onVideoInsert={handleVideoInsert} />}

        {mode === 'wysiwyg' && (
          <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={onEditorInput}
            style={{ flex: 1, padding: '28px 40px', overflow: 'auto', outline: 'none', color: '#e0e0e0', fontFamily: 'Georgia, serif', fontSize: '1rem', lineHeight: 1.7, caretColor: '#d4a843' }} />
        )}
        {mode === 'html' && (
          <textarea value={htmlValue} onChange={e => onHtmlChange(e.target.value)} spellCheck={false}
            style={{ flex: 1, padding: '16px', background: '#030303', color: '#d4d4d4', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.6, border: 'none', outline: 'none', resize: 'none' }} />
        )}
        <div style={{ padding: '5px 14px', borderTop: '1px solid #111', background: '#030303', fontSize: '0.7rem', color: '#2a2a2a' }}>
          ⚠ Local edits only — export JSON → update lib/noteContent.ts to make permanent
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POSTS MANAGER TAB  (current affairs + new notes)
// ─────────────────────────────────────────────────────────────────────────────
function PostsManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const editorRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setPosts(loadPosts()); }, []);

  const newPost = (type: PostType): Post => ({
    id: Date.now().toString(),
    type,
    title: '',
    excerpt: '',
    content: '<p>Start writing here...</p>',
    tags: [],
    publishedAt: new Date().toISOString(),
    published: false,
  });

  const openEdit = (post: Post) => {
    setEditing({ ...post });
    setMode('edit');
    setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = post.content; }, 50);
  };

  const savePost = () => {
    if (!editing) return;
    const content = editorRef.current?.innerHTML || editing.content;
    const updated = { ...editing, content };
    const existing = posts.find(p => p.id === updated.id);
    const newList = existing ? posts.map(p => p.id === updated.id ? updated : p) : [updated, ...posts];
    setPosts(newList);
    savePosts(newList);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const deletePost = (id: string) => {
    if (!confirm('Delete this post?')) return;
    const newList = posts.filter(p => p.id !== id);
    setPosts(newList);
    savePosts(newList);
    if (editing?.id === id) { setEditing(null); setMode('list'); }
  };

  const togglePublish = (id: string) => {
    const newList = posts.map(p => p.id === id ? { ...p, published: !p.published } : p);
    setPosts(newList);
    savePosts(newList);
  };

  // Image insert in post editor
  const handleImageInsert = () => imgInputRef.current?.click();
  const onImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const b64 = await fileToBase64(file);
    document.execCommand('insertHTML', false, `<img src="${b64}" style="max-width:100%;border-radius:6px;margin:8px 0;" />`);
    editorRef.current?.focus(); e.target.value = '';
  };
  const handleVideoInsert = () => {
    const url = prompt('YouTube URL or embed URL:'); if (!url) return;
    let embedUrl = url;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    document.execCommand('insertHTML', false,
      `<div style="position:relative;padding-bottom:56.25%;height:0;margin:12px 0;border-radius:8px;overflow:hidden;"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe></div>`
    );
    editorRef.current?.focus();
  };
  const onCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !editing) return;
    const b64 = await fileToBase64(file);
    setEditing(prev => prev ? { ...prev, coverImage: b64 } : prev);
    e.target.value = '';
  };

  // ── LIST VIEW ──
  if (mode === 'list') {
    const caPost = posts.filter(p => p.type === 'current-affairs');
    const nnPost = posts.filter(p => p.type === 'new-note');
    const PostCard = ({ p }: { p: Post }) => (
      <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
        {p.coverImage && <img src={p.coverImage} alt="" style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#ccc', fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title || <span style={{ color: '#444' }}>Untitled</span>}</div>
          <div style={{ color: '#444', fontSize: '0.72rem', marginTop: 2 }}>{new Date(p.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
        <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', background: p.published ? 'rgba(81,207,102,0.1)' : 'rgba(255,255,255,0.05)', color: p.published ? '#51cf66' : '#555', border: p.published ? '1px solid rgba(81,207,102,0.2)' : '1px solid #222', flexShrink: 0 }}>
          {p.published ? 'Live' : 'Draft'}
        </span>
        <button onClick={() => togglePublish(p.id)} style={{ padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.72rem', background: 'transparent', border: '1px solid #2a2a2a', color: '#888' }}>{p.published ? 'Unpublish' : 'Publish'}</button>
        <button onClick={() => openEdit(p)} style={{ padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: '0.78rem', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.25)', color: '#d4a843' }}>Edit</button>
        <button onClick={() => deletePost(p.id)} style={{ padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.78rem', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff8080' }}>✕</button>
      </div>
    );

    return (
      <div style={{ padding: 24, maxWidth: 860 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          <button onClick={() => { const p = newPost('current-affairs'); openEdit(p); }} style={{ padding: '8px 18px', borderRadius: 7, cursor: 'pointer', background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.4)', color: '#d4a843', fontWeight: 600, fontSize: '0.85rem' }}>+ Current Affairs Post</button>
          <button onClick={() => { const p = newPost('new-note'); openEdit(p); }} style={{ padding: '8px 18px', borderRadius: 7, cursor: 'pointer', background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)', color: '#4ecdc4', fontWeight: 600, fontSize: '0.85rem' }}>+ New Note / Article</button>
        </div>

        <h4 style={{ color: '#d4a843', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>📰 Current Affairs ({caPost.length})</h4>
        {caPost.length === 0 ? <div style={{ color: '#333', fontSize: '0.82rem', marginBottom: 24 }}>No posts yet.</div> : caPost.map(p => <PostCard key={p.id} p={p} />)}

        <h4 style={{ color: '#4ecdc4', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '24px 0 10px' }}>📄 New Notes / Articles ({nnPost.length})</h4>
        {nnPost.length === 0 ? <div style={{ color: '#333', fontSize: '0.82rem' }}>No articles yet.</div> : nnPost.map(p => <PostCard key={p.id} p={p} />)}
      </div>
    );
  }

  // ── EDIT VIEW ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)' }}>
      <input ref={imgInputRef}   type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageFile} />
      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onCoverFile} />

      {/* Edit topbar */}
      <div style={{ padding: '8px 14px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 8, background: '#050505', flexWrap: 'wrap' }}>
        <button onClick={() => { savePost(); setMode('list'); }} style={{ padding: '4px 10px', borderRadius: 5, cursor: 'pointer', fontSize: '0.78rem', background: 'transparent', border: '1px solid #2a2a2a', color: '#888' }}>← Back</button>
        <span style={{ color: '#555', fontSize: '0.78rem' }}>{editing?.type === 'current-affairs' ? '📰 Current Affairs' : '📄 New Note'}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <span style={{ color: '#555', fontSize: '0.78rem' }}>Published</span>
            <input type="checkbox" checked={editing?.published || false} onChange={e => setEditing(prev => prev ? { ...prev, published: e.target.checked } : prev)} style={{ accentColor: '#51cf66' }} />
          </label>
          <button onClick={savePost} style={{ padding: '4px 14px', borderRadius: 5, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, background: saved ? 'rgba(81,207,102,0.15)' : 'rgba(212,168,67,0.15)', border: saved ? '1px solid rgba(81,207,102,0.4)' : '1px solid rgba(212,168,67,0.4)', color: saved ? '#51cf66' : '#d4a843' }}>{saved ? '✓ Saved' : 'Save'}</button>
        </div>
      </div>

      {/* Meta fields */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #111', background: '#040404', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 2, minWidth: 220 }}>
          <input value={editing?.title || ''} onChange={e => setEditing(prev => prev ? { ...prev, title: e.target.value } : prev)}
            placeholder="Post title..." style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #2a2a2a', color: '#e0e0e0', fontSize: '1.1rem', fontWeight: 700, padding: '6px 0', outline: 'none', boxSizing: 'border-box' }} />
          <input value={editing?.excerpt || ''} onChange={e => setEditing(prev => prev ? { ...prev, excerpt: e.target.value } : prev)}
            placeholder="Short excerpt shown on homepage..." style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #1a1a1a', color: '#888', fontSize: '0.85rem', padding: '6px 0', outline: 'none', marginTop: 6, boxSizing: 'border-box' }} />
          <input value={editing?.tags.join(', ') || ''} onChange={e => setEditing(prev => prev ? { ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } : prev)}
            placeholder="Tags: Mughal, British Raj, UPSC 2024..." style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #1a1a1a', color: '#666', fontSize: '0.78rem', padding: '6px 0', outline: 'none', marginTop: 6, boxSizing: 'border-box' }} />
        </div>
        {/* Cover image */}
        <div style={{ flexShrink: 0 }}>
          <div onClick={() => coverInputRef.current?.click()} style={{ width: 120, height: 80, borderRadius: 6, border: '1px dashed #2a2a2a', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
            {editing?.coverImage ? <img src={editing.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: '#444', fontSize: '0.72rem', textAlign: 'center' }}>Click to add<br/>cover image</span>}
          </div>
          {editing?.coverImage && <button onClick={() => setEditing(prev => prev ? { ...prev, coverImage: undefined } : prev)} style={{ marginTop: 4, background: 'none', border: 'none', color: '#f55', cursor: 'pointer', fontSize: '0.72rem' }}>Remove</button>}
        </div>
      </div>

      {/* Formatting toolbar */}
      <EditorToolbar editorRef={editorRef} onImageInsert={handleImageInsert} onVideoInsert={handleVideoInsert} />

      {/* Content editor */}
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onInput={() => { /* content synced on save */ }}
        style={{ flex: 1, padding: '24px 36px', overflow: 'auto', outline: 'none', color: '#e0e0e0', fontFamily: 'Georgia, serif', fontSize: '1rem', lineHeight: 1.75, caretColor: '#d4a843', background: '#070707' }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
function Analytics() {
  const totalNotes = notes.length;
  const sections = [...new Set(notes.map(n => n.section))];
  const annotated = typeof window !== 'undefined' ? Object.keys(localStorage).filter(k => k.startsWith('annotations_v2_')).length : 0;
  const edits = (() => { try { return Object.keys(JSON.parse(localStorage.getItem(EDITS_KEY) || '{}')).length; } catch { return 0; } })();
  const posts = loadPosts();
  const published = posts.filter(p => p.published).length;

  const stat = (label: string, value: string | number, sub?: string) => (
    <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: '16px 20px' }}>
      <div style={{ color: '#d4a843', fontSize: '1.6rem', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
      <div style={{ color: '#ccc', fontSize: '0.85rem', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ color: '#444', fontSize: '0.72rem', marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ color: '#fff', marginBottom: 20, fontFamily: 'serif' }}>Analytics</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 12, marginBottom: 24 }}>
        {stat('Total Notes', totalNotes)} {stat('Paper I', notes.filter(n => n.paper === 1).length)} {stat('Paper II', notes.filter(n => n.paper === 2).length)}
        {stat('Sections', sections.length)} {stat('Annotated', annotated, 'with drawings')} {stat('Local Edits', edits)}
        {stat('Posts', posts.length, `${published} published`)}
      </div>
      <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 16 }}>
        <h4 style={{ color: '#444', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Notes by Section</h4>
        {sections.map(s => { const count = notes.filter(n => n.section === s).length; const pct = Math.round((count / totalNotes) * 100); return (
          <div key={s} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ color: '#aaa', fontSize: '0.82rem' }}>{s}</span><span style={{ color: '#555', fontSize: '0.78rem' }}>{count}</span></div>
            <div style={{ height: 4, background: '#111', borderRadius: 2 }}><div style={{ height: '100%', width: `${pct}%`, background: '#d4a843', borderRadius: 2 }} /></div>
          </div>
        ); })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
function Settings({ onLogout }: { onLogout: () => void }) {
  const [msg, setMsg] = useState('');
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };
  const exportEdits = () => { const blob = new Blob([localStorage.getItem(EDITS_KEY) || '{}'], { type: 'application/json' }); Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'note_edits.json' }).click(); };
  const exportPosts = () => { const blob = new Blob([localStorage.getItem(POSTS_KEY) || '[]'], { type: 'application/json' }); Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'posts_backup.json' }).click(); };
  const importPosts = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return;
      const text = await file.text();
      try { JSON.parse(text); localStorage.setItem(POSTS_KEY, text); flash('Posts imported successfully!'); } catch { flash('Invalid JSON file.'); }
    };
    input.click();
  };
  const clearAnnotations = () => { const keys = Object.keys(localStorage).filter(k => k.startsWith('annotations_v2_')); keys.forEach(k => localStorage.removeItem(k)); flash(`Cleared ${keys.length} annotation(s)`); };

  const row = (label: string, desc: string, action: () => void, btnLabel: string, danger = false) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #0f0f0f' }}>
      <div><div style={{ color: '#bbb', fontSize: '0.88rem' }}>{label}</div><div style={{ color: '#444', fontSize: '0.75rem', marginTop: 2 }}>{desc}</div></div>
      <button onClick={action} style={{ padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0, marginLeft: 16, background: danger ? 'rgba(255,80,80,0.08)' : 'rgba(212,168,67,0.1)', border: danger ? '1px solid rgba(255,80,80,0.25)' : '1px solid rgba(212,168,67,0.25)', color: danger ? '#ff8080' : '#d4a843' }}>{btnLabel}</button>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 580 }}>
      <h3 style={{ color: '#fff', marginBottom: 20, fontFamily: 'serif' }}>Settings</h3>
      <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: '0 16px', marginBottom: 16 }}>
        {row('Export note edits', 'Download local edits as JSON', exportEdits, 'Export')}
        {row('Export posts', 'Backup all current affairs & articles', exportPosts, 'Export')}
        {row('Import posts', 'Restore posts from backup JSON', importPosts, 'Import')}
        {row('Clear annotations', 'Delete all saved drawings', clearAnnotations, 'Clear', true)}
        {row('Logout', 'End admin session', onLogout, 'Logout', true)}
      </div>
      {msg && <p style={{ color: '#51cf66', fontSize: '0.82rem' }}>{msg}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ADMIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
type Tab = 'notes' | 'posts' | 'analytics' | 'settings';

export default function AdminPage() {
  const { authed, checking, login, logout } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('notes');
  if (checking) return <div style={{ background: '#000', minHeight: '100vh' }} />;
  if (!authed) return <LoginScreen onLogin={login} />;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'notes',     label: 'Note Editor', icon: '📝' },
    { id: 'posts',     label: 'Posts',       icon: '📰' },
    { id: 'analytics', label: 'Analytics',   icon: '📊' },
    { id: 'settings',  label: 'Settings',    icon: '⚙️' },
  ];

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ height: 52, background: '#050505', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12 }}>
        <span style={{ color: '#d4a843', fontWeight: 700, fontSize: '0.9rem' }}>⚙ Admin Panel</span>
        <span style={{ color: '#2a2a2a', fontSize: '0.75rem' }}>History Optional</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', background: tab === t.id ? 'rgba(212,168,67,0.12)' : 'transparent', border: tab === t.id ? '1px solid rgba(212,168,67,0.3)' : '1px solid transparent', color: tab === t.id ? '#d4a843' : '#555', transition: 'all 0.15s' }}>{t.icon} {t.label}</button>
          ))}
        </div>
      </div>
      {tab === 'notes'     && <NoteEditor />}
      {tab === 'posts'     && <PostsManager />}
      {tab === 'analytics' && <Analytics />}
      {tab === 'settings'  && <Settings onLogout={logout} />}
    </div>
  );
}
