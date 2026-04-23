'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ThemeCustomizer from './ThemeCustomizer';
import { supabase } from '@/lib/supabase';
import { SubscribeCard } from '@/components/SubscribeCard';
import type { User } from '@supabase/supabase-js';

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
  const [fingerprint, setFingerprint] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/slots').then(r => r.json()).then(d => setSlots(d.slots ?? 45)).catch(() => {});
    // Get fingerprint
    (async () => {
      const FP = await (await import('@fingerprintjs/fingerprintjs')).default.load();
      const { visitorId } = await FP.get();
      setFingerprint(visitorId);
    })();
  }, []);

  const features = [
    { name: 'All notes (Paper I & II)',  free: true,       premium: true        },
    { name: 'PYQ bank',                  free: true,       premium: true        },
    { name: 'Timeline & Historiography', free: true,       premium: true        },
    { name: 'Answer evaluation',         free: '1/week',   premium: 'Unlimited' },
    { name: 'AI Chat (History tutor)',   free: '5/month',  premium: 'Unlimited' },
    { name: 'Annotations & highlights',  free: true,       premium: true        },
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', overflowY: 'auto', padding: '2rem 1rem' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0e0e0e', border: '1px solid #222', borderRadius: 18, padding: '2rem', maxWidth: 440, width: '100%', margin: '0 auto', boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        {noSubFound && (
          <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.8rem', color: '#f87171', textAlign: 'center', letterSpacing: '0.01em' }}>
            No active subscription found for this account.
          </div>
        )}

        {/* Header with feature table — unique to this modal vs the generic SubscribeCard */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4a843', marginBottom: 6 }}>Premium</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: '#f0f0f0', lineHeight: 1.2 }}>Unlock everything</div>
          <div style={{ fontSize: '0.82rem', color: '#666', marginTop: 6 }}>Notes & PYQs are always free. Premium unlocks evaluations and AI chat.</div>
        </div>

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

        {/* Shared subscribe card handles price, payment, sign-in */}
        <SubscribeCard
          slots={slots}
          fingerprint={fingerprint}
          onClose={onClose}
          onSuccess={onClose}
        />

        {/* Already subscribed button */}
        <button
          onClick={async () => {
            sessionStorage.setItem('ho_verify_sub', '1');
            const { supabase } = await import('@/lib/supabase');
            await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
            });
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#1a1a1a'; el.style.color = '#fff'; el.style.borderColor = '#333'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = '#888'; el.style.borderColor = '#1e1e1e'; }}
          style={{ width: '100%', marginTop: 8, padding: '10px', background: 'transparent', border: '1px solid #1e1e1e', borderRadius: 8, color: '#888', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
        }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
              History <span style={{ color: 'var(--accent)' }}>Optional</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="desktop-nav">

            {/* Notes dropdown */}
            <div style={{ position: 'relative' }}
              onMouseEnter={() => setNotesMenuOpen(true)}
              onMouseLeave={() => setNotesMenuOpen(false)}>
              <button style={{
                padding: '0.35rem 0.6rem', borderRadius: 5, border: 'none',
                fontSize: '0.82rem', fontFamily: 'var(--font-ui)', cursor: 'pointer',
                color: (pathname.startsWith('/paper') || pathname.startsWith('/timeline') || pathname.startsWith('/historiography')) ? 'var(--accent)' : 'var(--text2)',
                background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.25rem',
                transition: 'color 0.15s',
              }}>
                Notes
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, marginTop: 1 }}>
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {notesMenuOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0,
                  background: '#111', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '6px 0.3rem 0.3rem', minWidth: 150, zIndex: 1000,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                }}>
                  {[
                    { href: '/paper1', label: 'Paper I' },
                    { href: '/paper2', label: 'Paper II' },
                    { href: '/timeline', label: 'Timeline' },
                    { href: '/historiography', label: 'Historiography' },
                    { href: '/flashcards', label: 'Flashcards' },
                  ].map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setNotesMenuOpen(false)}
                      style={{
                        display: 'block', padding: '0.45rem 0.7rem', borderRadius: 5,
                        fontSize: '0.82rem', textDecoration: 'none',
                        color: pathname.startsWith(item.href) ? 'var(--accent)' : 'var(--text2)',
                        background: pathname.startsWith(item.href) ? 'rgba(59,130,246,0.08)' : 'transparent',
                        transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = pathname.startsWith(item.href) ? 'var(--accent)' : 'var(--text2)'; (e.currentTarget as HTMLElement).style.background = pathname.startsWith(item.href) ? 'rgba(59,130,246,0.08)' : 'transparent'; }}
                    >{item.label}</Link>
                  ))}
                </div>
              )}
            </div>

            {/* PYQs dropdown */}
            <div style={{ position: 'relative' }}
              onMouseEnter={() => setPyqsMenuOpen(true)}
              onMouseLeave={() => setPyqsMenuOpen(false)}>
              <button style={{
                padding: '0.35rem 0.6rem', borderRadius: 5, border: 'none',
                fontSize: '0.82rem', fontFamily: 'var(--font-ui)', cursor: 'pointer',
                color: (pathname.startsWith('/pyqs') || pathname.startsWith('/test')) ? 'var(--accent)' : 'var(--text2)',
                background: 'transparent', display: 'flex', alignItems: 'center', gap: '0.25rem',
                transition: 'color 0.15s',
              }}>
                PYQs
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, marginTop: 1 }}>
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {pyqsMenuOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0,
                  background: '#111', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '6px 0.3rem 0.3rem', minWidth: 140, zIndex: 1000,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                }}>
                  {[
                    { href: '/pyqs', label: 'Browse PYQs' },
                    { href: '/test', label: 'Start Test' },
                  ].map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setPyqsMenuOpen(false)}
                      style={{
                        display: 'block', padding: '0.45rem 0.7rem', borderRadius: 5,
                        fontSize: '0.82rem', textDecoration: 'none',
                        color: pathname === item.href ? 'var(--accent)' : 'var(--text2)',
                        background: pathname === item.href ? 'rgba(59,130,246,0.08)' : 'transparent',
                        transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = pathname === item.href ? 'var(--accent)' : 'var(--text2)'; (e.currentTarget as HTMLElement).style.background = pathname === item.href ? 'rgba(59,130,246,0.08)' : 'transparent'; }}
                    >{item.label}</Link>
                  ))}
                </div>
              )}
            </div>

            {/* Flat links */}
            {[
              { href: '/chat', label: 'AI Chat' },
              { href: '/evaluate', label: 'Evaluate' },
            ].map(l => {
              const active = pathname.startsWith(l.href);
              return (
                <Link key={l.href} href={l.href} style={{
                  padding: '0.35rem 0.6rem', borderRadius: 5,
                  fontSize: '0.82rem', fontFamily: 'var(--font-ui)',
                  textDecoration: 'none',
                  color: active ? 'var(--accent)' : 'var(--text2)',
                  background: 'transparent',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}
                >{l.label}</Link>
              );
            })}

            {/* Divider */}
            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 0.25rem' }} />

            {/* Dashboard icon */}
            <Link href="/dashboard" title="Progress Dashboard" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 6, textDecoration: 'none',
              color: pathname.startsWith('/dashboard') ? 'var(--accent)' : 'rgba(255,255,255,0.35)',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = pathname.startsWith('/dashboard') ? 'var(--accent)' : 'rgba(255,255,255,0.35)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
            </Link>

            {/* Theme customizer */}
            <ThemeCustomizer />

            {/* Auth / Premium */}
            {user ? (
              <div style={{ position: 'relative', marginLeft: '0.25rem' }}>
                <button onClick={() => setUserMenuOpen(o => !o)} title={user.email}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#0f0f1a', border: `2px solid ${snooColor(user.email ?? '')}`,
                    cursor: 'pointer', padding: 0, overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 8px ${snooColor(user.email ?? '')}44`,
                  }}>
                  <SnooAvatar email={user.email ?? ''} size={28} />
                </button>
                {userMenuOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: '#111', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10, padding: '1rem', width: 210,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.7)', zIndex: 1000,
                  }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginBottom: 4 }}>Signed in as</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600, marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                    <button onClick={handleSignOut} style={{
                      width: '100%', background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.15)',
                      color: '#ff8080', cursor: 'pointer', padding: '0.4rem', borderRadius: 6, fontSize: '0.76rem',
                    }}>Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setShowPremiumModal(true)} style={{
                display: 'flex', alignItems: 'center', gap: 5, marginLeft: '0.25rem',
                background: 'rgba(212,168,67,0.12)',
                border: '1px solid rgba(212,168,67,0.5)',
                color: '#e8b84b', cursor: 'pointer',
                padding: '0.3rem 0.65rem', borderRadius: 6,
                fontSize: '0.76rem', fontWeight: 700,
                letterSpacing: '0.03em', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(212,168,67,0.2)'; el.style.borderColor = 'rgba(212,168,67,0.8)'; el.style.color = '#ffd700'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(212,168,67,0.12)'; el.style.borderColor = 'rgba(212,168,67,0.5)'; el.style.color = '#e8b84b'; }}
              >
                ✦ Premium
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)} style={{
            display: 'none', background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '0.25rem',
          }} className="mobile-menu-btn">
            {open
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '0.5rem 1rem 1rem',
            display: 'flex', flexDirection: 'column', gap: '0.1rem',
            background: '#0a0a0a',
          }}>
            {[
              { href: '/paper1', label: 'Paper I' },
              { href: '/paper2', label: 'Paper II' },
              { href: '/timeline', label: 'Timeline' },
              { href: '/historiography', label: 'Historiography' },
              { href: '/flashcards', label: 'Flashcards' },
              { href: '/pyqs', label: 'PYQs' },
              { href: '/test', label: 'Start Test' },
              { href: '/chat', label: 'AI Chat' },
              { href: '/evaluate', label: 'Evaluate' },
              { href: '/dashboard', label: 'My Progress' },
            ].map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{
                padding: '0.6rem 0.5rem', borderRadius: 5,
                fontSize: '0.88rem', textDecoration: 'none',
                color: pathname.startsWith(l.href) ? 'var(--accent)' : 'var(--text2)',
              }}>{l.label}</Link>
            ))}
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <ThemeCustomizer />
              {user ? (
                <button onClick={handleSignOut} style={{
                  background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.15)',
                  color: '#ff8080', cursor: 'pointer', padding: '0.4rem 0.8rem', borderRadius: 6, fontSize: '0.76rem',
                }}>Sign out</button>
              ) : (
                <button onClick={() => setShowPremiumModal(true)} style={{
                  background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.5)',
                  color: '#e8b84b', cursor: 'pointer', padding: '0.4rem 0.8rem', borderRadius: 6, fontSize: '0.76rem', fontWeight: 700,
                }}>✦ Premium</button>
              )}
            </div>
          </div>
        )}

        <style>{`
          @media (max-width: 768px) {
            .desktop-nav { display: none !important; }
            .mobile-menu-btn { display: flex !important; }
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
