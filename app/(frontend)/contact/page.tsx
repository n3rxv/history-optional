'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Mascot from '@/components/Mascot';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { SUPPORT_EMAIL, SUPPORT_MAILTO, TELEGRAM_URL } from '@/lib/contact';

/**
 * Three kinds of message, each with the fields /api/contact expects for it:
 * a question (name, email, message), a bug (page, description, email) and an
 * idea (title, description, email). ?tab=bug and ?tab=feature open the
 * matching one, as links elsewhere expect.
 */
type Kind = 'contact' | 'bug' | 'feature';
const KINDS: { key: Kind; label: string }[] = [
  { key: 'contact', label: 'A question' },
  { key: 'bug', label: 'Something broke' },
  { key: 'feature', label: 'An idea' },
];
const MIN_WORDS = 5;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

function ContactForm() {
  const searchParams = useSearchParams();
  const asked = searchParams.get('tab');
  const [kind, setKind] = useState<Kind>(asked === 'bug' ? 'bug' : asked === 'feature' ? 'feature' : 'contact');
  const [form, setForm] = useState({ name: '', email: '', message: '', page: '', title: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [errorText, setErrorText] = useState('');
  const { user } = useFirebaseAuth();

  // A signed-in reader should not have to type who they are.
  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(f => ({ ...f, name: f.name || user.displayName || '', email: f.email || user.email || '' }));
  }, [user]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (status === 'error') setStatus('idle');
  };

  const enough = words(form.message) >= MIN_WORDS;
  const ready = Boolean(form.email.trim()) && enough && (
    kind === 'contact' ? Boolean(form.name.trim()) : kind === 'bug' ? Boolean(form.page.trim()) : Boolean(form.title.trim())
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || status === 'sending') return;
    setStatus('sending');
    const body = kind === 'contact'
      ? { type: 'contact', name: form.name, email: form.email, message: form.message }
      : kind === 'bug'
        ? { type: 'bug', page: form.page, description: form.message, email: form.email }
        : { type: 'feature', title: form.title, description: form.message, email: form.email };
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        // The route says what was wrong (a bad address, too many messages).
        const data = await res.json().catch(() => null);
        setErrorText(data?.error ?? '');
        setStatus('error');
        return;
      }
      setStatus('done');
      setForm(f => ({ ...f, message: '', page: '', title: '' }));
    } catch {
      setErrorText('');
      setStatus('error');
    }
  };

  const left = MIN_WORDS - words(form.message);

  return (
    <div className="ct ds">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="ct-hero">
        <div className="ds-container">
          <h1 className="ds-h1 ct-h1">Get in touch</h1>
          <p className="ds-lede ct-lede">Write to us about a bug, a payment, or something you’d like to see on the site. A person reads every message.</p>
        </div>
      </header>

      <div className="ds-container ct-grid">
        <section className="ct-card">
          {status === 'done' ? (
            <div className="ct-done">
              <Mascot pose="celebrate" width={110} />
              <h2>Thanks, we’ve got it</h2>
              <p>{kind === 'contact' ? `We’ll reply to ${form.email || 'your email'}.` : kind === 'bug' ? 'We’ll look into it, and write to you if we need more.' : 'We read every idea, and we’ll write to you if it ships.'}</p>
              <button type="button" className="ds-btn ds-btn-line" onClick={() => setStatus('idle')}>Send another</button>
            </div>
          ) : (
            <form className="ct-form" onSubmit={submit} noValidate>
              <div className="ct-field">
                <span className="ct-label" id="ct-kind">What is it about?</span>
                <div className="ct-kinds" role="radiogroup" aria-labelledby="ct-kind">
                  {KINDS.map(k => (
                    <button key={k.key} type="button" role="radio" aria-checked={kind === k.key} className={`ct-kind${kind === k.key ? ' on' : ''}`} onClick={() => { setKind(k.key); setStatus('idle'); }}>{k.label}</button>
                  ))}
                </div>
              </div>

              {status === 'error' && (
                <p className="ct-error" role="alert">
                  {errorText || 'Something went wrong.'} You can also email us at <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>.
                </p>
              )}

              {kind === 'contact' && (
                <label className="ct-field">
                  <span className="ct-label">Name</span>
                  <input className="ct-input" autoComplete="name" placeholder="Your name" value={form.name} onChange={set('name')} />
                </label>
              )}
              {kind === 'bug' && (
                <label className="ct-field">
                  <span className="ct-label">Where did it happen?</span>
                  <input className="ct-input" placeholder="The page or feature, say the PYQ list or answer checking" value={form.page} onChange={set('page')} />
                </label>
              )}
              {kind === 'feature' && (
                <label className="ct-field">
                  <span className="ct-label">Your idea, in a line</span>
                  <input className="ct-input" placeholder="Say, download the notes as a PDF" value={form.title} onChange={set('title')} />
                </label>
              )}

              <label className="ct-field">
                <span className="ct-label">{kind === 'contact' ? 'Message' : kind === 'bug' ? 'What happened?' : 'Tell us more'}</span>
                <textarea className="ct-input ct-textarea" value={form.message} onChange={set('message')}
                  placeholder={kind === 'contact' ? 'Ask away' : kind === 'bug' ? 'What you did, what you expected, and what happened instead' : 'What should it do, and how would it help your preparation?'} />
                {form.message.trim() && !enough && <span className="ct-hint">{left} more {left === 1 ? 'word' : 'words'}, please</span>}
              </label>

              <label className="ct-field">
                <span className="ct-label">Email</span>
                <input className="ct-input" type="email" autoComplete="email" placeholder="you@email.com" value={form.email} onChange={set('email')} />
                {kind !== 'contact' && <span className="ct-hint">So we can follow up</span>}
              </label>

              <button type="submit" className="ds-btn ds-btn-solid ct-send" disabled={status === 'sending' || !ready}>
                {status === 'sending' ? 'Sending…' : kind === 'contact' ? 'Send message' : kind === 'bug' ? 'Send report' : 'Send idea'}
              </button>
            </form>
          )}
        </section>

        <aside className="ct-aside">
          <div className="ct-way">
            <span className="ct-way-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="m2 7 10 7 10-7" /></svg>
            </span>
            <div>
              <h3>Email</h3>
              <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
              <p>For anything about your account or a payment.</p>
            </div>
          </div>
          <div className="ct-way">
            <span className="ct-way-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
            </span>
            <div>
              <h3>Telegram</h3>
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">t.me/historyoptionalxyz</a>
              <p>Updates, discussion and quick questions.</p>
            </div>
          </div>
          <div className="ct-way">
            <span className="ct-way-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20M6 15h4" /></svg>
            </span>
            <div>
              <h3>A problem with a payment</h3>
              <span className="ct-way-value">Write within 7 days of paying</span>
              <p>Duplicate charges and long outages are covered. <Link href="/refund">The refund policy</Link> has the details.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return <Suspense><ContactForm /></Suspense>;
}

const CSS = `
.ct { background: var(--bg); min-height: 70vh; padding-bottom: clamp(48px, 9vh, 96px); }
.ct-hero { padding: clamp(28px, 5vh, 52px) 0 clamp(16px, 3vh, 28px); background: linear-gradient(180deg, color-mix(in srgb, var(--accent-dim) 60%, var(--bg)) 0%, var(--bg) 100%); }
.ct-h1 { font-size: clamp(2rem, 4.4vw, 3rem); margin: 0 0 var(--space-2); }
.ct-lede { max-width: 640px; }
.ct-grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: var(--space-6); align-items: start; }
.ct-card { padding: var(--space-6); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--elev-1); min-width: 0; }
.ct-form { display: flex; flex-direction: column; gap: var(--space-4); }
.ct-field { display: flex; flex-direction: column; gap: 6px; }
.ct-label { font-size: 0.92rem; font-weight: 700; }
.ct-kinds { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.ct-kind { min-height: 40px; padding: 0 var(--space-4); border: 1.5px solid var(--border2); border-radius: var(--radius-full); background: var(--ds-card); color: var(--text2); font: inherit; font-size: 0.92rem; font-weight: 700; cursor: pointer; transition: border-color 0.15s, background 0.15s, color 0.15s; }
.ct-kind:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.ct-kind.on { border-color: var(--accent); background: var(--accent-dim); color: var(--accent-text); }
.ct-input { width: 100%; box-sizing: border-box; min-height: 46px; padding: 0 var(--space-4); background: var(--bg); border: 1.5px solid var(--border2); border-radius: var(--radius-lg); color: var(--text); font: inherit; font-size: 0.98rem; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
.ct-input:focus { border-color: color-mix(in srgb, var(--accent) 65%, transparent); box-shadow: 0 0 0 4px var(--accent-glow); }
.ct-input::placeholder { color: var(--text3); }
.ct-textarea { min-height: 150px; padding: var(--space-3) var(--space-4); resize: vertical; line-height: 1.6; }
.ct-hint { font-size: 0.82rem; color: var(--text3); }
.ct-send { align-self: flex-start; min-height: 48px; padding: 0 var(--space-6); }
.ct-send:disabled { opacity: 0.5; cursor: not-allowed; }
.ct-error { margin: 0; padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); background: var(--danger-wash); color: var(--danger-text); font-size: 0.92rem; line-height: 1.5; }
.ct-error a { color: inherit; font-weight: 700; }
.ct-done { display: flex; flex-direction: column; align-items: center; text-align: center; gap: var(--space-2); padding: var(--space-4) 0; }
.ct-done h2 { margin: var(--space-3) 0 0; font-size: 1.3rem; font-weight: 800; }
.ct-done p { margin: 0 0 var(--space-3); color: var(--text2); }
.ct-aside { display: flex; flex-direction: column; gap: var(--space-3); }
.ct-way { display: flex; gap: var(--space-3); padding: var(--space-4) var(--space-5); background: var(--ds-card); border: 1px solid var(--border); border-radius: var(--radius-xl); }
.ct-way-icon { width: 40px; height: 40px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--accent-dim); color: var(--accent-text); }
.ct-way h3 { margin: 0 0 2px; font-size: 0.98rem; font-weight: 800; }
.ct-way a, .ct-way-value { font-size: 0.94rem; font-weight: 600; color: var(--accent-text); text-decoration: none; overflow-wrap: anywhere; }
.ct-way p a { font-size: inherit; }
.ct-way-value { color: var(--text); }
.ct-way a:hover { text-decoration: underline; text-underline-offset: 3px; }
.ct-way p { margin: 4px 0 0; font-size: 0.88rem; line-height: 1.5; color: var(--text3); }
@media (max-width: 900px) { .ct-grid { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 640px) {
  .ct-card { padding: var(--space-5) var(--space-4); }
  .ct-kind { flex: 1; padding: 0 var(--space-2); font-size: 0.86rem; }
  .ct-send { width: 100%; justify-content: center; }
}
`;
