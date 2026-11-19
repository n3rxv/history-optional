'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useLang } from '@/lib/i18n/LangContext';
import LoginPromptModal from '@/components/LoginPromptModal';
import { auth } from '@/lib/firebase';

/**
 * Asks a signed-in reader for a review and suggestions, with their name,
 * attempt and designation (app/api/review, supabase/reviews.sql).
 *
 * When it opens by itself: a signed-in reader who has opened PAGES_MIN pages
 * in this browser, AFTER_MS into a session, never on a page where they are
 * mid-task, and never on top of another dialog. "Not now" waits LATER_DAYS;
 * a sent review stops it for good, on every device (the server is asked
 * before it opens). Once it has opened in a session, the Premium nudge and
 * the weekly checkup stay away for the rest of that session (SHOWN_KEY), so
 * nobody gets two pop-ups in one visit.
 *
 * Any link with ?review=1 opens it straight away, so a review can be asked
 * for from Telegram or WhatsApp; a signed-out reader is asked to sign in first.
 */

export const SHOWN_KEY = 'ho_review_shown';
const SENT_KEY = 'ho_review_sent';
const LATER_KEY = 'ho_review_later';
const PAGES_KEY = 'ho_pages_opened';
const PAGES_MIN = 20;
const AFTER_MS = 3 * 60 * 1000;
const RETRY_MS = 60 * 1000;
const LATER_DAYS = 21;
const MIN_WORDS = 5;
/** Pages where a reader is in the middle of something, or being sold to. */
const BUSY = ['/test', '/evaluate', '/prelims', '/check-map', '/pricing', '/subscribe', '/auth'];

const ATTEMPTS: { id: string; en: string; hi: string }[] = [
  { id: '1', en: '1st', hi: 'पहला' },
  { id: '2', en: '2nd', hi: 'दूसरा' },
  { id: '3', en: '3rd', hi: 'तीसरा' },
  { id: '4', en: '4th', hi: 'चौथा' },
  { id: '5+', en: '5th or more', hi: 'पाँचवाँ या अधिक' },
  { id: 'none', en: 'Not a candidate', hi: 'अभ्यर्थी नहीं' },
];

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} },
};

export default function ReviewPrompt() {
  const { user, loading } = useFirebaseAuth();
  const { langHi } = useLang();
  const T = (en: string, hi: string) => (langHi ? hi : en);
  const path = usePathname();
  const pathRef = useRef(path);
  useEffect(() => { pathRef.current = path; }, [path]);

  const [open, setOpen] = useState(false);
  const [askLogin, setAskLogin] = useState(false);
  const [forced, setForced] = useState(false);
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [review, setReview] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [name, setName] = useState('');
  const [attempt, setAttempt] = useState('');
  const [about, setAbout] = useState('');
  const [canPublish, setCanPublish] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const sent = useRef(false);

  const show = useCallback(() => {
    try { sessionStorage.setItem(SHOWN_KEY, '1'); } catch {}
    setOpen(true);
  }, []);

  // ?review=1 opens it now, whoever is reading.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search).get('review');
    if (q === '1') setForced(true);
    // Local only, to look at the form without signing in. Dropped from builds.
    else if (process.env.NODE_ENV === 'development' && q === 'preview') show();
  }, [show]);
  useEffect(() => {
    if (!forced || loading) return;
    if (user) { setAskLogin(false); show(); } else setAskLogin(true);
  }, [forced, loading, user, show]);

  // The automatic ask.
  useEffect(() => {
    if (forced || loading || !user) return;
    if (store.get(SENT_KEY)) return;
    if (Number(store.get(PAGES_KEY) || 0) < PAGES_MIN) return;
    const later = Number(store.get(LATER_KEY) || 0);
    if (later && Date.now() - later < LATER_DAYS * 864e5) return;
    try { if (sessionStorage.getItem(SHOWN_KEY)) return; } catch {}

    let timer = 0;
    let stopped = false;
    const tryShow = async () => {
      if (stopped) return;
      const busy = BUSY.some((p) => pathRef.current?.startsWith(p)) || document.querySelector('[role="dialog"], [aria-modal="true"]') || document.hidden;
      if (busy) { timer = window.setTimeout(tryShow, RETRY_MS); return; }
      try {
        const res = await fetch('/api/review', { headers: { 'x-user-token': await user.getIdToken() } });
        if (res.ok && (await res.json()).done) { store.set(SENT_KEY, '1'); return; }
      } catch { return; }
      if (!stopped) show();
    };
    timer = window.setTimeout(tryShow, AFTER_MS);
    return () => { stopped = true; window.clearTimeout(timer); };
  }, [forced, loading, user, show]);

  // A signed-in reader's name is filled in for them.
  useEffect(() => {
     
    if (open && user?.displayName) setName((n) => n || user.displayName || '');
  }, [open, user]);

  const later = useCallback(() => {
    if (step === 'form') store.set(LATER_KEY, String(Date.now()));
    setOpen(false);
  }, [step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') later(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, later]);

  const enough = words(review) >= MIN_WORDS || words(suggestions) >= MIN_WORDS;
  const ready = enough && name.trim().length > 0 && !sending;

  const submit = async () => {
    if (!user || !ready || sent.current) return;
    sent.current = true;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': await user.getIdToken() },
        body: JSON.stringify({ review, suggestions, name, attempt: attempt || null, about, canPublish, page: window.location.pathname }),
      });
      if (!res.ok) throw new Error(String(res.status));
      store.set(SENT_KEY, '1');
      setStep('done');
      window.setTimeout(() => setOpen(false), 3500);
    } catch (e) {
      sent.current = false;
      setError((e as Error).message === '429'
        ? T('Too many submissions. Please wait a moment.', 'बहुत सारे संदेश भेजे गए। कृपया थोड़ी देर रुकें।')
        : T('That didn’t send. Please try again.', 'यह भेजा नहीं जा सका। कृपया फिर से कोशिश करें।'));
    } finally {
      setSending(false);
    }
  };

  if (askLogin) {
    // The modal closes itself after a popup sign-in, which can come before the
    // auth hook hears of the new user: open the form here when that happened.
    return <LoginPromptModal isOpen onClose={() => { setAskLogin(false); if (auth.currentUser) show(); else setForced(false); }}
      message={T('Sign in to write a review.', 'समीक्षा लिखने के लिए साइन इन करें।')} />;
  }
  if (!open) return null;

  return (
    <div className="ds ds-overlay rv-overlay">
      <style dangerouslySetInnerHTML={{ __html: RV_CSS }} />
      <div className="ds-modal rv" role="dialog" aria-modal="true" aria-labelledby="rv-title">
        {step === 'form' ? (<>
          <div className="rv-top">
            <span className="rv-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z" /><path d="M12 15.5s-3.2-1.9-3.2-4a1.8 1.8 0 0 1 3.2-1.1 1.8 1.8 0 0 1 3.2 1.1c0 2.1-3.2 4-3.2 4Z" /></svg>
            </span>
            <div className="rv-head">
              <span className="rv-eyebrow">{T('Your review', 'आपकी राय')}</span>
              <h2 id="rv-title">{T('How is History Optional working for you?', 'History Optional आपके कितने काम आ रहा है?')}</h2>
              <p>{T('A few lines from you help other aspirants decide, and tell us what to build next.', 'आपकी कुछ पंक्तियाँ दूसरे अभ्यर्थियों को फ़ैसला लेने में मदद करती हैं, और हमें बताती हैं कि आगे क्या बनाना है।')}</p>
            </div>
            <button type="button" className="ds-x rv-x" onClick={later} aria-label={T('Not now', 'अभी नहीं')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>

          <label className="rv-label" htmlFor="rv-review">{T('What has it changed in your preparation?', 'इसने आपकी तैयारी में क्या बदला?')}</label>
          <textarea id="rv-review" className="rv-input rv-text" rows={4} value={review} onChange={(e) => setReview(e.target.value)}
            placeholder={T('The notes, answer checking, topper copies, the AI… whatever helped you most.', 'नोट्स, उत्तर मूल्यांकन, टॉपर कॉपियाँ, AI… जो भी आपके सबसे ज़्यादा काम आया।')} />

          <label className="rv-label" htmlFor="rv-sugg">{T('Suggestions', 'सुझाव')} <span className="rv-opt">{T('optional', 'वैकल्पिक')}</span></label>
          <textarea id="rv-sugg" className="rv-input rv-text" rows={3} value={suggestions} onChange={(e) => setSuggestions(e.target.value)}
            placeholder={T('What should we add, change or fix?', 'हमें क्या जोड़ना, बदलना या ठीक करना चाहिए?')} />

          <label className="rv-label" htmlFor="rv-name">{T('Your name', 'आपका नाम')}</label>
          <input id="rv-name" className="rv-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />

          <span className="rv-label" id="rv-attempt-label">{T('Which UPSC attempt is this?', 'यह आपका UPSC का कौन-सा प्रयास है?')}</span>
          <div className="rv-chips" role="radiogroup" aria-labelledby="rv-attempt-label">
            {ATTEMPTS.map((a) => (
              <button key={a.id} type="button" role="radio" aria-checked={attempt === a.id} className={`rv-chip${attempt === a.id ? ' on' : ''}`}
                onClick={() => setAttempt((x) => (x === a.id ? '' : a.id))}>{langHi ? a.hi : a.en}</button>
            ))}
          </div>

          <label className="rv-label" htmlFor="rv-about">{T('Designation or what you do', 'पद या आप क्या करते हैं')} <span className="rv-opt">{T('optional', 'वैकल्पिक')}</span></label>
          <input id="rv-about" className="rv-input" value={about} onChange={(e) => setAbout(e.target.value)} maxLength={120}
            placeholder={T('e.g. Student, Working professional', 'जैसे विद्यार्थी, नौकरीपेशा')} />

          <label className="rv-consent">
            <input type="checkbox" checked={canPublish} onChange={(e) => setCanPublish(e.target.checked)} />
            <span>{T('You can show my review on History Optional with my name, attempt and designation.', 'आप मेरी समीक्षा मेरे नाम, प्रयास और पद के साथ History Optional पर दिखा सकते हैं।')}</span>
          </label>

          {error && <p className="rv-error" role="alert">{error}</p>}
          {!enough && (review || suggestions) && (
            <p className="rv-hint">{T(`A few more words, at least ${MIN_WORDS} in one box.`, `कुछ शब्द और, किसी एक बॉक्स में कम से कम ${MIN_WORDS}।`)}</p>
          )}

          <div className="rv-actions">
            <button type="button" className="ds-btn ds-btn-ghost" onClick={later}>{T('Not now', 'अभी नहीं')}</button>
            <button type="button" className="ds-btn rv-send" onClick={submit} disabled={!ready}>{sending ? T('Sending…', 'भेज रहे हैं…') : T('Send', 'भेजें')}</button>
          </div>
        </>) : (
          <div className="rv-done">
            <span className="rv-icon big" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
            <h2 id="rv-title">{T('Thank you!', 'धन्यवाद!')}</h2>
            <p>{T('We read every review and suggestion.', 'हम हर समीक्षा और सुझाव पढ़ते हैं।')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const RV_CSS = `
.rv-overlay { z-index: 9999; }
.rv { max-width: 520px; padding: 0; overflow-x: hidden; border: 2px solid transparent;
  background: linear-gradient(var(--ds-card), var(--ds-card)) padding-box, linear-gradient(120deg, var(--tint-modern), var(--tint-medieval), var(--tint-ancient)) border-box;
  box-shadow: 0 30px 80px -30px color-mix(in srgb, var(--tint-modern) 70%, transparent), 0 20px 60px -30px color-mix(in srgb, var(--tint-medieval) 60%, transparent); }
.rv > * { margin-left: var(--space-6); margin-right: var(--space-6); }
.rv-top { position: relative; display: flex; gap: var(--space-4); align-items: flex-start; margin: 0 0 var(--space-5); padding: var(--space-6) var(--space-6) var(--space-5);
  background: radial-gradient(80% 120% at 0% 0%, color-mix(in srgb, var(--tint-modern) 22%, transparent), transparent 70%), radial-gradient(70% 120% at 100% 0%, color-mix(in srgb, var(--tint-medieval) 20%, transparent), transparent 70%);
  border-bottom: 1px solid var(--border); }
.rv-icon { width: 48px; height: 48px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-circle); color: var(--on-fill);
  background: linear-gradient(135deg, var(--tint-modern), var(--tint-medieval)); box-shadow: 0 8px 24px -8px color-mix(in srgb, var(--tint-medieval) 70%, transparent); }
.rv-icon.big { width: 60px; height: 60px; }
.rv-head { flex: 1; min-width: 0; padding-right: var(--space-6); }
.rv-eyebrow { display: inline-block; margin-bottom: 4px; font-family: var(--font-ui); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
  background: linear-gradient(100deg, var(--tint-modern), var(--tint-medieval)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.rv-head h2 { margin: 0; font-size: 1.22rem; line-height: 1.3; font-weight: 800; letter-spacing: -0.015em; color: var(--text); }
.rv-head p { margin: 6px 0 0; font-size: 0.88rem; line-height: 1.5; color: var(--text2); }
.rv-x { position: absolute; top: var(--space-4); right: var(--space-4); }
.rv-label { display: block; margin-top: var(--space-4); margin-bottom: 6px; font-size: 0.9rem; font-weight: 700; color: var(--text); }
.rv-top + .rv-label { margin-top: 0; }
.rv-opt { margin-left: 4px; font-family: var(--font-ui); font-size: 0.74rem; font-weight: 500; color: var(--text3); }
.rv-input { display: block; width: calc(100% - 2 * var(--space-6)); box-sizing: border-box; padding: 10px var(--space-3); border: 1.5px solid var(--border2); border-radius: var(--radius-lg); background: var(--bg); color: var(--text); font: inherit; font-size: 0.95rem; line-height: 1.5; outline: none; }
.rv-text { resize: vertical; min-height: 84px; }
.rv-input:focus { border-color: color-mix(in srgb, var(--tint-modern) 70%, transparent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--tint-modern) 22%, transparent); }
.rv-input::placeholder { color: var(--text3); }
.rv-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.rv-chip { padding: 8px 14px; border: 1.5px solid var(--border2); border-radius: var(--radius-full); background: var(--bg); color: var(--text2); font: inherit; font-family: var(--font-ui); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.rv-chip:hover { border-color: color-mix(in srgb, var(--tint-modern) 60%, transparent); }
.rv-chip.on { border-color: transparent; color: var(--on-fill); background: linear-gradient(120deg, var(--tint-modern), var(--tint-medieval)); }
.rv-chip:focus-visible, .rv-consent input:focus-visible { outline: 2px solid var(--tint-modern); outline-offset: 2px; }
.rv-consent { display: flex; gap: var(--space-3); align-items: flex-start; margin-top: var(--space-5); padding: var(--space-3); border-radius: var(--radius-lg); background: color-mix(in srgb, var(--tint-modern) 8%, transparent); border: 1px solid color-mix(in srgb, var(--tint-modern) 25%, transparent); font-size: 0.86rem; line-height: 1.5; color: var(--text2); cursor: pointer; }
.rv-consent input { width: 18px; height: 18px; margin: 2px 0 0; flex-shrink: 0; accent-color: var(--tint-modern); }
.rv-error { margin: var(--space-3) var(--space-6) 0; font-size: 0.86rem; color: var(--danger-text); }
.rv-hint { margin: var(--space-3) var(--space-6) 0; font-size: 0.82rem; color: var(--text3); }
.rv-actions { display: flex; gap: var(--space-2); margin-top: var(--space-5); margin-bottom: var(--space-6); }
.rv-actions .ds-btn { flex: 1; justify-content: center; }
.rv-send { border: none; color: var(--on-fill); background: linear-gradient(120deg, var(--tint-modern), var(--tint-medieval) 60%, var(--tint-ancient)); box-shadow: 0 10px 26px -12px color-mix(in srgb, var(--tint-medieval) 80%, transparent); }
.rv-send:hover:not(:disabled) { filter: brightness(1.06); }
.rv-send:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
.rv-done { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); padding: var(--space-8) 0; text-align: center; }
.rv-done h2 { margin: var(--space-2) 0 0; font-size: 1.4rem; font-weight: 800; background: linear-gradient(100deg, var(--tint-modern), var(--tint-medieval), var(--tint-ancient)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.rv-done p { margin: 0; font-size: 0.92rem; color: var(--text2); }
@media (max-width: 640px) {
  .rv > * { margin-left: var(--space-4); margin-right: var(--space-4); }
  .rv-top { margin: 0 0 var(--space-4); padding: var(--space-5) var(--space-4) var(--space-4); }
  .rv-input { width: calc(100% - 2 * var(--space-4)); }
  .rv-icon { width: 40px; height: 40px; }
  .rv-head h2 { font-size: 1.08rem; }
  .rv-actions { flex-direction: column-reverse; }
}
`;
