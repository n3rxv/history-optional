'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UsageState {
  loading:    boolean;
  allowed:    boolean;
  used:       number;
  limit:      number;
  subscribed: boolean;
  owner:      boolean;
  token:      string | null;
}

interface Props {
  onAllowed: () => void;  // call this when user is allowed to evaluate
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open(): void;
      on(event: string, cb: () => void): void;
    };
  }
}

export function useEvalUsage() {
  const [state, setState] = useState<UsageState>({
    loading: true, allowed: false, used: 0,
    limit: 5, subscribed: false, owner: false, token: null,
  });

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, loading: true }));
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) {
      setState({ loading: false, allowed: false, used: 0, limit: 5, subscribed: false, owner: false, token: null });
      return;
    }
    const res  = await fetch('/api/eval-usage', { headers: { 'x-user-token': token } });
    const data = await res.json();
    setState({ loading: false, token, ...data });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const increment = useCallback(async (token: string) => {
    await fetch('/api/eval-usage', {
      method: 'POST',
      headers: { 'x-user-token': token },
    });
    refresh();
  }, [refresh]);

  return { ...state, refresh, increment };
}

export default function SubscriptionGate({ onAllowed }: Props) {
  const usage = useEvalUsage();
  const [showModal,   setShowModal]   = useState(false);
  const [payLoading,  setPayLoading]  = useState(false);
  const [paySuccess,  setPaySuccess]  = useState(false);
  const [signInMode,  setSignInMode]  = useState(false);
  const [signingIn,   setSigningIn]   = useState(false);

  // Load Razorpay script once
  useEffect(() => {
    if (document.getElementById('rzp-script')) return;
    const s = document.createElement('script');
    s.id  = 'rzp-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(s);
  }, []);

  const handleEvaluate = () => {
    if (usage.loading) return;
    if (!usage.token) { setSignInMode(true); setShowModal(true); return; }
    if (!usage.allowed) { setShowModal(true); return; }
    onAllowed();
  };

  const handleSignIn = async () => {
    setSigningIn(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/google-callback?next=/evaluate` },
    });
  };

  const handlePay = async () => {
    if (!usage.token) return;
    setPayLoading(true);
    try {
      const orderRes  = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'x-user-token': usage.token },
      });
      const orderData = await orderRes.json();
      if (!orderData.orderId) throw new Error('Order creation failed');

      const rzp = new window.Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      orderData.amount,
        currency:    orderData.currency,
        order_id:    orderData.orderId,
        name:        'History Optional',
        description: 'Unlimited Evaluations · 1 Year',
        image:       '/favicon.svg',
        prefill: {
          email: (await supabase.auth.getUser()).data.user?.email ?? '',
        },
        theme: { color: '#3b82f6' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: {
              'Content-Type':  'application/json',
              'x-user-token':  usage.token!,
            },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.ok) {
            setPaySuccess(true);
            usage.refresh();
          }
        },
      });
      rzp.on('payment.failed', () => setPayLoading(false));
      rzp.open();
    } catch (e) {
      console.error(e);
    } finally {
      setPayLoading(false);
    }
  };

  // ── Usage pill (shown above the evaluate button) ──────────────────────────
  const UsagePill = () => {
    if (usage.loading || usage.owner || usage.subscribed) return null;
    if (!usage.token) return (
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#666', letterSpacing: '0.1em' }}>
          Sign in to evaluate answers
        </span>
      </div>
    );
    const remaining = Math.max(0, usage.limit - usage.used);
    const color = remaining === 0 ? '#f87171' : remaining <= 2 ? '#fbbf24' : '#4ade80';
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: usage.limit }).map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i < usage.used ? '#333' : color,
              border: `1px solid ${i < usage.used ? '#2a2a2a' : color + '66'}`,
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: remaining === 0 ? '#f87171' : '#666', letterSpacing: '0.08em' }}>
          {remaining === 0 ? 'Daily limit reached' : `${remaining} evaluation${remaining === 1 ? '' : 's'} left today`}
        </span>
      </div>
    );
  };

  // ── Modal ─────────────────────────────────────────────────────────────────
  const Modal = () => {
    if (!showModal) return null;
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
        onClick={() => { if (!payLoading) { setShowModal(false); setPaySuccess(false); setSignInMode(false); } }}
      >
        <div style={{
          background: '#111', border: '1px solid #2a2a2a', borderRadius: 16,
          padding: '2rem', maxWidth: 420, width: '100%',
          boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
        }}
          onClick={e => e.stopPropagation()}
        >
          {paySuccess ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>
                  Subscription Active!
                </div>
                <div style={{ color: '#888', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  You now have unlimited evaluations for 1 year. Go ace those answers.
                </div>
              </div>
              <button
                style={{
                  width: '100%', padding: '14px', borderRadius: 8, border: 'none',
                  background: '#4ade80', color: '#000', fontWeight: 700,
                  fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-mono)',
                }}
                onClick={() => { setShowModal(false); setPaySuccess(false); onAllowed(); }}
              >
                Evaluate Now →
              </button>
            </>
          ) : signInMode ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: 12 }}>Sign in required</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: '#f0f0f0', marginBottom: 10 }}>
                  Evaluate Your Answers
                </div>
                <div style={{ color: '#888', fontSize: '0.88rem', lineHeight: 1.65 }}>
                  Sign in with Google to evaluate up to <span style={{ color: '#f0f0f0' }}>5 answers per day</span> for free.
                  Upgrade to <span style={{ color: '#3b82f6' }}>unlimited evaluations</span> for ₹999/year.
                </div>
              </div>
              <button
                disabled={signingIn}
                style={{
                  width: '100%', padding: '14px', borderRadius: 8,
                  border: '1px solid #3b82f6', background: 'rgba(59,130,246,0.1)',
                  color: '#3b82f6', fontWeight: 600, fontSize: '0.9rem',
                  cursor: signingIn ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-ui)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: 10, opacity: signingIn ? 0.6 : 1,
                }}
                onClick={handleSignIn}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                {signingIn ? 'Signing in…' : 'Continue with Google'}
              </button>
            </>
          ) : (
            <>
              {/* Header */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#f87171', marginBottom: 12 }}>Daily limit reached</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#f0f0f0', marginBottom: 10 }}>
                  Unlock Unlimited Evaluations
                </div>
                <div style={{ color: '#888', fontSize: '0.88rem', lineHeight: 1.65 }}>
                  You've used all <span style={{ color: '#f0f0f0' }}>{usage.limit} free evaluations</span> for today. Upgrade to evaluate as many answers as you want — every day.
                </div>
              </div>

              {/* Price card */}
              <div style={{
                background: 'linear-gradient(135deg, #0d1b3e, #091530)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 12, padding: '20px 20px 16px', marginBottom: 20, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)' }} />
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.8rem', fontWeight: 700, color: '#f0f0f0', lineHeight: 1 }}>₹999</span>
                  <span style={{ color: '#555', fontSize: '0.85rem', marginBottom: 6, fontFamily: 'var(--font-ui)' }}>/year</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#3b82f6', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>That's just ₹83/month</div>
                {[
                  '✓  Truly unlimited evaluations — every day',
                  '✓  All marking schemes & model answers',
                  '✓  Priority access to new features',
                  '✓  Support independent UPSC tooling',
                ].map((f, i) => (
                  <div key={i} style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: '#aaa', marginBottom: 7, lineHeight: 1.4 }}>{f}</div>
                ))}
              </div>

              {/* Pay button */}
              <button
                disabled={payLoading}
                style={{
                  width: '100%', padding: '15px', borderRadius: 8, border: 'none',
                  background: payLoading ? '#1e3a8a' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                  cursor: payLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                  boxShadow: payLoading ? 'none' : '0 0 30px rgba(59,130,246,0.3)',
                  transition: 'all 0.2s', marginBottom: 10,
                }}
                onClick={handlePay}
              >
                {payLoading ? 'Opening payment…' : 'Subscribe — ₹999/year →'}
              </button>

              <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#444', letterSpacing: '0.1em' }}>
                Secure payment via Razorpay · Renews annually
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return { UsagePill, Modal, handleEvaluate, usage };
}
