'use client';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import type { PYQ } from '@/lib/pyqData';
import { useAttemptedPyqs } from '@/hooks/useAttemptedPyqs';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import ModelAnswerModal from '@/components/ModelAnswerModal';
import TopperLocked from '@/components/TopperLocked';
import CompareIcon from '@/components/CompareIcon';
import { LIST_KEY } from './PyqBrowser';
import { pyqSection, tintFor, topicName } from './sections';

type AnswerEntry = { id: string; display_name: string; public_url: string; answer_number: number; created_at: string };
type TopperCopy = { id: string; question: string; note: string | null };
type Peek = { id: number; question: string } | null;
type Related = { id: number; question: string; year: number; marks: number };

const short = (q: string, n = 90) => (q.length > n ? `${q.slice(0, n - 1).trimEnd()}…` : q);

const Arrow = ({ back }: { back?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={back ? 'M19 12H5M11 6l-6 6 6 6' : 'M5 12h14M13 6l6 6-6 6'} />
  </svg>
);
const Dots = () => <div className="pd-writing"><span className="pd-dot" /><span className="pd-dot" /><span className="pd-dot" /></div>;

/**
 * One past question: how to go at it (write an answer, ask the AI, a model
 * answer), the topper copies written to it and the answers other aspirants
 * have shared, with more on the same topic beside it.
 */
export default function PyqDetail({ pyq, related, prev, next, topicCount }: {
  pyq: PYQ; related: Related[]; prev: Peek; next: Peek; topicCount: number;
}) {
  const router = useRouter();
  const meta = pyqSection(pyq.section);
  const { isAttempted, toggle, ready } = useAttemptedPyqs();
  const attempted = ready && isAttempted(pyq.id);
  // Model answers are Premium: a free reader gets the upgrade card instead.
  const { GateModals, usage, showChatLimitModal } = useSubscriptionGate(() => {});
  const subscribed = Boolean(usage?.subscribed);
  const [showModel, setShowModel] = useState(false);

  // ── Answers other aspirants shared ──
  const [answers, setAnswers] = useState<AnswerEntry[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [uploadOk, setUploadOk] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/pyq-answers?pyq_id=${pyq.id}`)
      .then((r) => r.json())
      .then((d) => setAnswers(d.answers ?? []))
      .catch(() => {})
      .finally(() => setLoadingAnswers(false));
  }, [pyq.id]);

  const handleUpload = async () => {
    setUploadErr(null);
    if (!file) { setUploadErr('Choose a PDF of your answer first.'); return; }
    if (!displayName.trim()) { setUploadErr('Add the name to show with it.'); return; }
    setUploading(true);
    const form = new FormData();
    form.append('pyq_id', String(pyq.id));
    form.append('display_name', displayName.trim());
    form.append('file', file);
    // The route records a signed-in uploader against the answer; it was never
    // sent the token, so every upload went in anonymous. Signed out still works.
    const token = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => '') : '';
    try {
      const res = await fetch('/api/pyq-answers', { method: 'POST', body: form, headers: token ? { authorization: `Bearer ${token}` } : undefined });
      const data = await res.json().catch(() => ({ error: 'Upload failed.' }));
      if (!res.ok || data.error) setUploadErr(data.error ?? 'Upload failed.');
      else {
        setAnswers((prev) => [...prev, data.answer]);
        setFile(null);
        setDisplayName('');
        if (fileRef.current) fileRef.current.value = '';
        setUploadOk(true);
        setShowUpload(false);
        setTimeout(() => setUploadOk(false), 4000);
      }
    } catch { setUploadErr('Upload failed. Check your connection and try again.'); }
    setUploading(false);
  };

  // ── Topper copies ──
  const [copies, setCopies] = useState<TopperCopy[]>([]);
  const [copiesLoading, setCopiesLoading] = useState(true);
  const [paywall, setPaywall] = useState(false);
  useEffect(() => {
    fetch(`/api/topper-copies?pyq_id=${pyq.id}`)
      .then((r) => r.json())
      .then((d) => setCopies(d.data ?? []))
      .catch(() => {})
      .finally(() => setCopiesLoading(false));
  }, [pyq.id]);
  // Opening a copy is what spends a free view, and the copy page counts it;
  // this only checks there is one to spend.
  const openCopy = async (href: string) => {
    const user = auth.currentUser;
    if (!user) { router.push(href); return; }
    const token = await user.getIdToken();
    const data = await fetch('/api/topper-access', { headers: { 'x-user-token': token } }).then((r) => r.json()).catch(() => ({ access: true }));
    if (data.access) router.push(href); else setPaywall(true);
  };
  const toppers = new Set(copies.map((c) => (c.note ?? '').split(',')[0].trim())).size;

  // Back to the list as the reader left it, filters and all.
  const backToList = (e: MouseEvent) => {
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(LIST_KEY); } catch { /* storage blocked */ }
    if (saved && saved !== '/pyqs') { e.preventDefault(); router.push(saved); }
  };

  const evaluateHref = `/evaluate?question=${encodeURIComponent(pyq.question)}&marks=${pyq.marks}`;
  const topicHref = `/pyqs?topic=${encodeURIComponent(pyq.topic)}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pd ds" style={tintFor(meta?.key)}>
        <div className="ds-container pd-grid">
          <div className="pd-main">
            <Link href="/pyqs" className="ds-back" onClick={backToList}><Arrow back />PYQs</Link>

            <article className="pd-qcard">
              <div className="pd-meta">
                <span className="pd-sec">{meta?.name ?? pyq.section}</span>
                <span>Paper {meta?.paper === 2 ? 'II' : 'I'}</span>
                <span>{pyq.year}</span>
                {pyq.source !== 'UPSC' && <span className="pd-src">{pyq.source}</span>}
                <span className="pd-marks">{pyq.marks} marks</span>
              </div>
              <h1 className="pd-question">{pyq.question}</h1>
              <div className="pd-tags">
                <Link href={topicHref} className="pd-topic" title={`Every question on ${topicName(pyq.topic)}`}>{topicName(pyq.topic)}</Link>
                {pyq.subtopic && <span className="pd-micro">{pyq.subtopic}</span>}
              </div>
              {pyq.syllabus.length > 0 && (
                <p className="pd-syllabus">Syllabus: {pyq.syllabus.join('; ')}</p>
              )}
            </article>

            <div className="pd-actions">
              <Link href={evaluateHref} className="ds-btn ds-btn-solid">Write an answer</Link>
              <Link href={`/chat?q=${encodeURIComponent(pyq.question)}`} className="ds-btn ds-btn-line">Ask the AI how to approach it</Link>
              <button type="button" className="ds-btn ds-btn-ghost" onClick={() => (subscribed ? setShowModel(true) : showChatLimitModal())}>
                Show a model answer
                {!subscribed && <span className="pd-pro">Premium</span>}
              </button>
            </div>

            {ready && (
              <label className={`pd-attempt${attempted ? ' on' : ''}`}>
                <input type="checkbox" checked={attempted} onChange={() => toggle(pyq.id)} />
                <span className="pd-attempt-box" aria-hidden="true">
                  {attempted && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                </span>
                <span>{attempted ? 'You’ve attempted this question' : 'I’ve attempted this question'}</span>
              </label>
            )}

            <section className="pd-community">
              <div className="pd-sec-head">
                <h2>Answers from other aspirants{answers.length > 0 && <span>{answers.length}</span>}</h2>
                {!showUpload && <button type="button" className="ds-btn ds-btn-line ds-btn-sm" onClick={() => setShowUpload(true)}>Share yours</button>}
              </div>

              {uploadOk && <p className="pd-ok" role="status">Thanks, your answer is up.</p>}

              {showUpload && (
                <div className="pd-card pd-upload">
                  <p className="pd-upload-intro">Upload a PDF of your handwritten or typed answer. Others writing this question will see it with your name.</p>
                  <div className="pd-upload-row">
                    <input className="pd-input" placeholder="Name to show" value={displayName} onChange={(e) => setDisplayName(e.target.value)} aria-label="Name to show with your answer" />
                    <label className={`pd-file${file ? ' chosen' : ''}`}>
                      <input ref={fileRef} type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                      <span>{file ? file.name : 'Choose a PDF, up to 5 MB'}</span>
                    </label>
                  </div>
                  {uploadErr && <p className="pd-err" role="alert">{uploadErr}</p>}
                  <div className="pd-upload-actions">
                    <button type="button" className="ds-btn ds-btn-solid ds-btn-sm" onClick={handleUpload} disabled={uploading}>{uploading ? 'Uploading…' : 'Upload answer'}</button>
                    <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => { setShowUpload(false); setUploadErr(null); }}>Cancel</button>
                  </div>
                </div>
              )}

              {loadingAnswers ? <Dots /> : answers.length === 0 ? (
                !showUpload && <p className="pd-none">Nobody has shared an answer to this one yet. Be the first.</p>
              ) : (
                <div className="pd-answers">
                  {answers.map((ans) => (
                    <a key={ans.id} href={ans.public_url} target="_blank" rel="noopener noreferrer" className="pd-answer">
                      <span className="pd-answer-icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                      </span>
                      <span className="pd-answer-text">
                        <span className="pd-answer-name">{ans.display_name}</span>
                        <span className="pd-answer-meta">Answer {ans.answer_number} · {new Date(ans.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </section>

            {(prev || next) && (
              <nav className="pd-pager" aria-label="More questions">
                {prev ? (
                  <Link href={`/pyqs/${prev.id}`} className="pd-pager-link">
                    <span className="pd-pager-dir"><Arrow back /> Previous</span>
                    <span className="pd-pager-q">{short(prev.question, 80)}</span>
                  </Link>
                ) : <span />}
                {next ? (
                  <Link href={`/pyqs/${next.id}`} className="pd-pager-link next">
                    <span className="pd-pager-dir">Next <Arrow /></span>
                    <span className="pd-pager-q">{short(next.question, 80)}</span>
                  </Link>
                ) : <span />}
              </nav>
            )}
          </div>

          <aside className="pd-aside">
            <div className="pd-side">
              <h2 className="pd-side-title">Topper copies{copies.length > 0 && <span>{copies.length}</span>}</h2>
              {copiesLoading ? <Dots /> : copies.length === 0 ? (
                <p className="pd-side-text">No topper has an answer to this one on the site yet. Copies are added as booklets come in.</p>
              ) : (
                <>
                  {copies.length >= 2 && (
                    <button type="button" className="pd-compare" onClick={() => openCopy(`/pyqs/${pyq.id}/compare`)}>
                      <span className="pd-compare-icon" aria-hidden="true"><CompareIcon size={18} /></span>
                      <span className="pd-compare-text">
                        <strong>Compare answers side by side</strong>
                        <span>{toppers >= 2 ? `See how ${toppers} toppers wrote this answer` : `Read ${copies.length} copies next to each other`}</span>
                      </span>
                      <Arrow />
                    </button>
                  )}
                  <div className="pd-copies">
                    {copies.map((c) => (
                      <button key={c.id} type="button" className="pd-copy" onClick={() => openCopy(`/topper-copies/${c.id}`)}>
                        <span className="pd-copy-who">{c.note || 'Topper copy'}</span>
                        <span className="pd-copy-q">{short(c.question, 110)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {related.length > 0 && (
              <div className="pd-side">
                <h2 className="pd-side-title">More on {topicName(pyq.topic)}</h2>
                <div className="pd-related">
                  {related.map((q) => (
                    <Link key={q.id} href={`/pyqs/${q.id}`} className="pd-rel">
                      <span className="pd-rel-q">{short(q.question)}</span>
                      <span className="pd-rel-meta">{q.year} · {q.marks} marks</span>
                    </Link>
                  ))}
                </div>
                {topicCount > related.length + 1 && (
                  <Link href={topicHref} className="pd-side-all">All {topicCount} questions on this topic <Arrow /></Link>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>

      {paywall && (
        <div className="ds-overlay" onClick={() => setPaywall(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420 }}>
            <TopperLocked onUnlocked={() => setPaywall(false)} onDismiss={() => setPaywall(false)} />
          </div>
        </div>
      )}
      <GateModals />
      {showModel && <ModelAnswerModal question={pyq.question} marks={pyq.marks} cacheKey={String(pyq.id)} onClose={() => setShowModel(false)} />}
    </>
  );
}

const CSS = `
.pd { background: var(--bg); min-height: 70vh; padding: clamp(20px, 3.5vh, 36px) 0 clamp(48px, 9vh, 96px); }
.pd-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: var(--space-8); align-items: start; }
.pd-main { min-width: 0; }

.pd-qcard { margin: var(--space-4) 0; padding: var(--space-6); background: var(--ds-card); border: 1px solid var(--border); border-top: 3px solid var(--t); border-radius: var(--radius-xl); box-shadow: var(--elev-1); }
.pd-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 14px; font-size: 0.88rem; color: var(--text3); margin-bottom: var(--space-3); }
.pd-sec { padding: 2px 10px; border-radius: var(--radius-full); background: var(--w); color: var(--t); font-weight: 700; }
.pd-src { padding: 1px 9px; border-radius: var(--radius-full); background: var(--ds-soft); color: var(--text2); font-weight: 600; }
.pd-marks { margin-left: auto; padding: 2px 10px; border-radius: var(--radius-full); background: var(--ds-soft); color: var(--text2); font-weight: 600; }
.pd-question { margin: 0 0 var(--space-4); font-size: clamp(1.18rem, 2.2vw, 1.42rem); font-weight: 600; line-height: 1.5; letter-spacing: -0.01em; color: var(--text); }
.pd-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
.pd-topic { padding: 4px 12px; border-radius: var(--radius-full); border: 1px solid color-mix(in srgb, var(--t) 35%, transparent); background: var(--w); color: var(--t); font-size: 0.84rem; font-weight: 600; text-decoration: none; }
.pd-topic:hover { border-color: var(--t); }
.pd-micro { font-size: 0.86rem; color: var(--text2); }
.pd-syllabus { margin: var(--space-3) 0 0; font-size: 0.82rem; line-height: 1.5; color: var(--text3); }

.pd-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4); }
.pd-pro { margin-left: 6px; padding: 1px 8px; border-radius: var(--radius-full); background: var(--premium-wash); color: var(--premium-text); font-size: 0.72rem; font-weight: 700; }
.pd-attempt { position: relative; display: inline-flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-6); font-size: 0.94rem; font-weight: 600; color: var(--text2); cursor: pointer; }
.pd-attempt input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.pd-attempt-box { width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; border: 2px solid var(--border3); border-radius: 6px; background: var(--ds-card); color: #fff; transition: background 0.15s, border-color 0.15s; }
.pd-attempt.on { color: var(--success-text); }
.pd-attempt.on .pd-attempt-box { background: var(--success-text); border-color: var(--success-text); }
.pd-attempt input:focus-visible + .pd-attempt-box { outline: 2px solid var(--accent); outline-offset: 2px; }

.pd-card { background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: var(--space-5) var(--space-6); margin-bottom: var(--space-6); }
.pd-writing { display: flex; align-items: center; gap: 8px; padding: var(--space-3) 0; font-size: 0.92rem; color: var(--text3); }
.pd-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--t); animation: pdDot 1.2s ease-in-out infinite; }
.pd-dot:nth-child(2) { animation-delay: 0.15s; }
.pd-dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes pdDot { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }

.pd-community { padding-top: var(--space-6); border-top: 1px solid var(--border); }
.pd-sec-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-4); }
.pd-sec-head h2 { display: flex; align-items: center; gap: var(--space-2); margin: 0; font-size: 1.2rem; font-weight: 800; letter-spacing: -0.01em; }
.pd-sec-head h2 span, .pd-side-title span { min-width: 26px; padding: 1px 8px; border-radius: var(--radius-full); background: var(--w); color: var(--t); font-size: 0.8rem; font-weight: 700; text-align: center; }
.pd-none { margin: 0; color: var(--text3); font-size: 0.95rem; }
.pd-ok { margin: 0 0 var(--space-4); padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--success-wash); color: var(--success-text); font-weight: 600; font-size: 0.92rem; }
.pd-upload { margin-bottom: var(--space-5); }
.pd-upload-intro { margin: 0 0 var(--space-4); font-size: 0.92rem; line-height: 1.55; color: var(--text2); }
.pd-upload-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: var(--space-2); }
.pd-input { height: 44px; padding: 0 var(--space-4); border: 1px solid var(--border2); border-radius: var(--radius-full); background: var(--bg); color: var(--text); font: inherit; font-size: 0.95rem; outline: none; min-width: 0; }
.pd-input:focus { border-color: color-mix(in srgb, var(--accent) 60%, transparent); box-shadow: 0 0 0 4px var(--accent-glow); }
.pd-file { position: relative; display: flex; align-items: center; gap: var(--space-2); height: 44px; padding: 0 var(--space-4); border: 1.5px dashed var(--border3); border-radius: var(--radius-full); color: var(--text2); font-size: 0.92rem; cursor: pointer; min-width: 0; }
.pd-file span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.pd-file input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.pd-file:focus-within { outline: 2px solid var(--accent); outline-offset: 2px; }
.pd-file.chosen { border-style: solid; border-color: color-mix(in srgb, var(--t) 45%, transparent); color: var(--t); background: var(--w); }
.pd-err { margin: var(--space-3) 0 0; color: var(--danger-text); font-size: 0.9rem; }
.pd-upload-actions { display: flex; gap: var(--space-2); margin-top: var(--space-4); }
.pd-answers { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-3); }
.pd-answer { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--ds-card); text-decoration: none; transition: border-color 0.15s; min-width: 0; }
.pd-answer:hover { border-color: color-mix(in srgb, var(--t) 45%, transparent); }
.pd-answer-icon { width: 36px; height: 36px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 10px; background: var(--w); color: var(--t); }
.pd-answer-text { display: flex; flex-direction: column; min-width: 0; }
.pd-answer-name { font-weight: 600; color: var(--text); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.pd-answer-meta { font-size: 0.8rem; color: var(--text3); }

.pd-pager { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--space-3); margin-top: var(--space-8); }
.pd-pager-link { display: flex; flex-direction: column; gap: 6px; padding: var(--space-4) var(--space-5); border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--ds-card); text-decoration: none; transition: border-color 0.15s, box-shadow 0.15s; }
.pd-pager-link:hover { border-color: color-mix(in srgb, var(--t) 45%, transparent); box-shadow: var(--elev-1); }
.pd-pager-link.next { text-align: right; align-items: flex-end; }
.pd-pager-dir { display: inline-flex; align-items: center; gap: 6px; font-size: 0.84rem; font-weight: 600; color: var(--t); }
.pd-pager-q { font-size: 0.92rem; line-height: 1.45; color: var(--text); }

.pd-aside { position: sticky; top: 84px; display: flex; flex-direction: column; gap: var(--space-4); padding-top: 50px; }
.pd-side { padding: var(--space-5); border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--ds-card); }
.pd-side-title { display: flex; align-items: center; gap: var(--space-2); margin: 0 0 var(--space-3); font-size: 1rem; font-weight: 800; line-height: 1.35; }
.pd-side-text { margin: 0; font-size: 0.9rem; line-height: 1.55; color: var(--text2); }
.pd-compare { display: flex; align-items: center; gap: var(--space-3); width: 100%; margin-bottom: var(--space-3); padding: var(--space-3); border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent); border-radius: var(--radius-lg); background: var(--accent-dim); color: var(--accent-text); font: inherit; text-align: left; cursor: pointer; transition: border-color 0.15s; }
.pd-compare:hover { border-color: var(--accent); }
.pd-compare-icon { width: 36px; height: 36px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-md); background: var(--ds-card); }
.pd-compare-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.pd-compare-text strong { font-size: 0.9rem; color: var(--text); }
.pd-compare-text span { font-size: 0.8rem; color: var(--text2); }
.pd-copies { display: flex; flex-direction: column; }
.pd-copy { display: flex; flex-direction: column; gap: 3px; padding: var(--space-3) 0; border: none; border-top: 1px solid var(--border); background: none; font: inherit; text-align: left; cursor: pointer; }
.pd-copy:first-child { border-top: none; padding-top: 0; }
.pd-copy-who { font-size: 0.86rem; font-weight: 700; color: var(--text); }
.pd-copy-q { font-size: 0.84rem; line-height: 1.5; color: var(--text2); }
.pd-copy:hover .pd-copy-who { color: var(--t); }
.pd-related { display: flex; flex-direction: column; }
.pd-rel { display: flex; flex-direction: column; gap: 4px; padding: var(--space-3) 0; border-top: 1px solid var(--border); text-decoration: none; }
.pd-rel:first-child { border-top: none; padding-top: 0; }
.pd-rel-q { font-size: 0.9rem; line-height: 1.5; color: var(--text); }
.pd-rel:hover .pd-rel-q { color: var(--t); }
.pd-rel-meta { font-size: 0.78rem; color: var(--text3); }
.pd-side-all { display: inline-flex; align-items: center; gap: 6px; margin-top: var(--space-3); font-size: 0.88rem; font-weight: 600; color: var(--accent-text); text-decoration: none; }
.pd-side-all:hover { text-decoration: underline; text-underline-offset: 3px; }

@media (max-width: 960px) {
  .pd-grid { grid-template-columns: minmax(0, 1fr); gap: var(--space-6); }
  .pd-aside { position: static; padding-top: 0; }
}
@media (max-width: 640px) {
  .pd-qcard { padding: var(--space-5) var(--space-4); }
  .pd-actions { flex-direction: column; align-items: stretch; }
  .pd-actions .ds-btn { justify-content: center; }
  .pd-card { padding: var(--space-4); }
  .pd-upload-row { grid-template-columns: minmax(0, 1fr); }
  .pd-pager { grid-template-columns: minmax(0, 1fr); }
  .pd-pager-link.next { text-align: left; align-items: flex-start; }
  .pd-sec-head h2 { font-size: 1.08rem; }
}
@media (prefers-reduced-motion: reduce) { .pd-dot { animation: none; } }
`;
