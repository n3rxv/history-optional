'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const FREE_LIMIT = 2;

interface UsageState {
  loading:    boolean;
  allowed:    boolean;
  used:       number;
  limit:      number;
  subscribed: boolean;
  owner:      boolean;
  noPhone:    boolean;
  token:      string | null;
}

// ── Phone collection modal ────────────────────────────────────────────────────
function PhoneModal({ token, onDone }: { token: string; onDone: () => void }) {
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  const submit = async () => {
    if (!phone.trim()) { setErr('Please enter your phone number.'); return; }
    setLoading(true); setErr('');
    const res  = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-token': token },
      body: JSON.stringify({ phone: phone.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? 'Something went wrong.'); setLoading(false); return; }
    onDone();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1001,
      background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: '#111', border: '1px solid #2a2a2a', borderRadius: 16,
        padding: '2rem', maxWidth: 400, width: '100%',
        boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: 12 }}>
          One-time setup
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, color: '#f0f0f0', marginBottom: 10 }}>
          Add your phone number
        </div>
        <div style={{ color: '#888', fontSize: '0.85rem', lineHeight: 1.65, marginBottom: 24 }}>
          Your free limit of <span style={{ color: '#f0f0f0' }}>2 evaluations/day</span> is tied to your phone number — this prevents misuse across multiple accounts. We don't send any messages.
        </div>

        <div style={{ marginBottom: 12 }}>
          <input
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={{
              width: '100%', padding: '13px 16px',
              background: '#161616', border: `1.5px solid ${err ? '#f87171' : '#2a2a2a'}`,
              borderRadius: 8, color: '#f0f0f0',
              fontFamily: 'var(--font-mono)', fontSize: '1rem',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {err && <div style={{ color: '#f87171', fontSize: '0.78rem', marginTop: 8, fontFamily: 'var(--font-ui)' }}>{err}</div>}
        </div>

        <button
          disabled={loading}
          onClick={submit}
          style={{
            width: '100%', padding: '13px', borderRadius: 8, border: 'none',
            background: loading ? '#1e3a8a' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
          }}
        >
          {loading ? 'Saving…' : 'Save & Continue →'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#444', letterSpacing: '0.1em' }}>
          Your number is stored securely and never shared
        </div>
      </div>
    </div>
  );
}

// ── Paywall / sign-in modal ───────────────────────────────────────────────────
function PaywallModal({
  token, mode, limit, onClose, onSuccess,
}: {
  token:     string | null;
  mode:      'unauthenticated' | 'limit_reached';
  limit:     number;
  onClose:   () => void;
  onSuccess: () => void;
}) {
  const [payLoading,  setPayLoading]  = useState(false);
  const [paySuccess,  setPaySuccess]  = useState(false);
  const [signingIn,   setSigningIn]   = useState(false);

  // Load Razorpay script
  useEffect(() => {
    if (document.getElementById('rzp-script')) return;
    const s = document.createElement('script');
    s.id = 'rzp-script'; s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(s);
  }, []);

  const handleSignIn = async () => {
    setSigningIn(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/google-callback?next=/evaluate` },
    });
  };

  const handlePay = async () => {
    if (!token) return;
    setPayLoading(true);
    try {
      const orderRes  = await fetch('/api/razorpay/order', { method: 'POST', headers: { 'x-user-token': token } });
      const orderData = await orderRes.json();
      if (!orderData.orderId) throw new Error('Order failed');

      const { data: { user } } = await supabase.auth.getUser();
      const rzp = new (window as any).Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount:      orderData.amount,
        currency:    orderData.currency,
        order_id:    orderData.orderId,
        name:        'History Optional',
        description: 'Unlimited Evaluations · 1 Year',
        image:       '/favicon.svg',
        prefill:     { email: user?.email ?? '' },
        theme:       { color: '#3b82f6' },
        handler: async (resp: any) => {
          const vRes  = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-token': token },
            body: JSON.stringify(resp),
          });
          if ((await vRes.json()).ok) setPaySuccess(true);
        },
      });
      rzp.on('payment.failed', () => setPayLoading(false));
      rzp.open();
    } catch { setPayLoading(false); }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
      onClick={() => { if (!payLoading) onClose(); }}
    >
      <div style={{
        background: '#111', border: '1px solid #2a2a2a', borderRadius: 16,
        padding: '2rem', maxWidth: 420, width: '100%',
        boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
      }} onClick={e => e.stopPropagation()}>

        {paySuccess ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>
                Subscription Active!
              </div>
              <div style={{ color: '#888', fontSize: '0.88rem', lineHeight: 1.6 }}>
                Unlimited evaluations for 1 year. Go ace those answers.
              </div>
            </div>
            <button
              style={{
                width: '100%', padding: '14px', borderRadius: 8, border: 'none',
                background: '#4ade80', color: '#000', fontWeight: 700,
                fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-mono)',
              }}
              onClick={() => { onClose(); onSuccess(); }}
            >
              Evaluate Now →
            </button>
          </>

        ) : mode === 'unauthenticated' ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: 12 }}>
                Sign in required
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: '#f0f0f0', marginBottom: 10 }}>
                Evaluate Your Answers
              </div>
              <div style={{ color: '#888', fontSize: '0.88rem', lineHeight: 1.65 }}>
                Sign in with Google to evaluate up to <span style={{ color: '#f0f0f0' }}>{limit} answers/day</span> for free.
                Upgrade for <span style={{ color: '#3b82f6' }}>unlimited evaluations</span> at ₹999/year.
              </div>
            </div>
            <button
              disabled={signingIn}
              style={{
                width: '100%', padding: '14px', borderRadius: 8,
                border: '1px solid #3b82f6', background: 'rgba(59,130,246,0.1)',
                color: '#3b82f6', fontWeight: 600, fontSize: '0.9rem',
                cursor: signingIn ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-ui)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                opacity: signingIn ? 0.6 : 1,
              }}
              onClick={handleSignIn}
            >
              <GoogleIcon />
              {signingIn ? 'Redirecting…' : 'Continue with Google'}
            </button>
          </>

        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#f87171', marginBottom: 12 }}>
                Daily limit reached
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#f0f0f0', marginBottom: 10 }}>
                Unlock Unlimited Evaluations
              </div>
              <div style={{ color: '#888', fontSize: '0.88rem', lineHeight: 1.65 }}>
                You've used all <span style={{ color: '#f0f0f0' }}>{limit} free evaluations</span> for today. Resets at midnight.
              </div>
            </div>

            {/* Price card */}
            <div style={{
              background: 'linear-gradient(135deg, #0d1b3e, #091530)',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 12, padding: '20px', marginBottom: 20, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.8rem', fontWeight: 700, color: '#f0f0f0', lineHeight: 1 }}>₹999</span>
                <span style={{ color: '#555', fontSize: '0.85rem', marginBottom: 6 }}>/year</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#3b82f6', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
                ₹83/month · cancel anytime
              </div>
              {[
                '✓  Truly unlimited evaluations — every day',
                '✓  All marking schemes & model answers',
                '✓  Priority access to new features',
              ].map((f, i) => (
                <div key={i} style={{ fontSize: '0.82rem', color: '#aaa', marginBottom: 7, lineHeight: 1.4 }}>{f}</div>
              ))}
            </div>

            <button
              disabled={payLoading}
              style={{
                width: '100%', padding: '15px', borderRadius: 8, border: 'none',
                background: payLoading ? '#1e3a8a' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                cursor: payLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                boxShadow: payLoading ? 'none' : '0 0 30px rgba(59,130,246,0.3)',
                marginBottom: 10,
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
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

// ── Main hook — use this in EvaluatePage ─────────────────────────────────────
export function useSubscriptionGate(onAllowed: () => void) {
  const [state, setState] = useState<UsageState>({
    loading: true, allowed: false, used: 0,
    limit: FREE_LIMIT, subscribed: false, owner: false, noPhone: false, token: null,
  });
  const [modal,      setModal]      = useState<'none' | 'phone' | 'unauthenticated' | 'limit_reached'>('none');

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, loading: true }));
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) {
      setState({ loading: false, allowed: false, used: 0, limit: FREE_LIMIT, subscribed: false, owner: false, noPhone: false, token: null });
      return;
    }
    const res  = await fetch('/api/eval-usage', { headers: { 'x-user-token': token } });
    const data = await res.json();
    setState({
      loading:    false,
      token,
      allowed:    data.allowed ?? false,
      used:       data.used    ?? 0,
      limit:      data.limit === Infinity ? Infinity : (data.limit ?? FREE_LIMIT),
      subscribed: data.subscribed ?? false,
      owner:      data.owner      ?? false,
      noPhone:    data.reason === 'no_phone',
    });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const increment = useCallback(async (token: string) => {
    await fetch('/api/eval-usage', { method: 'POST', headers: { 'x-user-token': token } });
    refresh();
  }, [refresh]);

  const handleEvaluate = useCallback(() => {
    if (state.loading) return;
    if (!state.token)  { setModal('unauthenticated'); return; }
    if (state.noPhone) { setModal('phone'); return; }
    if (!state.allowed){ setModal('limit_reached');   return; }
    onAllowed();
  }, [state, onAllowed]);

  // ── Dot pill showing remaining evals ────────────────────────────────────
  const UsagePill = () => {
    if (state.loading || state.owner || state.subscribed || !state.token) return null;
    const remaining = Math.max(0, state.limit - state.used);
    const color     = remaining === 0 ? '#f87171' : remaining <= 1 ? '#fbbf24' : '#4ade80';
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: state.limit }).map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i < state.used ? '#222' : color,
              border: `1px solid ${i < state.used ? '#2a2a2a' : color + '66'}`,
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

  // ── Combined modal renderer ───────────────────────────────────────────────
  const GateModals = () => (
    <>
      {modal === 'phone' && state.token && (
        <PhoneModal token={state.token} onDone={() => { setModal('none'); refresh().then(() => onAllowed()); }} />
      )}
      {(modal === 'unauthenticated' || modal === 'limit_reached') && (
        <PaywallModal
          token={state.token}
          mode={modal}
          limit={state.limit === Infinity ? FREE_LIMIT : state.limit}
          onClose={() => setModal('none')}
          onSuccess={onAllowed}
        />
      )}
    </>
  );

  return { UsagePill, GateModals, handleEvaluate, usage: state, increment };
}
