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

  const price = slots > 0 ? '₹2,999' : '₹9,999';
  const priceNum = slots > 0 ? 299900 : 999900;

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
      <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
        <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>🎉</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: '#4ade80', marginBottom: 6 }}>
          You're Premium!
        </div>
        <div style={{ color: '#666', fontSize: '0.82rem', marginBottom: 18 }}>
          Unlimited access for 1 year. Go ace those answers.
        </div>
        <button onClick={() => { onClose?.(); onSuccess?.(); }}
          style={{ width: '100%', padding: '11px', borderRadius: 7, border: 'none', background: '#4ade80', color: '#000', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer' }}>
          Let's go →
        </button>
      </div>
    );
  }

  if (step === 'signing_in') {
    return (
      <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#555', fontSize: '0.84rem' }}>
        Redirecting to Google…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Price + slot badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: '#f0f0f0', lineHeight: 1 }}>{price}</span>
          <span style={{ color: '#555', fontSize: '0.78rem' }}>/year</span>
        </div>
        {slots > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 6, padding: '3px 8px' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f87171', boxShadow: '0 0 4px #f87171', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: '#f87171', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{slots} early-bird slots left</span>
          </div>
        )}
      </div>

      {/* Inline feature pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['Unlimited evaluations', 'Unlimited AI chat', 'Model answers'].map(f => (
          <span key={f} style={{ fontSize: '0.7rem', color: '#777', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e1e1e', borderRadius: 20, padding: '3px 9px' }}>
            ✓ {f}
          </span>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={handlePay}
        disabled={step === 'paying'}
        style={{
          width: '100%', padding: '12px', borderRadius: 7, border: 'none',
          background: step === 'paying' ? '#111' : '#d4a843',
          color: step === 'paying' ? '#444' : '#000',
          fontWeight: 700, fontSize: '0.875rem',
          cursor: step === 'paying' ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          letterSpacing: '0.01em', transition: 'opacity 0.15s',
        }}>
        {step === 'paying'
          ? 'Opening payment…'
          : !token
            ? <><GoogleIcon /> Sign in & Subscribe — {price}/yr</>
            : `Subscribe — ${price}/year →`}
      </button>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: '#333', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          Secure · Razorpay · Renews annually
        </span>
        {onClose && (
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#3a3a3a', cursor: 'pointer', fontSize: '0.76rem', padding: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#888'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3a3a3a'; }}>
            Maybe later
          </button>
        )}
      </div>
    </div>
  );
}
