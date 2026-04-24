'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Comment {
  id: string;
  pyq_id: number;
  fingerprint: string;
  display_name: string;
  body: string;
  upvotes: number;
  created_at: string;
  user_upvoted?: boolean;
}

async function getFingerprint(): Promise<string> {
  try {
    const FP = await (await import('@fingerprintjs/fingerprintjs')).default.load();
    const { visitorId } = await FP.get();
    return visitorId;
  } catch { return 'anon-' + Math.random().toString(36).slice(2); }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DiscussionThread({ pyqId }: { pyqId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const [fp, setFp] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load name from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ho_discussion_name');
    if (saved) setName(saved);
    getFingerprint().then(setFp);
  }, []);

  const loadComments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pyq_comments')
      .select('*')
      .eq('pyq_id', pyqId)
      .order('created_at', { ascending: false });
    
    const upvoted = JSON.parse(localStorage.getItem('ho_upvoted_v1') || '{}');
    setComments((data || []).map((c: Comment) => ({ ...c, user_upvoted: !!upvoted[c.id] })));
    setLoading(false);
  }, [pyqId]);

  useEffect(() => { if (open) loadComments(); }, [open, loadComments]);

  const handleSubmit = async () => {
    if (!body.trim() || !name.trim() || !fp) return;
    setSubmitting(true);
    localStorage.setItem('ho_discussion_name', name);
    
    const { error } = await supabase.from('pyq_comments').insert({
      pyq_id: pyqId,
      fingerprint: fp,
      display_name: name.trim(),
      body: body.trim(),
      upvotes: 0,
    });
    
    if (!error) {
      setBody('');
      await loadComments();
    }
    setSubmitting(false);
  };

  const handleUpvote = async (comment: Comment) => {
    if (comment.user_upvoted || comment.fingerprint === fp) return;
    const upvoted = JSON.parse(localStorage.getItem('ho_upvoted_v1') || '{}');
    upvoted[comment.id] = true;
    localStorage.setItem('ho_upvoted_v1', JSON.stringify(upvoted));
    
    await supabase
      .from('pyq_comments')
      .update({ upvotes: comment.upvotes + 1 })
      .eq('id', comment.id);
    
    setComments(prev => prev.map(c => c.id === comment.id 
      ? { ...c, upvotes: c.upvotes + 1, user_upvoted: true } 
      : c
    ));
  };

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', color: 'var(--text3)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s' }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--accent2)'; el.style.color = 'var(--text2)'; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text3)'; }}
      >
        💬 Discuss {comments.length > 0 && !open ? `(${comments.length})` : ''}
      </button>

      {open && (
        <div style={{ marginTop: '0.75rem', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* Comment form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name (saved locally)"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.4rem 0.75rem', color: 'var(--text)', fontSize: '0.8rem', outline: 'none', fontFamily: 'var(--font-body)' }}
            />
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Share your approach, key points, or ask a question..."
              rows={3}
              style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.5rem 0.75rem', color: 'var(--text)', fontSize: '0.82rem', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-body)' }}
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !body.trim() || !name.trim()}
              style={{ alignSelf: 'flex-end', background: body.trim() && name.trim() ? 'var(--accent)' : 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 14px', color: body.trim() && name.trim() ? '#fff' : 'var(--text3)', cursor: body.trim() && name.trim() ? 'pointer' : 'not-allowed', fontSize: '0.78rem', fontWeight: 600 }}
            >
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>

          {/* Comments list */}
          {loading ? (
            <div style={{ color: 'var(--text3)', fontSize: '0.8rem', textAlign: 'center', padding: '0.5rem' }}>Loading…</div>
          ) : comments.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: '0.8rem', textAlign: 'center', padding: '0.5rem' }}>No comments yet. Be the first!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 400, overflowY: 'auto' }}>
              {comments.map(c => (
                <div key={c.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{c.display_name}</span>
                      {c.fingerprint === fp && <span style={{ fontSize: '0.6rem', color: 'var(--accent)', background: 'var(--accent-dim)', padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(59,130,246,0.2)' }}>you</span>}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>{timeAgo(c.created_at)}</span>
                  </div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '0.5rem' }}>{c.body}</div>
                  <button
                    onClick={() => handleUpvote(c)}
                    disabled={c.user_upvoted || c.fingerprint === fp}
                    style={{ background: c.user_upvoted ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${c.user_upvoted ? 'var(--accent2)' : 'var(--border)'}`, borderRadius: 5, padding: '2px 8px', color: c.user_upvoted ? 'var(--accent)' : 'var(--text3)', cursor: c.user_upvoted || c.fingerprint === fp ? 'default' : 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    ↑ {c.upvotes}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
