'use client';
import { useLang } from '@/lib/i18n/LangContext';
import { PLANS, PLAN_ORDER, PLAN_DURATION, DEFAULT_PLAN, planPriceLabel, type PlanId } from '@/lib/plans';
import { useState, useEffect } from 'react';
import { auth, signInWithGoogle } from '@/lib/firebase';

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export type SubscribeStep = 'idle' | 'signing_in' | 'paying' | 'success';

interface SubscribeCardProps {
  fingerprint: string | null;
  onSuccess?: () => void;
  onClose?: () => void;
  standalone?: boolean;
  /**
   * Which tile is selected when the card opens. The pricing page shows its own
   * plan cards and then opens this one, so the plan the person clicked has to
   * survive the transition; without it they would land back on Annual.
   */
  initialPlan?: PlanId;
}

export function SubscribeCard({
  fingerprint, onSuccess, onClose, standalone = false,
  initialPlan = 'yearly' }: SubscribeCardProps) {
  const { langHi } = useLang();
  const [step, setStep] = useState<SubscribeStep>('idle');
  const [token, setToken] = useState<string | null>(null);
  // 'weekly' is no longer sold, so a stale link or saved choice falls back.
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan === 'weekly' ? DEFAULT_PLAN : initialPlan);
  // Set when sign-in resumes for someone who is already subscribed. The
  // success screen otherwise names the plan tile they happened to have
  // selected, which is not the plan they own.
  const [existingPlan, setExistingPlan] = useState<string | null>(null);

  // Prices come from lib/plans.ts, which is what /api/razorpay/order bills.
  const allPlans = PLAN_ORDER.map(id => ({
    id, label: PLANS[id].label, price: planPriceLabel(id), sub: PLAN_DURATION[id],
  }));

  const currentPlan = allPlans.find(p => p.id === selectedPlan) ?? { id: selectedPlan, label: PLANS[selectedPlan].label, price: planPriceLabel(selectedPlan), sub: PLAN_DURATION[selectedPlan] };

  useEffect(() => {
    if (document.getElementById('rzp-script')) return;
    const s = document.createElement('script');
    s.id = 'rzp-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        if (sessionStorage.getItem('ho_pending_payment') === '1') {
          const stored = sessionStorage.getItem('ho_pending_plan') as PlanId | null;
          const savedPlan: PlanId = stored && stored !== 'weekly' ? stored : DEFAULT_PLAN;
          sessionStorage.removeItem('ho_pending_payment');
          sessionStorage.removeItem('ho_pending_plan');
          setSelectedPlan(savedPlan);

          // "Sign in & Subscribe" and "Already subscribed? Sign in" both resume
          // here, and the two sit next to each other. Going straight into
          // checkout meant an existing subscriber who picked the wrong one was
          // shown a payment sheet for something they already own. Check first,
          // and if they are covered, just let them in.
          let alreadyPremium = false;
          try {
            const res = await fetch('/api/sub-status', { headers: { 'x-user-token': idToken } });
            const status = await res.json();
            alreadyPremium = status?.isPremium === true;
            if (alreadyPremium && typeof status?.plan === 'string') setExistingPlan(status.plan);
          } catch {
            // If the check itself fails, fall through to checkout rather than
            // stranding someone who genuinely wants to pay.
          }

          if (alreadyPremium) {
            setStep('success');
            onSuccess?.();
            return;
          }

          openRazorpay(idToken, firebaseUser.email ?? '', savedPlan);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    sessionStorage.setItem('ho_pending_payment', '1');
    sessionStorage.setItem('ho_pending_plan', selectedPlan);
    setStep('signing_in');
    try {
      // Both popup and redirect resume through the onAuthStateChanged effect
      // above, which reads the pending keys back — on redirect this page is
      // already gone by the time sign-in completes.
      await signInWithGoogle();
    } catch {
      sessionStorage.removeItem('ho_pending_payment');
      sessionStorage.removeItem('ho_pending_plan');
      setStep('idle');
    }
  };

  const openRazorpay = async (authToken: string, email: string, planOverride?: PlanId) => {
    setStep('paying');
    try {
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': authToken },
        body: JSON.stringify({ plan: planOverride ?? selectedPlan }),
      });
      const orderData = await orderRes.json();
      // The order route refuses a one-time plan while a weekly mandate is
      // live, and says why. Show its words rather than a generic failure.
      if (!orderData.orderId) throw new Error(orderData.message ?? 'Order failed');
      const Razorpay = (window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open: () => void; on: (ev: string, fn: () => void) => void } }).Razorpay;
      const rzp = new Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'History Optional',
        description: `Unlimited Access · ${currentPlan.label}`,
        image: '/favicon.svg',
        prefill: { email },
        theme: { color: 'var(--premium-text)' },
        modal: {
          ondismiss: async () => {
            setStep('idle');
            onClose?.();
          },
        },
        handler: async (resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // plan and amount are deliberately not sent — the server reads both
          // from the Razorpay order, so anything we put here would be ignored.
          const vRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-token': authToken },
            body: JSON.stringify({ ...resp, fingerprint }),
          });
          const vData = await vRes.json();
          if (vData.ok) { setStep('success'); setTimeout(() => { onSuccess?.(); window.location.href = `/subscribe/success?plan=${vData.plan ?? planOverride ?? selectedPlan}&amount=${orderData.amount}&txn=${resp.razorpay_payment_id}`; }, 1500); }
        },
      });
      rzp.on('payment.failed', async () => {
        setStep('idle');
        onClose?.();
      });
      rzp.open();
    } catch {
      setStep('idle');
    }
  };

  const handlePay = async () => {
    if (!token) { handleSignIn(); return; }
    const currentUser = auth.currentUser;
    openRazorpay(token, currentUser?.email ?? '');
  };

  if (step === 'success') {
    return (
      <div className="sc ds sc-done">
        <style dangerouslySetInnerHTML={{ __html: SC_CSS }} />
        <span className="sc-done-mark" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </span>
        <h3>You&rsquo;re on Premium</h3>
        <p>
          {existingPlan
            ? 'Your subscription was already active, so nothing was charged.'
            : `The ${currentPlan.label.toLowerCase()} plan is active. Everything is open to you now.`}
        </p>
        <button className="ds-btn ds-btn-solid ds-btn-block" onClick={() => { onClose?.(); onSuccess?.(); }}>
          Start studying
        </button>
      </div>
    );
  }

  if (step === 'signing_in') {
    return (
      <div className="sc ds sc-wait">
        <style dangerouslySetInnerHTML={{ __html: SC_CSS }} />
        <span className="sc-spin" aria-hidden="true" />
        Taking you to Google…
      </div>
    );
  }

  // Two kinds of plan, for two reasons: the whole preparation, paid once, and a
  // single day to try it. One choice across both, one button. The weekly
  // mandate is no longer sold.
  const GROUPS: { title: string; note: string; ids: PlanId[] }[] = langHi
    ? [
        { title: 'पूरी तैयारी के लिए', note: 'एकमुश्त भुगतान', ids: ['yearly', 'sixmonths'] },
        { title: 'बस आज़माने के लिए', note: '24 घंटे, एक बार भुगतान', ids: ['daily'] },
      ]
    : [
        { title: 'For your whole preparation', note: 'One-time payment', ids: ['yearly', 'sixmonths'] },
        { title: 'Just to try it', note: '24 hours, paid once', ids: ['daily'] },
      ];
  const monthly = (id: PlanId) => {
    const rupees = PLANS[id].amountPaise / 100;
    if (id === 'yearly') return Math.round(rupees / 12);
    if (id === 'sixmonths') return Math.round(rupees / 6);
    return null;
  };
  const NOTE: Record<PlanId, string> = langHi
    ? { yearly: '', sixmonths: '', weekly: '', daily: '24 घंटे सब कुछ खुला' }
    : { yearly: '', sixmonths: '', weekly: '', daily: 'Everything open for 24 hours' };
  const NAME: Record<PlanId, string> = langHi
    ? { yearly: 'सालाना', sixmonths: '6 महीने', weekly: 'साप्ताहिक', daily: 'एक दिन' }
    : { yearly: 'A year', sixmonths: '6 months', weekly: 'Weekly', daily: 'A day' };
  const selPrice = planPriceLabel(selectedPlan);

  return (
    <div className={`sc ds${standalone ? ' standalone' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: SC_CSS }} />

      <div className="sc-list" role="radiogroup" aria-label={langHi ? 'प्लान चुनें' : 'Choose a plan'}>
        {GROUPS.map(g => (
          <div key={g.title} className="sc-group">
            <div className="sc-group-head"><strong>{g.title}</strong><span>{g.note}</span></div>
            {g.ids.map(id => {
              const on = selectedPlan === id;
              const pm = monthly(id);
              const note = pm ? `₹${pm.toLocaleString('en-IN')} ${langHi ? 'प्रति माह' : 'a month'}` : NOTE[id];
              return (
                <button key={id} type="button" role="radio" aria-checked={on} className={`sc-row${on ? ' on' : ''}`} onClick={() => setSelectedPlan(id)}>
                  <span className="sc-radio" aria-hidden="true" />
                  <span className="sc-row-main">
                    <span className="sc-row-name">
                      {NAME[id]}
                      {id === 'yearly' && <span className="sc-chosen">{langHi ? 'सबसे ज़्यादा चुना गया' : 'Most chosen'}</span>}
                    </span>
                    {note && <span className="sc-row-note">{note}</span>}
                  </span>
                  <span className="sc-row-price">
                    {planPriceLabel(id)}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sc-cta">
        <button className="ds-btn ds-btn-solid ds-btn-lg ds-btn-block" onClick={handlePay} disabled={step === 'paying'}>
          {step === 'paying'
            ? (langHi ? 'Razorpay खुल रहा है…' : 'Opening Razorpay…')
            : !token
                ? <><GoogleIcon /> {langHi ? 'Google से जारी रखें' : 'Continue with Google'}</>
                : `${langHi ? 'भुगतान करें' : 'Pay'} ${selPrice}`}
        </button>
        <div className="sc-foot">
          <span className="sc-secure">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            {!token
              ? (langHi ? `फिर Razorpay पर ${selPrice} का भुगतान` : `Then pay ${selPrice} on Razorpay`)
              : (langHi ? 'भुगतान Razorpay से' : 'Payments go through Razorpay')}
          </span>
          {onClose && <button className="sc-later" onClick={onClose}>{langHi ? 'बाद में' : 'Maybe later'}</button>}
        </div>
      </div>
    </div>
  );
}

const SC_CSS = `
.sc { display: flex; flex-direction: column; gap: var(--space-4); }
.sc-list { display: flex; flex-direction: column; gap: var(--space-4); }
.sc-group { display: flex; flex-direction: column; gap: var(--space-2); }
.sc-group-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; padding: 0 2px; }
.sc-group-head strong { font-size: 0.86rem; font-weight: 700; color: var(--text); }
.sc-group-head span { font-family: var(--font-ui); font-size: 0.76rem; color: var(--text3); }
.sc-row {
  display: flex; align-items: center; gap: var(--space-3); width: 100%; min-height: 58px;
  padding: var(--space-3) var(--space-4); text-align: left;
  background: var(--ds-card); border: 1.5px solid var(--border2); border-radius: var(--radius-lg);
  cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.sc-row:hover { border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.sc-row.on { border-color: var(--accent); background: var(--accent-dim); }
.sc-row:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.sc-radio { flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border3); position: relative; transition: border-color 0.15s; }
.sc-row.on .sc-radio { border-color: var(--accent); }
.sc-row.on .sc-radio::after { content: ''; position: absolute; inset: 3px; border-radius: 50%; background: var(--accent); }
.sc-row-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.sc-row-name { display: inline-flex; align-items: center; flex-wrap: wrap; gap: var(--space-2); font-size: 0.98rem; font-weight: 700; color: var(--text); }
.sc-chosen { padding: 1px 8px; border-radius: var(--radius-full); background: var(--accent); color: var(--accent-on); font-family: var(--font-ui); font-size: 0.7rem; font-weight: 700; }
.sc-row-note { font-family: var(--font-ui); font-size: 0.8rem; color: var(--text3); line-height: 1.4; }
.sc-row.on .sc-row-note { color: var(--text2); }
.sc-row-price { flex-shrink: 0; font-size: 1.12rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text); }
.sc-row-price small { font-size: 0.78rem; font-weight: 500; color: var(--text3); letter-spacing: 0; }
.sc-cta { display: flex; flex-direction: column; gap: var(--space-2); }
.sc-foot { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; }
.sc-secure { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-ui); font-size: 0.78rem; color: var(--text3); }
.sc-later { background: none; border: none; padding: 4px 0; color: var(--text2); font-family: var(--font-ui); font-size: 0.84rem; cursor: pointer; }
.sc-later:hover { color: var(--accent-text); }
.sc-done { align-items: center; text-align: center; padding: var(--space-3) 0; }
.sc-done h3 { margin: 0; font-size: 1.2rem; font-weight: 800; }
.sc-done p { margin: 0 0 var(--space-2); font-size: 0.9rem; color: var(--text2); line-height: 1.55; }
.sc-done-mark { width: 52px; height: 52px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--success-wash); color: var(--success-text); }
.sc-wait { align-items: center; padding: var(--space-6) 0; font-size: 0.9rem; color: var(--text2); }
.sc-spin { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--border2); border-top-color: var(--accent); animation: sc-spin 0.7s linear infinite; }
@keyframes sc-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .sc-spin { animation-duration: 2s; } .sc-row { transition: none; } }
`;
