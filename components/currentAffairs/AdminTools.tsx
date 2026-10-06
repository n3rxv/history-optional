'use client';

/**
 * The owner's tools for current affairs: writing a post, the drafts, and the
 * newspaper cuttings. Loaded only for an admin session (the page imports it
 * lazily), so readers' phones never download the editor. Moved here from
 * CurrentAffairsSection, whose reader half the page now renders on the server.
 */

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Post {
  id: string;
  slug?: string;
  type: 'current-affairs' | 'new-note';
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  cover_image?: string;
  published_at: string;
  published: boolean;
}

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

// The buttons act on mousedown with the default prevented, so the caret never
// leaves the editor; nothing here needs to hand focus back.
function Toolbar({ onImage, onVideo }: {
  onImage: () => void;
  onVideo: () => void;
}) {
  const cmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };
  const tools: Array<{ label: string; action: () => void; title: string; accent?: boolean; group?: boolean }> = [
    { label: 'B',       action: () => cmd('bold'),                      title: 'Bold' },
    { label: 'I',       action: () => cmd('italic'),                    title: 'Italic' },
    { label: 'U',       action: () => cmd('underline'),                 title: 'Underline' },
    { label: 'S',       action: () => cmd('strikeThrough'),             title: 'Strikethrough', group: true },
    { label: 'H1',      action: () => cmd('formatBlock', 'h1'),         title: 'Heading 1' },
    { label: 'H2',      action: () => cmd('formatBlock', 'h2'),         title: 'Heading 2' },
    { label: 'H3',      action: () => cmd('formatBlock', 'h3'),         title: 'Heading 3' },
    { label: 'P',       action: () => cmd('formatBlock', 'p'),          title: 'Paragraph', group: true },
    { label: '• List',  action: () => cmd('insertUnorderedList'),       title: 'Bullet list' },
    { label: '1. List', action: () => cmd('insertOrderedList'),         title: 'Numbered list' },
    { label: '" Quote', action: () => cmd('formatBlock', 'blockquote'), title: 'Blockquote', group: true },
    { label: 'Image',   action: onImage,                                title: 'Insert image', accent: true },
    { label: 'Video',   action: onVideo,                                title: 'Insert video', accent: true },
  ];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, padding: '8px 12px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
      {tools.map((t, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
          {t.group && i > 0 && <span style={{ width: 1, height: 16, background: 'var(--border2)', margin: '0 3px' }} />}
          <button onMouseDown={e => { e.preventDefault(); t.action(); }} title={t.title} style={{ padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: t.accent ? 'var(--warning-wash)' : 'rgba(0,0,0,0.04)', border: t.accent ? '1px solid color-mix(in srgb, var(--warning-text) 20%, transparent)' : '1px solid var(--border)', color: t.accent ? 'var(--warning-text)' : 'var(--text2)' }}>{t.label}</button>
        </span>
      ))}
      <button onMouseDown={e => { e.preventDefault(); const url = prompt('URL:'); if (url) { document.execCommand('createLink', false, url); } }} title="Insert link" style={{ padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem', background: 'rgba(0,0,0,0.04)', border: '1px solid var(--border)', color: 'var(--text2)' }}>Link</button>
    </div>
  );
}

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
  // What the preview shows, taken from the editor when Preview is pressed.
  // The editor used to be unmounted in preview, which also threw away what
  // had been written.
  const [previewHtml, setPreviewHtml] = useState('');
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
    document.execCommand('insertHTML', false, `<div style="position:relative;padding-bottom:56.25%;height:0;margin:12px 0;border-radius:8px;overflow:hidden;"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe></div>`);
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
    const post: Post = { id: Date.now().toString(), type, title: title.trim(), excerpt: excerpt.trim(), content, tags: tags.split(',').map(t => t.trim()).filter(Boolean), cover_image: coverImg, published_at: new Date().toISOString(), published };
    setSaving(true);
    const res = await apiCall('/api/admin/blog-posts', 'POST', post, token);
    setSaving(false);
    if (res.ok) { setSavedMsg('Saved!'); onSaved(post); setTimeout(() => { setSavedMsg(''); setOpen(false); reset(); }, 1200); }
    else { setSavedMsg('Save failed'); setTimeout(() => setSavedMsg(''), 2500); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, cursor: 'pointer', background: 'var(--warning-wash)', border: '1px dashed color-mix(in srgb, var(--warning-text) 35%, transparent)', color: 'var(--warning-text)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '2rem', width: '100%', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--warning-text) 14%, transparent)'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--warning-text) 8%, transparent)'; }}>+ New Post</button>
  );

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 12, overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 16px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {(['current-affairs', 'new-note'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} style={{ padding: '4px 12px', cursor: 'pointer', fontSize: '0.75rem', background: type === t ? 'var(--warning-wash)' : 'transparent', border: 'none', color: type === t ? 'var(--warning-text)' : 'var(--text3)', fontWeight: type === t ? 700 : 400 }}>{t === 'current-affairs' ? 'Current Affairs' : 'New Note'}</button>
          ))}
        </div>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)', marginLeft: 4 }}>
          {(['write', 'preview'] as const).map(p => (
            <button key={p} onClick={() => { if (p === 'preview') setPreviewHtml(editorRef.current?.innerHTML ?? ''); setActivePanel(p); }} style={{ padding: '4px 12px', cursor: 'pointer', fontSize: '0.75rem', background: activePanel === p ? 'var(--accent-dim)' : 'transparent', border: 'none', color: activePanel === p ? 'var(--accent)' : 'var(--text3)', fontWeight: activePanel === p ? 600 : 400 }}>{p === 'write' ? 'Write' : 'Preview'}</button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginLeft: 'auto' }}>
          <span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>Published</span>
          <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} style={{ accentColor: 'var(--success-text)', width: 14, height: 14 }} />
        </label>
        <button onClick={save} disabled={saving} style={{ padding: '5px 16px', borderRadius: 6, cursor: saving ? 'default' : 'pointer', fontSize: '0.82rem', fontWeight: 700, background: savedMsg === 'Saved!' ? 'var(--success-wash)' : 'color-mix(in srgb, var(--warning-text) 15%, transparent)', border: savedMsg === 'Saved!' ? '1px solid color-mix(in srgb, var(--success-text) 40%, transparent)' : '1px solid color-mix(in srgb, var(--warning-text) 40%, transparent)', color: savedMsg === 'Saved!' ? 'var(--success-text)' : 'var(--warning-text)', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : savedMsg || 'Save'}</button>
        <button onClick={() => { setOpen(false); reset(); }} style={{ padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text3)' }}>X</button>
      </div>
      {/* Kept mounted in preview, only hidden, so nothing written is lost. */}
      <div hidden={activePanel !== 'write'}>
          <div style={{ padding: '14px 20px 0', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: 2, minWidth: 220 }}>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title..." style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '2px solid var(--border2)', color: 'var(--text)', fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-display)', padding: '4px 0', outline: 'none', boxSizing: 'border-box', caretColor: 'var(--warning-text)' }} onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--warning-text)')} onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--border2)')} />
              <input value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short excerpt shown on homepage..." style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text2)', fontSize: '0.88rem', padding: '6px 0', outline: 'none', marginTop: 8, boxSizing: 'border-box' }} />
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags: Mughal, British Raj... (comma separated)" style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text3)', fontSize: '0.78rem', padding: '6px 0', outline: 'none', marginTop: 6, boxSizing: 'border-box' }} />
            </div>
            <div>
              <div onClick={() => coverInputRef.current?.click()} style={{ width: 130, height: 88, borderRadius: 7, border: '1px dashed var(--border2)', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg3)' }}>
                {coverImg ? <img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'var(--text3)', fontSize: '0.7rem', textAlign: 'center', lineHeight: 1.4, padding: '0 8px' }}>Cover image</span>}
              </div>
              {coverImg && <button onClick={() => setCoverImg(undefined)} style={{ marginTop: 4, background: 'none', border: 'none', color: 'var(--danger-text)', cursor: 'pointer', fontSize: '0.7rem' }}>Remove</button>}
            </div>
          </div>
          <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImageFile} />
          <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onCoverFile} />
          <div style={{ marginTop: 12 }}><Toolbar onImage={handleImageInsert} onVideo={handleVideoInsert} /></div>
          <div ref={editorRef} contentEditable suppressContentEditableWarning style={{ minHeight: 260, padding: '20px 24px', outline: 'none', color: 'var(--text)', fontFamily: 'Georgia, serif', fontSize: '1rem', lineHeight: 1.8, caretColor: 'var(--warning-text)', background: 'var(--bg)' }} onFocus={() => { if (editorRef.current?.innerHTML === '<p>Start writing your post here...</p>') editorRef.current.innerHTML = ''; }} />
          <div style={{ padding: '6px 20px', background: 'var(--bg3)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text3)', fontSize: '0.7rem' }}>Rich text editor</span>
            <span style={{ color: 'var(--warning-text)', fontSize: '0.7rem', opacity: 0.6 }}>{published ? 'Will publish immediately' : 'Draft - hidden from homepage'}</span>
          </div>
      </div>
      {activePanel === 'preview' && (
        <div style={{ padding: 24 }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', maxWidth: 680, margin: '0 auto' }}>
            {coverImg && <div style={{ height: 200, overflow: 'hidden' }}><img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
            <div style={{ padding: '20px 24px' }}>
              {tags && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>{tags.split(',').filter(Boolean).map(t => <span key={t} style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.68rem', background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border2)' }}>{t.trim()}</span>)}</div>}
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text)', fontWeight: 700, margin: '0 0 8px' }}>{title || <span style={{ opacity: 0.3 }}>Untitled post</span>}</h2>
              {excerpt && <p style={{ color: 'var(--text2)', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 16px' }}>{excerpt}</p>}
              <div className="note-content" dangerouslySetInnerHTML={{ __html: previewHtml || '<p style="opacity:0.3">Nothing written yet...</p>' }} style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.8 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Newspaper Cutting Slider ──────────────────────────────────────────────────
interface Cutting {
  id: string;
  headline: string;
  source: string;
  date: string;
  image: string;
  tag?: string;
}

function CuttingSlider({ cuttings, authed, token, onUpdate }: { 
  cuttings: Cutting[]; 
  authed: boolean; 
  token: string;
  onUpdate: (cuttings: Cutting[]) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [adding, setAdding] = useState(false);
  const [lightbox, setLightbox] = useState<Cutting | null>(null);
  const [form, setForm] = useState({ headline: '', source: 'The Hindu', date: '', tag: '' });
  const [imgData, setImgData] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(cuttings.length - 1, i + 1));

  const onImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImgData(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const saveCutting = async () => {
    if (!form.headline.trim() || !imgData) { alert('Add headline and image'); return; }
    setSaving(true);
    const newCutting: Cutting = {
      id: Date.now().toString(),
      headline: form.headline.trim(),
      source: form.source.trim() || 'The Hindu',
      date: form.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      image: imgData,
      tag: form.tag.trim() || undefined,
    };
    const updated = [newCutting, ...cuttings];
    await apiCall('/api/admin/cuttings', 'POST', { cuttings: updated }, token);
    onUpdate(updated);
    setAdding(false);
    setForm({ headline: '', source: 'The Hindu', date: '', tag: '' });
    setImgData(undefined);
    setSaving(false);
  };

  const deleteCutting = async (id: string) => {
    const updated = cuttings.filter(c => c.id !== id);
    await apiCall('/api/admin/cuttings', 'POST', { cuttings: updated }, token);
    onUpdate(updated);
    setIdx(Math.max(0, idx - 1));
  };

  if (cuttings.length === 0 && !authed) return null;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 3, height: 18, background: 'var(--warning-text)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text3)' }}>Press Clippings</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {authed && (
            <button onClick={() => setAdding(a => !a)} style={{ padding: '3px 10px', borderRadius: 5, cursor: 'pointer', fontSize: '0.7rem', background: adding ? 'var(--warning-wash)' : 'transparent', border: '1px solid color-mix(in srgb, var(--warning-text) 30%, transparent)', color: 'var(--warning-text)', fontWeight: 600 }}>
              {adding ? 'Cancel' : '+ Add'}
            </button>
          )}
          {cuttings.length > 1 && (
            <>
              <button onClick={prev} disabled={idx === 0} style={{ width: 26, height: 26, borderRadius: 4, cursor: idx === 0 ? 'default' : 'pointer', background: 'transparent', border: '1px solid var(--border2)', color: idx === 0 ? 'var(--border2)' : 'var(--text2)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text3)' }}>{idx + 1}/{cuttings.length}</span>
              <button onClick={next} disabled={idx === cuttings.length - 1} style={{ width: 26, height: 26, borderRadius: 4, cursor: idx === cuttings.length - 1 ? 'default' : 'pointer', background: 'transparent', border: '1px solid var(--border2)', color: idx === cuttings.length - 1 ? 'var(--border2)' : 'var(--text2)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            </>
          )}
        </div>
      </div>

      {/* Add form */}
      {authed && adding && (
        <div style={{ background: 'var(--bg2)', border: '1px solid color-mix(in srgb, var(--warning-text) 25%, transparent)', borderRadius: 10, padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div onClick={() => imgRef.current?.click()} style={{ width: 120, height: 90, borderRadius: 6, border: '1px dashed color-mix(in srgb, var(--warning-text) 40%, transparent)', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg3)', flexShrink: 0 }}>
            {imgData ? <img src={imgData} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'var(--text3)', fontSize: '0.68rem', textAlign: 'center' }}>Click to upload<br/>screenshot</span>}
          </div>
          <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImg} />
          <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} placeholder="Headline..." style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border2)', color: 'var(--text)', fontSize: '0.88rem', fontWeight: 700, padding: '4px 0', outline: 'none', width: '100%' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Source" style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text2)', fontSize: '0.75rem', padding: '3px 0', outline: 'none', width: '50%' }} />
              <input value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} placeholder="Tag (e.g. Mughals)" style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text2)', fontSize: '0.75rem', padding: '3px 0', outline: 'none', width: '50%' }} />
            </div>
            <input value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} placeholder="Date (e.g. 30 Apr 2026)" style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text3)', fontSize: '0.72rem', padding: '3px 0', outline: 'none', width: '100%' }} />
            <button onClick={saveCutting} disabled={saving} style={{ alignSelf: 'flex-start', marginTop: 4, padding: '5px 16px', borderRadius: 5, cursor: saving ? 'default' : 'pointer', fontSize: '0.78rem', fontWeight: 700, background: 'var(--warning-wash)', border: '1px solid color-mix(in srgb, var(--warning-text) 40%, transparent)', color: 'var(--warning-text)' }}>{saving ? 'Saving...' : 'Save Cutting'}</button>
          </div>
        </div>
      )}

      {/* Cards */}
      {cuttings.length > 0 && (
        <div ref={trackRef} style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', transform: `translateX(${-idx * 100}%)`, transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
            {cuttings.map((c, i) => (
              <div key={c.id} style={{ minWidth: '100%', padding: '0 2px' }}>
                <div style={{
                  background: 'var(--bg-raised)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)',
                  transform: `rotate(color-mix(in srgb, ${i % 2 === 0 ? -0.3 : 0.2} 87%, transparent)g)`,
                  position: 'relative',
                  cursor: 'zoom-in',
                }} onClick={() => setLightbox(c)}>
                  {/* Torn edge top */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--bg-raised)', zIndex: 2, clipPath: 'polygon(0 0,2% 100%,4% 20%,6% 90%,8% 10%,10% 80%,12% 5%,14% 95%,16% 15%,18% 85%,20% 0,22% 90%,24% 10%,26% 80%,28% 5%,30% 95%,32% 20%,34% 85%,36% 10%,38% 90%,40% 0,42% 80%,44% 15%,46% 90%,48% 5%,50% 85%,52% 10%,54% 95%,56% 20%,58% 80%,60% 0,62% 90%,64% 15%,66% 85%,68% 5%,70% 95%,72% 10%,74% 80%,76% 20%,78% 90%,80% 0,82% 85%,84% 15%,86% 95%,88% 5%,90% 80%,92% 10%,94% 90%,96% 20%,98% 85%,100% 0,100% 0,0 0)' }} />
                  
                  {/* Full width image */}
                  <img src={c.image} alt={c.headline} style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'contain', background: 'var(--bg-raised)' }} />

                  {/* Bottom overlay */}
                  <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-raised)', borderTop: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {c.tag && <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--warning-text)' }}>{c.tag}</span>}
                      <h3 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>{c.headline}</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.6rem', color: 'var(--text2)', fontStyle: 'italic' }}>{c.source}</span>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.58rem', color: 'var(--text3)' }}>{c.date}</span>
                      {authed && (
                        <button onClick={(e) => { e.stopPropagation(); deleteCutting(c.id); }} style={{ width: 18, height: 18, borderRadius: 3, cursor: 'pointer', background: 'var(--danger-wash)', border: '1px solid color-mix(in srgb, var(--danger-text) 30%, transparent)', color: 'var(--danger-text)', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-raised)', borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
            <img src={lightbox.image} alt={lightbox.headline} style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', display: 'block' }} />
            <div style={{ padding: '0.75rem 1rem', borderTop: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{lightbox.headline}</h3>
              <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.65rem', color: 'var(--text2)', fontStyle: 'italic' }}>{lightbox.source}</span>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.62rem', color: 'var(--text3)' }}>{lightbox.date}</span>
                <button onClick={() => setLightbox(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>✕</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {authed && cuttings.length === 0 && !adding && (
        <div style={{ padding: '1rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--text3)', fontSize: '0.78rem' }}>No press clippings yet — click + Add to upload your first cutting.</div>
      )}
    </div>
  );
}

// ─── Editorial Featured ────────────────────────────────────────────────────────

/** Shown on /current-affairs only to an admin. Saves rebuild the page on the server; refresh() shows it. */
export default function AdminTools() {
  const router = useRouter();
  const { authed, token } = useAdminAuth();
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [cuttings, setCuttings] = useState<Cutting[]>([]);
  useEffect(() => {
    if (!authed) return;
    fetch('/api/admin/blog-posts?all=true', { headers: { 'x-admin-token': token } }).then((r) => r.json())
      .then((d) => setDrafts(((d.data ?? []) as Post[]).filter((p) => !p.published))).catch(() => {});
    fetch('/api/admin/cuttings').then((r) => r.json()).then((d) => setCuttings(d.cuttings ?? [])).catch(() => {});
  }, [authed, token]);
  if (!authed) return null;
  return (
    <section className="ca-admin" aria-label="Admin tools">
      <h2 className="ca-admin-title">Admin</h2>
      <PostCreator token={token} onSaved={() => router.refresh()} />
      {drafts.length > 0 && (
        <div className="ca-drafts">
          <strong>Drafts, not shown to readers</strong>
          <ul>{drafts.map((d) => <li key={d.id}><Link href={`/posts/${d.slug || d.id}`}>{d.title}</Link></li>)}</ul>
        </div>
      )}
      <CuttingSlider cuttings={cuttings} authed token={token} onUpdate={(c) => { setCuttings(c); router.refresh(); }} />
    </section>
  );
}
