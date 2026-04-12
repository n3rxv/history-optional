'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/notes') ||
    pathname.startsWith('/pyqs') ||
    pathname.startsWith('/timeline') ||
    pathname.startsWith('/historiography') ||
    pathname.startsWith('/paper1') ||
    pathname.startsWith('/paper2') ||
    pathname.startsWith('/posts');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.access_token) {
        fetch('/api/ping', {
          method: 'POST',
          headers: { 'x-user-token': session.access_token },
        }).catch(() => {});
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setSigningIn(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/google-callback?next=${encodeURIComponent(pathname)}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
  };

  // Always render children on home or when signed in
  if (isPublic || user) return <>{children}</>;

  // Still checking session — render children silently (avoids flash)
  if (loading) return <>{children}</>;

  // Not signed in, not on home — show modal overlay
  return (
    <>
      {/* Blurred page content underneath */}
      <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.35 }}>
        {children}
      </div>

      {/* Modal backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}>
        {/* Modal card */}
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border2)',
          borderRadius: 16,
          padding: '2.5rem 2.5rem 2rem',
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          textAlign: 'center',
          animation: 'authModalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>

          {/* Logo mark */}
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem',
          }}>
            📜
          </div>

          {/* Heading */}
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.35rem', fontWeight: 700,
              color: 'var(--text)', letterSpacing: '-0.02em',
              marginBottom: '0.4rem',
            }}>
              Sign in to continue
            </h2>
            <p style={{
              color: 'var(--text3)',
              fontSize: '0.875rem',
              lineHeight: 1.55,
              maxWidth: 300,
            }}>
              Access to notes, PYQs, timelines, AI chat, and evaluation requires a free account.
            </p>
          </div>

          {/* Divider */}
          <div style={{ width: '100%', height: 1, background: 'var(--border)' }} />

          {/* Google sign in button */}
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%',
              background: signingIn ? 'rgba(59,130,246,0.04)' : 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: signingIn ? 'var(--text3)' : 'var(--accent)',
              cursor: signingIn ? 'not-allowed' : 'pointer',
              padding: '0.75rem 1.25rem',
              borderRadius: 10,
              fontSize: '0.9rem', fontWeight: 600,
              letterSpacing: '-0.01em',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!signingIn) (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.14)'; }}
            onMouseLeave={e => { if (!signingIn) (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.08)'; }}
          >
            {signingIn ? (
              <>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid rgba(59,130,246,0.3)',
                  borderTopColor: 'var(--accent)',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Redirecting…
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Back to home */}
          <a
            href="/"
            style={{
              fontSize: '0.78rem',
              color: 'var(--text3)',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text3)'; }}
          >
            ← Back to home
          </a>
        </div>
      </div>

      <style>{`
        @keyframes authModalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
