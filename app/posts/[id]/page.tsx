'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    const headers: Record<string, string> = {};
    if (stored) headers['x-admin-token'] = stored;

    fetch(`/api/admin/blog-posts/${id}`, { headers })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(({ data }) => {
        if (data) setPost(data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text3)', fontSize: '0.9rem',
    }}>
      Loading…
    </div>
  );

  if (notFound || !post) return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <p style={{ color: 'var(--text3)', fontSize: '0.95rem' }}>Post not found.</p>
      <button onClick={() => router.back()} style={backBtnStyle}>← Go back</button>
    </div>
  );

  return (
    <main style={{ maxWidth: 740, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>

      {/* Back button */}
      <button onClick={() => router.back()} style={backBtnStyle}>
        ← Back
      </button>

      {/* Cover image */}
      {post.cover_image && (
        <div style={{
          width: '100%', height: 340, borderRadius: 12,
          overflow: 'hidden', marginBottom: '2rem',
        }}>
          <img
            src={post.cover_image}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem' }}>
          {post.tags.map(tag => (
            <span key={tag} style={{
              padding: '3px 10px', borderRadius: 5, fontSize: '0.7rem',
              background: 'var(--bg3)', color: 'var(--text3)',
              border: '1px solid var(--border2)',
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
        fontWeight: 700,
        color: 'var(--text)',
        lineHeight: 1.2,
        margin: '0 0 0.75rem',
      }}>
        {post.title}
      </h1>

      {/* Excerpt / deck */}
      {post.excerpt && (
        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text2)',
          lineHeight: 1.6,
          margin: '0 0 0.75rem',
          fontStyle: 'italic',
          borderLeft: '3px solid var(--accent2)',
          paddingLeft: '0.85rem',
        }}>
          {post.excerpt}
        </p>
      )}

      {/* Date + type pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: '2rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{
          padding: '2px 9px', borderRadius: 5, fontSize: '0.68rem',
          background: 'rgba(212,168,67,0.10)', border: '1px solid rgba(212,168,67,0.25)',
          color: '#d4a843', fontWeight: 600,
        }}>
          {post.type === 'current-affairs' ? '📰 Current Affairs' : '📄 New Note'}
        </span>
        <span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>
          {new Date(post.published_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </span>
      </div>

      {/* Article body */}
      <div
        className="note-content article-body"
        dangerouslySetInnerHTML={{ __html: post.content }}
        style={{
          color: 'var(--text)',
          fontSize: '1.05rem',
          lineHeight: 1.85,
        }}
      />

      {/* Bottom back button */}
      <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
        <button onClick={() => router.back()} style={backBtnStyle}>← Back to Home</button>
      </div>
    </main>
  );
}

const backBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: '1.5rem',
  padding: '6px 14px',
  borderRadius: 7,
  cursor: 'pointer',
  fontSize: '0.82rem',
  fontWeight: 600,
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  color: 'var(--text2)',
  transition: 'border-color 0.15s, color 0.15s',
};
