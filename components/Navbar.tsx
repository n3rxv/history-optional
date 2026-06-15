'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import ThemeCustomizer from './ThemeCustomizer';
import { useLang } from '@/lib/i18n/LangContext';
import { tr, t } from '@/lib/i18n/ui';
import SearchModal from './SearchModal';
import { supabase } from '@/lib/supabase';
import { SubscribeCard } from '@/components/SubscribeCard';
import type { User } from '@supabase/supabase-js';

function snooColor(email: string): string {
  const palette = ['#ff4500','#51cf66','#339af0','#cc5de8','#f59f00','#20c997','#ff6b6b','#74c0fc','#a9e34b','#ffa94d'];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function SnooAvatar({ email, size = 28 }: { email: string; size?: number }) {
  return (
    <img src="/avatar.png" alt="avatar" width={size * 2.5} height={size * 2.5} style={{ objectFit: 'contain' }} />
  );
}

const FEATURES = [
  { name: 'Notes (Paper I & II)',        free: '✓ free',   premium: '✓'          },
  { name: 'PYQ bank',                    free: '✓ free',   premium: '✓'          },
  { name: 'Timeline & Historiography',   free: '✓ free',   premium: '✓'          },
  { name: 'Answer evaluation',           free: '1/week',   premium: 'Unlimited'  },
  { name: 'AI Chat',                     free: '3/month',  premium: 'Unlimited'  },
  { name: 'Model answers',               free: '—',        premium: '✓'          },
  { name: 'Chat with Books',             free: '—',        premium: '✓'          },
  { name: 'Map evaluation',              free: '—',        premium: 'Unlimited'  },
  { name: 'FLT / Full paper eval',       free: '—',        premium: 'Unlimited'  },
  { name: 'PDF upload & chat',           free: '—',        premium: '✓'          },
  { name: 'Brainstorm mode',             free: '—',        premium: '✓'          },
];

function PremiumModal({ onClose, noSubFound }: { onClose: () => void; noSubFound?: boolean }) {
  const [slots, setSlots] = React.useState(45);
  const [fingerprint, setFingerprint] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/slots').then(r => r.json()).then(d => setSlots(d.slots ?? 45)).catch(() => {});
    (async () => {
      const FP = await (await import('@fingerprintjs/fingerprintjs')).default.load();
      const { visitorId } = await FP.get();
      setFingerprint(visitorId);
    })();
  }, []);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0e0e0e', border: '1px solid #1e1e1e', borderRadius: 16, padding: '1.5rem', maxWidth: 560, width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.8)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#d4a843', marginBottom: 4 }}>Premium</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: '#f0f0f0', lineHeight: 1.2 }}>Unlock everything</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: '2px 4px', fontSize: '1rem', lineHeight: 1, marginTop: 2 }}>✕</button>
        </div>

        {noSubFound && (
          <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: '0.76rem', color: '#f87171', textAlign: 'center' }}>
            No active subscription found for this account.
          </div>
        )}

        {/* Feature table — compact */}
        <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid #1a1a1a', maxHeight: 160, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#d4a843 #1a1a1a' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 72px', background: '#111', padding: '6px 10px', borderBottom: '1px solid #1a1a1a' }}>
            <span style={{ fontSize: '0.62rem', color: '#333', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Feature</span>
            <span style={{ fontSize: '0.62rem', color: '#333', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>Free</span>
            <span style={{ fontSize: '0.62rem', color: '#d4a843', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'right' }}>Premium</span>
          </div>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 56px 72px', padding: '7px 10px', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', borderBottom: i < FEATURES.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#aaa' }}>{f.name}</span>
              <span style={{ fontSize: '0.72rem', color: f.free === '✓ free' ? '#2d6a40' : '#3a3a3a', textAlign: 'center' }}>{f.free}</span>
              <span style={{ fontSize: '0.72rem', color: '#d4a843', fontWeight: 600, textAlign: 'right' }}>{f.premium}</span>
            </div>
          ))}
        </div>

        {/* Subscribe card — compact version handles price + CTA */}
        <SubscribeCard
          slots={slots}
          fingerprint={fingerprint}
          onClose={onClose}
          onSuccess={onClose}
        />

        {/* Already subscribed */}
        <button
          onClick={async () => {
            sessionStorage.setItem('ho_verify_sub', '1');
            const { supabase } = await import('@/lib/supabase');
            await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `${window.location.origin}/auth/google-callback?next=${encodeURIComponent(window.location.pathname)}` },
            });
          }}
          style={{ width: '100%', marginTop: 10, padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 7, color: '#e0e0e0', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden' }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.4)'; el.style.color = '#fff'; el.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.2)'; el.style.color = '#e0e0e0'; el.style.background = 'rgba(255,255,255,0.06)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Already subscribed? Sign in
        </button>
      </div>
    </div>
  );
}

// ── Extend Plan Modal ──────────────────────────────────────────
function ExtendModal({
  user, subData, onClose, onSuccess,
}: {
  user: { id: string; email?: string | null };
  subData: { plan: string; expires_at: string } | null;
  onClose: () => void;
  onSuccess: (newExpiry: string) => void;
}) {
  const [selectedPlan, setSelectedPlan] = useState<'daily'|'weekly'|'monthly'|'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  const plans = [
    { id: 'daily',   label: 'Daily',   price: '₹49',    days: 1 },
    { id: 'weekly',  label: 'Weekly',  price: '₹299',   days: 7 },
    { id: 'monthly', label: 'Monthly', price: '₹999',   days: 30 },
    { id: 'yearly',  label: 'Annual',  price: '₹5,999', days: 365 },
  ] as const;

  const computeNewExpiry = (planId: string) => {
    const base = subData?.expires_at && new Date(subData.expires_at) > new Date()
      ? new Date(subData.expires_at) : new Date();
    const d = new Date(base);
    if (planId === 'daily')   d.setDate(d.getDate() + 1);
    else if (planId === 'weekly')  d.setDate(d.getDate() + 7);
    else if (planId === 'monthly') d.setMonth(d.getMonth() + 1);
    else d.setFullYear(d.getFullYear() + 1);
    return d;
  };

  const newExpiry = computeNewExpiry(selectedPlan);
  const cur = plans.find(p => p.id === selectedPlan)!;

  const handlePay = async () => {
    setLoading(true);
    try {
      // 0. Ensure Razorpay script is loaded
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Razorpay script failed to load'));
          document.head.appendChild(s);
        });
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not signed in');
      const token = session.access_token;

      // 1. Create Razorpay order
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': token },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const order = await orderRes.json();
      const orderId = order.id ?? order.orderId;
      if (!orderId) throw new Error('Order creation failed');

      // 2. Open Razorpay
      const Razorpay = (window as any).Razorpay;
      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!rzpKey) throw new Error('Razorpay key not set — check NEXT_PUBLIC_RAZORPAY_KEY_ID in .env.local');
      const rzp = new Razorpay({
        key: rzpKey,
        amount: order.amount,
        currency: 'INR',
        name: 'History Optional',
        description: `${cur.label} Plan`,
        order_id: orderId,
        prefill: { email: user.email ?? '' },
        theme: { color: '#6366f1' },
        handler: async (resp: any) => {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-token': token },
            body: JSON.stringify({ ...resp, plan: selectedPlan, fingerprint: null }),
          });
          const v = await verifyRes.json();
          if (v.ok) {
            onSuccess(v.expiresAt);
            onClose();
          }
        },
      });
      rzp.open();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'linear-gradient(145deg, #0f0f0f, #141414)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, width: '100%', maxWidth: 380, boxShadow: '0 32px 80px rgba(0,0,0,0.9)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(212,168,67,0.1) 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '1.2rem 1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>⚡ Extend Plan</div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              {subData ? 'Current plan extends from your existing expiry' : 'Choose a plan to get started'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: '1.2rem 1.4rem' }}>
          {/* Current expiry */}
          {subData && (
            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 8, padding: '0.6rem 0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>Current expiry</span>
              <span style={{ fontSize: '0.72rem', color: '#a5b4fc', fontWeight: 600 }}>
                {new Date(subData.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}

          {/* Plan selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1rem' }}>
            {plans.map(p => {
              const sel = selectedPlan === p.id;
              return (
                <button key={p.id} onClick={() => setSelectedPlan(p.id as any)}
                  style={{ background: sel ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(212,168,67,0.15))' : 'rgba(255,255,255,0.03)', border: sel ? '1px solid rgba(99,102,241,0.55)' : '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.7rem 0.5rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }}>
                  {p.id === 'yearly' && <div style={{ position: 'absolute', top: 4, right: 4, fontSize: '0.48rem', background: '#e8b84b', color: '#000', fontWeight: 800, padding: '1px 5px', borderRadius: 20, letterSpacing: '0.05em' }}>BEST</div>}
                  <div style={{ fontSize: '0.72rem', color: sel ? '#c7d2fe' : 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontSize: '1rem', color: sel ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: 800 }}>{p.price}</div>
                </button>
              );
            })}
          </div>

          {/* New expiry preview */}
          <div style={{ background: 'linear-gradient(90deg, rgba(81,207,102,0.08), rgba(81,207,102,0.04))', border: '1px solid rgba(81,207,102,0.18)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 3 }}>New expiry after payment</div>
              <div style={{ fontSize: '0.88rem', color: '#51cf66', fontWeight: 700 }}>
                {newExpiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div style={{ fontSize: '1.4rem' }}>📅</div>
          </div>

          {/* Pay button */}
          <button onClick={handlePay} disabled={loading}
            style={{ width: '100%', background: loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(90deg, #6366f1, #818cf8)', border: 'none', borderRadius: 10, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', padding: '0.75rem', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.03em', boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? 'Processing…' : `Pay ${cur.price} → Proceed`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { langHi, toggleLang } = useLang();
  const [profileEdit, setProfileEdit] = useState(false);
  const [aspirantName, setAspirantName] = useState('');
  const [aspirantAge, setAspirantAge] = useState('');
  const [aspirantAttempt, setAspirantAttempt] = useState('');
  const [aspirantYear, setAspirantYear] = useState('');
  const [subData, setSubData] = useState<{ plan: string; expires_at: string } | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [pyqsMenuOpen, setPyqsMenuOpen] = useState(false);
  const [notesMenuOpen, setNotesMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const notesRef = useRef<HTMLDivElement>(null);
  const pyqsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (notesRef.current && !notesRef.current.contains(e.target as Node)) setNotesMenuOpen(false);
      if (pyqsRef.current && !pyqsRef.current.contains(e.target as Node)) setPyqsMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const p = Math.min(window.scrollY / 80, 1);
      setScrollProgress(p);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [noSubFound, setNoSubFound] = useState(false);
  const [notifications, setNotifications] = useState<{id:string,title:string,link:string,type:string,created_at:string}[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      if (sessionStorage.getItem('ho_pending_payment') === '1') setShowPremiumModal(true);
      if (sessionStorage.getItem('ho_verify_sub') === '1') {
        sessionStorage.removeItem('ho_verify_sub');
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
    supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(15).then(({ data }) => {
      if (data) setNotifications(data);
    });
    const saved = localStorage.getItem('ho_seen_notifications');
    if (saved) setSeenIds(JSON.parse(saved));
  }, []);

  const markSeen = (id: string) => {
    setSeenIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem('ho_seen_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const fetchSub = async (token: string) => {
      try {
        const res = await fetch(`/api/sub-status?token=${token}`);
        const d = await res.json();
        if (d.isPremium) setSubData({ plan: d.plan, expires_at: d.expires_at });
        else setSubData(null);
      } catch { setSubData(null); }
    };
    const saved = localStorage.getItem('ho_aspirant_profile');
    if (saved) { try { const p = JSON.parse(saved); setAspirantName(p.name||''); setAspirantAge(p.age||''); setAspirantAttempt(p.attempt||''); setAspirantYear(p.year||''); } catch {} }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.access_token) fetchSub(session.access_token);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.access_token) fetchSub(session.access_token);
      else setSubData(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    router.refresh();
  };

  return (
    <>
      <nav style={{ position: 'fixed', top: 'var(--banner-height, 33px)', left: 0, right: 0, zIndex: 1100, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 67 - 7 * scrollProgress }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0, overflow: 'hidden' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', display: 'inline-flex', alignItems: 'center' }}>
              {/* "H" always visible */}
              <span>H</span>
              {/* "istory " collapses on scroll */}
              <span style={{ display: 'inline-block', maxWidth: `${6 * (1 - scrollProgress)}em`, overflow: 'hidden', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>istory</span>
              {/* space between words, hidden when scrolled */}
              <span style={{ display: 'inline-block', maxWidth: `${0.35 * (1 - scrollProgress)}em`, overflow: 'hidden' }}>&nbsp;</span>
              {/* "Optional" collapses on scroll, accent coloured */}
              <span style={{ color: 'var(--accent)', display: 'inline-block', maxWidth: `${8 * (1 - scrollProgress)}em`, overflow: 'hidden', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>Optional</span>
              {/* "." appears on scroll */}
              <span style={{ display: 'inline-block', maxWidth: `${scrollProgress}em`, overflow: 'hidden', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>.</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', ...(scrollProgress >= 0.5 ? { position: 'absolute', left: '50%', transform: 'translateX(-50%)' } : {}) }} className="desktop-nav">

            {/* Notes dropdown */}
            <div ref={notesRef} style={{ position: 'relative' }}>
              <button onClick={() => setNotesMenuOpen(o => !o)} style={{ padding: '0.35rem 0.6rem', borderRadius: 5, border: 'none', fontSize: '0.82rem', fontFamily: 'var(--font-ui)', cursor: 'pointer', color: (pathname.startsWith('/paper') || pathname.startsWith('/timeline') || pathname.startsWith('/historiography')) ? 'var(--accent)' : 'var(--text2)', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'color 0.15s' }} onMouseEnter={e => { const el = e.currentTarget as HTMLElement; if (el.style.color !== 'var(--accent)') el.style.color = '#fff'; }} onMouseLeave={e => { const el = e.currentTarget as HTMLElement; if (el.style.color !== 'var(--accent)') el.style.color = 'var(--text2)'; }}>
                {tr(t.notes, langHi)}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, marginTop: 1 }}>
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {notesMenuOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 0.3rem 0.3rem', minWidth: 150, zIndex: 1000, boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
                  {[{ href: '/paper1', label: langHi ? 'पेपर I' : 'Paper I' }, { href: '/paper2', label: langHi ? 'पेपर II' : 'Paper II' }, { href: '/timeline', label: langHi ? 'समयरेखा' : 'Timeline' }, { href: '/historiography', label: langHi ? 'इतिहास-लेखन' : 'Historiography' }, { href: '/flashcards', label: langHi ? 'फ्लैशकार्ड' : 'Flashcards' }, { href: '/#daily-answer', label: langHi ? 'दैनिक उत्तर लेखन' : 'Daily Answer Writing' }].map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setNotesMenuOpen(false)}
                      style={{ display: 'block', padding: '0.45rem 0.7rem', borderRadius: 5, fontSize: '0.82rem', textDecoration: 'none', color: pathname.startsWith(item.href) ? 'var(--accent)' : 'var(--text2)', background: pathname.startsWith(item.href) ? 'rgba(59,130,246,0.08)' : 'transparent', transition: 'all 0.12s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = pathname.startsWith(item.href) ? 'var(--accent)' : 'var(--text2)'; (e.currentTarget as HTMLElement).style.background = pathname.startsWith(item.href) ? 'rgba(59,130,246,0.08)' : 'transparent'; }}
                    >{item.label}</Link>
                  ))}
                </div>
              )}
            </div>

            {/* PYQs dropdown */}
            <div ref={pyqsRef} style={{ position: 'relative' }}>
              <button onClick={() => setPyqsMenuOpen(o => !o)} style={{ padding: '0.35rem 0.6rem', borderRadius: 5, border: 'none', fontSize: '0.82rem', fontFamily: 'var(--font-ui)', cursor: 'pointer', color: (pathname.startsWith('/pyqs') || pathname.startsWith('/test')) ? 'var(--accent)' : 'var(--text2)', background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'color 0.15s' }} onMouseEnter={e => { const el = e.currentTarget as HTMLElement; if (el.style.color !== 'var(--accent)') el.style.color = '#fff'; }} onMouseLeave={e => { const el = e.currentTarget as HTMLElement; if (el.style.color !== 'var(--accent)') el.style.color = 'var(--text2)'; }}>
                PYQs
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, marginTop: 1 }}>
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {pyqsMenuOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 0.3rem 0.3rem', minWidth: 140, zIndex: 1000, boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
                  {[{ href: '/pyqs', label: langHi ? 'PYQs देखें' : 'Browse PYQs' }, { href: '/test', label: langHi ? 'टेस्ट शुरू करें' : 'Start Test' }].map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setPyqsMenuOpen(false)}
                      style={{ display: 'block', padding: '0.45rem 0.7rem', borderRadius: 5, fontSize: '0.82rem', textDecoration: 'none', color: pathname === item.href ? 'var(--accent)' : 'var(--text2)', background: pathname === item.href ? 'rgba(59,130,246,0.08)' : 'transparent', transition: 'all 0.12s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = pathname === item.href ? 'var(--accent)' : 'var(--text2)'; (e.currentTarget as HTMLElement).style.background = pathname === item.href ? 'rgba(59,130,246,0.08)' : 'transparent'; }}
                    >{item.label}</Link>
                  ))}
                </div>
              )}
            </div>

            {/* Flat links */}
            {[{ href: '/chat', label: tr(t.chat, langHi) }, { href: '/evaluate', label: tr(t.evaluate, langHi) }, { href: '/resources', label: tr(t.resources, langHi) }, { href: '/mapping', label: tr(t.mapping, langHi) }, { href: '/prelims', label: tr(t.prelims, langHi) }].map(l => {
              const active = pathname.startsWith(l.href);
              return (
                <Link key={l.href} href={l.href} style={{ padding: '0.35rem 0.6rem', borderRadius: 5, fontSize: '0.82rem', fontFamily: 'var(--font-ui)', textDecoration: 'none', color: active ? 'var(--accent)' : 'var(--text2)', background: 'transparent', transition: 'color 0.15s', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}
                >{l.label}</Link>
              );
            })}

            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 0.25rem' }} />

            {/* Dashboard */}
            <Link href="/dashboard" title="Progress Dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, textDecoration: 'none', color: pathname.startsWith('/dashboard') ? 'var(--accent)' : 'rgba(255,255,255,0.35)', transition: 'color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = pathname.startsWith('/dashboard') ? 'var(--accent)' : 'rgba(255,255,255,0.35)'; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
            </Link>

            <SearchModal />

            {/* Bell */}
            <div ref={bellRef} style={{ position: 'relative' }}>
              <button onClick={() => {
                setBellOpen(o => !o);
                if (!bellOpen) {
                  const allIds = notifications.map(n => n.id);
                  setSeenIds(allIds);
                  localStorage.setItem('ho_seen_notifications', JSON.stringify(allIds));
                }
              }} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:30, height:30, borderRadius:6, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', position:'relative', transition:'color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {notifications.filter(n => !seenIds.includes(n.id)).length > 0 && (
                  <span style={{ position:'absolute', top:-4, right:-4, minWidth:16, height:16, borderRadius:8, background:'#f87171', border:'1.5px solid #000', fontSize:'0.6rem', fontWeight:700, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px', fontFamily:'var(--font-mono)' }}>
                    {notifications.filter(n => !seenIds.includes(n.id)).length > 9 ? '9+' : notifications.filter(n => !seenIds.includes(n.id)).length}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 14px)', right:-8, background:'rgba(6,6,10,0.98)', backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)', border:'1px solid rgba(139,92,246,0.25)', borderRadius:18, minWidth:320, maxWidth:360, zIndex:1000, boxShadow:'0 0 0 1px rgba(0,0,0,0.6), 0 24px 64px rgba(0,0,0,0.9), 0 0 80px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.05)', overflow:'hidden', animation:'bellDrop 0.2s cubic-bezier(0.16,1,0.3,1)' }}>
                  <div style={{ padding:'14px 18px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(99,102,241,0.04)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:'#818cf8', boxShadow:'0 0 10px #818cf8, 0 0 20px rgba(129,140,248,0.4)' }} />
                      <span style={{ fontSize:'0.6rem', fontFamily:'var(--font-mono)', letterSpacing:'0.22em', color:'#a5b4fc', textTransform:'uppercase', fontWeight:600 }}>Notifications</span>
                    </div>
                    {notifications.filter(n => !seenIds.includes(n.id)).length > 0 && (
                      <span style={{ fontSize:'0.6rem', fontFamily:'var(--font-mono)', color:'#fff', letterSpacing:'0.08em', background:'rgba(248,113,113,0.2)', border:'1px solid rgba(248,113,113,0.35)', borderRadius:20, padding:'2px 8px', fontWeight:600 }}>
                        {notifications.filter(n => !seenIds.includes(n.id)).length} NEW
                      </span>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding:'32px 18px', fontSize:'0.82rem', color:'#444', textAlign:'center', fontFamily:'var(--font-mono)', letterSpacing:'0.08em' }}>— no notifications —</div>
                  ) : (
                    <div style={{ maxHeight:400, overflowY:'auto' }}>
                      {notifications.map(n => {
                        const seen = seenIds.includes(n.id);
                        return (
                          <a key={n.id} href={n.link} onClick={() => { markSeen(n.id); setBellOpen(false); }}
                            style={{ display:'block', padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.04)', textDecoration:'none', background: seen ? 'transparent' : 'rgba(99,102,241,0.06)', position:'relative', transition:'background 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = seen ? 'transparent' : 'rgba(99,102,241,0.06)'; }}>
                            {!seen && <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'linear-gradient(180deg,#818cf8,#a78bfa)', borderRadius:'0 3px 3px 0', boxShadow:'2px 0 12px rgba(129,140,248,0.4)' }} />}
                            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                              <div style={{ width:34, height:34, borderRadius:10, background: seen ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))', border: seen ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(139,92,246,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'0.9rem', boxShadow: seen ? 'none' : '0 0 12px rgba(99,102,241,0.15)' }}>
                                {n.type === 'note' ? '📄' : n.type === 'current_affairs' ? '📰' : '📢'}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:'0.85rem', color: seen ? '#6b7280' : '#ffffff', lineHeight:1.5, fontWeight: seen ? 400 : 500, letterSpacing:'-0.01em' }}>{n.title}</div>
                                <div style={{ fontSize:'0.65rem', color: seen ? '#374151' : '#818cf8', marginTop:4, fontFamily:'var(--font-mono)', letterSpacing:'0.05em', fontWeight:500 }}>{new Date(n.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ padding:'10px 18px', borderTop:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    <div style={{ width:4, height:4, borderRadius:'50%', background:'rgba(129,140,248,0.4)' }} />
                    <div style={{ fontSize:'0.52rem', color:'#4b5563', fontFamily:'var(--font-mono)', letterSpacing:'0.15em', textTransform:'uppercase' }}>History Optional</div>
                    <div style={{ width:4, height:4, borderRadius:'50%', background:'rgba(129,140,248,0.4)' }} />
                  </div>
                </div>
              )}
            </div>

          {/* Global Lang Toggle */}
          <button
            onClick={toggleLang}
            title={langHi ? 'Switch to English' : 'Switch to Hindi'}
            className="hide-md"
            style={{
              display: 'flex', alignItems: 'center', gap: 0,
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 6, overflow: 'hidden',
              cursor: 'pointer', padding: 0,
              fontSize: '0.7rem', fontWeight: 700,
              boxShadow: langHi ? '0 0 0 1px rgba(99,102,241,0.45)' : 'none',
              transition: 'box-shadow 0.15s',
              marginRight: '0.1rem',
            }}
          >
            <span style={{
              padding: '0.28rem 0.6rem',
              background: !langHi ? 'rgba(59,130,246,0.18)' : 'transparent',
              color: !langHi ? '#60a5fa' : 'var(--text3)',
              borderRight: '1px solid var(--border)',
              transition: 'all 0.15s',
              letterSpacing: '0.04em',
            }}>EN</span>
            <span style={{
              padding: '0.28rem 0.6rem',
              background: langHi ? 'rgba(99,102,241,0.18)' : 'transparent',
              color: langHi ? '#a5b4fc' : 'var(--text3)',
              transition: 'all 0.15s',
              letterSpacing: '0.04em',
            }}>हि</span>
          </button>
          <span className="hide-md"><ThemeCustomizer /></span>

            {/* Auth / Premium */}
            {user ? (
              <div style={{ position: 'relative', marginLeft: '0.25rem' }}>
                <button onClick={() => setUserMenuOpen(o => !o)} title={user.email}
                  style={{ width: 45, height: 45, borderRadius: 0, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none' }}>
                  <SnooAvatar email={user.email ?? ''} size={28} />
                </button>
                {userMenuOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 290, borderRadius: 18, padding: 0, zIndex: 1000, overflow: 'hidden', background: 'linear-gradient(160deg, #0d0d12 0%, #111118 60%, #0d0d0f 100%)', boxShadow: '0 0 0 1px rgba(99,102,241,0.18), 0 0 0 2px rgba(99,102,241,0.06), 0 28px 80px rgba(0,0,0,0.95), 0 0 60px rgba(99,102,241,0.08)' }}>
                    {/* Top glow bar */}
                    <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), rgba(212,168,67,0.6), transparent)' }} />
                    {/* Header — avatar + email + edit toggle */}
                    <div style={{ padding: '1rem 1rem 0.75rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(212,168,67,0.05) 100%)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <SnooAvatar email={user.email ?? ''} size={40} />
                          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#51cf66', border: '2px solid #0d0d12', boxShadow: '0 0 6px rgba(81,207,102,0.6)' }} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                            {aspirantName || 'UPSC Aspirant'}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{user.email}</div>
                        </div>
                        <button onClick={() => setProfileEdit(e => !e)}
                          style={{ flexShrink: 0, background: profileEdit ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${profileEdit ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', color: profileEdit ? '#a5b4fc' : 'rgba(255,255,255,0.4)' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </div>
                    </div>

                    {/* Aspirant profile fields */}
                    {profileEdit ? (
                      <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.58rem', color: 'rgba(99,102,241,0.8)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>Your Profile</div>
                        {[
                          { label: 'Full Name', val: aspirantName, set: setAspirantName, placeholder: 'e.g. Rahul Sharma', key: 'name' },
                          { label: 'Age', val: aspirantAge, set: setAspirantAge, placeholder: 'e.g. 24', key: 'age' },
                          { label: 'Attempt No.', val: aspirantAttempt, set: setAspirantAttempt, placeholder: 'e.g. 1st', key: 'attempt' },
                          { label: 'Target Year', val: aspirantYear, set: setAspirantYear, placeholder: 'e.g. 2026', key: 'year' },
                        ].map(({ label, val, set, placeholder, key }) => (
                          <div key={key} style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
                            <input
                              value={val}
                              onChange={e => {
                                set(e.target.value);
                                const cur = { name: aspirantName, age: aspirantAge, attempt: aspirantAttempt, year: aspirantYear, [key]: e.target.value };
                                localStorage.setItem('ho_aspirant_profile', JSON.stringify(cur));
                              }}
                              placeholder={placeholder}
                              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '0.35rem 0.6rem', fontSize: '0.73rem', color: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-ui)', transition: 'border-color 0.15s' }}
                              onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
                              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                            />
                          </div>
                        ))}
                        <button onClick={() => setProfileEdit(false)}
                          style={{ width: '100%', marginTop: 4, background: 'linear-gradient(90deg, rgba(99,102,241,0.2), rgba(99,102,241,0.1))', border: '1px solid rgba(99,102,241,0.35)', borderRadius: 7, padding: '0.35rem', fontSize: '0.7rem', color: '#a5b4fc', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.03em' }}>
                          ✓ Save Profile
                        </button>
                      </div>
                    ) : (
                      <div>
                      <div style={{ padding: '0.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                        {[
                          { label: 'Age', val: aspirantAge, icon: '🎂' },
                          { label: 'Attempt', val: aspirantAttempt, icon: '��' },
                          { label: 'Target', val: aspirantYear, icon: '📅' },
                        ].map(({ label, val, icon }) => (
                          <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '0.4rem 0.6rem' }}>
                            <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', marginBottom: 2 }}>{icon} {label}</div>
                            <div style={{ fontSize: '0.72rem', color: val ? '#e2e8f0' : 'rgba(255,255,255,0.2)', fontWeight: val ? 600 : 400 }}>{val || '—'}</div>
                          </div>
                        ))}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '0.4rem 0.6rem' }}>
                          <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', marginBottom: 2 }}>✦ Plan</div>
                          <div style={{ fontSize: '0.72rem', color: subData ? '#e8b84b' : 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{subData ? subData.plan.charAt(0).toUpperCase() + subData.plan.slice(1) : 'Free'}</div>
                        </div>
                      </div>
                      {aspirantYear.trim() === '2026' && (() => {
                        const days = Math.max(0, Math.ceil((new Date('2026-08-21T00:00:00').getTime() - Date.now()) / 86400000));
                        const urgent = days <= 30; const soon = days <= 60;
                        return (<div style={{ margin: '6px 0 2px', padding: '0.65rem 0.75rem', background: urgent ? 'linear-gradient(135deg,rgba(248,113,113,0.08),rgba(239,68,68,0.05))' : 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05))', border: '1px solid ' + (urgent ? 'rgba(248,113,113,0.25)' : 'rgba(99,102,241,0.2)'), borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div><div style={{ fontSize: '0.58rem', color: urgent ? 'rgba(248,113,113,0.7)' : 'rgba(99,102,241,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>{urgent ? '🔥' : '⚔️'} Mains 2026</div><div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>21 Aug 2026</div></div>
                          <div style={{ textAlign: 'right' }}><div style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: urgent ? '#f87171' : soon ? '#fbbf24' : '#a5b4fc' }}>{days}</div><div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>days left</div></div>
                        </div>);
                      })()}
                      {aspirantYear.trim() === '2027' && (() => {
                        const daysP = Math.max(0, Math.ceil((new Date('2027-05-23T00:00:00').getTime() - Date.now()) / 86400000));
                        const urgentP = daysP <= 30; const soonP = daysP <= 60;
                        return (<div style={{ margin: '6px 0 2px', padding: '0.65rem 0.75rem', background: urgentP ? 'linear-gradient(135deg,rgba(248,113,113,0.08),rgba(239,68,68,0.05))' : 'linear-gradient(135deg,rgba(232,184,75,0.08),rgba(245,215,110,0.04))', border: '1px solid ' + (urgentP ? 'rgba(248,113,113,0.25)' : 'rgba(232,184,75,0.22)'), borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div><div style={{ fontSize: '0.58rem', color: urgentP ? 'rgba(248,113,113,0.7)' : 'rgba(232,184,75,0.85)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>{urgentP ? '🔥' : '📋'} Prelims 2027</div><div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>23 May 2027</div></div>
                          <div style={{ textAlign: 'right' }}><div style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: urgentP ? '#f87171' : soonP ? '#fbbf24' : '#e8b84b' }}>{daysP}</div><div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>days left</div></div>
                        </div>);
                      })()}
                    </div>
                    )}

                    {/* Plan section */}
                    <div style={{ padding: '0.75rem 1rem 0' }}>
                      {subData ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: '0.6rem', background: 'linear-gradient(90deg,#e8b84b,#f5d76e)', color: '#000', fontWeight: 800, letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>✦ {subData.plan}</span>
                            <span style={{ fontSize: '0.62rem', color: (() => { const days = Math.ceil((new Date(subData.expires_at).getTime() - Date.now()) / 86400000); return days <= 3 ? '#f87171' : days <= 7 ? '#fbbf24' : '#51cf66'; })() }}>
                              {(() => { const days = Math.ceil((new Date(subData.expires_at).getTime() - Date.now()) / 86400000); return days <= 0 ? 'Expired' : `${days}d left`; })()}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
                            Expires {new Date(subData.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <button onClick={() => { setShowExtendModal(true); setUserMenuOpen(false); }}
                            style={{ width: '100%', background: 'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(212,168,67,0.1))', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc', cursor: 'pointer', padding: '0.45rem', borderRadius: 8, fontSize: '0.73rem', fontWeight: 600, letterSpacing: '0.03em', marginBottom: 10, transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(90deg, rgba(99,102,241,0.32), rgba(212,168,67,0.18))'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.65)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(99,102,241,0.25)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(212,168,67,0.1))'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.35)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                            Extend Plan
                          </button>
                        </>
                      ) : (
                        <button onClick={() => { setShowExtendModal(true); setUserMenuOpen(false); }}
                          style={{ width: '100%', background: 'linear-gradient(90deg, rgba(212,168,67,0.15), rgba(212,168,67,0.07))', border: '1px solid rgba(212,168,67,0.4)', color: '#e8b84b', cursor: 'pointer', padding: '0.45rem', borderRadius: 8, fontSize: '0.73rem', fontWeight: 700, letterSpacing: '0.03em', marginBottom: 10, transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,168,67,0.25)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(212,168,67,0.2)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(90deg, rgba(212,168,67,0.15), rgba(212,168,67,0.07))'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                          ✦ Get Premium
                        </button>
                      )}
                    </div>

                    {/* Sign out */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '0 1rem', paddingTop: '0.7rem', paddingBottom: '0.9rem' }}>
                      <button onClick={handleSignOut}
                        style={{ width: '100%', background: 'rgba(255,80,80,0.04)', border: '1px solid rgba(255,80,80,0.1)', color: '#f87171', cursor: 'pointer', padding: '0.4rem', borderRadius: 8, fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.02em', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,80,80,0.1)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,80,80,0.28)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px rgba(255,80,80,0.15)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,80,80,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,80,80,0.1)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setShowPremiumModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: '0.25rem', background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.5)', color: '#e8b84b', cursor: 'pointer', padding: '0.3rem 0.65rem', borderRadius: 6, fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.03em', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(212,168,67,0.2)'; el.style.borderColor = 'rgba(212,168,67,0.8)'; el.style.color = '#ffd700'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(212,168,67,0.12)'; el.style.borderColor = 'rgba(212,168,67,0.5)'; el.style.color = '#e8b84b'; }}>
                ✦ Premium
              </button>
            )}
          </div>

          {/* Extend Plan Modal */}
      {showExtendModal && user && (
        <ExtendModal
          user={user}
          subData={subData}
          onClose={() => setShowExtendModal(false)}
          onSuccess={(newExpiry) => setSubData(prev => prev ? { ...prev, expires_at: newExpiry } : { plan: 'monthly', expires_at: newExpiry })}
        />
      )}
      {/* Mobile hamburger */}
          <div style={{ display:'none', alignItems:'center', gap:'0.5rem' }} className="mobile-menu-btn">
            <button onClick={() => { setBellOpen(o => !o); }} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', padding:'0.25rem', position:'relative', display:'flex', alignItems:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {notifications.filter(n => !seenIds.includes(n.id)).length > 0 && (
                <span style={{ position:'absolute', top:2, right:2, width:7, height:7, borderRadius:'50%', background:'#f87171', border:'1.5px solid #000' }} />
              )}
            </button>
            <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '0.25rem' }}>
              {open
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              }
            </button>
          </div>
        </div>
        {/* Mobile bell dropdown */}
        {bellOpen && (
          <div className="mobile-bell-dropdown" style={{ position:'fixed', top:78, right:12, left:12, background:'rgba(6,6,10,0.98)', backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)', border:'1px solid rgba(139,92,246,0.25)', borderRadius:18, zIndex:1200, boxShadow:'0 0 0 1px rgba(0,0,0,0.6), 0 24px 64px rgba(0,0,0,0.95), 0 0 80px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.05)', overflow:'hidden', animation:'bellDrop 0.2s cubic-bezier(0.16,1,0.3,1)' }}>
            <div style={{ padding:'14px 18px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(99,102,241,0.04)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#818cf8', boxShadow:'0 0 10px #818cf8, 0 0 20px rgba(129,140,248,0.4)' }} />
                <span style={{ fontSize:'0.6rem', fontFamily:'var(--font-mono)', letterSpacing:'0.22em', color:'#a5b4fc', textTransform:'uppercase', fontWeight:600 }}>Notifications</span>
              </div>
              {notifications.filter(n => !seenIds.includes(n.id)).length > 0 && (
                <span style={{ fontSize:'0.6rem', fontFamily:'var(--font-mono)', color:'#fff', letterSpacing:'0.08em', background:'rgba(248,113,113,0.2)', border:'1px solid rgba(248,113,113,0.35)', borderRadius:20, padding:'2px 8px', fontWeight:600 }}>
                  {notifications.filter(n => !seenIds.includes(n.id)).length} NEW
                </span>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding:'32px 18px', fontSize:'0.82rem', color:'#444', textAlign:'center', fontFamily:'var(--font-mono)', letterSpacing:'0.08em' }}>— no notifications —</div>
            ) : (
              <div style={{ maxHeight:360, overflowY:'auto' }}>
                {notifications.map(n => {
                  const seen = seenIds.includes(n.id);
                  return (
                    <a key={n.id} href={n.link} onClick={() => { markSeen(n.id); setBellOpen(false); }}
                      style={{ display:'block', padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.04)', textDecoration:'none', background: seen ? 'transparent' : 'rgba(99,102,241,0.06)', position:'relative' }}>
                      {!seen && <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'linear-gradient(180deg,#818cf8,#a78bfa)', borderRadius:'0 3px 3px 0', boxShadow:'2px 0 12px rgba(129,140,248,0.4)' }} />}
                      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                        <div style={{ width:34, height:34, borderRadius:10, background: seen ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))', border: seen ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(139,92,246,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'0.9rem', boxShadow: seen ? 'none' : '0 0 12px rgba(99,102,241,0.15)' }}>
                          {n.type === 'note' ? '📄' : n.type === 'current_affairs' ? '📰' : '📢'}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'0.88rem', color: seen ? '#6b7280' : '#ffffff', lineHeight:1.5, fontWeight: seen ? 400 : 500, letterSpacing:'-0.01em' }}>{n.title}</div>
                          <div style={{ fontSize:'0.68rem', color: seen ? '#374151' : '#818cf8', marginTop:4, fontFamily:'var(--font-mono)', letterSpacing:'0.05em', fontWeight:500 }}>{new Date(n.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
            <div style={{ padding:'10px 18px', borderTop:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <div style={{ width:4, height:4, borderRadius:'50%', background:'rgba(129,140,248,0.4)' }} />
              <div style={{ fontSize:'0.52rem', color:'#4b5563', fontFamily:'var(--font-mono)', letterSpacing:'0.15em', textTransform:'uppercase' }}>History Optional</div>
              <div style={{ width:4, height:4, borderRadius:'50%', background:'rgba(129,140,248,0.4)' }} />
            </div>
          </div>
        )}

        {/* Mobile menu */}
        {open && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0.5rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.1rem', background: '#0a0a0a' }}>
            {[{ href: '/paper1', label: langHi ? 'पेपर I' : 'Paper I' }, { href: '/paper2', label: langHi ? 'पेपर II' : 'Paper II' }, { href: '/timeline', label: langHi ? 'समयरेखा' : 'Timeline' }, { href: '/historiography', label: langHi ? 'इतिहास-लेखन' : 'Historiography' }, { href: '/flashcards', label: langHi ? 'फ्लैशकार्ड' : 'Flashcards' }, { href: '/pyqs', label: langHi ? 'PYQs देखें' : 'PYQs' }, { href: '/test', label: langHi ? 'टेस्ट शुरू करें' : 'Start Test' }, { href: '/chat', label: tr(t.chat, langHi) }, { href: '/evaluate', label: tr(t.evaluate, langHi) }, { href: '/resources', label: tr(t.resources, langHi) }, { href: '/mapping', label: tr(t.mapping, langHi) }, { href: '/prelims', label: tr(t.prelims, langHi) }, { href: '/dashboard', label: tr(t.dashboard, langHi) }].map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{ padding: '0.6rem 0.5rem', borderRadius: 5, fontSize: '0.88rem', textDecoration: 'none', color: pathname.startsWith(l.href) ? 'var(--accent)' : 'var(--text2)' }}>{l.label}</Link>
            ))}
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <SearchModal />
              {/* Mobile Lang Toggle */}
              <button
                onClick={toggleLang}
                style={{
                  display: 'flex', alignItems: 'center', gap: 0,
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: 6, overflow: 'hidden',
                  cursor: 'pointer', padding: 0,
                  fontSize: '0.7rem', fontWeight: 700,
                  boxShadow: langHi ? '0 0 0 1px rgba(99,102,241,0.45)' : 'none',
                }}
              >
                <span style={{ padding: '0.3rem 0.6rem', background: !langHi ? 'rgba(59,130,246,0.18)' : 'transparent', color: !langHi ? '#60a5fa' : 'var(--text3)', borderRight: '1px solid var(--border)' }}>EN</span>
                <span style={{ padding: '0.3rem 0.6rem', background: langHi ? 'rgba(99,102,241,0.18)' : 'transparent', color: langHi ? '#a5b4fc' : 'var(--text3)' }}>हि</span>
              </button>
              <ThemeCustomizer />
              {user ? (
                <button onClick={handleSignOut} style={{ background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.15)', color: '#ff8080', cursor: 'pointer', padding: '0.4rem 0.8rem', borderRadius: 6, fontSize: '0.76rem', transition: 'box-shadow 0.2s ease' }} onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 12px rgba(255,80,80,0.45), inset 0 0 8px rgba(255,80,80,0.08)')} onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>Sign out</button>
              ) : (
                <button onClick={() => setShowPremiumModal(true)} style={{ background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.5)', color: '#e8b84b', cursor: 'pointer', padding: '0.4rem 0.8rem', borderRadius: 6, fontSize: '0.76rem', fontWeight: 700 }}>✦ Premium</button>
              )}
            </div>
          </div>
        )}

        <style>{`
          @keyframes bellDrop {
            from { opacity: 0; transform: translateY(-8px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @media (max-width: 1024px) {
            .hide-md { display: none !important; }
          }
          @media (max-width: 900px) {
            .desktop-nav { display: none !important; }
            .mobile-menu-btn { display: flex !important; }
            .mobile-bell-dropdown { display: block !important; }
          }
          @media (min-width: 901px) {
            .mobile-bell-dropdown { display: none !important; }
          }
        `}</style>
      </nav>

      {showPremiumModal && (
        <PremiumModal
          onClose={() => { setShowPremiumModal(false); setNoSubFound(false); }}
          noSubFound={noSubFound}
        />
      )}
    </>
  );
}
