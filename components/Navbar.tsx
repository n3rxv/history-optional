'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ThemeCustomizer from './ThemeCustomizer';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const links = [
  { href: '/',          label: 'Home' },
  { href: '/paper1',    label: 'Paper I' },
  { href: '/paper2',    label: 'Paper II' },
  { href: '/timeline',  label: 'Timeline' },
  { href: '/chat',      label: 'AI Chat' },
  { href: '/evaluate',  label: 'Evaluate' },
  { href: '/historiography', label: 'Historiography' },
];

function snooColor(email: string): string {
  const palette = [
    '#ff4500', '#51cf66', '#339af0', '#cc5de8', '#f59f00',
    '#20c997', '#ff6b6b', '#74c0fc', '#a9e34b', '#ffa94d',
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function SnooAvatar({ email, size = 28 }: { email: string; size?: number }) {
  const c = snooColor(email);
  const bg = '#0f0f1a';
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill={bg}/>
      <circle cx="43" cy="13" r="4.5" fill={c}/>
      <line x1="39.5" y1="15.5" x2="33" y2="21" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="32" cy="30" r="14" fill={c}/>
      <circle cx="27" cy="28" r="3.5" fill="white"/>
      <circle cx="37" cy="28" r="3.5" fill="white"/>
      <circle cx="28" cy="28.5" r="1.8" fill={bg}/>
      <circle cx="38" cy="28.5" r="1.8" fill={bg}/>
      <path d="M27 34 Q32 38.5 37 34" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="18" cy="29" r="4.5" fill={c}/>
      <circle cx="46" cy="29" r="4.5" fill={c}/>
      <circle cx="18" cy="29" r="2.2" fill="#ff6b6b"/>
      <circle cx="46" cy="29" r="2.2" fill="#ff6b6b"/>
      <ellipse cx="32" cy="51" rx="10" ry="6.5" fill={c}/>
    </svg>
  );
}

function PremiumModal({ onClose, noSubFound }: { onClose: () => void; noSubFound?: boolean }) {
  const [slots, setSlots] = React.useState(45);
  const [step, setStep] = React.useState<'plans' | 'signing_in' | 'paying' | 'success'>('plans');

  React.useEffect(() => {
    fetch('/api/slots').then(r => r.json()).then(d => setSlots(d.slots ?? 45)).catch(() => {});
    if (!document.getElementById('rzp-script')) {
      const s = document.createElement('script');
      s.id = 'rzp-script';
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.head.appendChild(s);
    }
    // Auto-trigger payment if returning from OAuth
    if (sessionStorage.getItem('ho_pending_payment') === '1') {
      setTimeout(async () => {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          sessionStorage.removeItem('ho_pending_payment');
          setStep('paying');
          // inline pay
          const orderRes = await fetch('/api/razorpay/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-token': session.access_token },
          });
          const orderData = await orderRes.json();
          if (!orderData.orderId) { setStep('plans'); return; }
          let paymentSucceeded = false;
          const rzp = new (window as any).Razorpay({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: orderData.amount,
            currency: orderData.currency,
            order_id: orderData.orderId,
            name: 'History Optional',
            description: 'Unlimited Access · 1 Year',
            prefill: { email: session.user?.email ?? '' },
            theme: { color: '#d4a843' },
            modal: {
              ondismiss: async () => {
                document.body.style.overflow = '';
                document.body.style.pointerEvents = '';
                const { supabase } = await import('@/lib/supabase');
                await supabase.auth.signOut();
                onClose();
              }
            },
            handler: async (resp: any) => {
              const FP = await (await import('@fingerprintjs/fingerprintjs')).default.load();
              const { visitorId: fingerprint } = await FP.get();
              const vRes = await fetch('/api/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-token': session.access_token },
                body: JSON.stringify({ ...resp, fingerprint }),
              });
              if ((await vRes.json()).ok) setStep('success');
            },
          });
          rzp.on('payment.failed', async () => {
            document.body.style.overflow = '';
            document.body.style.pointerEvents = '';
            const { supabase } = await import('@/lib/supabase');
            await supabase.auth.signOut();
            onClose();
          });
          rzp.open();
        }
      }, 800);
    }
  }, []);

  const price = slots > 0 ? '₹1,999' : '₹9,999';

  const handleSubscribe = async () => {
    // Get fingerprint
    const FP = await (await import('@fingerprintjs/fingerprintjs')).default.load();
    const { visitorId: fingerprint } = await FP.get();

    // Check if already have auth session
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      sessionStorage.setItem('ho_pending_payment', '1');
      setStep('signing_in');
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
      });
      return;
    }

    setStep('paying');
    const orderRes = await fetch('/api/razorpay/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-token': session.access_token },
    });
    const orderData = await orderRes.json();
    if (!orderData.orderId) { setStep('plans'); return; }

    const rzp = new (window as any).Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.orderId,
      name: 'History Optional',
      description: 'Unlimited Access · 1 Year',
      prefill: { email: session.user?.email ?? '' },
      theme: { color: '#d4a843' },
      handler: async (resp: any) => {
        const vRes = await fetch('/api/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-token': session.access_token },
          body: JSON.stringify({ ...resp, fingerprint }),
        });
        if ((await vRes.json()).ok) setStep('success');
      },
    });
    rzp.on('payment.failed', () => setStep('plans'));
    rzp.open();
  };

  const features = [
    { name: 'All notes (Paper I & II)', free: true,  premium: true  },
    { name: 'PYQ bank',                 free: true,  premium: true  },
    { name: 'Timeline & Historiography',free: true,  premium: true  },
    { name: 'Answer evaluation',        free: '1/week', premium: 'Unlimited' },
    { name: 'AI Chat (History tutor)',  free: '5/month', premium: 'Unlimited' },
    { name: 'Annotations & highlights', free: true,  premium: true  },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}
      onClick={onClose}>
      <div style={{ background: '#0e0e0e', border: '1px solid #222', borderRadius: 18, padding: '2rem', maxWidth: 440, width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.8)', margin: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {step === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>You're Premium!</div>
            <div style={{ color: '#888', fontSize: '0.88rem', marginBottom: 24 }}>Unlimited access for 1 year. Go ace those answers.</div>
            <button onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: 8, border: 'none', background: '#4ade80', color: '#000', fontWeight: 700, cursor: 'pointer' }}>Let's go →</button>
          </div>
        ) : step === 'signing_in' ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#888' }}>Redirecting to Google…</div>
        ) : (
          <>
            {noSubFound && (
              <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.8rem', color: '#f87171', textAlign: 'center', letterSpacing: '0.01em' }}>
                No active subscription found for this account.
              </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4a843', marginBottom: 6 }}>Premium</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: '#f0f0f0', lineHeight: 1.2 }}>Unlock everything</div>
              <div style={{ fontSize: '0.82rem', color: '#666', marginTop: 6 }}>Notes & PYQs are always free. Premium unlocks evaluations and AI chat.</div>
            </div>

            {/* Features */}
            <div style={{ marginBottom: 20 }}>
              {features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < features.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                  <span style={{ fontSize: '0.84rem', color: '#bbb' }}>{f.name}</span>
                  <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: f.free === true ? '#3d7a50' : '#4a4a4a', minWidth: 60, textAlign: 'center' }}>
                      {f.free === true ? '✓ free' : f.free === false ? '—' : f.free}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#d4a843', fontWeight: 600, minWidth: 72, textAlign: 'right' }}>
                      {f.premium === true ? '✓' : f.premium}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Price row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#111', border: '1px solid #222', borderRadius: 10, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f0f0f0', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{price}</div>
                <div style={{ fontSize: '0.72rem', color: '#555', marginTop: 3 }}>per year · renews annually</div>
              </div>
              {slots > 0 && (
                <div style={{ fontSize: '0.7rem', color: '#c0392b', fontFamily: 'var(--font-mono)', textAlign: 'right', lineHeight: 1.4 }}>
                  {slots} slots<br/>left
                </div>
              )}
            </div>

            <button onClick={handleSubscribe} disabled={step === 'paying'}
              style={{ width: '100%', padding: '13px', borderRadius: 8, border: 'none', background: step === 'paying' ? '#1a1a1a' : '#d4a843', color: step === 'paying' ? '#555' : '#000', fontWeight: 700, fontSize: '0.9rem', cursor: step === 'paying' ? 'not-allowed' : 'pointer', marginBottom: 8, letterSpacing: '0.02em' }}>
              {step === 'paying' ? 'Opening payment…' : `Subscribe — ${price}/year`}
            </button>

            <button onClick={onClose}
              style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #1e1e1e', borderRadius: 8, color: '#444', cursor: 'pointer', fontSize: '0.8rem' }}>
              Maybe later
            </button>

            <button onClick={async () => {
                sessionStorage.setItem('ho_verify_sub', '1');
                const { supabase } = await import('@/lib/supabase');
                await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
                });
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1a1a1a'; (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = '#333'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#888'; (e.currentTarget as HTMLElement).style.borderColor = '#1e1e1e'; }}
              style={{ width: '100%', marginTop: 8, padding: '10px', background: 'transparent', border: '1px solid #1e1e1e', borderRadius: 8, color: '#888', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Already subscribed? Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pyqsMenuOpen, setPyqsMenuOpen] = useState(false);
  const [notesMenuOpen, setNotesMenuOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [noSubFound, setNoSubFound] = useState(false);

  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      if (sessionStorage.getItem('ho_pending_payment') === '1') {
        setShowPremiumModal(true);
      }
      if (sessionStorage.getItem('ho_verify_sub') === '1') {
        sessionStorage.removeItem('ho_verify_sub');
        // Check if they have a subscription, sign out if not
        (async () => {
          const { supabase } = await import('@/lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const res = await fetch(`/api/usage?fp=check&checkSub=1&token=${session.access_token}`);
            const data = await res.json();
            if (!data.isPremium) {
              await supabase.auth.signOut();
              setNoSubFound(true);
              setShowPremiumModal(true);
            }
          }
        })();
      }
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = () => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/google-callback?next=${encodeURIComponent(window.location.pathname)}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    router.refresh();
  };

  return (
    <>
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #1f1f1f',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        height: 60, flexWrap: 'nowrap',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.2rem', fontWeight: 700,
            color: '#ffffff', letterSpacing: '-0.01em',
          }}>
            History <span style={{ color: 'var(--accent)' }}>Optional</span>
          </span>
          <span style={{
            fontSize: '0.6rem',
            background: 'rgba(59,130,246,0.1)',
            color: 'var(--accent)',
            border: '1px solid rgba(59,130,246,0.3)',
            padding: '1px 6px', borderRadius: 3,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.08em',
          }}>UPSC</span>
        </Link>

        <div style={{ display: 'flex', gap: '0.15rem', alignItems: 'center' }} className="desktop-nav">
          {/* Notes dropdown */}
          <div style={{ position: 'relative' }} onMouseEnter={() => setNotesMenuOpen(true)} onMouseLeave={() => setNotesMenuOpen(false)}>
            <button style={{
              padding: '0.3rem 0.55rem',
              borderRadius: 5,
              fontSize: '0.78rem',
              fontFamily: 'var(--font-ui)',
              color: (pathname.startsWith('/paper') || pathname.startsWith('/timeline') || pathname.startsWith('/historiography')) ? 'var(--accent)' : 'var(--text2)',
              background: (pathname.startsWith('/paper') || pathname.startsWith('/timeline') || pathname.startsWith('/historiography')) ? 'rgba(59,130,246,0.1)' : 'transparent',
              border: (pathname.startsWith('/paper') || pathname.startsWith('/timeline') || pathname.startsWith('/historiography')) ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
              transition: 'all 0.15s',
            }}>
              Notes ▾
            </button>
            {notesMenuOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0,
                background: 'var(--bg2)', border: '1px solid var(--border2)',
                borderRadius: 8, padding: '0.4rem',
                minWidth: 160, zIndex: 1000,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                {[
                  { href: '/paper1', label: '📜 Paper I' },
                  { href: '/paper2', label: '📖 Paper II' },
                  { href: '/timeline', label: '🗓 Timeline' },
                  { href: '/historiography', label: '🏛 Historiography' },
                ].map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setNotesMenuOpen(false)}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#fff'; el.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = pathname.startsWith(item.href) ? 'var(--accent)' : 'var(--text2)'; el.style.background = pathname.startsWith(item.href) ? 'rgba(59,130,246,0.1)' : 'transparent'; }}
                    style={{
                      display: 'block', padding: '0.5rem 0.75rem', borderRadius: 5,
                      fontSize: '0.85rem', textDecoration: 'none',
                      color: pathname.startsWith(item.href) ? 'var(--accent)' : 'var(--text2)',
                      background: pathname.startsWith(item.href) ? 'rgba(59,130,246,0.1)' : 'transparent',
                    }}>{item.label}</Link>
                ))}
              </div>
            )}
          </div>

          {/* PYQs dropdown */}
          <div style={{ position: 'relative' }} onMouseEnter={() => setPyqsMenuOpen(true)} onMouseLeave={() => setPyqsMenuOpen(false)}>
            <button style={{
              padding: '0.3rem 0.55rem',
              borderRadius: 5,
              fontSize: '0.78rem',
              fontFamily: 'var(--font-ui)',
              color: (pathname.startsWith('/pyqs') || pathname.startsWith('/test')) ? 'var(--accent)' : 'var(--text2)',
              background: (pathname.startsWith('/pyqs') || pathname.startsWith('/test')) ? 'rgba(59,130,246,0.1)' : 'transparent',
              border: (pathname.startsWith('/pyqs') || pathname.startsWith('/test')) ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
              transition: 'all 0.15s',
            }}>
              PYQs ▾
            </button>
            {pyqsMenuOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0,
                background: 'var(--bg2)', border: '1px solid var(--border2)',
                borderRadius: 8, padding: '0.4rem',
                minWidth: 140, zIndex: 1000,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                <Link href="/pyqs" onClick={() => setPyqsMenuOpen(false)}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = pathname === '/pyqs' ? 'var(--accent)' : 'var(--text2)'; (e.currentTarget as HTMLElement).style.background = pathname === '/pyqs' ? 'rgba(59,130,246,0.1)' : 'transparent'; }}
                  style={{
                  display: 'block', padding: '0.5rem 0.75rem', borderRadius: 5,
                  fontSize: '0.85rem', textDecoration: 'none',
                  color: pathname === '/pyqs' ? 'var(--accent)' : 'var(--text2)',
                  background: pathname === '/pyqs' ? 'rgba(59,130,246,0.1)' : 'transparent',
                }}>📋 Browse PYQs</Link>
                <Link href="/test" onClick={() => setPyqsMenuOpen(false)}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = pathname === '/test' ? 'var(--accent)' : 'var(--text2)'; (e.currentTarget as HTMLElement).style.background = pathname === '/test' ? 'rgba(59,130,246,0.1)' : 'transparent'; }}
                  style={{
                  display: 'block', padding: '0.5rem 0.75rem', borderRadius: 5,
                  fontSize: '0.85rem', textDecoration: 'none',
                  color: pathname === '/test' ? 'var(--accent)' : 'var(--text2)',
                  background: pathname === '/test' ? 'rgba(59,130,246,0.1)' : 'transparent',
                }}>🎯 Start Test</Link>
              </div>
            )}
          </div>

          {links.map(l => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} style={{
                padding: '0.4rem 0.9rem',
                borderRadius: 5,
                fontSize: '0.85rem',
                fontFamily: 'var(--font-ui)',
                textDecoration: 'none',
                color: active ? 'var(--accent)' : 'var(--text2)',
                background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
                border: active ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) (e.target as HTMLElement).style.color = '#ffffff'; }}
              onMouseLeave={e => { if (!active) (e.target as HTMLElement).style.color = 'var(--text2)'; }}
              >
                {l.label}
              </Link>
            );
          })}
          <ThemeCustomizer />

          {/* Auth button */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: '#0f0f1a', border: `2px solid ${snooColor(user.email ?? '')}`,
                  cursor: 'pointer', padding: 0, overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginLeft: '0.4rem', flexShrink: 0,
                  boxShadow: `0 0 10px ${snooColor(user.email ?? '')}44`,
                }}
                title={user.email}
              >
                <SnooAvatar email={user.email ?? ''} size={30} />
              </button>
              {userMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  background: 'var(--bg2)', border: '1px solid var(--border2)',
                  borderRadius: 10, padding: '1rem', width: 220,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 1000,
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 4 }}>Signed in as</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 600, marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </div>
                  <button onClick={handleSignOut} style={{
                    width: '100%', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)',
                    color: '#ff8080', cursor: 'pointer', padding: '0.4rem', borderRadius: 6, fontSize: '0.78rem',
                  }}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowPremiumModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(135deg, rgba(212,168,67,0.2), rgba(251,191,36,0.12))',
                border: '1px solid rgba(212,168,67,0.7)',
                color: '#f0c040', cursor: 'pointer',
                padding: '0.3rem 0.65rem', borderRadius: 6,
                fontSize: '0.78rem', fontWeight: 700,
                marginLeft: '0.4rem', transition: 'all 0.2s',
                letterSpacing: '0.03em', whiteSpace: 'nowrap',
                boxShadow: '0 0 10px rgba(212,168,67,0.3), 0 0 20px rgba(212,168,67,0.1)',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'linear-gradient(135deg, rgba(212,168,67,0.3), rgba(251,191,36,0.2))'; el.style.boxShadow = '0 0 16px rgba(212,168,67,0.5), 0 0 32px rgba(212,168,67,0.2)'; el.style.borderColor = 'rgba(212,168,67,0.9)'; el.style.color = '#ffd700'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'linear-gradient(135deg, rgba(212,168,67,0.2), rgba(251,191,36,0.12))'; el.style.boxShadow = '0 0 10px rgba(212,168,67,0.3), 0 0 20px rgba(212,168,67,0.1)'; el.style.borderColor = 'rgba(212,168,67,0.7)'; el.style.color = '#f0c040'; }}
            >
              ✦ Premium
            </button>
          )}
          {showPremiumModal && <PremiumModal onClose={() => { setShowPremiumModal(false); setNoSubFound(false); }} noSubFound={noSubFound} />}
        </div>

        <button onClick={() => setOpen(!open)} style={{
          display: 'none', background: 'none', border: 'none',
          color: 'var(--text)', cursor: 'pointer', fontSize: '1.4rem',
        }} className="mobile-menu-btn">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '0.75rem 1.5rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '0.25rem',
          background: 'var(--bg)',
        }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{
              padding: '0.65rem 0.75rem', borderRadius: 5,
              fontSize: '0.9rem', textDecoration: 'none',
              color: pathname === l.href ? 'var(--accent)' : 'var(--text2)',
            }}>{l.label}</Link>
          ))}
          <Link href="/dashboard" onClick={() => setOpen(false)} style={{
            padding: '0.65rem 0.75rem', borderRadius: 5,
            fontSize: '0.9rem', textDecoration: 'none',
            color: pathname === '/dashboard' ? 'var(--accent)' : 'var(--text2)',
          }}>📊 My Progress</Link>
          <Link href="/pyqs" onClick={() => setOpen(false)} style={{
            padding: '0.65rem 0.75rem', borderRadius: 5,
            fontSize: '0.9rem', textDecoration: 'none',
            color: pathname === '/pyqs' ? 'var(--accent)' : 'var(--text2)',
          }}>📋 PYQs</Link>
          <Link href="/test" onClick={() => setOpen(false)} style={{
            padding: '0.65rem 0.75rem', borderRadius: 5,
            fontSize: '0.9rem', textDecoration: 'none',
            color: pathname === '/test' ? 'var(--accent)' : 'var(--text2)',
          }}>🎯 Start Test</Link>
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <ThemeCustomizer />
            {user ? (
              <button onClick={handleSignOut} style={{
                background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)',
                color: '#ff8080', cursor: 'pointer', padding: '0.4rem 0.8rem', borderRadius: 6, fontSize: '0.78rem',
              }}>Sign out ({user.email?.split('@')[0]})</button>
            ) : (
              <button onClick={handleSignIn} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)',
                color: 'var(--accent)', cursor: 'pointer',
                padding: '0.4rem 0.8rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
              }}>Sign in with Google</button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
    {showPremiumModal && <PremiumModal onClose={() => { setShowPremiumModal(false); setNoSubFound(false); }} noSubFound={noSubFound} />}
  </>
  );
}
