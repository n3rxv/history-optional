#!/bin/bash
# Run from your project root: bash inject_subscribe.sh

cat > components/SubscribeCard.tsx << 'EOF'
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

export function SubscribeCard({ slots, fingerprint, onSuccess, onClose, standalone = false }: SubscribeCardProps) {
  const [step, setStep] = useState<SubscribeStep>('idle');
  const [token, setToken] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  const price = slots > 0 ? '₹2,999' : '₹9,999';
  const originalPrice = slots > 0 ? '₹9,999' : null;

  useEffect(() => {
    if (document.getElementById('rzp-script')) return;
    const s = document.createElement('script');
    s.id = 'rzp-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setToken(session.access_token);
        if (sessionStorage.getItem('ho_pending_payment') === '1') {
          sessionStorage.removeItem('ho_pending_payment');
          openRazorpay(session.access_token, session.user?.email ?? '');
        }
      }
    });
  }, []);

  const handleSignIn = async () => {
    sessionStorage.setItem('ho_pending_payment', '1');
    setStep('signing_in');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
    });
  };

  const openRazorpay = async (authToken: string, email: string) => {
    setStep('paying');
    try {
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': authToken },
      });
      const orderData = await orderRes.json();
      if (!orderData.orderId) throw new Error('Order failed');
      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'History Optional',
        description: 'Unlimited Access · 1 Year',
        image: '/favicon.svg',
        prefill: { email },
        theme: { color: '#d4a843' },
        modal: {
          ondismiss: async () => {
            await supabase.auth.signOut();
            setToken(null);
            setStep('idle');
            onClose?.();
          },
        },
        handler: async (resp: any) => {
          const vRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-token': authToken },
            body: JSON.stringify({ ...resp, fingerprint }),
          });
          if ((await vRes.json()).ok) setStep('success');
        },
      });
      rzp.on('payment.failed', async () => {
        await supabase.auth.signOut();
        setToken(null);
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
    const { data: { user } } = await supabase.auth.getUser();
    openRazorpay(token, user?.email ?? '');
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
          @keyframes confettiRain {
            0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(60px) rotate(360deg); opacity: 0; }
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
          <div style={{ color: '#555', fontSize: '0.8rem', marginBottom: 18, lineHeight: 1.5 }}>
            Unlimited access for 1 year.<br/>Go ace those answers.
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
      <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#555', fontSize: '0.84rem' }}>
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
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
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
        .subscribe-cta:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .subscribe-cta:active {
          transform: translateY(0px);
        }
        .subscribe-cta {
          transition: all 0.18s ease;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>

        {/* Decorative top graphic — coin/seal */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Price block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '1.9rem', fontWeight: 700,
                color: '#f0f0f0', lineHeight: 1,
                background: 'linear-gradient(135deg, #f0e68c, #d4a843, #f0e68c)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 3s linear infinite',
              }}>{price}</span>
              <span style={{ color: '#444', fontSize: '0.75rem' }}>/year</span>
              {originalPrice && (
                <span style={{ color: '#3a3a3a', fontSize: '0.72rem', textDecoration: 'line-through' }}>
                  {originalPrice}
                </span>
              )}
            </div>
            {slots > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#f87171',
                  boxShadow: '0 0 6px #f87171',
                  display: 'inline-block', flexShrink: 0,
                  animation: 'pulseSlot 1.5s ease infinite',
                }} />
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
                  color: '#f87171', letterSpacing: '0.04em',
                }}>
                  {slots} early-bird slots left
                </span>
              </div>
            )}
          </div>

          {/* Gold seal graphic */}
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
            {/* Starburst rays */}
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
            {/* Crown icon */}
            <path d="M17 31 L19 23 L23 27 L26 21 L29 27 L33 23 L35 31 Z" fill="#7a4f0a" opacity="0.85" strokeLinejoin="round"/>
            <rect x="17" y="31" width="18" height="2.5" rx="1" fill="#7a4f0a" opacity="0.85"/>
          </svg>
        </div>

        {/* Feature pills row */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[
            { label: 'Unlimited evals', icon: '◎' },
            { label: 'Unlimited AI chat', icon: '◈' },
            { label: 'Model answers', icon: '◆' },
          ].map(f => (
            <span key={f.label} style={{
              fontSize: '0.68rem', color: '#888',
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

        {/* CTA Button */}
        <button
          className="subscribe-cta"
          onClick={handlePay}
          disabled={step === 'paying'}
          style={{
            width: '100%', padding: '13px', borderRadius: 8, border: 'none',
            background: step === 'paying'
              ? '#111'
              : 'linear-gradient(135deg, #c49a2c 0%, #e8b84b 35%, #f5cc5e 50%, #e8b84b 65%, #b8881e 100%)',
            backgroundSize: '200% 200%',
            animation: step === 'paying' ? 'none' : 'gradientShift 4s ease infinite, ctaGlow 2.5s ease infinite',
            color: step === 'paying' ? '#444' : '#1a0e00',
            fontWeight: 800, fontSize: '0.875rem',
            cursor: step === 'paying' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            letterSpacing: '0.02em',
            position: 'relative', overflow: 'hidden',
          }}>
          {/* Shimmer overlay */}
          {step !== 'paying' && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2.5s linear infinite',
            }} />
          )}
          {step === 'paying'
            ? 'Opening payment…'
            : !token
              ? <><GoogleIcon /> Sign in &amp; Subscribe — {price}/yr</>
              : `Subscribe — ${price}/year →`}
        </button>

        {/* Footer row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Lock icon */}
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#2a2a2a', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Secure · Razorpay · Renews annually
            </span>
          </div>
          {onClose && (
            <button onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#2e2e2e', cursor: 'pointer', fontSize: '0.74rem', padding: 0, transition: 'color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#777'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#2e2e2e'; }}>
              Maybe later
            </button>
          )}
        </div>
      </div>
    </>
  );
}
EOF

echo "✅ SubscribeCard.tsx written"

# ─── Git commands ─────────────────────────────────────────────────────────────
git add components/SubscribeCard.tsx
git commit -m "feat: sexy SubscribeCard with gold shimmer, seal graphic, glow CTA"
git push

echo "✅ Pushed to git"
