'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

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

const SESSION_KEY = 'histopt_admin_v2';

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [token, setToken] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editPublished, setEditPublished] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      fetch('/api/admin/verify-token', { headers: { 'x-admin-token': stored } }).then(r => {
        if (r.ok) { setAuthed(true); setToken(stored); }
      });
    }

    const headers: Record<string, string> = {};
    if (stored) headers['x-admin-token'] = stored;

    fetch(`/api/admin/blog-posts/${id}`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(({ data }) => {
        if (data) {
          setPost(data);
          setEditTitle(data.title);
          setEditExcerpt(data.excerpt || '');
          setEditTags(data.tags?.join(', ') || '');
          setEditPublished(data.published);
        } else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const startEdit = () => {
    setEditing(true);
    setTimeout(() => {
      if (contentRef.current) contentRef.current.focus();
    }, 100);
  };

  const save = async () => {
    if (!post) return;
    setSaving(true);
    const updatedPost = {
      ...post,
      title: editTitle,
      excerpt: editExcerpt,
      tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
      published: editPublished,
      content: contentRef.current?.innerHTML || post.content,
      updated_at: new Date().toISOString(),
    };
    const res = await fetch('/api/admin/blog-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify(updatedPost),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) {
      setPost(updatedPost);
      setEditing(false);
      setSavedMsg('Saved!');
      setTimeout(() => setSavedMsg(''), 2000);
    } else {
      setSavedMsg('Save failed');
      setTimeout(() => setSavedMsg(''), 2000);
    }
  };

  const cancel = () => {
    setEditing(false);
    setEditTitle(post?.title || '');
    setEditExcerpt(post?.excerpt || '');
    setEditTags(post?.tags?.join(', ') || '');
    setEditPublished(post?.published ?? true);
    if (contentRef.current && post) contentRef.current.innerHTML = post.content;
  };

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: '0.9rem' }}>
      Loading…
    </div>
  );

  if (notFound || !post) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ color: 'var(--text3)', fontSize: '0.95rem' }}>Post not found.</p>
      <button onClick={() => router.back()} style={backBtnStyle}>← Go back</button>
    </div>
  );

  return (
    <main style={{ maxWidth: 740, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button onClick={() => router.back()} style={backBtnStyle}>← Back</button>
        {authed && !editing && (
          <button onClick={startEdit} style={{
            padding: '6px 16px', borderRadius: 7, cursor: 'pointer',
            fontSize: '0.82rem', fontWeight: 600,
            background: 'rgba(212,168,67,0.10)', border: '1px solid rgba(212,168,67,0.35)',
            color: '#d4a843', transition: 'all 0.15s',
          }}>
            ✏️ Edit
          </button>
        )}
        {authed && editing && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {savedMsg && <span style={{ fontSize: '0.78rem', color: savedMsg === 'Saved!' ? '#51cf66' : '#f55' }}>{savedMsg}</span>}
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
              <span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>Published</span>
              <input type="checkbox" checked={editPublished} onChange={e => setEditPublished(e.target.checked)} style={{ accentColor: '#51cf66' }} />
            </label>
            <button onClick={cancel} style={{
              padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: '0.82rem',
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)',
            }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{
              padding: '6px 16px', borderRadius: 7, cursor: saving ? 'default' : 'pointer',
              fontSize: '0.82rem', fontWeight: 600,
              background: 'rgba(81,207,102,0.12)', border: '1px solid rgba(81,207,102,0.4)',
              color: '#51cf66', opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Edit mode: meta fields */}
      {editing && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 10, padding: '16px 20px', marginBottom: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            placeholder="Title..."
            style={{
              background: 'transparent', border: 'none', borderBottom: '2px solid var(--accent2)',
              color: 'var(--text)', fontSize: '1.2rem', fontWeight: 700,
              fontFamily: 'var(--font-display)', padding: '4px 0', outline: 'none', width: '100%',
              caretColor: '#d4a843',
            }}
          />
          <input
            value={editExcerpt}
            onChange={e => setEditExcerpt(e.target.value)}
            placeholder="Excerpt..."
            style={{
              background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
              color: 'var(--text2)', fontSize: '0.9rem', padding: '4px 0', outline: 'none', width: '100%',
            }}
          />
          <input
            value={editTags}
            onChange={e => setEditTags(e.target.value)}
            placeholder="Tags (comma separated)..."
            style={{
              background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
              color: 'var(--text3)', fontSize: '0.78rem', padding: '4px 0', outline: 'none', width: '100%',
            }}
          />
        </div>
      )}

      {/* Cover image */}
      {post.cover_image && (
        <div style={{ width: '100%', height: 340, borderRadius: 12, overflow: 'hidden', marginBottom: '2rem' }}>
          <img src={post.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Tags */}
      {!editing && post.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem' }}>
          {post.tags.map(tag => (
            <span key={tag} style={{
              padding: '3px 10px', borderRadius: 5, fontSize: '0.7rem',
              background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border2)',
            }}>{tag}</span>
          ))}
        </div>
      )}

      {/* Title (view mode) */}
      {!editing && (
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
          fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, margin: '0 0 0.75rem',
        }}>
          {post.title}
        </h1>
      )}

      {/* Excerpt (view mode) */}
      {!editing && post.excerpt && (
        <p style={{
          fontSize: '1.05rem', color: 'var(--text2)', lineHeight: 1.6, margin: '0 0 0.75rem',
          fontStyle: 'italic', borderLeft: '3px solid var(--accent2)', paddingLeft: '0.85rem',
        }}>
          {post.excerpt}
        </p>
      )}

      {/* Date + type pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{
          padding: '2px 9px', borderRadius: 5, fontSize: '0.68rem',
          background: 'rgba(212,168,67,0.10)', border: '1px solid rgba(212,168,67,0.25)',
          color: '#d4a843', fontWeight: 600,
        }}>
          {post.type === 'current-affairs' ? '📰 Current Affairs' : '📄 New Note'}
        </span>
        <span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>
          {new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        {!post.published && authed && (
          <span style={{
            padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem',
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border2)',
            color: 'var(--text3)', fontWeight: 700,
          }}>DRAFT</span>
        )}
      </div>

      {/* Article body — editable when in edit mode */}
      {editing && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 8, marginBottom: 8,
          padding: '4px 0',
        }}>
          {/* Inline toolbar */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 3, padding: '8px 12px',
            borderBottom: '1px solid var(--border)', background: 'var(--bg3)',
          }}>
            {[
              ['B', 'bold'], ['I', 'italic'], ['U', 'underline'],
              ['H1', 'formatBlock', 'h1'], ['H2', 'formatBlock', 'h2'], ['H3', 'formatBlock', 'h3'],
              ['P', 'formatBlock', 'p'], ['• List', 'insertUnorderedList'], ['1. List', 'insertOrderedList'],
              ['Undo', 'undo'], ['Redo', 'redo'], ['Clear', 'removeFormat'],
            ].map(([label, cmd, val], i) => (
              <button key={i}
                onMouseDown={e => { e.preventDefault(); document.execCommand(cmd, false, val); contentRef.current?.focus(); }}
                style={{
                  padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text2)',
                }}
              >{label}</button>
            ))}
          </div>
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: post.content }}
            style={{
              minHeight: 400, padding: '20px 24px', outline: 'none',
              color: 'var(--text)', fontSize: '1.05rem', lineHeight: 1.85,
              fontFamily: 'Georgia, "Times New Roman", serif',
              caretColor: '#d4a843',
            }}
          />
        </div>
      )}

      {!editing && (
        <div
          className="note-content article-body"
          dangerouslySetInnerHTML={{ __html: post.content }}
          style={{ color: 'var(--text)', fontSize: '1.05rem', lineHeight: 1.85 }}
        />
      )}

      {/* Bottom */}
      <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
        <button onClick={() => router.back()} style={backBtnStyle}>← Back to Home</button>
      </div>
    </main>
  );
}

const backBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  marginBottom: '1.5rem', padding: '6px 14px', borderRadius: 7,
  cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
  background: 'var(--bg2)', border: '1px solid var(--border)',
  color: 'var(--text2)', transition: 'border-color 0.15s, color 0.15s',
};
