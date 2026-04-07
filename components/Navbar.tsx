'use client';
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

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pyqsMenuOpen, setPyqsMenuOpen] = useState(false);

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
        height: 60,
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
              padding: '0.4rem 0.9rem',
              borderRadius: 5,
              fontSize: '0.85rem',
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
                minWidth: 140, zIndex: 200,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                <Link href="/pyqs" onClick={() => setPyqsMenuOpen(false)} style={{
                  display: 'block', padding: '0.5rem 0.75rem', borderRadius: 5,
                  fontSize: '0.85rem', textDecoration: 'none',
                  color: pathname === '/pyqs' ? 'var(--accent)' : 'var(--text2)',
                  background: pathname === '/pyqs' ? 'rgba(59,130,246,0.1)' : 'transparent',
                }}>📋 Browse PYQs</Link>
                <Link href="/test" onClick={() => setPyqsMenuOpen(false)} style={{
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
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 200,
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
              onClick={handleSignIn}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)',
                color: 'var(--accent)', cursor: 'pointer',
                padding: '0.35rem 0.85rem', borderRadius: 6,
                fontSize: '0.8rem', fontWeight: 600,
                marginLeft: '0.4rem', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.15)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.08)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in
            </button>
          )}
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
  );
}
