'use client';
import React, { useState } from 'react';
import { auth, signInWithGoogle } from '@/lib/firebase';
import { useUsageTracker } from '@/hooks/useUsageTracker';
import { SubscribeCard } from '@/components/SubscribeCard';
import { daysToMains } from '@/lib/examDates';
import { useLang } from '@/lib/i18n/LangContext';

const FREE_EVAL_LIMIT = 1;
const FREE_CHAT_LIMIT = 3;

// The date lives in lib/examDates.ts so the navbar and this gate agree.

function Modal({ mode, type, fingerprint, onClose }: {
  mode: 'unauthenticated' | 'limit_reached' | 'device_limit';
  type: 'eval' | 'chat';
  fingerprint: string | null;
  onClose: () => void;
}) {
  const [signingIn, setSigningIn] = useState(false);
  const { langHi } = useLang();
  const daysLeft = daysToMains();

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
        border: '1px solid color-mix(in srgb, var(--warning-text) 15%, transparent)',
        boxShadow: '0 0 60px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>

        {mode === 'unauthenticated' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>
                {langHi ? 'जारी रखने के लिए साइन इन करें' : 'Sign in to continue'}
              </h2>
              {langHi ? (
                <p style={{ color: 'var(--text2)', margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text)' }}>{FREE_EVAL_LIMIT} निःशुल्क मूल्यांकन</strong> और{' '}
                  <strong style={{ color: 'var(--text)' }}>{FREE_CHAT_LIMIT} निःशुल्क चैट</strong> पाएँ, या असीमित पहुँच के लिए सदस्यता लें।
                </p>
              ) : (
                <p style={{ color: 'var(--text2)', margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                  Get <strong style={{ color: 'var(--text)' }}>{FREE_EVAL_LIMIT} free evaluation</strong> and{' '}
                  <strong style={{ color: 'var(--text)' }}>{FREE_CHAT_LIMIT} free chats</strong> — or subscribe for unlimited access.
                </p>
              )}
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
              {signingIn ? (langHi ? 'साइन इन हो रहा है…' : 'Signing in…') : (langHi ? 'Google से जारी रखें' : 'Continue with Google')}
            </button>
            <button onClick={onClose} style={{
              marginTop: 10, width: '100%', padding: '10px', borderRadius: 8,
              background: 'transparent', color: 'var(--text3)', border: '1px solid #333',
              fontSize: 13, cursor: 'pointer',
            }}>
              {langHi ? 'रद्द करें' : 'Cancel'}
            </button>
          </>
        )}

        {(mode === 'limit_reached' || mode === 'device_limit') && (
          <>
            <div style={{
              background: 'var(--warning-wash)',
              border: '1px solid color-mix(in srgb, var(--warning-text) 20%, transparent)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--warning-text)', marginBottom: 6 }}>
                {langHi
                  ? (daysLeft > 0
                    ? `मुख्य परीक्षा में ${daysLeft} दिन बाक़ी। आपका निःशुल्क कोटा पूरा हो गया।`
                    : 'मुख्य परीक्षा आ गई। आपका निःशुल्क कोटा पूरा हो गया।')
                  : daysLeft > 0
                    ? `${daysLeft} days to Mains. Your free quota is done.`
                    : 'Mains is here. Your free quota is done.'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.55 }}>
                {langHi
                  ? (type === 'eval'
                    ? 'टॉपर रोज़ 5 से 10 उत्तर जँचवाते हैं। आपका 1 निःशुल्क मूल्यांकन हो चुका है। लेखन पर प्रतिक्रिया के बिना आप बस अंदाज़ा लगाते हैं कि परीक्षक क्या चाहता है।'
                    : 'आपकी 3 निःशुल्क चैट हो चुकी हैं। गंभीर अभ्यर्थी इसी समय स्रोतों, इतिहास-लेखन और उत्तर के ढाँचे पर तुरंत स्पष्टता पा रहे हैं।')
                  : type === 'eval'
                  ? "Toppers evaluate 5–10 answers daily. You've used your 1 free evaluation. Without feedback on your writing, you're guessing what the examiner wants."
                  : "You've used your 3 free chats. Serious aspirants are getting instant clarity on sources, historiography, and answer structure — right now."}
              </div>
            </div>

            <SubscribeCard
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
