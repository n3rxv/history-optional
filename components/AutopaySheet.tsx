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

const GOLD = '#d4a843';

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
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Weekly autopay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999, padding: '1rem',
        background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      <div style={{
        width: '100%', maxWidth: 400, background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 'clamp(1rem, 4vw, 1.4rem)', boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
      }}>
        {step === 'already' && already ? (
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>
              You already have access
            </div>
            <p style={{ color: 'var(--text2)', fontSize: '0.86rem', lineHeight: 1.6, margin: '0 0 6px' }}>
              {already.autoRenew
                ? 'Your weekly subscription is already running, so nothing was charged.'
                : 'Nothing was charged. You are on a plan you have already paid for.'}
            </p>
            <p style={{ color: 'var(--text3)', fontSize: '0.82rem', lineHeight: 1.6, margin: '0 0 18px' }}>
              {already.autoRenew ? 'Next renewal' : 'Access runs to'}{' '}
              {new Date(already.expiresAt).toLocaleDateString('en-IN',
                { day: 'numeric', month: 'long', year: 'numeric' })}
              {already.autoRenew ? '.' : '. Come back after that if you want the weekly instead.'}
            </p>
            <button onClick={onClose}
              style={{
                width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                color: '#000', fontWeight: 800, fontSize: '0.86rem', cursor: 'pointer',
              }}>Got it</button>
          </div>
        ) : step === 'authorised' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>
              {liveUntil ? "You're in" : gaveUp ? 'Mandate authorised' : 'Mandate authorised'}
            </div>
            {liveUntil ? (
              <p style={{ color: 'var(--text2)', fontSize: '0.86rem', lineHeight: 1.6, margin: '0 0 18px' }}>
                &#8377;99 collected. Everything is unlocked, and the next charge is{' '}
                {new Date(liveUntil).toLocaleDateString('en-IN',
                  { day: 'numeric', month: 'long' })}.
              </p>
            ) : gaveUp ? (
              <p style={{ color: 'var(--text2)', fontSize: '0.86rem', lineHeight: 1.6, margin: '0 0 18px' }}>
                The charge is taking longer than usual to confirm. Nothing is wrong and
                nothing is lost. Refresh in a minute, or write to us if it has not opened.
              </p>
            ) : (
              <p style={{ color: 'var(--text2)', fontSize: '0.86rem', lineHeight: 1.6, margin: '0 0 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                <span style={{
                  width: 13, height: 13, flexShrink: 0, borderRadius: '50%',
                  border: '2px solid rgba(74,222,128,0.25)', borderTopColor: '#4ade80',
                  animation: 'autopaySpin 0.7s linear infinite',
                }} />
                Collecting the first &#8377;99&hellip;
              </p>
            )}
            <style>{`@keyframes autopaySpin { to { transform: rotate(360deg); } }`}</style>
            <button
              onClick={() => { if (liveUntil) window.location.reload(); else onClose(); }}
              style={{
                width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                color: '#000', fontWeight: 800, fontSize: '0.86rem', cursor: 'pointer',
              }}>{liveUntil ? 'Start using it' : 'Done'}</button>
          </div>
        ) : (
          <>
            {/* This authorises a recurring debit, so it is laid out as a
                billing summary rather than a feature pitch: what is taken
                today, what is taken afterwards, and how to stop it. */}
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>
              Weekly subscription
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 18 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.1rem', fontWeight: 700,
                lineHeight: 1, color: 'var(--text)' }}>
                {planPriceLabel(AUTOPAY_PLAN)}
              </span>
              <span style={{ color: 'var(--text3)', fontSize: '0.82rem' }}>/week</span>
            </div>

            <dl style={{ margin: '0 0 18px', borderTop: '1px solid var(--border)' }}>
              {([
                ['Charged today', planPriceLabel(AUTOPAY_PLAN)],
                ['Then every 7 days', planPriceLabel(AUTOPAY_PLAN)],
                ['Cancel', 'any time, one click'],
              ] as const).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'baseline', gap: 12, padding: '9px 0',
                  borderBottom: '1px solid var(--bg3)' }}>
                  <dt style={{ color: 'var(--text2)', fontSize: '0.84rem' }}>{k}</dt>
                  <dd style={{ margin: 0, color: 'var(--text)', fontSize: '0.84rem',
                    fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{v}</dd>
                </div>
              ))}
            </dl>

            {message && (
              <p style={{ color: '#f87171', fontSize: '0.8rem', margin: '0 0 12px' }}>{message}</p>
            )}
            <button onClick={start}
              disabled={step === 'opening' || step === 'signing_in'}
              style={{
                width: '100%', padding: '12px', borderRadius: 8, border: 'none',
                background: step === 'idle' || step === 'error'
                  ? 'linear-gradient(135deg, #c49a2c 0%, #e8b84b 40%, #f5cc5e 55%, #b8881e 100%)'
                  : 'var(--bg3)',
                color: step === 'idle' || step === 'error' ? '#000' : 'var(--text3)',
                fontWeight: 800, fontSize: '0.86rem', letterSpacing: '0.02em',
                cursor: step === 'idle' || step === 'error' ? 'pointer' : 'wait',
              }}>
              {step === 'opening' ? 'Opening\u2026'
                : step === 'signing_in' ? 'Signing in\u2026'
                : 'Authorise \u20b999/week \u2192'}
            </button>
            <p style={{ color: 'var(--text3)', fontSize: '0.72rem', lineHeight: 1.55,
              margin: '10px 0 0' }}>
              Razorpay notifies you before each debit. Cancelling stops future charges
              and grants you access for the remaining days you&rsquo;ve already paid for.
            </p>
            <button onClick={onClose}
              style={{ width: '100%', marginTop: 10, background: 'none', border: 'none',
                color: 'var(--text3)', cursor: 'pointer', fontSize: '0.78rem' }}>
              Maybe later
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
