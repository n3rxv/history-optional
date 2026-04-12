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

function PremiumModal({ onClose }: { onClose: () => void }) {
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
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#d4a843', marginBottom: 8 }}>✦ Premium</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#f0f0f0' }}>Unlock Everything</div>
            </div>

            {/* Features table */}
            <div style={{ border: '1px solid #1e1e1e', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', background: '#141414', padding: '8px 14px', borderBottom: '1px solid #1e1e1e' }}>
                <span style={{ fontSize: '0.7rem', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Feature</span>
                <span style={{ fontSize: '0.7rem', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', minWidth: 56 }}>Free</span>
                <span style={{ fontSize: '0.7rem', color: '#d4a843', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', minWidth: 72 }}>Premium</span>
              </div>
              {features.map((f, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '9px 14px', borderBottom: i < features.length - 1 ? '1px solid #161616' : 'none', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#ccc' }}>{f.name}</span>
                  <span style={{ textAlign: 'center', minWidth: 56, fontSize: '0.78rem', color: f.free === true ? '#51cf66' : '#888' }}>
                    {f.free === true ? '✓' : f.free === false ? '✗' : f.free}
                  </span>
                  <span style={{ textAlign: 'center', minWidth: 72, fontSize: '0.78rem', color: '#d4a843', fontWeight: 600 }}>
                    {f.premium === true ? '✓' : f.premium === false ? '✗' : f.premium}
                  </span>
                </div>
              ))}
            </div>

            {/* Notes are free callout */}
            <div style={{ background: 'rgba(81,207,102,0.06)', border: '1px solid rgba(81,207,102,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: '0.78rem', color: '#51cf66', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📚</span> All notes, PYQs & timelines are <strong>completely free</strong> — always.
            </div>

            {/* Price */}
            <div style={{ background: 'linear-gradient(135deg,#0d1b3e,#091530)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#d4a843,transparent)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.4rem', fontWeight: 700, color: '#f0f0f0', lineHeight: 1 }}>{price}</span>
                <span style={{ color: '#555', fontSize: '0.85rem', marginBottom: 4 }}>/year</span>
              </div>
              {slots > 0 ? (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#f87171', letterSpacing: '0.08em', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#f87171', boxShadow: '0 0 6px #f87171' }} />
                  Only {slots} early-bird slot{slots === 1 ? '' : 's'} left at this price
                </div>
              ) : (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#f87171', letterSpacing: '0.08em', marginTop: 6 }}>Early-bird slots full — standard pricing</div>
              )}
            </div>

            <button onClick={handleSubscribe} disabled={step === 'paying'}
              style={{ width: '100%', padding: '14px', borderRadius: 8, border: 'none', background: step === 'paying' ? '#1a1a1a' : 'linear-gradient(135deg,#b8860b,#d4a843)', color: step === 'paying' ? '#555' : '#000', fontWeight: 700, fontSize: '0.95rem', cursor: step === 'paying' ? 'not-allowed' : 'pointer', marginBottom: 10, letterSpacing: '0.03em' }}>
              {step === 'paying' ? 'Opening payment…' : `✦ Subscribe — ${price}/year`}
            </button>
            <button onClick={onClose} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid #222', borderRadius: 8, color: '#555', cursor: 'pointer', fontSize: '0.82rem' }}>Maybe later</button>
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button onClick={async () => {
                const { supabase } = await import('@/lib/supabase');
                await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
                });
              }} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>
                Already subscribed? Sign in
              </button>
            </div>
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
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ho_pending_payment') === '1') {
      setShowPremiumModal(true);
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
                background: 'linear-gradient(135deg, rgba(212,168,67,0.15), rgba(251,191,36,0.1))',
                border: '1px solid rgba(212,168,67,0.5)',
                color: '#d4a843', cursor: 'pointer',
                padding: '0.3rem 0.65rem', borderRadius: 6,
                fontSize: '0.78rem', fontWeight: 700,
                marginLeft: '0.4rem', transition: 'all 0.15s',
                letterSpacing: '0.03em', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(212,168,67,0.25), rgba(251,191,36,0.2))'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(212,168,67,0.15), rgba(251,191,36,0.1))'; }}
            >
              ✦ Premium
            </button>
          )}
          {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}
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
    {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} />}
  </>
  );
}
