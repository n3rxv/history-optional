'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { allNotes as notes } from '@/lib/notes';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type PostType = 'current-affairs' | 'new-note';

interface Post {
  id: string;
  type: PostType;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  cover_image?: string;
  published_at: string;
  published: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────────────────────────────────────────
async function apiCall(url: string, method: string, body?: object, token?: string) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-admin-token': token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
const SESSION_KEY = 'histopt_admin_v2';

function useAdminAuth() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [token, setToken] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) { setAuthed(true); setToken(stored); }
    setChecking(false);
  }, []);

  const login = async (pass: string) => {
    const result = await apiCall('/api/admin/verify-password', 'POST', { password: pass });
    if (result.ok) {
      sessionStorage.setItem(SESSION_KEY, result.token);
      setAuthed(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setToken('');
  };

  return { authed, checking, login, logout, token };
}

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
      <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 12, padding: '2.5rem', width: 340, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⚙️</div>
        <h2 style={{ color: '#fff', fontFamily: 'serif', fontSize: '1.4rem', marginBottom: 4 }}>Admin Panel</h2>
        <p style={{ color: '#555', fontSize: '0.8rem', marginBottom: 24 }}>History Optional</p>
        <input
          type="password" value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Password"
          style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: 7, background: '#111', border: err ? '1px solid #f55' : '1px solid #2a2a2a', color: '#fff', fontSize: '0.9rem', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
        />
        <button onClick={submit} disabled={loading}
          style={{ width: '100%', padding: '0.65rem', borderRadius: 7, background: '#d4a843', border: 'none', color: '#000', fontSize: '0.9rem', fontWeight: 700, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Checking...' : 'Enter'}
        </button>
        {err && <p style={{ color: '#f55', fontSize: '0.78rem', marginTop: 8 }}>Wrong password</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITOR TOOLBAR
// ─────────────────────────────────────────────────────────────────────────────
function EditorToolbar({ editorRef, onImageInsert, onVideoInsert }: {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onImageInsert: () => void;
  onVideoInsert: () => void;
}) {
  const cmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertBlockquote = () => {
    document.execCommand('formatBlock', false, 'blockquote');
    editorRef.current?.focus();
  };

  const insertColorPicker = () => {
    const color = prompt('Enter hex color (e.g. #e63946):');
    if (color) cmd('foreColor', color);
  };

  const insertHighlight = () => {
    const color = prompt('Highlight color (e.g. #fff3cd):') || '#fff3cd';
    cmd('hiliteColor', color);
  };

  const btn = (label: string, action: () => void, title: string, accent?: boolean) => (
    <button onClick={action} title={title}
      style={{ padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: accent ? 'rgba(212,168,67,0.08)' : 'rgba(255,255,255,0.05)', border: accent ? '1px solid rgba(212,168,67,0.2)' : '1px solid rgba(255,255,255,0.08)', color: accent ? '#d4a843' : '#bbb' }}>
      {label}
    </button>
  );

  const divider = () => <div style={{ width: 1, height: 18, background: '#222', margin: '0 2px' }} />;

  return (
    <div style={{ padding: '6px 14px', borderBottom: '1px solid #111', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', background: '#050505' }}>
      {btn('B', () => cmd('bold'), 'Bold')}
      {btn('I', () => cmd('italic'), 'Italic')}
      {btn('U', () => cmd('underline'), 'Underline')}
      {btn('S', () => cmd('strikeThrough'), 'Strikethrough')}
      {divider()}
      {btn('H1', () => cmd('formatBlock', 'h1'), 'Heading 1')}
      {btn('H2', () => cmd('formatBlock', 'h2'), 'Heading 2')}
      {btn('H3', () => cmd('formatBlock', 'h3'), 'Heading 3')}
      {btn('P', () => cmd('formatBlock', 'p'), 'Paragraph')}
      {divider()}
      {btn('• List', () => cmd('insertUnorderedList'), 'Bullet list')}
      {btn('1. List', () => cmd('insertOrderedList'), 'Numbered list')}
      {btn('" Quote', insertBlockquote, 'Blockquote')}
      {divider()}
      {btn('A color', insertColorPicker, 'Text color')}
      {btn('🖍 HL', insertHighlight, 'Highlight')}
      {divider()}
      {btn('↩', () => cmd('undo'), 'Undo')}
      {btn('↪', () => cmd('redo'), 'Redo')}
      {btn('✕ fmt', () => cmd('removeFormat'), 'Clear formatting')}
      <button onClick={() => { const url = prompt('URL:'); if (url) cmd('createLink', url); }}
        title="Insert link"
        style={{ padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#bbb' }}>🔗</button>
      {divider()}
      {btn('🖼 Image', onImageInsert, 'Insert image', true)}
      {btn('▶ Video', onVideoInsert, 'Insert video', true)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTE EDITOR
// ─────────────────────────────────────────────────────────────────────────────
function NoteEditor({ token }: { token: string }) {
  const [selectedSlug, setSelectedSlug] = useState(notes[0]?.slug || '');
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [originalContent, setOriginalContent] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'wysiwyg' | 'html'>('wysiwyg');
  const [htmlValue, setHtmlValue] = useState('');
  const [loading, setLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load all overrides from Supabase on mount
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

  // Load original noteContent for current slug
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
    setSaving(true);
    const res = await apiCall('/api/admin/note-content', 'POST', { slug: selectedSlug, content: html }, token);
    setSaving(false);
    if (res.ok) {
      setOverrides(prev => ({ ...prev, [selectedSlug]: html }));
      setSavedMsg('✓ Saved to cloud');
      setTimeout(() => setSavedMsg(''), 3000);
    } else {
      setSavedMsg('⚠ Save failed');
      setTimeout(() => setSavedMsg(''), 3000);
    }
  };

  const scheduleAutoSave = (html: string) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveToSupabase(html), 1500);
  };

  const onEditorInput = () => {
    if (!editorRef.current) return;
    scheduleAutoSave(editorRef.current.innerHTML);
  };

  const onHtmlChange = (val: string) => {
    setHtmlValue(val);
    scheduleAutoSave(val);
  };

  const switchToWysiwyg = () => {
    setMode('wysiwyg');
    setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = htmlValue; }, 0);
  };

  const switchToHtml = () => {
    const html = editorRef.current?.innerHTML || currentContent();
    setHtmlValue(html);
    setMode('html');
  };

  const resetToOriginal = async () => {
    if (!confirm('Reset to original content? This will delete your edits from the cloud.')) return;
    await apiCall('/api/admin/note-content', 'DELETE', { slug: selectedSlug }, token);
    const updated = { ...overrides };
    delete updated[selectedSlug];
    setOverrides(updated);
    const orig = originalContent[selectedSlug] || '';
    if (mode === 'wysiwyg' && editorRef.current) editorRef.current.innerHTML = orig;
    else setHtmlValue(orig);
    setSavedMsg('Reset to original');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const handleImageInsert = () => imgInputRef.current?.click();
  const onImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if ((reader.result as string).length > 500_000) {
        alert('Image too large! Please use an image under 500KB.');
        return;
      }
      document.execCommand('insertHTML', false, `<img src="${reader.result}" style="max-width:100%;border-radius:6px;margin:8px 0;" />`);
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
      `<div style="position:relative;padding-bottom:56.25%;height:0;margin:12px 0;border-radius:8px;overflow:hidden;">
         <iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe>
       </div>`
    );
    editorRef.current?.focus();
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.section?.toLowerCase().includes(search.toLowerCase())
  );

  const hasOverride = !!overrides[selectedSlug];
  const selectedNote = notes.find(n => n.slug === selectedSlug);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>
      <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageFile} />

      {/* Sidebar */}
      <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', background: '#030303' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #1a1a1a' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..."
            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, background: '#111', border: '1px solid #2a2a2a', color: '#ccc', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          {filteredNotes.map(n => (
            <div key={n.slug} onClick={() => setSelectedSlug(n.slug)}
              style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #0d0d0d', background: selectedSlug === n.slug ? '#141414' : 'transparent', borderLeft: selectedSlug === n.slug ? '2px solid #d4a843' : '2px solid transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: selectedSlug === n.slug ? '#d4a843' : '#ccc', fontSize: '0.82rem', fontWeight: selectedSlug === n.slug ? 600 : 400 }}>{n.title}</span>
                {overrides[n.slug] && <span title="Cloud edit saved" style={{ width: 6, height: 6, borderRadius: '50%', background: '#51cf66', flexShrink: 0 }} />}
              </div>
              <div style={{ color: '#333', fontSize: '0.7rem', marginTop: 2 }}>{n.section}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 12px', borderTop: '1px solid #1a1a1a', fontSize: '0.72rem', color: '#333' }}>
          ☁ {Object.keys(overrides).length} cloud edits
        </div>
      </div>

      {/* Editor area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 8, background: '#050505', flexWrap: 'wrap' }}>
          <span style={{ color: '#555', fontSize: '0.82rem' }}>
            {selectedNote?.title}
            {hasOverride && <span style={{ color: '#51cf66', marginLeft: 6 }}>● cloud saved</span>}
          </span>
          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #222', marginLeft: 8 }}>
            <button onClick={switchToWysiwyg} style={{ padding: '4px 12px', cursor: 'pointer', fontSize: '0.78rem', background: mode === 'wysiwyg' ? '#1a1a1a' : 'transparent', color: mode === 'wysiwyg' ? '#d4a843' : '#555', border: 'none' }}>✍ Edit</button>
            <button onClick={switchToHtml} style={{ padding: '4px 12px', cursor: 'pointer', fontSize: '0.78rem', background: mode === 'html' ? '#1a1a1a' : 'transparent', color: mode === 'html' ? '#d4a843' : '#555', border: 'none', borderLeft: '1px solid #222' }}>‹/› HTML</button>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            {hasOverride && (
              <button onClick={resetToOriginal}
                style={{ padding: '4px 10px', borderRadius: 5, cursor: 'pointer', fontSize: '0.78rem', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff8080' }}>
                Reset to original
              </button>
            )}
            <span style={{ fontSize: '0.75rem', color: saving ? '#d4a843' : savedMsg ? '#51cf66' : '#2a2a2a', transition: 'color 0.3s' }}>
              {saving ? '↑ Saving...' : savedMsg || 'Auto-saves to cloud'}
            </span>
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
          ☁ Edits saved to Supabase — permanent until changed again
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POSTS MANAGER
// ─────────────────────────────────────────────────────────────────────────────
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
      .then(r => r.json())
      .then(({ data }) => { if (data) setPosts(data); });
  }, [token]);

  const newPost = (type: PostType): Post => ({
    id: Date.now().toString(),
    type,
    title: '',
    excerpt: '',
    content: '<p>Start writing here...</p>',
    tags: [],
    published_at: new Date().toISOString(),
    published: false,
  });

  const openEdit = (post: Post) => {
    setEditing({ ...post });
    setMode('edit');
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
      setEditing(updated);
      setSavedMsg('✓ Saved');
      setTimeout(() => setSavedMsg(''), 2000);
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
    reader.onload = () => {
      document.execCommand('insertHTML', false, `<img src="${reader.result}" style="max-width:100%;border-radius:6px;margin:8px 0;" />`);
      editorRef.current?.focus();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  const handleVideoInsert = () => {
    const url = prompt('YouTube URL:'); if (!url) return;
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
    const reader = new FileReader();
    reader.onload = () => setEditing(prev => prev ? { ...prev, cover_image: reader.result as string } : prev);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // LIST VIEW
  if (mode === 'list') {
    const caPost = posts.filter(p => p.type === 'current-affairs');
    const nnPost = posts.filter(p => p.type === 'new-note');

    const PostCard = ({ p }: { p: Post }) => (
      <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
        {p.cover_image && <img src={p.cover_image} alt="" style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#ccc', fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title || <span style={{ color: '#444' }}>Untitled</span>}</div>
          <div style={{ color: '#444', fontSize: '0.72rem', marginTop: 2 }}>{new Date(p.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
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
          <button onClick={() => openEdit(newPost('current-affairs'))}
            style={{ padding: '8px 18px', borderRadius: 7, cursor: 'pointer', background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.4)', color: '#d4a843', fontWeight: 600, fontSize: '0.85rem' }}>
            + Current Affairs Post
          </button>
          <button onClick={() => openEdit(newPost('new-note'))}
            style={{ padding: '8px 18px', borderRadius: 7, cursor: 'pointer', background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)', color: '#4ecdc4', fontWeight: 600, fontSize: '0.85rem' }}>
            + New Note / Article
          </button>
        </div>
        <h4 style={{ color: '#d4a843', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>📰 Current Affairs ({caPost.length})</h4>
        {caPost.length === 0 ? <div style={{ color: '#333', fontSize: '0.82rem', marginBottom: 24 }}>No posts yet.</div> : caPost.map(p => <PostCard key={p.id} p={p} />)}
        <h4 style={{ color: '#4ecdc4', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '24px 0 10px' }}>📄 New Notes / Articles ({nnPost.length})</h4>
        {nnPost.length === 0 ? <div style={{ color: '#333', fontSize: '0.82rem' }}>No articles yet.</div> : nnPost.map(p => <PostCard key={p.id} p={p} />)}
      </div>
    );
  }

  // EDIT VIEW
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)' }}>
      <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageFile} />
      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onCoverFile} />

      <div style={{ padding: '8px 14px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 8, background: '#050505', flexWrap: 'wrap' }}>
        <button onClick={() => { savePost(); setMode('list'); }}
          style={{ padding: '4px 10px', borderRadius: 5, cursor: 'pointer', fontSize: '0.78rem', background: 'transparent', border: '1px solid #2a2a2a', color: '#888' }}>
          ← Back
        </button>
        <span style={{ color: '#555', fontSize: '0.78rem' }}>{editing?.type === 'current-affairs' ? '📰 Current Affairs' : '📄 New Note'}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <span style={{ color: '#555', fontSize: '0.78rem' }}>Published</span>
            <input type="checkbox" checked={editing?.published || false}
              onChange={e => setEditing(prev => prev ? { ...prev, published: e.target.checked } : prev)}
              style={{ accentColor: '#51cf66' }} />
          </label>
          <button onClick={savePost} disabled={saving}
            style={{ padding: '4px 14px', borderRadius: 5, cursor: saving ? 'default' : 'pointer', fontSize: '0.82rem', fontWeight: 600, background: savedMsg ? 'rgba(81,207,102,0.15)' : 'rgba(212,168,67,0.15)', border: savedMsg ? '1px solid rgba(81,207,102,0.4)' : '1px solid rgba(212,168,67,0.4)', color: savedMsg ? '#51cf66' : '#d4a843' }}>
            {saving ? 'Saving...' : savedMsg || 'Save'}
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 20px', borderBottom: '1px solid #111', background: '#040404', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: 2, minWidth: 220 }}>
          <input value={editing?.title || ''} onChange={e => setEditing(prev => prev ? { ...prev, title: e.target.value } : prev)}
            placeholder="Post title..."
            style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #2a2a2a', color: '#e0e0e0', fontSize: '1.1rem', fontWeight: 700, padding: '6px 0', outline: 'none', boxSizing: 'border-box' }} />
          <input value={editing?.excerpt || ''} onChange={e => setEditing(prev => prev ? { ...prev, excerpt: e.target.value } : prev)}
            placeholder="Short excerpt shown on homepage..."
            style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #1a1a1a', color: '#888', fontSize: '0.85rem', padding: '6px 0', outline: 'none', marginTop: 6, boxSizing: 'border-box' }} />
          <input value={editing?.tags.join(', ') || ''} onChange={e => setEditing(prev => prev ? { ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } : prev)}
            placeholder="Tags: Mughal, British Raj, UPSC 2024..."
            style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #1a1a1a', color: '#666', fontSize: '0.78rem', padding: '6px 0', outline: 'none', marginTop: 6, boxSizing: 'border-box' }} />
        </div>
        <div style={{ flexShrink: 0 }}>
          <div onClick={() => coverInputRef.current?.click()}
            style={{ width: 120, height: 80, borderRadius: 6, border: '1px dashed #2a2a2a', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
            {editing?.cover_image
              ? <img src={editing.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: '#444', fontSize: '0.72rem', textAlign: 'center' }}>Click to add<br />cover image</span>}
          </div>
          {editing?.cover_image && (
            <button onClick={() => setEditing(prev => prev ? { ...prev, cover_image: undefined } : prev)}
              style={{ marginTop: 4, background: 'none', border: 'none', color: '#f55', cursor: 'pointer', fontSize: '0.72rem' }}>Remove</button>
          )}
        </div>
      </div>

      <EditorToolbar editorRef={editorRef} onImageInsert={handleImageInsert} onVideoInsert={handleVideoInsert} />

      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onInput={() => { /* synced on save */ }}
        style={{ flex: 1, padding: '24px 36px', overflow: 'auto', outline: 'none', color: '#e0e0e0', fontFamily: 'Georgia, serif', fontSize: '1rem', lineHeight: 1.75, caretColor: '#d4a843', background: '#070707' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
function Analytics({ token }: { token: string }) {
  const [overrideCount, setOverrideCount] = useState(0);
  const [postStats, setPostStats] = useState({ total: 0, published: 0 });
  const totalNotes = notes.length;
  const sections = [...new Set(notes.map(n => n.section))];

  useEffect(() => {
    fetch('/api/admin/note-content', { headers: { 'x-admin-token': token } })
      .then(r => r.json()).then(({ data }) => setOverrideCount(data?.length || 0));
    fetch('/api/admin/blog-posts?all=true', { headers: { 'x-admin-token': token } })
      .then(r => r.json()).then(({ data }) => {
        if (data) setPostStats({ total: data.length, published: data.filter((p: Post) => p.published).length });
      });
  }, [token]);

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
        {stat('Total Notes', totalNotes)}
        {stat('Paper I', notes.filter(n => n.paper === 1).length)}
        {stat('Paper II', notes.filter(n => n.paper === 2).length)}
        {stat('Sections', sections.length)}
        {stat('Cloud Edits', overrideCount, 'saved to Supabase')}
        {stat('Posts', postStats.total, `${postStats.published} published`)}
      </div>
      <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 16 }}>
        <h4 style={{ color: '#444', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Notes by Section</h4>
        {sections.map(s => {
          const count = notes.filter(n => n.section === s).length;
          const pct = Math.round((count / totalNotes) * 100);
          return (
            <div key={s} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#aaa', fontSize: '0.82rem' }}>{s}</span>
                <span style={{ color: '#555', fontSize: '0.78rem' }}>{count}</span>
              </div>
              <div style={{ height: 4, background: '#111', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: '#d4a843', borderRadius: 2 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
function Settings({ onLogout, token }: { onLogout: () => void; token: string }) {
  const [msg, setMsg] = useState('');
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

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

  const row = (label: string, desc: string, action: () => void, btnLabel: string, danger = false) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #0f0f0f' }}>
      <div>
        <div style={{ color: '#bbb', fontSize: '0.88rem' }}>{label}</div>
        <div style={{ color: '#444', fontSize: '0.75rem', marginTop: 2 }}>{desc}</div>
      </div>
      <button onClick={action}
        style={{ padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0, marginLeft: 16, background: danger ? 'rgba(255,80,80,0.08)' : 'rgba(212,168,67,0.1)', border: danger ? '1px solid rgba(255,80,80,0.25)' : '1px solid rgba(212,168,67,0.25)', color: danger ? '#ff8080' : '#d4a843' }}>
        {btnLabel}
      </button>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 580 }}>
      <h3 style={{ color: '#fff', marginBottom: 20, fontFamily: 'serif' }}>Settings</h3>
      <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: '0 16px', marginBottom: 16 }}>
        {row('Export note overrides', 'Download all cloud edits as JSON backup', exportOverrides, 'Export')}
        {row('Export posts', 'Backup all current affairs & articles', exportPosts, 'Export')}
        {row('Logout', 'End admin session', onLogout, 'Logout', true)}
      </div>
      <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 16 }}>
        <div style={{ color: '#555', fontSize: '0.78rem', marginBottom: 8 }}>☁ Storage: Supabase (Mumbai)</div>
        <div style={{ color: '#555', fontSize: '0.78rem' }}>🔐 Auth: Server-side verified password</div>
        <div style={{ color: '#555', fontSize: '0.78rem', marginTop: 4 }}>👥 Student auth: Google OAuth (Supabase)</div>
      </div>
      {msg && <p style={{ color: '#51cf66', fontSize: '0.82rem', marginTop: 12 }}>{msg}</p>}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// SUBMISSIONS
// ─────────────────────────────────────────────────────────────────────────────
function Submissions({ token }: { token: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'contact' | 'bug'>('all');

  useEffect(() => {
    fetch('/api/admin/submissions', { headers: { 'x-admin-token': token } })
      .then(r => r.json())
      .then(({ data }) => { setRows(data || []); setLoading(false); });
  }, [token]);

  const deleteRow = async (id: string) => {
    if (!confirm('Delete this submission?')) return;
    await fetch('/api/admin/submissions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ id }),
    });
    setRows(r => r.filter(x => x.id !== id));
  };

  const visible = rows.filter(r => filter === 'all' || r.type === filter);
  if (loading) return <div style={{ padding: 32, color: '#444' }}>Loading...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h3 style={{ color: '#fff', fontFamily: 'serif', margin: 0 }}>Submissions</h3>
        <span style={{ color: '#555', fontSize: '0.8rem' }}>{rows.length} total</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {(['all', 'contact', 'bug'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 12px', borderRadius: 5, cursor: 'pointer', fontSize: '0.78rem', background: filter === f ? 'rgba(212,168,67,0.12)' : 'transparent', border: filter === f ? '1px solid rgba(212,168,67,0.3)' : '1px solid #222', color: filter === f ? '#d4a843' : '#555' }}>{f === 'all' ? 'All' : f === 'contact' ? '✉ Contact' : '🐛 Bug'}</button>
          ))}
        </div>
      </div>
      {visible.length === 0 ? (
        <div style={{ color: '#333', fontSize: '0.85rem', padding: '32px 0', textAlign: 'center' }}>No submissions yet.</div>
      ) : (
        visible.map(row => (
          <div key={row.id} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, background: row.type === 'bug' ? 'rgba(255,80,80,0.1)' : 'rgba(212,168,67,0.1)', border: row.type === 'bug' ? '1px solid rgba(255,80,80,0.25)' : '1px solid rgba(212,168,67,0.25)', color: row.type === 'bug' ? '#ff8080' : '#d4a843' }}>{row.type === 'bug' ? '🐛 Bug' : '✉ Contact'}</span>
              {row.name && <span style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: 600 }}>{row.name}</span>}
              {row.email && <span style={{ color: '#555', fontSize: '0.78rem' }}>{row.email}</span>}
              {row.page && <span style={{ color: '#777', fontSize: '0.78rem' }}>• {row.page}</span>}
              <span style={{ marginLeft: 'auto', color: '#333', fontSize: '0.72rem' }}>{new Date(row.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              <button onClick={() => deleteRow(row.id)} style={{ padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.72rem', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff8080' }}>✕</button>
            </div>
            <p style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{row.message}</p>
          </div>
        ))
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
type Tab = 'notes' | 'posts' | 'analytics' | 'submissions' | 'settings';

export default function AdminPage() {
  const { authed, checking, login, logout, token } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('notes');

  if (checking) return <div style={{ background: '#000', minHeight: '100vh' }} />;
  if (!authed) return <LoginScreen onLogin={login} />;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'notes',     label: 'Note Editor', icon: '📝' },
    { id: 'posts',     label: 'Posts',       icon: '📰' },
    { id: 'analytics', label: 'Analytics',   icon: '📊' },
    { id: 'submissions', label: 'Submissions', icon: '📬' },
    { id: 'settings',  label: 'Settings',    icon: '⚙️' },
  ];

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ height: 52, background: '#050505', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12 }}>
        <span style={{ color: '#d4a843', fontWeight: 700, fontSize: '0.9rem' }}>⚙ Admin Panel</span>
        <span style={{ color: '#2a2a2a', fontSize: '0.75rem' }}>History Optional</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', background: tab === t.id ? 'rgba(212,168,67,0.12)' : 'transparent', border: tab === t.id ? '1px solid rgba(212,168,67,0.3)' : '1px solid transparent', color: tab === t.id ? '#d4a843' : '#555', transition: 'all 0.15s' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'notes'     && <NoteEditor token={token} />}
      {tab === 'posts'     && <PostsManager token={token} />}
      {tab === 'analytics' && <Analytics token={token} />}
      {tab === 'submissions' && <Submissions token={token} />}
      {tab === 'settings'  && <Settings onLogout={logout} token={token} />}
    </div>
  );
}
