'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface Post {
  id: string;
  type: 'current-affairs' | 'new-note';
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  cover_image?: string;
  published_at: string;
  published: boolean;
}

// ─── tiny API helper ───────────────────────────────────────────────────────────
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

// ─── auth hook (same as admin panel) ──────────────────────────────────────────
const SESSION_KEY = 'histopt_admin_v2';

function useAdminAuth() {
  const [authed, setAuthed] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return;
    fetch('/api/admin/verify-token', { headers: { 'x-admin-token': stored } }).then(r => {
      if (r.ok) { setAuthed(true); setToken(stored); }
      else sessionStorage.removeItem(SESSION_KEY);
    });
  }, []);

  return { authed, token };
}

// ─── Editor Toolbar ────────────────────────────────────────────────────────────
function Toolbar({ editorRef, onImage, onVideo }: {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onImage: () => void;
  onVideo: () => void;
}) {
  const cmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const tools: Array<{ label: string; action: () => void; title: string; accent?: boolean; group?: boolean }> = [
    { label: 'B',      action: () => cmd('bold'),                    title: 'Bold' },
    { label: 'I',      action: () => cmd('italic'),                  title: 'Italic' },
    { label: 'U',      action: () => cmd('underline'),               title: 'Underline' },
    { label: 'S',      action: () => cmd('strikeThrough'),           title: 'Strikethrough', group: true },
    { label: 'H1',     action: () => cmd('formatBlock', 'h1'),       title: 'Heading 1' },
    { label: 'H2',     action: () => cmd('formatBlock', 'h2'),       title: 'Heading 2' },
    { label: 'H3',     action: () => cmd('formatBlock', 'h3'),       title: 'Heading 3' },
    { label: 'P',      action: () => cmd('formatBlock', 'p'),        title: 'Paragraph', group: true },
    { label: '• List', action: () => cmd('insertUnorderedList'),     title: 'Bullet list' },
    { label: '1. List',action: () => cmd('insertOrderedList'),       title: 'Numbered list' },
    { label: '" Quote',action: () => cmd('formatBlock', 'blockquote'), title: 'Blockquote', group: true },
    { label: 'A',      action: () => { const c = prompt('Hex color:'); if (c) cmd('foreColor', c); }, title: 'Text color' },
    { label: '🖍',     action: () => { const c = prompt('Highlight color:') || '#fff3cd'; cmd('hiliteColor', c); }, title: 'Highlight', group: true },
    { label: '↩',      action: () => cmd('undo'),                    title: 'Undo' },
    { label: '↪',      action: () => cmd('redo'),                    title: 'Redo' },
    { label: '✕ fmt',  action: () => cmd('removeFormat'),            title: 'Clear formatting', group: true },
    { label: '🖼',     action: onImage,                              title: 'Insert image', accent: true },
    { label: '▶',      action: onVideo,                              title: 'Insert video', accent: true },
  ];

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 3, padding: '8px 12px',
      background: 'var(--bg3)', borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      {tools.map((t, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
          {t.group && i > 0 && <span style={{ width: 1, height: 16, background: 'var(--border2)', margin: '0 3px' }} />}
          <button
            onMouseDown={e => { e.preventDefault(); t.action(); }}
            title={t.title}
            style={{
              padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
              fontSize: '0.75rem', fontWeight: 600,
              background: t.accent ? 'rgba(212,168,67,0.08)' : 'rgba(255,255,255,0.04)',
              border: t.accent ? '1px solid rgba(212,168,67,0.2)' : '1px solid var(--border)',
              color: t.accent ? '#d4a843' : 'var(--text2)',
            }}
          >{t.label}</button>
        </span>
      ))}
      <button
        onMouseDown={e => { e.preventDefault(); const url = prompt('URL:'); if (url) { document.execCommand('createLink', false, url); editorRef.current?.focus(); } }}
        title="Insert link"
        style={{ padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text2)' }}
      >🔗</button>
    </div>
  );
}

// ─── Inline Post Creator (WordPress-style) ─────────────────────────────────────
function PostCreator({ token, onSaved }: { token: string; onSaved: (post: Post) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'current-affairs' | 'new-note'>('current-affairs');
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState('');
  const [published, setPublished] = useState(true);
  const [coverImg, setCoverImg] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [activePanel, setActivePanel] = useState<'write' | 'preview'>('write');

  const editorRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle(''); setExcerpt(''); setTags(''); setCoverImg(undefined);
    setPublished(true); setSavedMsg(''); setActivePanel('write');
    if (editorRef.current) editorRef.current.innerHTML = '<p>Start writing your post here...</p>';
  };

  const handleImageInsert = () => imgInputRef.current?.click();
  const onImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if ((reader.result as string).length > 500_000) { alert('Image too large (max 500KB)'); return; }
      document.execCommand('insertHTML', false, `<img src="${reader.result}" style="max-width:100%;border-radius:6px;margin:8px 0;" />`);
      editorRef.current?.focus();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleVideoInsert = () => {
    const url = prompt('YouTube URL:'); if (!url) return;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    const embedUrl = match ? `https://www.youtube.com/embed/${match[1]}` : url;
    document.execCommand('insertHTML', false,
      `<div style="position:relative;padding-bottom:56.25%;height:0;margin:12px 0;border-radius:8px;overflow:hidden;">
         <iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe>
       </div>`
    );
    editorRef.current?.focus();
  };

  const onCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverImg(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const save = async () => {
    if (!title.trim()) { alert('Please add a title'); return; }
    const content = editorRef.current?.innerHTML || '';
    const post: Post = {
      id: Date.now().toString(),
      type,
      title: title.trim(),
      excerpt: excerpt.trim(),
      content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      cover_image: coverImg,
      published_at: new Date().toISOString(),
      published,
    };
    setSaving(true);
    const res = await apiCall('/api/admin/blog-posts', 'POST', post, token);
    setSaving(false);
    if (res.ok) {
      setSavedMsg('✓ Published!');
      onSaved(post);
      setTimeout(() => { setSavedMsg(''); setOpen(false); reset(); }, 1200);
    } else {
      setSavedMsg('⚠ Save failed');
      setTimeout(() => setSavedMsg(''), 2500);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
          background: 'rgba(212,168,67,0.08)', border: '1px dashed rgba(212,168,67,0.35)',
          color: '#d4a843', fontSize: '0.85rem', fontWeight: 600,
          marginBottom: '1.5rem', width: '100%', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.14)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.08)'; }}
      >
        <span style={{ fontSize: '1.1rem' }}>✍️</span> New Post
      </button>
    );
  }

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border2)',
      borderRadius: 12, overflow: 'hidden', marginBottom: '2rem',
      boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '10px 16px', background: 'var(--bg3)',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Type selector */}
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {(['current-affairs', 'new-note'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              padding: '4px 12px', cursor: 'pointer', fontSize: '0.75rem',
              background: type === t ? 'rgba(212,168,67,0.12)' : 'transparent',
              border: 'none',
              color: type === t ? '#d4a843' : 'var(--text3)',
              fontWeight: type === t ? 700 : 400,
            }}>
              {t === 'current-affairs' ? '📰 Current Affairs' : '📄 New Note'}
            </button>
          ))}
        </div>

        {/* Write / Preview toggle */}
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)', marginLeft: 4 }}>
          {(['write', 'preview'] as const).map(p => (
            <button key={p} onClick={() => setActivePanel(p)} style={{
              padding: '4px 12px', cursor: 'pointer', fontSize: '0.75rem',
              background: activePanel === p ? 'rgba(59,130,246,0.1)' : 'transparent',
              border: 'none',
              color: activePanel === p ? 'var(--accent)' : 'var(--text3)',
              fontWeight: activePanel === p ? 600 : 400,
            }}>
              {p === 'write' ? '✍ Write' : '👁 Preview'}
            </button>
          ))}
        </div>

        {/* Publish toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginLeft: 'auto' }}>
          <span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>Published</span>
          <input
            type="checkbox" checked={published}
            onChange={e => setPublished(e.target.checked)}
            style={{ accentColor: '#51cf66', width: 14, height: 14 }}
          />
        </label>

        <button onClick={save} disabled={saving} style={{
          padding: '5px 16px', borderRadius: 6, cursor: saving ? 'default' : 'pointer',
          fontSize: '0.82rem', fontWeight: 700,
          background: savedMsg?.startsWith('✓') ? 'rgba(81,207,102,0.15)' : 'rgba(212,168,67,0.15)',
          border: savedMsg?.startsWith('✓') ? '1px solid rgba(81,207,102,0.4)' : '1px solid rgba(212,168,67,0.4)',
          color: savedMsg?.startsWith('✓') ? '#51cf66' : '#d4a843',
          opacity: saving ? 0.7 : 1,
        }}>
          {saving ? 'Saving…' : savedMsg || 'Save'}
        </button>

        <button onClick={() => { setOpen(false); reset(); }} style={{
          padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem',
          background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)',
        }}>✕</button>
      </div>

      {activePanel === 'write' && (
        <>
          {/* Meta fields */}
          <div style={{ padding: '14px 20px 0', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: 2, minWidth: 220 }}>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Post title…"
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  borderBottom: '2px solid var(--border2)', color: 'var(--text)',
                  fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-display)',
                  padding: '4px 0', outline: 'none', boxSizing: 'border-box',
                  caretColor: '#d4a843',
                }}
                onFocus={e => (e.currentTarget.style.borderBottomColor = '#d4a843')}
                onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--border2)')}
              />
              <input
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                placeholder="Short excerpt shown on homepage…"
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  borderBottom: '1px solid var(--border)', color: 'var(--text2)',
                  fontSize: '0.88rem', padding: '6px 0', outline: 'none',
                  marginTop: 8, boxSizing: 'border-box',
                }}
              />
              <input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="Tags: Mughal, British Raj, UPSC 2024… (comma separated)"
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  borderBottom: '1px solid var(--border)', color: 'var(--text3)',
                  fontSize: '0.78rem', padding: '6px 0', outline: 'none',
                  marginTop: 6, boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Cover image picker */}
            <div>
              <div
                onClick={() => coverInputRef.current?.click()}
                style={{
                  width: 130, height: 88, borderRadius: 7,
                  border: '1px dashed var(--border2)', cursor: 'pointer',
                  overflow: 'hidden', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: 'var(--bg3)',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#d4a843')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
              >
                {coverImg
                  ? <img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: 'var(--text3)', fontSize: '0.7rem', textAlign: 'center', lineHeight: 1.4, padding: '0 8px' }}>🖼<br />Cover image</span>
                }
              </div>
              {coverImg && (
                <button
                  onClick={() => setCoverImg(undefined)}
                  style={{ marginTop: 4, background: 'none', border: 'none', color: '#f55', cursor: 'pointer', fontSize: '0.7rem' }}
                >Remove</button>
              )}
            </div>
          </div>

          {/* Hidden file inputs */}
          <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageFile} />
          <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onCoverFile} />

          {/* Toolbar */}
          <div style={{ marginTop: 12 }}>
            <Toolbar editorRef={editorRef} onImage={handleImageInsert} onVideo={handleVideoInsert} />
          </div>

          {/* Rich text editor */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            style={{
              minHeight: 260, padding: '20px 24px',
              outline: 'none', color: 'var(--text)',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '1rem', lineHeight: 1.8,
              caretColor: '#d4a843',
              background: 'var(--bg)',
            }}
            onFocus={() => {
              if (editorRef.current?.innerHTML === '<p>Start writing your post here...</p>') {
                editorRef.current.innerHTML = '';
              }
            }}
          />

          {/* Word count / status bar */}
          <div style={{
            padding: '6px 20px', background: 'var(--bg3)',
            borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: 'var(--text3)', fontSize: '0.7rem' }}>
              Rich text editor — supports images, videos, headings, lists & more
            </span>
            <span style={{ color: '#d4a843', fontSize: '0.7rem', opacity: 0.6 }}>
              {published ? '🟢 Will publish immediately' : '⚫ Draft — hidden from homepage'}
            </span>
          </div>
        </>
      )}

      {activePanel === 'preview' && (
        <div style={{ padding: 24 }}>
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 10, overflow: 'hidden', maxWidth: 680, margin: '0 auto',
          }}>
            {coverImg && (
              <div style={{ height: 200, overflow: 'hidden' }}>
                <img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ padding: '20px 24px' }}>
              {tags && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                  {tags.split(',').filter(Boolean).map(t => (
                    <span key={t} style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.68rem', background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border2)' }}>{t.trim()}</span>
                  ))}
                </div>
              )}
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text)', fontWeight: 700, margin: '0 0 8px' }}>
                {title || <span style={{ opacity: 0.3 }}>Untitled post</span>}
              </h2>
              {excerpt && <p style={{ color: 'var(--text2)', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 16px' }}>{excerpt}</p>}
              <div
                className="note-content"
                dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || '<p style="opacity:0.3">Nothing written yet…</p>' }}
                style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.8 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Section ──────────────────────────────────────────────────────────────
export default function CurrentAffairsSection() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'current-affairs' | 'new-note'>('current-affairs');
  const [expanded, setExpanded] = useState<string | null>(null);
  const { authed, token } = useAdminAuth();

  const fetchPosts = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) headers['x-admin-token'] = stored;

      // If admin, fetch all (including drafts); else only published
      const url = stored ? '/api/admin/blog-posts?all=true' : '/api/admin/blog-posts';
      const res = await fetch(url, { headers });
      const { data } = await res.json();
      if (data) setPosts(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const onPostSaved = (post: Post) => {
    setPosts(prev => {
      const exists = prev.find(p => p.id === post.id);
      return exists ? prev.map(p => p.id === post.id ? post : p) : [post, ...prev];
    });
  };

  // For non-admin: only published posts
  const visiblePosts = posts.filter(p =>
    (authed || p.published) && p.type === activeTab
  );

  const caCount = posts.filter(p => (authed || p.published) && p.type === 'current-affairs').length;
  const nnCount = posts.filter(p => (authed || p.published) && p.type === 'new-note').length;

  const hasAny = caCount + nnCount > 0 || authed;
  if (!hasAny && !loading) return null;

  return (
    <section style={{ marginBottom: '3rem' }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.3rem',
            color: 'var(--text)', margin: 0, fontWeight: 700,
          }}>
            Latest from History
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
            Current affairs &amp; new study material
          </p>
        </div>

        {/* Tab toggle */}
        {(caCount > 0 || nnCount > 0) && (
          <div style={{
            display: 'flex', background: 'var(--bg2)',
            border: '1px solid var(--border)', borderRadius: 8,
            padding: 3, gap: 2,
          }}>
            {([
              ['current-affairs', '📰 Current Affairs', caCount],
              ['new-note', '📄 New Notes', nnCount],
            ] as const).map(([id, label, count]) =>
              count > 0 && (
                <button key={id} onClick={() => setActiveTab(id)} style={{
                  padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem',
                  background: activeTab === id ? 'var(--accent-dim)' : 'transparent',
                  border: activeTab === id ? '1px solid var(--accent2)' : '1px solid transparent',
                  color: activeTab === id ? 'var(--accent)' : 'var(--text3)',
                  transition: 'all 0.15s', fontWeight: activeTab === id ? 600 : 400,
                }}>
                  {label} <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>({count})</span>
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Admin: inline post creator */}
      {authed && <PostCreator token={token} onSaved={onPostSaved} />}

      {/* Posts grid */}
      {loading ? (
        <div style={{ color: 'var(--text3)', fontSize: '0.82rem', padding: '16px 0' }}>
          Loading posts…
        </div>
      ) : visiblePosts.length === 0 ? (
        <div style={{ color: 'var(--text3)', fontSize: '0.82rem', padding: '16px 0' }}>
          {authed ? 'No posts yet — create one above.' : 'No posts yet.'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        }}>
          {visiblePosts.map(post => (
            <div
              key={post.id}
              style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                transition: 'border-color 0.15s, transform 0.15s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent2)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.transform = 'none';
              }}
              onClick={() => setExpanded(expanded === post.id ? null : post.id)}
            >
              {/* Draft badge (admin only) */}
              {authed && !post.published && (
                <div style={{
                  position: 'absolute', top: 10, right: 10, zIndex: 2,
                  padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border2)',
                  color: 'var(--text3)', fontWeight: 600,
                }}>DRAFT</div>
              )}

              {/* Cover image */}
              {post.cover_image && (
                <div style={{ height: 140, overflow: 'hidden' }}>
                  <img src={post.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ padding: '14px 16px' }}>
                {/* Tags */}
                {post.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                    {post.tags.slice(0, 3).map(tag => (
                      <span key={tag} style={{
                        padding: '2px 7px', borderRadius: 4, fontSize: '0.68rem',
                        background: 'var(--bg3)', color: 'var(--text3)',
                        border: '1px solid var(--border2)',
                      }}>{tag}</span>
                    ))}
                  </div>
                )}

                <h3 style={{
                  color: 'var(--text)', fontFamily: 'var(--font-display)',
                  fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px', lineHeight: 1.35,
                }}>
                  {post.title}
                </h3>

                {post.excerpt && (
                  <p style={{ color: 'var(--text2)', fontSize: '0.8rem', lineHeight: 1.5, margin: '0 0 10px' }}>
                    {post.excerpt}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text3)', fontSize: '0.7rem' }}>
                    {new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600 }}>
                    {expanded === post.id ? 'Close ↑' : 'Read →'}
                  </span>
                </div>
              </div>

              {/* Expanded content */}
              {expanded === post.id && (
                <div
                  className="note-content"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                  style={{
                    padding: '14px 16px 16px',
                    borderTop: '1px solid var(--border)',
                    color: 'var(--text)', fontSize: '0.88rem',
                    lineHeight: 1.7, maxHeight: 500, overflow: 'auto',
                  }}
                  onClick={e => e.stopPropagation()}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
