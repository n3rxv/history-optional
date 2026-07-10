'use client';
import { useState } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function LoginPromptModal({ isOpen, onClose, message }: LoginPromptModalProps) {
  const [signingIn, setSigningIn] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err) {
      console.error('Sign in error:', err);
      setSigningIn(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 1999,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem', pointerEvents: 'none',
      }}>
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border2)',
          borderRadius: 16,
          padding: '2.5rem 2.5rem 2rem',
          maxWidth: 420, width: '100%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '1.25rem', textAlign: 'center',
          animation: 'authModalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'auto',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem',
          }}>📜</div>

          <div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700,
              color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '0.4rem',
            }}>Sign in to continue</h2>
            <p style={{ color: 'var(--text3)', fontSize: '0.875rem', lineHeight: 1.55, maxWidth: 300 }}>
              {message || 'Create a free account to access this feature.'}
            </p>
          </div>

          <div style={{ width: '100%', height: 1, background: 'var(--border)' }} />

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
              padding: '0.75rem 1.25rem', borderRadius: 10,
              fontSize: '0.9rem', fontWeight: 600, letterSpacing: '-0.01em',
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
                  borderTopColor: 'var(--accent)', display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Signing in…
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

          <button onClick={onClose} style={{
            fontSize: '0.78rem', color: 'var(--text3)',
            background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text3)'; }}
          >
            Maybe later
          </button>
        </div>
      </div>
      <style>{`
        @keyframes authModalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
