'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUsageTracker } from './useUsageTracker';
import { SubscribeCard } from '@/components/SubscribeCard';

function LimitModal({
  slots, onClose, onSuccess, fingerprint,
}: {
  slots: number;
  onClose: () => void;
  onSuccess: () => void;
  fingerprint: string | null;
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', overflowY: 'auto', padding: '2rem 1rem' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 16, padding: '2rem', maxWidth: 400, width: '100%', margin: '0 auto', boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        <SubscribeCard
          slots={slots}
          fingerprint={fingerprint}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  );
}

export function useSubscriptionGate(onEvaluate: () => void) {
  const { usage, loading, canEval, canChat, incrementEval, incrementChat, FREE_EVAL_LIMIT, FREE_CHAT_LIMIT } = useUsageTracker();
  const [showEvalLimit, setShowEvalLimit] = useState(false);
  const [showChatLimit, setShowChatLimit] = useState(false);
  const [slots, setSlots] = useState(45);
  const onEvaluateRef = useRef(onEvaluate);
  useEffect(() => { onEvaluateRef.current = onEvaluate; }, [onEvaluate]);

  useEffect(() => {
    fetch('/api/slots').then(r => r.json()).then(d => setSlots(d.slots ?? 45)).catch(() => {});
  }, []);

  const handleEvaluate = useCallback(() => {
    if (loading) { onEvaluateRef.current(); return; }
    if (!canEval) { setShowEvalLimit(true); return; }
    onEvaluateRef.current();
  }, [loading, canEval]);

  const handleChat = useCallback(() => {
    if (!canChat) { setShowChatLimit(true); return false; }
    return true;
  }, [canChat]);

  const increment = useCallback(async (_fp: string) => {
    await incrementEval();
  }, [incrementEval]);

  const UsagePill = () => {
    if (loading) return null;
    if (usage?.isPremium) return (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#51cf66', letterSpacing: '0.08em', marginBottom: 12 }}>
        ✦ Unlimited access
      </div>
    );
    const remaining = FREE_EVAL_LIMIT - (usage?.eval_count ?? 0);
    const color = remaining <= 0 ? '#f87171' : remaining === 1 ? '#fbbf24' : '#555';
    return (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color, letterSpacing: '0.08em', marginBottom: 12 }}>
        {remaining <= 0 ? 'Free evaluations used · subscribe for unlimited' : `${remaining} of ${FREE_EVAL_LIMIT} free evaluations remaining`}
      </div>
    );
  };

  const GateModals = ({ slots: slotsProp }: { slots?: number } = {}) => {
    const s = slotsProp ?? slots;
    return (
      <>
        {showEvalLimit && (
          <LimitModal
            slots={s}
            fingerprint={usage?.fingerprint ?? null}
            onClose={() => setShowEvalLimit(false)}
            onSuccess={() => { setShowEvalLimit(false); onEvaluateRef.current(); }}
          />
        )}
        {showChatLimit && (
          <LimitModal
            slots={s}
            fingerprint={usage?.fingerprint ?? null}
            onClose={() => setShowChatLimit(false)}
            onSuccess={() => setShowChatLimit(false)}
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
    FREE_EVAL_LIMIT, FREE_CHAT_LIMIT,
  };
}
