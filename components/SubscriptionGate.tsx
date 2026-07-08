'use client';
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useUsageTracker } from '@/hooks/useUsageTracker';

const FREE_EVAL_LIMIT = 1;
const FREE_CHAT_LIMIT = 3;

function Modal({ mode, limit, onClose }: {
  mode: 'unauthenticated' | 'limit_reached' | 'device_limit';
  limit: number;
  onClose: () => void;
}) {
  const [signingIn, setSigningIn] = useState(false);

  async function handleGoogleSignIn() {
    setSigningIn(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
    }} onClick={onClose}>
      <div style={{
        background: '#1a1a1a', borderRadius: 16, padding: '32px 28px',
        maxWidth: 380, width: '90%', color: '#f0f0f0',
      }} onClick={e => e.stopPropagation()}>

        {mode === 'unauthenticated' && (
          <>
            <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>Sign in to continue</h2>
            <p style={{ color: '#aaa', marginBottom: 24, fontSize: 14 }}>
              Sign in with Google to get{' '}
              <span style={{ color: '#f0f0f0' }}>{FREE_EVAL_LIMIT} free evaluation</span> and{' '}
              <span style={{ color: '#f0f0f0' }}>{FREE_CHAT_LIMIT} free chats</span>, or subscribe for unlimited access.
            </p>
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              style={{
                width: '100%', padding: '12px', borderRadius: 8,
                background: '#fff', color: '#111', border: 'none',
                fontWeight: 600, fontSize: 15, cursor: 'pointer',
              }}>
              {signingIn ? 'Signing in...' : 'Continue with Google'}
            </button>
          </>
        )}

        {mode === 'limit_reached' && (
          <>
            <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>Free limit reached</h2>
            <p style={{ color: '#aaa', marginBottom: 24, fontSize: 14 }}>
              You've used your free quota. Subscribe to unlock unlimited evaluations and chats.
            </p>
            <button
              onClick={() => window.location.href = '/subscribe'}
              style={{
                width: '100%', padding: '12px', borderRadius: 8,
                background: '#7c3aed', color: '#fff', border: 'none',
                fontWeight: 600, fontSize: 15, cursor: 'pointer',
              }}>
              Subscribe Now
            </button>
          </>
        )}

        {mode === 'device_limit' && (
          <>
            <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>Device limit reached</h2>
            <p style={{ color: '#aaa', marginBottom: 24, fontSize: 14 }}>
              This device has already used its free quota with another account. Subscribe to continue.
            </p>
            <button
              onClick={() => window.location.href = '/subscribe'}
              style={{
                width: '100%', padding: '12px', borderRadius: 8,
                background: '#7c3aed', color: '#fff', border: 'none',
                fontWeight: 600, fontSize: 15, cursor: 'pointer',
              }}>
              Subscribe Now
            </button>
          </>
        )}

        <button onClick={onClose} style={{
          marginTop: 12, width: '100%', padding: '10px', borderRadius: 8,
          background: 'transparent', color: '#666', border: '1px solid #333',
          fontSize: 14, cursor: 'pointer',
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function SubscriptionGate({ type, children }: {
  type: 'eval' | 'chat';
  children: (props: { onAction: () => Promise<boolean> }) => React.ReactNode;
}) {
  const { usage, loading, authReady, canEval, canChat, incrementEval, incrementChat } = useUsageTracker();
  const [modal, setModal] = useState<'none' | 'unauthenticated' | 'limit_reached' | 'device_limit'>('none');

  const canDo = type === 'eval' ? canEval : canChat;
  const increment = type === 'eval' ? incrementEval : incrementChat;

  async function onAction(): Promise<boolean> {
    // Login nahi hai
    if (!usage) {
      setModal('unauthenticated');
      return false;
    }

    // Premium hai — allow
    if (usage.subscribed) {
      await increment();
      return true;
    }

    // Free limit check
    if (!canDo) {
      setModal('limit_reached');
      return false;
    }

    await increment();
    return true;
  }

  if (loading || !authReady) return null;

  return (
    <>
      {children({ onAction })}
      {modal !== 'none' && (
        <Modal
          mode={modal}
          limit={type === 'eval' ? FREE_EVAL_LIMIT : FREE_CHAT_LIMIT}
          onClose={() => setModal('none')}
        />
      )}
    </>
  );
}
