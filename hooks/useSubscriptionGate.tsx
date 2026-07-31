'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUsageTracker } from './useUsageTracker';
import { SubscribeCard } from '@/components/SubscribeCard';

function LoginModal({ onClose }: { onClose: () => void }) {
  const [signingIn, setSigningIn] = useState(false);
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1001, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
      onClick={onClose}>
      <div style={{ background:'#111', border:'1px solid #2a2a2a', borderRadius:16, padding:'2rem', maxWidth:380, width:'100%', boxShadow:'0 40px 80px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'1.25rem', fontWeight:700, color:'#f0f0f0' }}>Sign in to continue</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#555', cursor:'pointer', fontSize:'1.1rem' }}>✕</button>
        </div>
        <p style={{ color:'#666', fontSize:'0.85rem', marginBottom:20 }}>
          Sign in with Google to get 1 free evaluation and 3 free chats, or subscribe for unlimited access.
        </p>
        <button
          onClick={async () => {
            setSigningIn(true);
            try {
              const { auth } = await import('@/lib/firebase');
              const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
              await signInWithPopup(auth, new GoogleAuthProvider());
              onClose();
            } catch(e) { console.error(e); } finally { setSigningIn(false); }
          }}
          disabled={signingIn}
          style={{ width:'100%', padding:'12px', borderRadius:8, background:'#fff', color:'#111', border:'none', fontWeight:600, fontSize:15, cursor:'pointer' }}>
          {signingIn ? 'Signing in...' : 'Continue with Google'}
        </button>
      </div>
    </div>
  );
}

function LimitModal({
  slots, onClose, onSuccess, fingerprint,
}: {
  slots: number;
  onClose: () => void;
  onSuccess: () => void;
  fingerprint: string | null;
}) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1001, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
      onClick={onClose}>
      <div style={{ background:'#111', border:'1px solid #2a2a2a', borderRadius:16, padding:'2rem', maxWidth:400, width:'100%', boxShadow:'0 40px 80px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'1.25rem', fontWeight:700, color:'#f0f0f0' }}>
            ⚡ Unlock Unlimited Access
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#555', cursor:'pointer', fontSize:'1.1rem', padding:'0 2px', lineHeight:1 }}>✕</button>
        </div>
        <div style={{ color:'#666', fontSize:'0.82rem', marginBottom:20 }}>
          Subscribe for unlimited access to all features.
        </div>
        <div style={{ height:1, background:'rgba(255,255,255,0.05)', marginBottom:20 }} />
        <SubscribeCard
          slots={slots}
          fingerprint={fingerprint}
          onSuccess={() => { onClose(); onSuccess(); }}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

export function useSubscriptionGate(onEvaluate: () => void) {
  const { usage, loading, canEval, canChat, incrementEval, incrementChat, refetchUsage, FREE_EVAL_LIMIT, FREE_CHAT_LIMIT } = useUsageTracker();
  const [showEvalLimit, setShowEvalLimit] = useState(false);
  const [showChatLimit, setShowChatLimit] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [slots, setSlots] = useState(45);
  const onEvaluateRef = useRef(onEvaluate);
  useEffect(() => { onEvaluateRef.current = onEvaluate; }, [onEvaluate]);

  useEffect(() => {
    fetch('/api/slots').then(r => r.json()).then(d => setSlots(d.slots ?? 45)).catch(() => {});
  }, []);

  // Auto-close modals when user becomes premium (after sign in / payment)
  useEffect(() => {
    if (usage?.subscribed) {
      setShowEvalLimit(false);
      setShowChatLimit(false);
    }
  }, [usage?.subscribed]);

  const handleEvaluate = useCallback(() => {
    if (loading) return;
    if (!usage) { setShowLoginModal(true); return; }
    if (!canEval) { setShowEvalLimit(true); return; }
    onEvaluateRef.current();
  }, [loading, usage, canEval]);

  const handleChat = useCallback(() => {
    if (!usage) { setShowLoginModal(true); return false; }
    if (!canChat) { setShowChatLimit(true); return false; }
    return true;
  }, [usage, canChat]);

  // eval_count is now tracked server-side in /api/evaluate for all users
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const increment = useCallback(async (_fp: string) => {}, []);

  const UsagePill = () => {
    if (loading) return null;
    if (usage?.subscribed) return (
      <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.62rem', color:'#51cf66', letterSpacing:'0.08em', marginBottom:12 }}>
        ✦ Unlimited access
      </div>
    );
    const remaining = FREE_EVAL_LIMIT - (usage?.eval_count ?? 0);
    const color = remaining <= 0 ? '#f87171' : remaining === 1 ? '#fbbf24' : '#555';
    return (
      <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.62rem', color, letterSpacing:'0.08em', marginBottom:12 }}>
        {remaining <= 0 ? 'Free evaluations used · subscribe for unlimited' : `${remaining} of ${FREE_EVAL_LIMIT} free evaluations remaining`}
      </div>
    );
  };

  const GateModals = ({ slots: slotsProp }: { slots?: number } = {}) => {
    const s = slotsProp ?? slots;
    return (
      <>
        {showLoginModal && (
          <LoginModal onClose={() => setShowLoginModal(false)} />
        )}
        {showEvalLimit && (
          <LimitModal
            slots={s}
            fingerprint={usage?.fingerprint ?? null}
            onClose={() => setShowEvalLimit(false)}
            onSuccess={() => { refetchUsage(); setShowEvalLimit(false); onEvaluateRef.current(); }}
          />
        )}
        {showChatLimit && (
          <LimitModal
            slots={s}
            fingerprint={usage?.fingerprint ?? null}
            onClose={() => setShowChatLimit(false)}
            onSuccess={() => { refetchUsage(); setShowChatLimit(false); }}
          />
        )}
      </>
    );
  };

  return {
    UsagePill, GateModals, handleEvaluate, handleChat,
    usage: { ...usage, token: usage?.fingerprint ?? null, loading },
    increment, incrementChat,
    canEval, canChat, slots,
    showChatLimitModal: () => setShowChatLimit(true),
    showLoginModal: () => setShowLoginModal(true),
    FREE_EVAL_LIMIT, FREE_CHAT_LIMIT,
  };
}
