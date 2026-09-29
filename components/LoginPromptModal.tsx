'use client';
import { useEffect, useRef, useState } from 'react';
import { signInWithGoogle } from '@/lib/firebase';
import { useLang } from '@/lib/i18n/LangContext';
import Mascot from '@/components/Mascot';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

/**
 * The site's one sign-in dialog. Pages that need an account open it through
 * useLoginPrompt, and the chat and evaluate gates open it through
 * useSubscriptionGate; before, the gate drew its own, hard-coded dark, which
 * sat as a black box on the light theme.
 */
export default function LoginPromptModal({ isOpen, onClose, message }: LoginPromptModalProps) {
  const [signingIn, setSigningIn] = useState(false);
  const { langHi } = useLang();
  const googleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    googleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      const method = await signInWithGoogle();
      // A redirect unloads this page; the modal is gone when we come back.
      if (method === 'redirect') return;
      onClose();
    } catch (err) {
      console.error('Sign in error:', err);
      setSigningIn(false);
    }
  };

  return (
    <div className="lpm-scrim" onClick={onClose}>
      <style>{LPM_CSS}</style>
      <div
        className="lpm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lpm-title"
        onClick={e => e.stopPropagation()}
      >
        <Mascot pose="peek" width={104} className="lpm-owl" />
        <h2 id="lpm-title">{langHi ? 'जारी रखने के लिए साइन इन करें' : 'Sign in to continue'}</h2>
        <p className="lpm-msg">
          {message || (langHi ? 'इसके लिए एक निःशुल्क खाता चाहिए।' : 'This needs a free account.')}
        </p>

        <button ref={googleRef} className="lpm-google" onClick={handleSignIn} disabled={signingIn}>
          {signingIn ? (
            <><span className="lpm-spin" aria-hidden="true" />{langHi ? 'साइन इन हो रहा है…' : 'Signing in…'}</>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {langHi ? 'Google से जारी रखें' : 'Continue with Google'}
            </>
          )}
        </button>

        <button className="lpm-later" onClick={onClose}>{langHi ? 'बाद में' : 'Maybe later'}</button>
      </div>
    </div>
  );
}

const LPM_CSS = `
.lpm-scrim {
  position: fixed; inset: 0; z-index: 2000;
  display: flex; align-items: center; justify-content: center; padding: var(--space-6);
  background: color-mix(in srgb, var(--bg) 72%, transparent);
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
}
.lpm {
  width: 100%; max-width: 400px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  padding: var(--space-8) var(--space-8) var(--space-6);
  background: var(--bg-raised); border: 1px solid var(--border2); border-radius: var(--radius-xl);
  box-shadow: var(--elev-3); font-family: var(--font-body);
  animation: lpmIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.lpm-owl { height: auto; margin-bottom: var(--space-3); }
.lpm h2 { font-family: var(--font-body); font-size: 1.3rem; font-weight: 700; color: var(--text); margin: 0 0 var(--space-2); }
.lpm-msg { font-size: 0.92rem; line-height: 1.6; color: var(--text2); margin: 0 0 var(--space-6); }
.lpm-google {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-5); border-radius: var(--radius-md);
  background: var(--bg-raised); color: var(--text); border: 1px solid var(--border3);
  font-family: var(--font-body); font-size: 0.95rem; font-weight: 600; cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.lpm-google:hover:not(:disabled) { border-color: var(--accent); background: var(--accent-dim); }
.lpm-google:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.lpm-google:disabled { cursor: wait; color: var(--text3); }
.lpm-spin { width: 16px; height: 16px; border-radius: var(--radius-circle); border: 2px solid var(--accent-glow); border-top-color: var(--accent); animation: lpmSpin 0.7s linear infinite; }
.lpm-later { margin-top: var(--space-3); background: none; border: none; font-family: var(--font-body); font-size: 0.85rem; color: var(--text3); cursor: pointer; padding: var(--space-2); }
.lpm-later:hover { color: var(--text2); }
@keyframes lpmIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: none; } }
@keyframes lpmSpin { to { transform: rotate(360deg); } }
@media (max-width: 480px) { .lpm { padding: var(--space-6) var(--space-5) var(--space-5); } }
@media (prefers-reduced-motion: reduce) { .lpm, .lpm-spin { animation: none; } }
`;
