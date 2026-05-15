'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUsageTracker } from './useUsageTracker';
import { supabase } from '@/lib/supabase';

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

function LimitModal({
  slots, onClose, onSuccess, fingerprint,
}: {
  slots: number;
  onClose: () => void;
  onSuccess: () => void;
  fingerprint: string | null;
}) {
  const [step, setStep] = useState<'paywall' | 'signing_in' | 'paying' | 'success'>('paywall');
  const [token, setToken] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'daily'|'weekly'|'monthly'|'yearly'>('yearly');

  const allPlans = [
    { id: 'daily',   label: 'Daily',   price: '₹29',   sub: 'per day' },
    { id: 'weekly',  label: 'Weekly',  price: '₹149',  sub: 'per week' },
    { id: 'monthly', label: 'Monthly', price: '₹499',  sub: 'per month' },
    { id: 'yearly',  label: 'Annual',  price: slots > 0 ? '₹2,999' : '₹9,999', sub: 'per year' },
  ] as const;
  const plans = slots > 0 ? allPlans : allPlans.filter(p => p.id === 'yearly');
  useEffect(() => { if (slots === 0) setSelectedPlan('yearly'); }, [slots]);
  const currentPlan = plans.find(p => p.id === selectedPlan)!;
  const price = currentPlan.price;
  const priceNum = slots > 0 ? 299900 : 999900;

  useEffect(() => {
    if (document.getElementById('rzp-script')) return;
    const s = document.createElement('script');
    s.id = 'rzp-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(s);
  }, []);

  // Check if user just returned from Google OAuth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setToken(session.access_token);
        // If they were mid-purchase (came back from OAuth), open payment
        if (localStorage.getItem('ho_pending_payment') === '1') {
          const savedPlan = localStorage.getItem('ho_pending_plan') as 'daily'|'weekly'|'monthly'|'yearly' || 'yearly';
          localStorage.removeItem('ho_pending_payment');
          localStorage.removeItem('ho_pending_plan');
          setSelectedPlan(savedPlan);
          setStep('paying');
          openRazorpay(session.access_token, session.user?.email ?? '', savedPlan);
        }
      }
    });
  }, []);

  const handleSignIn = async () => {
    localStorage.setItem('ho_pending_payment', '1');
    localStorage.setItem('ho_pending_plan', selectedPlan);
    setStep('signing_in');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
    });
  };

  const openRazorpay = async (authToken: string, email: string, planOverride?: 'daily'|'weekly'|'monthly'|'yearly') => {
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
        description: 'Unlimited Access · 1 Year',
        image: '/favicon.svg',
        prefill: { email },
        theme: { color: '#3b82f6' },
        handler: async (resp: any) => {
          const vRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-token': authToken },
            body: JSON.stringify({ ...resp, fingerprint, plan: planOverride ?? selectedPlan }),
          });
          if ((await vRes.json()).ok) setStep('success');
        },
      });
      rzp.on('payment.failed', () => setStep('paywall'));
      rzp.open();
    } catch {
      setStep('paywall');
    }
  };

  const handlePay = async () => {
    if (!token) { handleSignIn(); return; }
    const { data: { user } } = await supabase.auth.getUser();
    openRazorpay(token, user?.email ?? '');
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1001, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
      onClick={() => { if (step === 'paywall') onClose(); }}>
      <div style={{ background:'#111', border:'1px solid #2a2a2a', borderRadius:16, padding:'2rem', maxWidth:400, width:'100%', boxShadow:'0 40px 80px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}>

        {step === 'success' ? (
          <>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontSize:'3rem', marginBottom:12 }}>🎉</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:700, color:'#4ade80', marginBottom:8 }}>Subscription Active!</div>
              <div style={{ color:'#888', fontSize:'0.88rem', lineHeight:1.6 }}>Unlimited access for 1 year. Go ace those answers.</div>
            </div>
            <button onClick={() => { onClose(); onSuccess(); }}
              style={{ width:'100%', padding:'14px', borderRadius:8, border:'none', background:'#4ade80', color:'#000', fontWeight:700, fontSize:'0.9rem', cursor:'pointer' }}>
              Continue →
            </button>
          </>
        ) : step === 'signing_in' ? (
          <div style={{ textAlign:'center', padding:'2rem 0' }}>
            <div style={{ color:'#888', fontSize:'0.88rem' }}>Redirecting to Google…</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.58rem', letterSpacing:'0.25em', textTransform:'uppercase', color:'#f87171', marginBottom:12 }}>
              Free limit reached
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'1.35rem', fontWeight:700, color:'#f0f0f0', marginBottom:8 }}>
              Unlock Unlimited Access
            </div>
            <div style={{ color:'#888', fontSize:'0.85rem', lineHeight:1.65, marginBottom:20 }}>
              You've used all your free credits. Subscribe to continue with unlimited evaluations and AI chat.
            </div>

            {/* Plan selector */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6, marginBottom:16 }}>
              {plans.map(p => {
                const isSelected = selectedPlan === p.id;
                const isPopular = p.id === 'yearly';
                return (
                  <button key={p.id} onClick={() => setSelectedPlan(p.id)}
                    style={{
                      padding:'10px 4px 8px', borderRadius:10, cursor:'pointer', position:'relative',
                      border: isSelected ? '2px solid #d4a843' : '1px solid rgba(255,255,255,0.08)',
                      background: isSelected
                        ? 'linear-gradient(160deg, rgba(212,168,67,0.18), rgba(212,168,67,0.06))'
                        : 'rgba(255,255,255,0.02)',
                      transition:'all 0.2s', textAlign:'center',
                      boxShadow: isSelected
                        ? '0 0 24px rgba(212,168,67,0.25), inset 0 1px 0 rgba(255,255,255,0.08)'
                        : 'none',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                    }}>
                    {isPopular && (
                      <div style={{
                        position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)',
                        background:'linear-gradient(90deg,#d4a843,#f0e68c)',
                        color:'#000', fontSize:'0.45rem', fontWeight:800,
                        padding:'2px 7px', borderRadius:20, letterSpacing:'0.08em',
                        whiteSpace:'nowrap', textTransform:'uppercase',
                      }}>BEST VALUE</div>
                    )}
                    <div style={{
                      fontSize:'0.58rem', fontWeight:700, letterSpacing:'0.08em',
                      textTransform:'uppercase', marginBottom:5,
                      color: isSelected ? '#f0c040' : '#444',
                    }}>{p.label}</div>
                    <div style={{
                      fontSize:'1.15rem', fontWeight:900, lineHeight:1,
                      fontFamily:'var(--font-mono)',
                      color: isSelected ? '#ffe066' : '#666',
                      textShadow: isSelected ? '0 0 20px rgba(255,220,80,0.4)' : 'none',
                    }}>{p.price}</div>
                    <div style={{
                      fontSize:'0.55rem', marginTop:4,
                      color: isSelected ? '#a07830' : '#2a2a2a',
                    }}>{p.sub}</div>
                  </button>
                );
              })}
            </div>

            {/* Features */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:'0.82rem', color:'#aaa', marginBottom:6 }}>✓ Unlimited answer evaluations</div>
              <div style={{ fontSize:'0.82rem', color:'#aaa', marginBottom:6 }}>✓ Unlimited AI chat every day</div>
              <div style={{ fontSize:'0.82rem', color:'#aaa' }}>✓ All model answers & feedback</div>
              <div style={{ fontSize:'0.82rem', color:'#aaa' }}>✓ Prelims Smart Analysis included</div>
            </div>

            {/* Sign in context if not logged in */}
            {!token && (
              <div style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:'0.78rem', color:'#888', lineHeight:1.5 }}>
                You'll sign in with Google to complete your purchase — this keeps your subscription safe across devices.
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={step === 'paying'}
              style={{ width:'100%', padding:'15px', borderRadius:8, border:'none', background: step === 'paying' ? '#1e3a8a' : 'linear-gradient(135deg,#2563eb,#3b82f6)', color:'#fff', fontWeight:700, fontSize:'0.9rem', cursor: step === 'paying' ? 'not-allowed' : 'pointer', fontFamily:'var(--font-mono)', letterSpacing:'0.05em', boxShadow:'0 0 30px rgba(59,130,246,0.3)', marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              {step === 'paying' ? 'Opening payment…' : !token ? <><GoogleIcon /> Sign in & Subscribe — {currentPlan.price}</> : `Subscribe — ${currentPlan.price}/${currentPlan.sub.split(' ')[1]} →`}
            </button>

            <div style={{ textAlign:'center', fontFamily:'var(--font-mono)', fontSize:'0.6rem', color:'#444', letterSpacing:'0.1em', marginBottom:12 }}>
              SECURE · RAZORPAY · {selectedPlan === 'yearly' ? 'RENEWS ANNUALLY' : selectedPlan.toUpperCase()}
            </div>

            <button onClick={onClose}
              style={{ width:'100%', padding:'10px', background:'transparent', border:'1px solid #222', borderRadius:8, color:'#555', cursor:'pointer', fontSize:'0.82rem' }}>
              Maybe later
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function useSubscriptionGate(onEvaluate: () => void) {
  const { usage, loading, canEval, canChat, incrementEval, incrementChat, FREE_EVAL_LIMIT, FREE_CHAT_LIMIT } = useUsageTracker();
  const [showEvalLimit, setShowEvalLimit] = useState(false);
  const [showChatLimit, setShowChatLimit] = useState(false);
  const [slots, setSlots] = useState(45);
  const onEvaluateRef = useRef(onEvaluate);
  useEffect(() => { onEvaluateRef.current = onEvaluate; }, [onEvaluate]);

  useEffect(() => {
    fetch('/api/slots').then(r => r.json()).then(d => setSlots(d.slots ?? 45)).catch(() => {});
  }, []);

  const handleEvaluate = useCallback(() => {
    if (loading) { onEvaluateRef.current(); return; }
    if (!canEval) { setShowEvalLimit(true); return; }
    onEvaluateRef.current();
  }, [loading, canEval]);

  const handleChat = useCallback(() => {
    if (!canChat) { setShowChatLimit(true); return false; }
    return true;
  }, [canChat]);

  const increment = useCallback(async (_fp: string) => {
    await incrementEval();
  }, [incrementEval]);

  const UsagePill = () => {
    if (loading) return null;
    if (usage?.isPremium) return (
      <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.62rem', color:'#51cf66', letterSpacing:'0.08em', marginBottom:12 }}>
        ✦ Unlimited access
      </div>
    );
    const remaining = FREE_EVAL_LIMIT - (usage?.eval_count ?? 0);
    const color = remaining <= 0 ? '#f87171' : remaining === 1 ? '#fbbf24' : '#555';
    return (
      <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.62rem', color, letterSpacing:'0.08em', marginBottom:12 }}>
        {remaining <= 0 ? 'Free evaluations used · subscribe for unlimited' : `${remaining} of ${FREE_EVAL_LIMIT} free evaluations remaining`}
      </div>
    );
  };

  const GateModals = ({ slots: slotsProp }: { slots?: number } = {}) => {
    const s = slotsProp ?? slots;
    return (
      <>
        {showEvalLimit && (
          <LimitModal
            slots={s}
            fingerprint={usage?.fingerprint ?? null}
            onClose={() => setShowEvalLimit(false)}
            onSuccess={() => { setShowEvalLimit(false); onEvaluateRef.current(); }}
          />
        )}
        {showChatLimit && (
          <LimitModal
            slots={s}
            fingerprint={usage?.fingerprint ?? null}
            onClose={() => setShowChatLimit(false)}
            onSuccess={() => setShowChatLimit(false)}
          />
        )}
      </>
    );
  };

  return {
    UsagePill, GateModals, handleEvaluate, handleChat,
    usage: { ...usage, token: usage?.fingerprint ?? null, loading },
    increment, incrementChat,
    canEval, canChat, slots,
    showChatLimitModal: () => setShowChatLimit(true),
    FREE_EVAL_LIMIT, FREE_CHAT_LIMIT,
  };
}
