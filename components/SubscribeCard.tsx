'use client';
import { useLang } from '@/lib/i18n/LangContext';
import { useState, useEffect } from 'react';
import { auth, signInWithGoogle } from '@/lib/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';

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
  slots: number;
  fingerprint: string | null;
  onSuccess?: () => void;
  onClose?: () => void;
  standalone?: boolean;
}

export function SubscribeCard({
  slots, fingerprint, onSuccess, onClose, standalone = false }: SubscribeCardProps) {
  const { langHi } = useLang();
  const [step, setStep] = useState<SubscribeStep>('idle');
  const [token, setToken] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'daily'|'sixmonths'|'yearly'>('yearly');
  // Set when sign-in resumes for someone who is already subscribed. The
  // success screen otherwise names the plan tile they happened to have
  // selected, which is not the plan they own.
  const [existingPlan, setExistingPlan] = useState<string | null>(null);

  const allPlans = [
    { id: 'daily',      label: 'Daily',     price: '₹49',    sub: '1 day' },
    { id: 'sixmonths',  label: '6 Months',  price: '₹1,999', sub: '6 months' },
    { id: 'yearly',     label: 'Annual',    price: '₹2,999', sub: '1 year' },
  ] as const;
  const plans = slots > 0 ? allPlans : allPlans.filter(p => p.id === 'yearly');
  useEffect(() => { if (slots === 0) setSelectedPlan('yearly'); }, [slots]);

  const currentPlan = plans.find(p => p.id === selectedPlan)!;
  const price = currentPlan.price;
  const originalPrice = null;

  const showJulyBadge = false;

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
          const savedPlan = sessionStorage.getItem('ho_pending_plan') as 'daily'|'sixmonths'|'yearly' || 'yearly';
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

  const openRazorpay = async (authToken: string, email: string, planOverride?: 'daily'|'sixmonths'|'yearly') => {
    setStep('paying');
    try {
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': authToken },
        body: JSON.stringify({ plan: planOverride ?? selectedPlan }),
      });
      const orderData = await orderRes.json();
      if (!orderData.orderId) throw new Error('Order failed');
      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'History Optional',
        description: `Unlimited Access · ${currentPlan.label}`,
        image: '/favicon.svg',
        prefill: { email },
        theme: { color: '#d4a843' },
        modal: {
          ondismiss: async () => {
            setStep('idle');
            onClose?.();
          },
        },
        handler: async (resp: any) => {
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
      <>
        <style>{`
          @keyframes successPop {
            0%   { transform: scale(0.8); opacity: 0; }
            60%  { transform: scale(1.08); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes successGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(74,222,128,0.2); }
            50%       { box-shadow: 0 0 40px rgba(74,222,128,0.5); }
          }
        `}</style>
        <div style={{
          textAlign: 'center', padding: '1rem 0',
          animation: 'successPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(74,222,128,0.15) 0%, transparent 70%)',
            border: '1px solid rgba(74,222,128,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            animation: 'successGlow 2s ease infinite',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: '#4ade80', marginBottom: 5 }}>
            You're Premium!
          </div>
          <div style={{ color: 'var(--text3)', fontSize: '0.8rem', marginBottom: 18, lineHeight: 1.5 }}>
            {existingPlan
              ? <>You already have an active subscription.<br/>Go ace those answers.</>
              : <>Unlimited access · {currentPlan.label} plan.<br/>Go ace those answers.</>}
          </div>
          <button onClick={() => { onClose?.(); onSuccess?.(); }}
            style={{
              width: '100%', padding: '11px', borderRadius: 7, border: 'none',
              background: 'linear-gradient(135deg, #4ade80, #22c55e)',
              color: '#000', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer',
              letterSpacing: '0.02em',
            }}>
            Let's go →
          </button>
        </div>
      </>
    );
  }

  if (step === 'signing_in') {
    return (
      <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text3)', fontSize: '0.84rem' }}>
        <div style={{
          width: 20, height: 20, border: '2px solid rgba(212,168,67,0.2)',
          borderTopColor: '#d4a843', borderRadius: '50%',
          margin: '0 auto 10px',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Redirecting to Google…
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes pulseSlot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ctaGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(212,168,67,0.3), 0 4px 15px rgba(0,0,0,0.4); }
          50%       { box-shadow: 0 0 35px rgba(212,168,67,0.55), 0 4px 20px rgba(0,0,0,0.5); }
        }
        @keyframes julyPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0); }
          50%       { box-shadow: 0 0 10px 2px rgba(251,191,36,0.18); }
        }
        .subscribe-cta { transition: all 0.18s ease; }
        .subscribe-cta:hover { filter: brightness(1.1); }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>

        {/* July offer banner — only when annual selected in July */}
        {showJulyBadge && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(251,191,36,0.07)',
            border: '0.5px solid rgba(251,191,36,0.3)',
            borderRadius: 8, padding: '6px 10px',
            animation: 'julyPulse 2.5s ease infinite',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.75rem' }}>🎉</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                July Offer — Ends Jul 31
              </span>
            </div>
            <span style={{
              fontSize: '0.6rem', fontWeight: 800, color: '#4ade80',
              background: 'rgba(74,222,128,0.1)', border: '0.5px solid rgba(74,222,128,0.25)',
              borderRadius: 8, padding: '2px 7px', letterSpacing: '0.04em',
            }}>50% OFF</span>
          </div>
        )}

        {/* Plan selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
          {plans.map(p => {
            const isSelected = selectedPlan === p.id;
            const isPopular = p.id === 'yearly';
            return (
            <button key={p.id} onClick={() => setSelectedPlan(p.id)}
              style={{
                padding: '10px 4px 8px', borderRadius: 10, cursor: 'pointer', position: 'relative',
                border: isSelected ? '2px solid #d4a843' : '1px solid var(--border)',
                background: isSelected
                  ? 'linear-gradient(160deg, rgba(212,168,67,0.18), rgba(212,168,67,0.06))'
                  : 'var(--bg3)',
                transition: 'all 0.2s', textAlign: 'center',
                boxShadow: isSelected
                  ? '0 0 24px rgba(212,168,67,0.25), inset 0 1px 0 rgba(0,0,0,0.08)'
                  : 'none',
                transform: isSelected ? 'translateY(-2px)' : 'none',
              }}>
              {isPopular && (
                <div style={{
                  position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(90deg,#d4a843,#f0e68c)',
                  color: '#000', fontSize: '0.45rem', fontWeight: 800,
                  padding: '2px 7px', borderRadius: 20, letterSpacing: '0.08em',
                  whiteSpace: 'nowrap', textTransform: 'uppercase',
                }}>{langHi ? "सर्वोत्तम मूल्य" : "BEST VALUE"}</div>
              )}
              <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5, color: isSelected ? '#f0c040' : '#444' }}>{p.label}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, lineHeight: 1, fontFamily: 'var(--font-mono)', color: isSelected ? '#ffe066' : '#666', textShadow: isSelected ? '0 0 20px rgba(255,220,80,0.4)' : 'none' }}>{p.price}</div>
              <div style={{ fontSize: '0.55rem', marginTop: 4, color: isSelected ? '#a07830' : 'var(--border)' }}>{p.sub}</div>
            </button>
            );
          })}
        </div>

        {/* Price block + seal */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '1.9rem', fontWeight: 700,
                color: 'var(--text)', lineHeight: 1,
                background: 'linear-gradient(135deg, #f0e68c, #d4a843, #f0e68c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>{price}</span>
              <span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>/{currentPlan.sub}</span>
              {originalPrice && (
                <span style={{ color: 'var(--border2)', fontSize: '0.72rem', textDecoration: 'line-through' }}>
                  {originalPrice}
                </span>
              )}
            </div>
            
            {showJulyBadge && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#fbbf24', boxShadow: '0 0 6px rgba(251,191,36,0.6)',
                  display: 'inline-block', flexShrink: 0,
                  animation: 'pulseSlot 1.5s ease infinite',
                }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#fbbf24', letterSpacing: '0.04em' }}>
                  Limited time · saves ₹3,000
                </span>
              </div>
            )}
          </div>

          {/* Gold seal */}
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ flexShrink: 0, opacity: 0.9 }}>
            <defs>
              <radialGradient id="sealGrad" cx="50%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#f9e07a"/>
                <stop offset="50%" stopColor="#d4a843"/>
                <stop offset="100%" stopColor="#9a6f1e"/>
              </radialGradient>
              <radialGradient id="sealInner" cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#fef3c7"/>
                <stop offset="100%" stopColor="#d4a843"/>
              </radialGradient>
            </defs>
            {Array.from({ length: 16 }).map((_, i) => {
              const angle = (i * 360) / 16;
              const rad = (angle * Math.PI) / 180;
              const x1 = 26 + Math.cos(rad) * 19;
              const y1 = 26 + Math.sin(rad) * 19;
              const x2 = 26 + Math.cos(rad) * 24;
              const y2 = 26 + Math.sin(rad) * 24;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d4a843" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>;
            })}
            <circle cx="26" cy="26" r="18" fill="url(#sealGrad)"/>
            <circle cx="26" cy="26" r="14" fill="url(#sealInner)" opacity="0.4"/>
            <path d="M17 31 L19 23 L23 27 L26 21 L29 27 L33 23 L35 31 Z" fill="#7a4f0a" opacity="0.85" strokeLinejoin="round"/>
            <rect x="17" y="31" width="18" height="2.5" rx="1" fill="#7a4f0a" opacity="0.85"/>
          </svg>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[
            { label: 'Unlimited evals', icon: '◎' },
            { label: 'Prelims Smart Analysis', icon: '◎' },
            { label: 'Unlimited AI chat', icon: '◈' },
            { label: 'Model answers', icon: '◆' },
          ].map(f => (
            <span key={f.label} style={{
              fontSize: '0.68rem', color: 'var(--text3)',
              background: 'rgba(212,168,67,0.04)',
              border: '1px solid rgba(212,168,67,0.12)',
              borderRadius: 20, padding: '3px 9px',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ color: '#d4a843', fontSize: '0.6rem' }}>{f.icon}</span>
              {f.label}
            </span>
          ))}
        </div>

        {/* Glowing divider */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.25), rgba(212,168,67,0.5), rgba(212,168,67,0.25), transparent)',
          margin: '0 0 2px',
        }} />

        {/* CTA */}
        <button
          className="subscribe-cta"
          onClick={handlePay}
          disabled={step === 'paying'}
          style={{
            width: '100%', padding: '13px', borderRadius: 8, border: 'none',
            background: step === 'paying'
              ? 'var(--bg3)'
              : 'linear-gradient(135deg, #c49a2c 0%, #e8b84b 35%, #f5cc5e 50%, #e8b84b 65%, #b8881e 100%)',
            backgroundSize: '200% 200%',
            animation: step === 'paying' ? 'none' : 'gradientShift 4s ease infinite, ctaGlow 2.5s ease infinite',
            color: step === 'paying' ? 'var(--text3)' : '#000',
            fontWeight: 800, fontSize: '0.875rem',
            cursor: step === 'paying' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            letterSpacing: '0.02em',
            position: 'relative', overflow: 'hidden',
          }}>
          {step === 'paying'
            ? 'Opening payment…'
            : !token
              ? <><GoogleIcon /> Sign in &amp; Subscribe — {price}/{currentPlan.sub.split(' ')[1]}</>
              : `Subscribe — ${price}/${currentPlan.sub} →`}
        </button>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'var(--border)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              {'Secure · Razorpay · One-time payment'}
            </span>
          </div>
          {onClose && (
            <button onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--border)', cursor: 'pointer', fontSize: '0.74rem', padding: 0, transition: 'color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#777'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--border)'; }}>
              Maybe later
            </button>
          )}
        </div>
      </div>
    </>
  );
}
