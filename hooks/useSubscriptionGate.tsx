'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUsageTracker } from './useUsageTracker';
import { SubscribeCard } from '@/components/SubscribeCard';
import LoginPromptModal from '@/components/LoginPromptModal';
import Mascot from '@/components/Mascot';
import { useLang } from '@/lib/i18n/LangContext';

/**
 * What a free reader has run out of, or that a paid feature was asked for.
 * The chat page opens the chat variant for Premium features too (PDFs,
 * Brainstorm, books), so the title only says the free chats are used up when
 * they are.
 */
function LimitModal({
  kind, exhausted, onClose, onSuccess, fingerprint,
}: {
  kind: 'chat' | 'eval';
  exhausted: boolean;
  onClose: () => void;
  onSuccess: () => void;
  fingerprint: string | null;
}) {
  const { langHi } = useLang();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const title = !exhausted
    ? (langHi ? 'प्रीमियम के साथ सब कुछ खोलें' : 'Unlock everything with Premium')
    : kind === 'chat'
      ? (langHi ? 'आपकी 3 निःशुल्क चैट पूरी हो गईं' : "You've used your 3 free chats")
      : (langHi ? 'आपका निःशुल्क मूल्यांकन पूरा हो गया' : "You've used your free evaluation");
  const sub = langHi
    ? 'असीमित चैट और मूल्यांकन, मेंटर मोड, पुस्तकों से चैट और PDF।'
    : 'Unlimited chats and evaluations, Mentor mode, Chat with books and PDFs.';

  return (
    <div className="lim-scrim ds" onClick={onClose}>
      <style>{LIM_CSS}</style>
      <div className="lim" role="dialog" aria-modal="true" aria-labelledby="lim-title" onClick={e => e.stopPropagation()}>
        <button className="lim-close" onClick={onClose} aria-label={langHi ? 'बंद करें' : 'Close'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <div className="lim-head">
          <Mascot pose="peek" width={80} className="lim-owl" />
          <div>
            <h2 id="lim-title">{title}</h2>
            <p>{sub}</p>
          </div>
        </div>
        <SubscribeCard
          fingerprint={fingerprint}
          onSuccess={() => { onClose(); onSuccess(); }}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

const LIM_CSS = `
.lim-scrim {
  position: fixed; inset: 0; z-index: 1001; overflow-y: auto;
  display: flex; align-items: center; justify-content: center; padding: var(--space-4);
  background: var(--scrim);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.lim {
  position: relative; width: 100%; max-width: 440px; margin: auto;
  padding: var(--space-6); font-family: var(--font-body);
  background: var(--ds-card); border: 1px solid var(--border); border-radius: 16px;
  box-shadow: var(--shadow-xl);
}
.lim-close {
  position: absolute; top: var(--space-3); right: var(--space-3);
  width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center;
  border: none; border-radius: var(--radius-md); background: none; color: var(--text3); cursor: pointer;
}
.lim-close:hover { color: var(--text); background: var(--bg2); }
.lim-head { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-5); padding-right: var(--space-6); }
.lim-owl { height: auto; flex-shrink: 0; }
.lim-head h2 { font-family: var(--font-ui); font-size: 1.125rem; font-weight: 700; letter-spacing: -0.01em; line-height: 1.3; color: var(--text); margin: 0 0 var(--space-1); }
.lim-head p { font-size: 0.85rem; line-height: 1.55; color: var(--text2); margin: 0; }
@media (max-width: 480px) {
  .lim { padding: var(--space-5) var(--space-4); }
  .lim-owl { width: 64px; }
}
`;

export function useSubscriptionGate(onEvaluate: () => void) {
  const { langHi } = useLang();
  const { usage, loading, canEval, canChat, incrementEval, incrementChat, refetchUsage, FREE_EVAL_LIMIT, FREE_CHAT_LIMIT } = useUsageTracker();
  const [showEvalLimit, setShowEvalLimit] = useState(false);
  const [showChatLimit, setShowChatLimit] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const onEvaluateRef = useRef(onEvaluate);
  useEffect(() => { onEvaluateRef.current = onEvaluate; }, [onEvaluate]);

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
    // The amber read as pale yellow on paper and was the hardest line on the
    // page to see. A warning tone is not worth an unreadable one, so the
    // normal case is just body text.
    const color = remaining <= 0 ? 'var(--danger-text)' : 'var(--text)';
    return (
      <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.68rem', fontWeight:600, color, letterSpacing:'0.08em', marginBottom:12 }}>
        {remaining <= 0 ? 'Free evaluations used · subscribe for unlimited' : `${remaining} of ${FREE_EVAL_LIMIT} free evaluations remaining`}
      </div>
    );
  };

  const GateModals = () => {
    return (
      <>
        <LoginPromptModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          message={langHi
            ? 'Google से साइन इन करें और 1 निःशुल्क मूल्यांकन और 3 निःशुल्क चैट पाएँ, या असीमित के लिए सदस्यता लें।'
            : 'Sign in with Google to get 1 free evaluation and 3 free chats, or subscribe for unlimited access.'}
        />
        {showEvalLimit && (
          <LimitModal
            kind="eval"
            exhausted={!canEval}
            fingerprint={usage?.fingerprint ?? null}
            onClose={() => setShowEvalLimit(false)}
            onSuccess={() => { refetchUsage(); setShowEvalLimit(false); onEvaluateRef.current(); }}
          />
        )}
        {showChatLimit && (
          <LimitModal
            kind="chat"
            exhausted={!canChat}
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
    canEval, canChat,
    showChatLimitModal: () => setShowChatLimit(true),
    showLoginModal: () => setShowLoginModal(true),
    FREE_EVAL_LIMIT, FREE_CHAT_LIMIT,
  };
}
