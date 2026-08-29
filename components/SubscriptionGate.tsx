'use client';
import React, { useState } from 'react';
import { auth, signInWithGoogle } from '@/lib/firebase';
import { useUsageTracker } from '@/hooks/useUsageTracker';
import { SubscribeCard } from '@/components/SubscribeCard';

const FREE_EVAL_LIMIT = 1;
const FREE_CHAT_LIMIT = 3;

function getDaysToMains(): number {
  const mains = new Date('2027-08-20');
  const now = new Date();
  const diff = Math.ceil((mains.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function Modal({ mode, type, fingerprint, onClose }: {
  mode: 'unauthenticated' | 'limit_reached' | 'device_limit';
  type: 'eval' | 'chat';
  fingerprint: string | null;
  onClose: () => void;
}) {
  const [signingIn, setSigningIn] = useState(false);
  const daysLeft = getDaysToMains();

  async function handleGoogleSignIn() {
    setSigningIn(true);
    try {
      const method = await signInWithGoogle();
      // A redirect unloads this page — don't touch state on the way out.
      if (method === 'redirect') return;
      onClose();
      setSigningIn(false);
    } catch (e) {
      console.error(e);
      setSigningIn(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
      backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg2)', borderRadius: 16, padding: '28px 24px',
        maxWidth: 420, width: '92%', color: 'var(--text)',
        border: '1px solid rgba(212,168,67,0.15)',
        boxShadow: '0 0 60px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>

        {mode === 'unauthenticated' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>
                Sign in to continue
              </h2>
              <p style={{ color: 'var(--text2)', margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                Get <strong style={{ color: 'var(--text)' }}>{FREE_EVAL_LIMIT} free evaluation</strong> and{' '}
                <strong style={{ color: 'var(--text)' }}>{FREE_CHAT_LIMIT} free chats</strong> — or subscribe for unlimited access.
              </p>
            </div>
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              style={{
                width: '100%', padding: '12px', borderRadius: 8,
                background: '#fff', color: '#111', border: 'none',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {signingIn ? 'Signing in…' : 'Continue with Google'}
            </button>
            <button onClick={onClose} style={{
              marginTop: 10, width: '100%', padding: '10px', borderRadius: 8,
              background: 'transparent', color: 'var(--text3)', border: '1px solid #333',
              fontSize: 13, cursor: 'pointer',
            }}>
              Cancel
            </button>
          </>
        )}

        {(mode === 'limit_reached' || mode === 'device_limit') && (
          <>
            <div style={{
              background: 'rgba(212,168,67,0.06)',
              border: '1px solid rgba(212,168,67,0.2)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#d4a843', marginBottom: 6 }}>
                {daysLeft > 0
                  ? `${daysLeft} days to Mains. Your free quota is done.`
                  : 'Mains is here. Your free quota is done.'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.55 }}>
                {type === 'eval'
                  ? "Toppers evaluate 5–10 answers daily. You've used your 1 free evaluation. Without feedback on your writing, you're guessing what the examiner wants."
                  : "You've used your 3 free chats. Serious aspirants are getting instant clarity on sources, historiography, and answer structure — right now."}
              </div>
            </div>

            <SubscribeCard
              slots={1}
              fingerprint={fingerprint}
              onSuccess={onClose}
              onClose={onClose}
              standalone={false}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function SubscriptionGate({ type, children }: {
  type: 'eval' | 'chat';
  children: (props: { onAction: () => Promise<boolean> }) => React.ReactElement | null;
}) {
  const { usage, loading, authReady, canEval, canChat, incrementEval, incrementChat } = useUsageTracker();
  const [modal, setModal] = useState<'none' | 'unauthenticated' | 'limit_reached' | 'device_limit'>('none');

  const canDo = type === 'eval' ? canEval : canChat;
  const increment = type === 'eval' ? incrementEval : incrementChat;

  const fingerprint = usage?.fingerprint ?? null;

  async function onAction(): Promise<boolean> {
    if (!usage) {
      setModal('unauthenticated');
      return false;
    }
    if (usage.subscribed) {
      await increment();
      return true;
    }
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
          type={type}
          fingerprint={fingerprint}
          onClose={() => setModal('none')}
        />
      )}
    </>
  );
}
