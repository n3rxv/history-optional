'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * The owner's editor on a post page: title, excerpt, tags, published, and the
 * body edited in place. Loaded only for an admin session. It loads the post
 * through the admin route (which also returns drafts, and the body as
 * written rather than as cleaned for readers), saves through it, and the
 * route rebuilds the page.
 */

type RawPost = { id: string; slug?: string; type: string; title: string; excerpt: string; content: string; tags: string[]; cover_image?: string; published: boolean; published_at: string };
const SESSION_KEY = 'histopt_admin_v2';

export default function PostAdmin({ slug }: { slug: string }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [post, setPost] = useState<RawPost | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', excerpt: '', tags: '', published: true });
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return;
    let live = true;
    (async () => {
      const ok = await fetch('/api/admin/verify-token', { headers: { 'x-admin-token': stored } }).then((r) => r.ok).catch(() => false);
      if (!ok || !live) return;
      setToken(stored);
      const res = await fetch(`/api/admin/blog-posts/slug/${encodeURIComponent(slug)}`, { headers: { 'x-admin-token': stored } }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (live && res?.data) setPost(res.data);
    })();
    return () => { live = false; };
  }, [slug]);

  if (!token || !post) return null;

  const start = () => {
    setForm({ title: post.title, excerpt: post.excerpt ?? '', tags: (post.tags ?? []).join(', '), published: post.published });
    setEditing(true);
    requestAnimationFrame(() => { if (bodyRef.current) bodyRef.current.innerHTML = post.content; });
  };
  const save = async () => {
    setState('saving');
    const next: RawPost = {
      ...post,
      title: form.title.trim() || post.title,
      excerpt: form.excerpt.trim(),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      published: form.published,
      content: bodyRef.current?.innerHTML ?? post.content,
    };
    const res = await fetch('/api/admin/blog-posts', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify(next) }).then((r) => r.json()).catch(() => null);
    if (res?.ok) { setPost(next); setEditing(false); setState('saved'); router.refresh(); setTimeout(() => setState('idle'), 2000); }
    else { setState('failed'); setTimeout(() => setState('idle'), 2500); }
  };

  return (
    <div className="po-admin">
      {!editing ? (
        <div className="po-admin-bar">
          <span>{post.published ? 'Published' : 'Draft, not shown to readers'}{state === 'saved' ? ' · saved' : ''}</span>
          <button type="button" className="ds-btn ds-btn-line ds-btn-sm" onClick={start}>Edit this post</button>
        </div>
      ) : (
        <div className="po-admin-edit">
          <label><span>Title</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label><span>Excerpt</span><input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></label>
          <label><span>Tags, comma separated</span><input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></label>
          <label className="po-admin-check"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
          <span className="po-admin-label">Body</span>
          <div ref={bodyRef} className="po-admin-body po-prose" contentEditable suppressContentEditableWarning />
          <div className="po-admin-actions">
            {state === 'failed' && <span className="po-admin-err">That did not save.</span>}
            <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            <button type="button" className="ds-btn ds-btn-solid ds-btn-sm" onClick={save} disabled={state === 'saving'}>{state === 'saving' ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
