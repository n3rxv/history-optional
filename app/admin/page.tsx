'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { allNotes as notes } from '@/lib/notes';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type PostType = 'current-affairs' | 'new-note';
type Tab = 'dashboard' | 'notes' | 'posts' | 'notifications' | 'submissions' | 'analytics' | 'settings';

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
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Syne:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
    ::-webkit-scrollbar-thumb:hover { background: #d4a843; }
    .cms-nav-item { transition: all 0.15s ease; }
    .cms-nav-item:hover { background: rgba(212,168,67,0.06) !important; color: #d4a843 !important; }
    .cms-nav-item.active { background: rgba(212,168,67,0.1) !important; color: #d4a843 !important; border-left: 2px solid #d4a843 !important; }
    .cms-btn { transition: all 0.12s ease; }
    .cms-btn:hover { opacity: 0.85; transform: translateY(-1px); }
    .cms-btn:active { transform: translateY(0); }
    .cms-card { transition: border-color 0.15s ease; }
    .cms-card:hover { border-color: #2a2a2a !important; }
    .cms-input { transition: border-color 0.15s ease, box-shadow 0.15s ease; }
    .cms-input:focus { border-color: rgba(212,168,67,0.5) !important; box-shadow: 0 0 0 3px rgba(212,168,67,0.08); outline: none; }
    .cms-select { transition: border-color 0.15s ease; }
    .cms-select:focus { border-color: rgba(212,168,67,0.5) !important; outline: none; }
    [contenteditable]:focus { outline: none; }
    .pulse-dot { animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
    .slide-in { animation: slideIn 0.2s ease; }
    @keyframes slideIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
    .fade-in { animation: fadeIn 0.25s ease; }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    .stat-num { animation: countUp 0.6s ease; }
    @keyframes countUp { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
    .post-row { transition: background 0.12s; }
    .post-row:hover { background: #111 !important; }
    .note-item { transition: all 0.1s; }
    .note-item:hover { background: rgba(255,255,255,0.03) !important; }
    .tag-chip { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:0.7rem; font-weight:500; background:rgba(212,168,67,0.1); border:1px solid rgba(212,168,67,0.2); color:#d4a843; font-family:'JetBrains Mono',monospace; }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────────────────────────────────────────
async function apiCall(url: string, method: string, body?: object, token?: string) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { 'x-admin-token': token } : {}) },
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

  const logout = () => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); setToken(''); };
  return { authed, checking, login, logout, token };
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,168,67,0.04) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
      
      <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 16, padding: '3rem 2.5rem', width: 380, textAlign: 'center', position: 'relative' }}>
        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 60, height: 2, background: 'linear-gradient(90deg, transparent, #d4a843, transparent)', borderRadius: 1 }} />
        
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 22 }}>⚡</div>
        
        <h2 style={{ color: '#fff', fontFamily: "'DM Serif Display', serif", fontSize: '1.6rem', marginBottom: 4, fontWeight: 400 }}>Command Center</h2>
        <p style={{ color: '#3a3a3a', fontSize: '0.78rem', marginBottom: 28, fontFamily: "'Syne', sans-serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>History Optional · Admin</p>
        
        <input
          type="password" value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Enter access key"
          className="cms-input"
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8, background: '#111', border: err ? '1px solid rgba(255,80,80,0.5)' : '1px solid #222', color: '#e0e0e0', fontSize: '0.9rem', marginBottom: 14, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}
        />
        <button onClick={submit} disabled={loading} className="cms-btn"
          style={{ width: '100%', padding: '0.75rem', borderRadius: 8, background: loading ? 'rgba(212,168,67,0.3)' : '#d4a843', border: 'none', color: '#000', fontSize: '0.88rem', fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: "'Syne', sans-serif", letterSpacing: '0.05em' }}>
          {loading ? 'Verifying...' : 'Enter →'}
        </button>
        {err && <p style={{ color: '#f55', fontSize: '0.75rem', marginTop: 10, fontFamily: 'monospace' }}>⚠ Access denied</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: Tab; label: string; icon: string; badge?: string }[] = [
  { id: 'dashboard',     label: 'Dashboard',      icon: '◈' },
  { id: 'notes',         label: 'Note Editor',    icon: '✦' },
  { id: 'posts',         label: 'Posts',          icon: '◎' },
  { id: 'notifications', label: 'Notifications',  icon: '◉' },
  { id: 'submissions',   label: 'Submissions',    icon: '◇' },
  { id: 'analytics',     label: 'Analytics',      icon: '▦' },
  { id: 'settings',      label: 'Settings',       icon: '◌' },
];

function Sidebar({ tab, setTab, onLogout }: { tab: Tab; setTab: (t: Tab) => void; onLogout: () => void }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ width: 220, flexShrink: 0, background: '#060606', borderRight: '1px solid #141414', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #111' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#d4a843' }}>⚡</div>
          <div>
            <div style={{ color: '#d4a843', fontSize: '0.82rem', fontWeight: 700, fontFamily: "'Syne', sans-serif", letterSpacing: '0.04em' }}>HISTOPT</div>
            <div style={{ color: '#2a2a2a', fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>CMS v2</div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #0d0d0d', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className="pulse-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#51cf66' }} />
        <span style={{ color: '#2a2a2a', fontSize: '0.67rem', fontFamily: "'JetBrains Mono', monospace" }}>LIVE · {timeStr}</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflow: 'auto' }}>
        {NAV_ITEMS.map(item => (
          <div key={item.id} onClick={() => setTab(item.id)}
            className={`cms-nav-item ${tab === item.id ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 2, color: tab === item.id ? '#d4a843' : '#383838', borderLeft: '2px solid transparent', fontSize: '0.82rem', fontFamily: "'Syne', sans-serif', fontWeight: tab === item.id ? 600 : 400" }}>
            <span style={{ fontSize: '0.9rem', width: 16, textAlign: 'center' }}>{item.icon}</span>
            <span style={{ letterSpacing: '0.02em' }}>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #0d0d0d' }}>
        <div style={{ background: '#0a0a0a', border: '1px solid #141414', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
          <div style={{ color: '#222', fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>SESSION ACTIVE</div>
          <div style={{ color: '#444', fontSize: '0.67rem' }}>Supabase · Mumbai</div>
        </div>
        <button onClick={onLogout} className="cms-btn"
          style={{ width: '100%', padding: '7px', borderRadius: 7, cursor: 'pointer', background: 'transparent', border: '1px solid #1a1a1a', color: '#333', fontSize: '0.75rem', fontFamily: "'Syne', sans-serif" }}>
          ⏻ Sign out
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ token, setTab }: { token: string; setTab: (t: Tab) => void }) {
  const [overrideCount, setOverrideCount] = useState(0);
  const [postStats, setPostStats] = useState({ total: 0, published: 0 });
  const [notifCount, setNotifCount] = useState(0);
  const [submissions, setSubmissions] = useState(0);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const totalNotes = notes.length;

  useEffect(() => {
    fetch('/api/admin/note-content', { headers: { 'x-admin-token': token } })
      .then(r => r.json()).then(({ data }) => setOverrideCount(data?.length || 0));
    fetch('/api/admin/blog-posts?all=true', { headers: { 'x-admin-token': token } })
      .then(r => r.json()).then(({ data }) => {
        if (data) { setPostStats({ total: data.length, published: data.filter((p: Post) => p.published).length }); setRecentPosts(data.slice(0, 4)); }
      });
    fetch('/api/notifications-admin', { headers: { 'x-admin-token': token } })
      .then(r => r.json()).then(({ data }) => setNotifCount(data?.length || 0));
    fetch('/api/admin/submissions', { headers: { 'x-admin-token': token } })
      .then(r => r.json()).then(({ data }) => setSubmissions(data?.length || 0));
  }, [token]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const StatCard = ({ value, label, sub, accent, onClick }: { value: number | string; label: string; sub?: string; accent?: string; onClick?: () => void }) => (
    <div onClick={onClick} className="cms-card" style={{ background: '#0a0a0a', border: '1px solid #141414', borderRadius: 12, padding: '18px 20px', cursor: onClick ? 'pointer' : 'default', position: 'relative', overflow: 'hidden' }}>
      {accent && <div style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderRadius: '0 12px 0 100%', background: `rgba(${accent},0.08)` }} />}
      <div className="stat-num" style={{ color: '#d4a843', fontSize: '2rem', fontWeight: 700, fontFamily: "'DM Serif Display', serif", lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#888', fontSize: '0.78rem', marginTop: 8, fontFamily: "'Syne', sans-serif" }}>{label}</div>
      {sub && <div style={{ color: '#333', fontSize: '0.68rem', marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>{sub}</div>}
    </div>
  );

  return (
    <div className="fade-in" style={{ padding: '28px 32px', maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ color: '#333', fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <h1 style={{ color: '#fff', fontFamily: "'DM Serif Display', serif", fontSize: '2rem', fontWeight: 400, marginBottom: 4 }}>{greeting()}, Commander.</h1>
        <p style={{ color: '#333', fontSize: '0.82rem', fontFamily: "'Syne', sans-serif" }}>Your History Optional content dashboard is ready.</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
        <StatCard value={totalNotes} label="Total Notes" sub="across all sections" onClick={() => setTab('notes')} />
        <StatCard value={overrideCount} label="Cloud Edits" sub="saved to Supabase" onClick={() => setTab('notes')} />
        <StatCard value={postStats.published} label="Published Posts" sub={`${postStats.total} total`} onClick={() => setTab('posts')} />
        <StatCard value={notifCount} label="Notifications" sub="active bell items" onClick={() => setTab('notifications')} />
        <StatCard value={submissions} label="Submissions" sub="contact & bug reports" onClick={() => setTab('submissions')} />
        <StatCard value={`${notes.filter(n => n.paper === 1).length}/${notes.filter(n => n.paper === 2).length}`} label="Paper I / II" sub="note distribution" />
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: '#333', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14, fontFamily: "'JetBrains Mono', monospace" }}>Quick Actions</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: '+ New Post', tab: 'posts', color: '#d4a843' },
            { label: '✦ Edit Notes', tab: 'notes', color: '#818cf8' },
            { label: '◉ Add Notification', tab: 'notifications', color: '#51cf66' },
            { label: '◇ View Submissions', tab: 'submissions', color: '#f59e0b' },
          ].map(a => (
            <button key={a.tab} onClick={() => setTab(a.tab as Tab)} className="cms-btn"
              style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`, color: a.color, fontFamily: "'Syne', sans-serif" }}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent posts */}
      {recentPosts.length > 0 && (
        <div>
          <div style={{ color: '#333', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14, fontFamily: "'JetBrains Mono', monospace" }}>Recent Posts</div>
          <div style={{ background: '#0a0a0a', border: '1px solid #141414', borderRadius: 12, overflow: 'hidden' }}>
            {recentPosts.map((p, i) => (
              <div key={p.id} className="post-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < recentPosts.length - 1 ? '1px solid #0d0d0d' : 'none' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.published ? '#51cf66' : '#2a2a2a', flexShrink: 0 }} />
                <span style={{ color: '#888', fontSize: '0.82rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Syne', sans-serif" }}>{p.title || 'Untitled'}</span>
                <span style={{ color: '#2a2a2a', fontSize: '0.68rem', fontFamily: "'JetBrains Mono', monospace" }}>{new Date(p.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', background: p.type === 'current-affairs' ? 'rgba(212,168,67,0.08)' : 'rgba(78,205,196,0.08)', color: p.type === 'current-affairs' ? '#d4a843' : '#4ecdc4', border: `1px solid ${p.type === 'current-affairs' ? 'rgba(212,168,67,0.2)' : 'rgba(78,205,196,0.2)'}`, fontFamily: "'JetBrains Mono', monospace" }}>
                  {p.type === 'current-affairs' ? 'CA' : 'NOTE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
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
  const cmd = (command: string, value?: string) => { document.execCommand(command, false, value); editorRef.current?.focus(); };
  const insertBlockquote = () => { document.execCommand('formatBlock', false, 'blockquote'); editorRef.current?.focus(); };
  const insertColorPicker = () => { const color = prompt('Hex color (e.g. #e63946):'); if (color) cmd('foreColor', color); };
  const insertHighlight = () => { const color = prompt('Highlight color:') || '#fff3cd'; cmd('hiliteColor', color); };

  const btn = (label: string, action: () => void, title: string, accent?: boolean) => (
    <button onClick={action} title={title} className="cms-btn"
      style={{ padding: '3px 9px', borderRadius: 5, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: accent ? 'rgba(212,168,67,0.1)' : 'rgba(255,255,255,0.04)', border: accent ? '1px solid rgba(212,168,67,0.25)' : '1px solid rgba(255,255,255,0.07)', color: accent ? '#d4a843' : '#666', fontFamily: "'JetBrains Mono', monospace" }}>
      {label}
    </button>
  );

  const divider = () => <div style={{ width: 1, height: 16, background: '#1a1a1a', margin: '0 3px' }} />;

  return (
    <div style={{ padding: '6px 12px', borderBottom: '1px solid #0d0d0d', display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', background: '#040404' }}>
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
      <button onClick={() => { const url = prompt('URL:'); if (url) cmd('createLink', url); }} title="Insert link" className="cms-btn"
        style={{ padding: '3px 9px', borderRadius: 5, cursor: 'pointer', fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#666' }}>🔗</button>
      {divider()}
      {btn('🖼 Img', onImageInsert, 'Insert image', true)}
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
  const editorRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/admin/note-content', { headers: { 'x-admin-token': token } })
      .then(r => r.json()).then(({ data }) => {
        if (data) { const map: Record<string, string> = {}; data.forEach((row: { slug: string; content: string }) => { map[row.slug] = row.content; }); setOverrides(map); }
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

  const currentContent = useCallback(() => overrides[selectedSlug] ?? originalContent[selectedSlug] ?? '', [overrides, selectedSlug, originalContent]);

  useEffect(() => {
    const content = currentContent();
    if (mode === 'wysiwyg' && editorRef.current) editorRef.current.innerHTML = content;
    else if (mode === 'html') setHtmlValue(content);
  }, [selectedSlug, mode, originalContent]);

  const saveToSupabase = async (html: string) => {
    setSaving(true);
    const res = await apiCall('/api/admin/note-content', 'POST', { slug: selectedSlug, content: html }, token);
    setSaving(false);
    if (res.ok) { setOverrides(prev => ({ ...prev, [selectedSlug]: html })); setSavedMsg('✓ Saved'); setTimeout(() => setSavedMsg(''), 2500); }
    else { setSavedMsg('⚠ Failed'); setTimeout(() => setSavedMsg(''), 2500); }
  };

  const scheduleAutoSave = (html: string) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveToSupabase(html), 1500);
  };

  const onEditorInput = () => { if (!editorRef.current) return; scheduleAutoSave(editorRef.current.innerHTML); };
  const onHtmlChange = (val: string) => { setHtmlValue(val); scheduleAutoSave(val); };
  const switchToWysiwyg = () => { setMode('wysiwyg'); setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = htmlValue; }, 0); };
  const switchToHtml = () => { const html = editorRef.current?.innerHTML || currentContent(); setHtmlValue(html); setMode('html'); };

  const resetToOriginal = async () => {
    if (!confirm('Reset to original content?')) return;
    await apiCall('/api/admin/note-content', 'DELETE', { slug: selectedSlug }, token);
    const updated = { ...overrides }; delete updated[selectedSlug]; setOverrides(updated);
    const orig = originalContent[selectedSlug] || '';
    if (mode === 'wysiwyg' && editorRef.current) editorRef.current.innerHTML = orig;
    else setHtmlValue(orig);
    setSavedMsg('Reset to original'); setTimeout(() => setSavedMsg(''), 2000);
  };

  const handleImageInsert = () => imgInputRef.current?.click();
  const onImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if ((reader.result as string).length > 500_000) { alert('Image too large! Use under 500KB.'); return; }
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
    document.execCommand('insertHTML', false, `<div style="position:relative;padding-bottom:56.25%;height:0;margin:12px 0;border-radius:8px;overflow:hidden;"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe></div>`);
    editorRef.current?.focus();
  };

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.section?.toLowerCase().includes(search.toLowerCase()));
  const hasOverride = !!overrides[selectedSlug];
  const selectedNote = notes.find(n => n.slug === selectedSlug);

  // Group notes by section
  const sections = [...new Set(filteredNotes.map(n => n.section))];

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageFile} />

      {/* Sidebar */}
      <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid #0d0d0d', display: 'flex', flexDirection: 'column', background: '#040404' }}>
        <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid #0d0d0d' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..."
            className="cms-input"
            style={{ width: '100%', padding: '7px 10px', borderRadius: 7, background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#888', fontSize: '0.78rem', fontFamily: "'JetBrains Mono', monospace" }} />
        </div>
        <div style={{ overflow: 'auto', flex: 1, padding: '6px 0' }}>
          {sections.map(section => (
            <div key={section}>
              <div style={{ padding: '8px 12px 4px', color: '#2a2a2a', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'JetBrains Mono', monospace" }}>{section}</div>
              {filteredNotes.filter(n => n.section === section).map(n => (
                <div key={n.slug} onClick={() => setSelectedSlug(n.slug)}
                  className="note-item"
                  style={{ padding: '7px 12px', cursor: 'pointer', background: selectedSlug === n.slug ? 'rgba(212,168,67,0.06)' : 'transparent', borderLeft: selectedSlug === n.slug ? '2px solid #d4a843' : '2px solid transparent', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: selectedSlug === n.slug ? '#d4a843' : '#3a3a3a', fontSize: '0.78rem', flex: 1, fontFamily: "'Syne', sans-serif" }}>{n.title}</span>
                  {overrides[n.slug] && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#51cf66', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 12px', borderTop: '1px solid #0d0d0d', fontSize: '0.65rem', color: '#2a2a2a', fontFamily: "'JetBrains Mono', monospace" }}>
          ☁ {Object.keys(overrides).length} cloud edits · {filteredNotes.length} notes
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #0d0d0d', display: 'flex', alignItems: 'center', gap: 10, background: '#050505', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <span style={{ color: '#555', fontSize: '0.82rem', fontFamily: "'Syne', sans-serif" }}>{selectedNote?.title}</span>
            {hasOverride && <span style={{ color: '#51cf66', marginLeft: 8, fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace" }}>● cloud</span>}
          </div>
          <div style={{ display: 'flex', borderRadius: 7, overflow: 'hidden', border: '1px solid #1a1a1a' }}>
            <button onClick={switchToWysiwyg} style={{ padding: '4px 12px', cursor: 'pointer', fontSize: '0.75rem', background: mode === 'wysiwyg' ? '#141414' : 'transparent', color: mode === 'wysiwyg' ? '#d4a843' : '#444', border: 'none', fontFamily: "'Syne', sans-serif" }}>✍ Edit</button>
            <button onClick={switchToHtml} style={{ padding: '4px 12px', cursor: 'pointer', fontSize: '0.75rem', background: mode === 'html' ? '#141414' : 'transparent', color: mode === 'html' ? '#d4a843' : '#444', border: 'none', borderLeft: '1px solid #1a1a1a', fontFamily: "'JetBrains Mono', monospace" }}>{'</>'} HTML</button>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {hasOverride && (
              <button onClick={resetToOriginal} className="cms-btn"
                style={{ padding: '4px 10px', borderRadius: 5, cursor: 'pointer', fontSize: '0.73rem', background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff8080', fontFamily: "'Syne', sans-serif" }}>
                Reset
              </button>
            )}
            <span style={{ fontSize: '0.7rem', color: saving ? '#d4a843' : savedMsg ? '#51cf66' : '#2a2a2a', fontFamily: "'JetBrains Mono', monospace", minWidth: 100, textAlign: 'right' }}>
              {saving ? '↑ saving...' : savedMsg || 'auto-saves'}
            </span>
          </div>
        </div>

        {mode === 'wysiwyg' && <EditorToolbar editorRef={editorRef} onImageInsert={handleImageInsert} onVideoInsert={handleVideoInsert} />}

        {mode === 'wysiwyg' && (
          <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={onEditorInput}
            style={{ flex: 1, padding: '32px 48px', overflow: 'auto', color: '#d0d0d0', fontFamily: 'Georgia, serif', fontSize: '1rem', lineHeight: 1.75, caretColor: '#d4a843', background: '#030303' }} />
        )}
        {mode === 'html' && (
          <textarea value={htmlValue} onChange={e => onHtmlChange(e.target.value)} spellCheck={false}
            style={{ flex: 1, padding: '16px 20px', background: '#030303', color: '#d4d4d4', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', lineHeight: 1.65, border: 'none', resize: 'none' }} />
        )}

        <div style={{ padding: '5px 16px', borderTop: '1px solid #0a0a0a', background: '#030303', fontSize: '0.65rem', color: '#1a1a1a', fontFamily: "'JetBrains Mono', monospace" }}>
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
  const [filter, setFilter] = useState<'all' | 'current-affairs' | 'new-note'>('all');
  const editorRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/blog-posts?all=true', { headers: { 'x-admin-token': token } })
      .then(r => r.json()).then(({ data }) => { if (data) setPosts(data); });
  }, [token]);

  const newPost = (type: PostType): Post => ({ id: Date.now().toString(), type, title: '', excerpt: '', content: '<p>Start writing here...</p>', tags: [], published_at: new Date().toISOString(), published: false });

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
    reader.onload = () => { document.execCommand('insertHTML', false, `<img src="${reader.result}" style="max-width:100%;border-radius:6px;margin:8px 0;" />`); editorRef.current?.focus(); };
    reader.readAsDataURL(file); e.target.value = '';
  };
  const handleVideoInsert = () => {
    const url = prompt('YouTube URL:'); if (!url) return;
    let embedUrl = url;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    document.execCommand('insertHTML', false, `<div style="position:relative;padding-bottom:56.25%;height:0;margin:12px 0;border-radius:8px;overflow:hidden;"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe></div>`);
    editorRef.current?.focus();
  };
  const onCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !editing) return;
    const reader = new FileReader();
    reader.onload = () => setEditing(prev => prev ? { ...prev, cover_image: reader.result as string } : prev);
    reader.readAsDataURL(file); e.target.value = '';
  };

  if (mode === 'edit') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageFile} />
        <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onCoverFile} />

        <div style={{ padding: '8px 16px', borderBottom: '1px solid #0d0d0d', display: 'flex', alignItems: 'center', gap: 10, background: '#050505', flexWrap: 'wrap' }}>
          <button onClick={() => { savePost(); setMode('list'); }} className="cms-btn"
            style={{ padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', background: 'transparent', border: '1px solid #1a1a1a', color: '#555', fontFamily: "'Syne', sans-serif" }}>
            ← Back
          </button>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.65rem', background: editing?.type === 'current-affairs' ? 'rgba(212,168,67,0.1)' : 'rgba(78,205,196,0.1)', color: editing?.type === 'current-affairs' ? '#d4a843' : '#4ecdc4', border: `1px solid ${editing?.type === 'current-affairs' ? 'rgba(212,168,67,0.25)' : 'rgba(78,205,196,0.25)'}`, fontFamily: "'JetBrains Mono', monospace" }}>
            {editing?.type === 'current-affairs' ? 'CURRENT AFFAIRS' : 'NEW NOTE'}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <span style={{ color: '#444', fontSize: '0.75rem', fontFamily: "'Syne', sans-serif" }}>Published</span>
              <input type="checkbox" checked={editing?.published || false}
                onChange={e => setEditing(prev => prev ? { ...prev, published: e.target.checked } : prev)}
                style={{ accentColor: '#51cf66' }} />
            </label>
            <button onClick={savePost} disabled={saving} className="cms-btn"
              style={{ padding: '5px 16px', borderRadius: 6, cursor: saving ? 'default' : 'pointer', fontSize: '0.8rem', fontWeight: 600, background: savedMsg ? 'rgba(81,207,102,0.12)' : 'rgba(212,168,67,0.12)', border: savedMsg ? '1px solid rgba(81,207,102,0.35)' : '1px solid rgba(212,168,67,0.35)', color: savedMsg ? '#51cf66' : '#d4a843', fontFamily: "'Syne', sans-serif" }}>
              {saving ? 'Saving...' : savedMsg || 'Save'}
            </button>
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderBottom: '1px solid #0a0a0a', background: '#040404', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: 2, minWidth: 220 }}>
            <input value={editing?.title || ''} onChange={e => setEditing(prev => prev ? { ...prev, title: e.target.value } : prev)}
              placeholder="Post title..."
              style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #1a1a1a', color: '#e0e0e0', fontSize: '1.2rem', fontWeight: 700, padding: '6px 0', fontFamily: "'DM Serif Display', serif" }} />
            <input value={editing?.excerpt || ''} onChange={e => setEditing(prev => prev ? { ...prev, excerpt: e.target.value } : prev)}
              placeholder="Short excerpt..."
              style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #0d0d0d', color: '#555', fontSize: '0.85rem', padding: '6px 0', marginTop: 8, fontFamily: "'Syne', sans-serif" }} />
            <input value={editing?.tags.join(', ') || ''} onChange={e => setEditing(prev => prev ? { ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) } : prev)}
              placeholder="Tags: Mughal, British Raj..."
              style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #0a0a0a', color: '#444', fontSize: '0.75rem', padding: '6px 0', marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }} />
          </div>
          <div style={{ flexShrink: 0 }}>
            <div onClick={() => coverInputRef.current?.click()}
              style={{ width: 120, height: 80, borderRadius: 8, border: '1px dashed #2a2a2a', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
              {editing?.cover_image
                ? <img src={editing.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: '#333', fontSize: '0.68rem', textAlign: 'center', fontFamily: "'Syne', sans-serif" }}>+ Cover</span>}
            </div>
            {editing?.cover_image && (
              <button onClick={() => setEditing(prev => prev ? { ...prev, cover_image: undefined } : prev)}
                style={{ marginTop: 4, background: 'none', border: 'none', color: '#f55', cursor: 'pointer', fontSize: '0.68rem', fontFamily: "'Syne', sans-serif" }}>Remove</button>
            )}
          </div>
        </div>

        <EditorToolbar editorRef={editorRef} onImageInsert={handleImageInsert} onVideoInsert={handleVideoInsert} />
        <div ref={editorRef} contentEditable suppressContentEditableWarning
          style={{ flex: 1, padding: '28px 40px', overflow: 'auto', color: '#d0d0d0', fontFamily: 'Georgia, serif', fontSize: '1rem', lineHeight: 1.75, caretColor: '#d4a843', background: '#030303' }} />
      </div>
    );
  }

  const filtered = filter === 'all' ? posts : posts.filter(p => p.type === filter);

  return (
    <div className="fade-in" style={{ padding: '24px 28px', maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', fontWeight: 400, flex: 1 }}>Posts</h2>
        <div style={{ display: 'flex', gap: 4, borderRadius: 8, border: '1px solid #141414', overflow: 'hidden' }}>
          {(['all', 'current-affairs', 'new-note'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 12px', cursor: 'pointer', fontSize: '0.72rem', background: filter === f ? '#141414' : 'transparent', color: filter === f ? '#d4a843' : '#444', border: 'none', fontFamily: "'Syne', sans-serif" }}>
              {f === 'all' ? 'All' : f === 'current-affairs' ? 'Current Affairs' : 'Articles'}
            </button>
          ))}
        </div>
        <button onClick={() => openEdit(newPost('current-affairs'))} className="cms-btn"
          style={{ padding: '7px 14px', borderRadius: 7, cursor: 'pointer', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)', color: '#d4a843', fontWeight: 600, fontSize: '0.78rem', fontFamily: "'Syne', sans-serif" }}>
          + CA Post
        </button>
        <button onClick={() => openEdit(newPost('new-note'))} className="cms-btn"
          style={{ padding: '7px 14px', borderRadius: 7, cursor: 'pointer', background: 'rgba(78,205,196,0.08)', border: '1px solid rgba(78,205,196,0.25)', color: '#4ecdc4', fontWeight: 600, fontSize: '0.78rem', fontFamily: "'Syne', sans-serif" }}>
          + Article
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ color: '#2a2a2a', fontSize: '0.85rem', padding: '48px 0', textAlign: 'center', fontFamily: "'Syne', sans-serif" }}>No posts yet.</div>
      ) : (
        <div style={{ background: '#0a0a0a', border: '1px solid #141414', borderRadius: 12, overflow: 'hidden' }}>
          {filtered.map((p, i) => (
            <div key={p.id} className="post-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < filtered.length - 1 ? '1px solid #0d0d0d' : 'none', background: '#0a0a0a' }}>
              {p.cover_image && <img src={p.cover_image} alt="" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#aaa', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Syne', sans-serif" }}>{p.title || <span style={{ color: '#333' }}>Untitled</span>}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                  {p.tags.slice(0, 3).map(t => <span key={t} className="tag-chip">{t}</span>)}
                  <span style={{ color: '#2a2a2a', fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace" }}>{new Date(p.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <span style={{ padding: '2px 9px', borderRadius: 5, fontSize: '0.65rem', background: p.published ? 'rgba(81,207,102,0.08)' : 'rgba(255,255,255,0.04)', color: p.published ? '#51cf66' : '#444', border: p.published ? '1px solid rgba(81,207,102,0.2)' : '1px solid #1a1a1a', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                {p.published ? 'LIVE' : 'DRAFT'}
              </span>
              <button onClick={() => togglePublish(p.id)} className="cms-btn" style={{ padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontSize: '0.7rem', background: 'transparent', border: '1px solid #1a1a1a', color: '#555', fontFamily: "'Syne', sans-serif" }}>{p.published ? 'Unpublish' : 'Publish'}</button>
              <button onClick={() => openEdit(p)} className="cms-btn" style={{ padding: '3px 10px', borderRadius: 5, cursor: 'pointer', fontSize: '0.75rem', background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.2)', color: '#d4a843', fontFamily: "'Syne', sans-serif" }}>Edit</button>
              <button onClick={() => deletePost(p.id)} className="cms-btn" style={{ padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontSize: '0.75rem', background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff8080' }}>✕</button>
            </div>
          ))}
        </div>
      )}
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
    fetch('/api/admin/note-content', { headers: { 'x-admin-token': token } }).then(r => r.json()).then(({ data }) => setOverrideCount(data?.length || 0));
    fetch('/api/admin/blog-posts?all=true', { headers: { 'x-admin-token': token } }).then(r => r.json()).then(({ data }) => {
      if (data) setPostStats({ total: data.length, published: data.filter((p: Post) => p.published).length });
    });
  }, [token]);

  return (
    <div className="fade-in" style={{ padding: '24px 28px', maxWidth: 800 }}>
      <h2 style={{ color: '#fff', fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', fontWeight: 400, marginBottom: 24 }}>Analytics</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { v: totalNotes, l: 'Total Notes' },
          { v: notes.filter(n => n.paper === 1).length, l: 'Paper I' },
          { v: notes.filter(n => n.paper === 2).length, l: 'Paper II' },
          { v: sections.length, l: 'Sections' },
          { v: overrideCount, l: 'Cloud Edits' },
          { v: postStats.total, l: 'Posts', s: `${postStats.published} live` },
        ].map(({ v, l, s }) => (
          <div key={l} style={{ background: '#0a0a0a', border: '1px solid #141414', borderRadius: 10, padding: '16px 18px' }}>
            <div className="stat-num" style={{ color: '#d4a843', fontSize: '1.8rem', fontWeight: 700, fontFamily: "'DM Serif Display', serif", lineHeight: 1 }}>{v}</div>
            <div style={{ color: '#666', fontSize: '0.78rem', marginTop: 6, fontFamily: "'Syne', sans-serif" }}>{l}</div>
            {s && <div style={{ color: '#333', fontSize: '0.65rem', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{s}</div>}
          </div>
        ))}
      </div>

      <div style={{ background: '#0a0a0a', border: '1px solid #141414', borderRadius: 12, padding: '20px 20px' }}>
        <div style={{ color: '#2a2a2a', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16, fontFamily: "'JetBrains Mono', monospace" }}>Notes Distribution</div>
        {sections.map(s => {
          const count = notes.filter(n => n.section === s).length;
          const pct = Math.round((count / totalNotes) * 100);
          return (
            <div key={s} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ color: '#666', fontSize: '0.78rem', fontFamily: "'Syne', sans-serif" }}>{s}</span>
                <span style={{ color: '#333', fontSize: '0.68rem', fontFamily: "'JetBrains Mono', monospace" }}>{count} · {pct}%</span>
              </div>
              <div style={{ height: 3, background: '#141414', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #d4a843, rgba(212,168,67,0.3))', borderRadius: 2, transition: 'width 0.6s ease' }} />
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

  const SettingRow = ({ icon, label, desc, btnLabel, onClick, danger }: { icon: string; label: string; desc: string; btnLabel: string; onClick: () => void; danger?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #0a0a0a' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: '1rem', width: 20, textAlign: 'center' }}>{icon}</span>
        <div>
          <div style={{ color: '#999', fontSize: '0.85rem', fontFamily: "'Syne', sans-serif" }}>{label}</div>
          <div style={{ color: '#333', fontSize: '0.72rem', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{desc}</div>
        </div>
      </div>
      <button onClick={onClick} className="cms-btn"
        style={{ padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', background: danger ? 'rgba(255,80,80,0.06)' : 'rgba(212,168,67,0.08)', border: danger ? '1px solid rgba(255,80,80,0.2)' : '1px solid rgba(212,168,67,0.2)', color: danger ? '#ff8080' : '#d4a843', fontFamily: "'Syne', sans-serif" }}>
        {btnLabel}
      </button>
    </div>
  );

  return (
    <div className="fade-in" style={{ padding: '24px 28px', maxWidth: 580 }}>
      <h2 style={{ color: '#fff', fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', fontWeight: 400, marginBottom: 24 }}>Settings</h2>

      <div style={{ background: '#0a0a0a', border: '1px solid #141414', borderRadius: 12, padding: '0 18px', marginBottom: 16 }}>
        <SettingRow icon="📦" label="Export Note Overrides" desc="Download all cloud edits as JSON backup" btnLabel="Export" onClick={exportOverrides} />
        <SettingRow icon="📄" label="Export Posts" desc="Backup all current affairs & articles" btnLabel="Export" onClick={exportPosts} />
        <SettingRow icon="⏻" label="Sign Out" desc="End admin session" btnLabel="Logout" onClick={onLogout} danger />
      </div>

      <div style={{ background: '#0a0a0a', border: '1px solid #141414', borderRadius: 12, padding: '14px 18px' }}>
        <div style={{ color: '#1a1a1a', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, fontFamily: "'JetBrains Mono', monospace" }}>System</div>
        {[
          ['☁', 'Storage', 'Supabase · Mumbai Region'],
          ['🔐', 'Auth', 'Server-side HMAC password'],
          ['👥', 'Students', 'Google OAuth via Supabase'],
        ].map(([icon, label, val]) => (
          <div key={label} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem' }}>{icon}</span>
            <span style={{ color: '#333', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace', width: 70" }}>{label}</span>
            <span style={{ color: '#222', fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace" }}>{val}</span>
          </div>
        ))}
      </div>

      {msg && <p style={{ color: '#51cf66', fontSize: '0.78rem', marginTop: 12, fontFamily: "'JetBrains Mono', monospace" }}>{msg}</p>}
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
      .then(r => r.json()).then(({ data }) => { setRows(data || []); setLoading(false); });
  }, [token]);

  const deleteRow = async (id: string) => {
    if (!confirm('Delete this submission?')) return;
    await fetch('/api/admin/submissions', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ id }) });
    setRows(r => r.filter(x => x.id !== id));
  };

  const visible = rows.filter(r => filter === 'all' || r.type === filter);
  if (loading) return <div style={{ padding: 32, color: '#333', fontFamily: "'Syne', sans-serif" }}>Loading...</div>;

  return (
    <div className="fade-in" style={{ padding: '24px 28px', maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', fontWeight: 400, flex: 1 }}>Submissions</h2>
        <span style={{ color: '#2a2a2a', fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace" }}>{rows.length} total</span>
        <div style={{ display: 'flex', gap: 4, borderRadius: 8, border: '1px solid #141414', overflow: 'hidden' }}>
          {(['all', 'contact', 'bug'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 12px', cursor: 'pointer', fontSize: '0.72rem', background: filter === f ? '#141414' : 'transparent', color: filter === f ? '#d4a843' : '#444', border: 'none', fontFamily: "'Syne', sans-serif" }}>
              {f === 'all' ? 'All' : f === 'contact' ? '✉ Contact' : '🐛 Bug'}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div style={{ color: '#2a2a2a', fontSize: '0.85rem', padding: '48px 0', textAlign: 'center', fontFamily: "'Syne', sans-serif" }}>No submissions yet.</div>
      ) : (
        visible.map(row => (
          <div key={row.id} className="cms-card slide-in" style={{ background: '#0a0a0a', border: '1px solid #141414', borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 600, background: row.type === 'bug' ? 'rgba(255,80,80,0.08)' : 'rgba(212,168,67,0.08)', border: row.type === 'bug' ? '1px solid rgba(255,80,80,0.2)' : '1px solid rgba(212,168,67,0.2)', color: row.type === 'bug' ? '#ff8080' : '#d4a843', fontFamily: "'JetBrains Mono', monospace" }}>
                {row.type === 'bug' ? 'BUG' : 'CONTACT'}
              </span>
              {row.name && <span style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: 600, fontFamily: "'Syne', sans-serif" }}>{row.name}</span>}
              {row.email && <span style={{ color: '#444', fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace" }}>{row.email}</span>}
              {row.page && <span style={{ color: '#333', fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace" }}>· {row.page}</span>}
              <span style={{ marginLeft: 'auto', color: '#2a2a2a', fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace" }}>{new Date(row.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              <button onClick={() => deleteRow(row.id)} className="cms-btn" style={{ padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem', background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.18)', color: '#ff8080' }}>✕</button>
            </div>
            <p style={{ color: '#666', fontSize: '0.83rem', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', fontFamily: "'Syne', sans-serif" }}>{row.message}</p>
          </div>
        ))
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS MANAGER
// ─────────────────────────────────────────────────────────────────────────────
function NotificationsManager({ token }: { token: string }) {
  const [notifications, setNotifications] = useState<{id:string,title:string,link:string,type:string,created_at:string}[]>([]);
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
    if (!form.title.trim() || !form.link.trim()) { flash('Title and link are required'); return; }
    setSaving(true);
    const res = await fetch('/api/notifications-admin', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify(form) });
    const data = await res.json(); setSaving(false);
    if (data.ok) { setForm({ title: '', link: '', type: 'announcement' }); flash('✓ Notification added'); load(); } else flash('⚠ Failed');
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    await fetch('/api/notifications-admin', { method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ id }) });
    setNotifications(n => n.filter(x => x.id !== id));
  };

  const startEdit = (n: {id:string,title:string,link:string,type:string,created_at:string}) => { setEditingId(n.id); setEditForm({ title: n.title, link: n.link, type: n.type }); };
  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    if (!editForm.title.trim() || !editForm.link.trim()) { flash('Title and link are required'); return; }
    setEditSaving(true);
    const res = await fetch('/api/notifications-admin', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ id, ...editForm }) });
    const data = await res.json(); setEditSaving(false);
    if (data.ok) { setNotifications(ns => ns.map(n => n.id === id ? { ...n, ...editForm } : n)); setEditingId(null); flash('✓ Updated'); } else flash('⚠ Failed');
  };

  const typeColor = (t: string) => t === 'note' ? '#4ecdc4' : t === 'current_affairs' ? '#818cf8' : '#d4a843';
  const typeLabel = (t: string) => t === 'note' ? 'NOTE' : t === 'current_affairs' ? 'CA' : 'ANN';

  const iStyle: React.CSSProperties = { padding: '7px 10px', borderRadius: 7, background: '#0d0d0d', border: '1px solid #1a1a1a', color: '#d0d0d0', fontSize: '0.82rem', fontFamily: "'JetBrains Mono', monospace" };

  return (
    <div className="fade-in" style={{ padding: '24px 28px', maxWidth: 700 }}>
      <h2 style={{ color: '#fff', fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', fontWeight: 400, marginBottom: 24 }}>Notifications</h2>

      {/* Add form */}
      <div style={{ background: '#0a0a0a', border: '1px solid #141414', borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
        <div style={{ color: '#2a2a2a', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14, fontFamily: "'JetBrains Mono', monospace" }}>New Notification</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title — e.g. New notes: Bhakti Movement added"
            className="cms-input" style={{ ...iStyle, width: '100%' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="/notes/bhakti-movement"
              className="cms-input" style={{ ...iStyle, flex: 1 }} />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="cms-select" style={{ ...iStyle, cursor: 'pointer', background: '#0d0d0d' }}>
              <option value="announcement">📢 Announcement</option>
              <option value="note">📄 Note</option>
              <option value="current_affairs">📰 Current Affairs</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={add} disabled={saving} className="cms-btn"
              style={{ padding: '8px 20px', borderRadius: 7, cursor: saving ? 'default' : 'pointer', fontSize: '0.82rem', fontWeight: 600, background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)', color: '#d4a843', fontFamily: "'Syne', sans-serif" }}>
              {saving ? 'Adding...' : '+ Add'}
            </button>
            {msg && <span style={{ fontSize: '0.75rem', color: msg.startsWith('✓') ? '#51cf66' : '#f87171', fontFamily: "'JetBrains Mono', monospace" }}>{msg}</span>}
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: '#333', fontSize: '0.82rem', padding: '20px 0', fontFamily: "'Syne', sans-serif" }}>Loading...</div>
      ) : notifications.length === 0 ? (
        <div style={{ color: '#1a1a1a', fontSize: '0.85rem', padding: '48px 0', textAlign: 'center', fontFamily: "'Syne', sans-serif" }}>No notifications yet.</div>
      ) : (
        <div>
          <div style={{ color: '#2a2a2a', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>{notifications.length} notifications</div>
          {notifications.map(n => editingId === n.id ? (
            <div key={n.id} className="slide-in" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 10, padding: '14px 16px', marginBottom: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className="cms-input" style={{ ...iStyle, width: '100%' }} autoFocus />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={editForm.link} onChange={e => setEditForm(f => ({ ...f, link: e.target.value }))}
                    className="cms-input" style={{ ...iStyle, flex: 1 }} />
                  <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                    className="cms-select" style={{ ...iStyle, cursor: 'pointer', background: '#0d0d0d' }}>
                    <option value="announcement">📢 Announcement</option>
                    <option value="note">📄 Note</option>
                    <option value="current_affairs">📰 Current Affairs</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => saveEdit(n.id)} disabled={editSaving} className="cms-btn"
                    style={{ padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(81,207,102,0.1)', border: '1px solid rgba(81,207,102,0.25)', color: '#51cf66', fontFamily: "'Syne', sans-serif" }}>
                    {editSaving ? 'Saving…' : '✓ Save'}
                  </button>
                  <button onClick={cancelEdit} className="cms-btn"
                    style={{ padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', background: 'transparent', border: '1px solid #1a1a1a', color: '#444', fontFamily: "'Syne', sans-serif" }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div key={n.id} className="cms-card slide-in" style={{ background: '#0a0a0a', border: '1px solid #141414', borderRadius: 10, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.62rem', fontFamily: "'JetBrains Mono', monospace", background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)`, color: typeColor(n.type), flexShrink: 0 }}>
                {typeLabel(n.type)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#d0d0d0', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Syne', sans-serif" }}>{n.title}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                  <span style={{ color: '#2a2a2a', fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace" }}>{n.link}</span>
                  <span style={{ color: '#1a1a1a', fontSize: '0.62rem', marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace" }}>{new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
              <button onClick={() => startEdit(n)} className="cms-btn"
                style={{ padding: '4px 10px', borderRadius: 5, cursor: 'pointer', fontSize: '0.73rem', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.18)', color: '#818cf8' }}>
                ✎
              </button>
              <button onClick={() => remove(n.id)} className="cms-btn"
                style={{ padding: '4px 10px', borderRadius: 5, cursor: 'pointer', fontSize: '0.73rem', background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.18)', color: '#ff8080' }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { authed, checking, login, logout, token } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('dashboard');

  if (checking) return <div style={{ background: '#050505', minHeight: '100vh' }} />;
  if (!authed) return (<><GlobalStyles /><LoginScreen onLogin={login} /></>);

  return (
    <>
      <GlobalStyles />
      <div style={{ display: 'flex', minHeight: '100vh', background: '#050505', color: '#fff' }}>
        <Sidebar tab={tab} setTab={setTab} onLogout={logout} />
        <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {tab === 'dashboard'     && <Dashboard token={token} setTab={setTab} />}
          {tab === 'notes'         && <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><NoteEditor token={token} /></div>}
          {tab === 'posts'         && <PostsManager token={token} />}
          {tab === 'notifications' && <NotificationsManager token={token} />}
          {tab === 'submissions'   && <Submissions token={token} />}
          {tab === 'analytics'     && <Analytics token={token} />}
          {tab === 'settings'      && <Settings onLogout={logout} token={token} />}
        </main>
      </div>
    </>
  );
}
