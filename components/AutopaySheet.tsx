'use client';

/**
 * Weekly autopay checkout.
 *
 * Lives on its own because two places open it: the pricing page and the
 * premium modal that can be raised from anywhere in the app. A second copy of
 * this would be a second place for the price and the flow to drift apart,
 * which is exactly how the extend-plan modal ended up billing Rs 2,999 for a
 * Rs 1,999 button.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { auth, signInWithGoogle } from '@/lib/firebase';
import { planPriceLabel, AUTOPAY_PLAN } from '@/lib/plans';

const GOLD = 'var(--warning-text)';

const RESUME_KEY = 'ho_pending_autopay';

export default function AutopaySheet({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'idle' | 'signing_in' | 'opening' | 'authorised' | 'already' | 'error'>('idle');
  const [already, setAlready] = useState<{ expiresAt: string; autoRenew: boolean } | null>(null);
  const [liveUntil, setLiveUntil] = useState<string | null>(null);
  const [gaveUp, setGaveUp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (document.getElementById('rzp-script')) return;
    const s = document.createElement('script');
    s.id = 'rzp-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  // A redirect sign-in unloads this page, so the intent has to survive it.
  // Without this the sheet came back mounted but idle and the reader had to
  // press Subscribe a second time.
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (user && sessionStorage.getItem(RESUME_KEY) === '1') {
        sessionStorage.removeItem(RESUME_KEY);
        void openCheckout(user);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    const user = auth.currentUser;
    if (user) return openCheckout(user);

    setStep('signing_in');
    sessionStorage.setItem(RESUME_KEY, '1');
    try {
      const method = await signInWithGoogle();
      // 'redirect' means the page is already navigating away; the effect above
      // resumes on the way back. 'popup' resolves here with a live user, and
      // returning at that point was what left the button stuck on "Signing in".
      if (method === 'popup') {
        sessionStorage.removeItem(RESUME_KEY);
        const signedIn = auth.currentUser;
        if (signedIn) return openCheckout(signedIn);
        setStep('idle');
      }
    } catch {
      sessionStorage.removeItem(RESUME_KEY);
      setStep('idle');
    }
  }

  /**
   * Waits for the first charge to land.
   *
   * Razorpay debits the mandate on authorisation and fires
   * subscription.charged straight away, so this is usually one or two
   * iterations. The page had no way of noticing, though: nothing re-read
   * sub-status after the sheet closed, so someone sat looking at a stale
   * "being collected" message until they happened to refresh.
   */
  async function waitForAccess() {
    const started = Date.now();
    while (Date.now() - started < 45_000) {
      try {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          const res = await fetch('/api/sub-status', {
            headers: { 'x-user-token': token }, cache: 'no-store',
          });
          const s = await res.json();
          // isPremium alone is the wrong test for someone restarting a
          // cancelled weekly: they are already premium on the days they paid
          // for, so this would report success the instant it first polled,
          // whether or not the new mandate ever debited. auto_renew is only
          // set back to true by the subscription.charged webhook, which is
          // exactly the event being waited on, and it becomes true at the
          // same moment for a first-time subscriber.
          if (s?.isPremium && s?.autoRenew) { setLiveUntil(s.expires_at ?? null); return; }
        }
      } catch {
        // A blip mid-poll is not a failure; the next tick tries again.
      }
      await new Promise(r => setTimeout(r, 2000));
    }
    // The charge can still land after this; the webhook is what grants, not
    // this loop. Say so rather than implying something went wrong.
    setGaveUp(true);
  }

  async function openCheckout(user: NonNullable<typeof auth.currentUser>) {
    setStep('opening');
    setMessage(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/razorpay/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': token },
      });
      const data = await res.json();

      if (res.status === 409) {
        // Already covered. Show what they have rather than an error: they did
        // not do anything wrong, and the useful information is the end date.
        setAlready({ expiresAt: data.expiresAt, autoRenew: !!data.autoRenew });
        setStep('already');
        return;
      }
      if (!data.subscriptionId) throw new Error(data.error ?? 'Could not start the subscription');

      const rzp = new (window as unknown as { Razorpay: new (o: unknown) => { open: () => void; on: (e: string, cb: () => void) => void } }).Razorpay({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: 'History Optional',
        description: 'Weekly \u00b7 renews every 7 days',
        image: '/favicon.svg',
        prefill: { email: user.email ?? '' },
        theme: { color: GOLD },
        modal: { ondismiss: () => setStep('idle') },
        handler: () => {
          // Authorised, not yet charged. Razorpay debits and then calls the
          // webhook; that is what grants access. Poll until it lands so the
          // reader is told rather than left guessing.
          setStep('authorised');
          void waitForAccess();
        },
      });
      rzp.on('payment.failed', () => {
        setStep('error');
        setMessage('That payment method could not be authorised. Try another.');
      });
      rzp.open();
    } catch (e) {
      setStep('error');
      setMessage(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  if (typeof document === 'undefined') return null;
  const price = planPriceLabel(AUTOPAY_PLAN);
  const Tick = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>;
  return createPortal(
    <div className="ds ds-overlay ap-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <style dangerouslySetInnerHTML={{ __html: AP_CSS }} />
      <div className="ds-modal ap" role="dialog" aria-modal="true" aria-labelledby="ap-title">
        {step === 'already' && already ? (
          <div className="ap-done">
            <span className="ap-mark">{Tick}</span>
            <h2 id="ap-title">You already have access</h2>
            <p>
              {already.autoRenew
                ? 'Your weekly plan is already running, so nothing was charged.'
                : 'Nothing was charged. You are on a plan you have already paid for.'}
            </p>
            <p className="ap-muted">
              {already.autoRenew ? 'Next renewal' : 'Access runs to'}{' '}
              {new Date(already.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              {already.autoRenew ? '.' : '. Come back after that if you want the weekly plan instead.'}
            </p>
            <button type="button" className="ds-btn ds-btn-solid ds-btn-block" onClick={onClose}>Got it</button>
          </div>
        ) : step === 'authorised' ? (
          <div className="ap-done">
            {liveUntil ? <span className="ap-mark">{Tick}</span> : !gaveUp && <span className="ap-spin" aria-hidden="true" />}
            <h2 id="ap-title">{liveUntil ? 'You’re in' : 'Payment set up'}</h2>
            {liveUntil ? (
              <p>{price} collected. Everything is open now, and the next charge is on {new Date(liveUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}.</p>
            ) : gaveUp ? (
              <p>The charge is taking longer than usual to confirm. Nothing is wrong and nothing is lost. Refresh in a minute, or write to us if it still hasn’t opened.</p>
            ) : (
              <p>Collecting the first {price}. This usually takes a few seconds.</p>
            )}
            <button type="button" className="ds-btn ds-btn-solid ds-btn-block" onClick={() => { if (liveUntil) window.location.reload(); else onClose(); }}>
              {liveUntil ? 'Start studying' : 'Done'}
            </button>
          </div>
        ) : (
          <>
            {/* This authorises a recurring debit, so it reads as a bill rather
                than a pitch: what is taken today, what afterwards, and how to
                stop it. */}
            <div className="ds-modal-head">
              <div>
                <h2 id="ap-title">Weekly plan</h2>
                <p>Everything in Premium, paid a week at a time.</p>
              </div>
              <button type="button" className="ds-x" onClick={onClose} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <div className="ap-price"><strong>{price}</strong><span>a week</span></div>
            <dl className="ap-bill">
              <div><dt>Today</dt><dd>{price}</dd></div>
              <div><dt>Then every 7 days</dt><dd>{price}</dd></div>
              <div><dt>To stop it</dt><dd>One click, any time</dd></div>
            </dl>
            {message && <p className="ap-err" role="alert">{message}</p>}
            <button type="button" className="ds-btn ds-btn-solid ds-btn-lg ds-btn-block" onClick={start} disabled={step === 'opening' || step === 'signing_in'}>
              {step === 'opening' ? 'Opening Razorpay…' : step === 'signing_in' ? 'Signing you in…' : `Authorise ${price} a week`}
            </button>
            <p className="ap-fine">Razorpay tells you before each debit. If you stop it, you keep the days you’ve already paid for.</p>
            <button type="button" className="ap-later" onClick={onClose}>Maybe later</button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

const AP_CSS = `
.ap-overlay { z-index: 100000; }
.ap { max-width: 420px; }
.ap-price { display: flex; align-items: baseline; gap: 8px; margin-bottom: var(--space-4); }
.ap-price strong { font-size: 2.4rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
.ap-price span { font-size: 0.95rem; color: var(--text3); }
.ap-bill { margin: 0 0 var(--space-5); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
.ap-bill div { display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-3); padding: 11px var(--space-4); border-top: 1px solid var(--border); }
.ap-bill div:first-child { border-top: none; }
.ap-bill dt { font-size: 0.92rem; color: var(--text2); }
.ap-bill dd { margin: 0; font-size: 0.92rem; font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; text-align: right; }
.ap-err { margin: 0 0 var(--space-3); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); background: var(--danger-wash); color: var(--danger-text); font-size: 0.88rem; }
.ap-fine { margin: var(--space-3) 0 0; font-size: 0.84rem; line-height: 1.5; color: var(--text3); }
.ap-later { display: block; margin: var(--space-2) auto 0; padding: 6px 4px; background: none; border: none; color: var(--text2); font: inherit; font-size: 0.88rem; cursor: pointer; }
.ap-later:hover { color: var(--accent-text); }
.ap-done { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); text-align: center; padding: var(--space-2) 0; }
.ap-done h2 { margin: var(--space-2) 0 0; font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; }
.ap-done p { margin: 0; font-size: 0.92rem; line-height: 1.55; color: var(--text2); }
.ap-done p.ap-muted { color: var(--text3); font-size: 0.86rem; }
.ap-done .ds-btn { margin-top: var(--space-3); }
.ap-mark { width: 52px; height: 52px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--success-wash); color: var(--success-text); }
.ap-spin { width: 40px; height: 40px; border-radius: 50%; border: 3px solid var(--border2); border-top-color: var(--accent); animation: ap-spin 0.7s linear infinite; }
@keyframes ap-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .ap-spin { animation-duration: 2s; } }
`;
