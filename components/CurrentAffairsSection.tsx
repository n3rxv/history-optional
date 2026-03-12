'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const POSTS_KEY = 'histopt_posts';

interface Post {
  id: string;
  type: 'current-affairs' | 'new-note';
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  coverImage?: string;
  publishedAt: string;
  published: boolean;
}

export default function CurrentAffairsSection() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'current-affairs' | 'new-note'>('current-affairs');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(POSTS_KEY);
      if (raw) setPosts(JSON.parse(raw));
    } catch {}
    // Listen for storage changes (in case admin updates in another tab)
    const onStorage = () => {
      try { const raw = localStorage.getItem(POSTS_KEY); if (raw) setPosts(JSON.parse(raw)); } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const visible = posts.filter(p => p.published && p.type === activeTab);

  if (posts.filter(p => p.published).length === 0) return null;

  return (
    <section style={{ marginTop: '3rem', padding: '0 1.5rem 3rem' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--text)', margin: 0, fontWeight: 700 }}>
            Latest from History
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
            Current affairs &amp; new study material
          </p>
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 2 }}>
          {([['current-affairs', '📰 Current Affairs'], ['new-note', '📄 New Notes']] as const).map(([id, label]) => (
            posts.filter(p => p.published && p.type === id).length > 0 && (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem',
                background: activeTab === id ? 'var(--accent-dim)' : 'transparent',
                border: activeTab === id ? '1px solid var(--accent2)' : '1px solid transparent',
                color: activeTab === id ? 'var(--accent)' : 'var(--text3)',
                transition: 'all 0.15s', fontWeight: activeTab === id ? 600 : 400,
              }}>{label} <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>({posts.filter(p => p.published && p.type === id).length})</span></button>
            )
          ))}
        </div>
      </div>

      {/* Posts grid */}
      {visible.length === 0 ? (
        <div style={{ color: 'var(--text3)', fontSize: '0.82rem' }}>No posts yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {visible.map(post => (
            <div key={post.id}
              style={{
                background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10,
                overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
              onClick={() => setExpanded(expanded === post.id ? null : post.id)}
            >
              {/* Cover image */}
              {post.coverImage && (
                <div style={{ height: 140, overflow: 'hidden' }}>
                  <img src={post.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ padding: '14px 16px' }}>
                {/* Tags */}
                {post.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                    {post.tags.slice(0, 3).map(tag => (
                      <span key={tag} style={{ padding: '2px 7px', borderRadius: 4, fontSize: '0.68rem', background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border2)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <h3 style={{ color: 'var(--text)', fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px', lineHeight: 1.35 }}>
                  {post.title}
                </h3>

                {post.excerpt && (
                  <p style={{ color: 'var(--text2)', fontSize: '0.8rem', lineHeight: 1.5, margin: '0 0 10px' }}>
                    {post.excerpt}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text3)', fontSize: '0.7rem' }}>
                    {new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600 }}>
                    {expanded === post.id ? 'Close ↑' : 'Read →'}
                  </span>
                </div>
              </div>

              {/* Expanded full content */}
              {expanded === post.id && (
                <div
                  className="note-content"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                  style={{
                    padding: '0 16px 16px',
                    borderTop: '1px solid var(--border)',
                    paddingTop: 14,
                    color: 'var(--text)',
                    fontSize: '0.88rem',
                    lineHeight: 1.7,
                    maxHeight: 500,
                    overflow: 'auto',
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
