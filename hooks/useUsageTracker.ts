'use client';
import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export type UsageData = {
  fingerprint: string;
  eval_count: number;
  chat_count: number;
  isPremium?: boolean;
  token?: string;
};

const FREE_EVAL_LIMIT = 1;
const FREE_CHAT_LIMIT = 3;

export function useUsageTracker() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let fingerprint = '';

    async function getFingerprint() {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      fingerprint = result.visitorId;
      document.cookie = `fp=${fingerprint};max-age=315360000;path=/`;
      localStorage.setItem('fp', fingerprint);
      const res = await fetch(`/api/usage?fp=${fingerprint}`);
      const data = await res.json();
      setUsage({ ...data, isPremium: false });
      setLoading(false);
      return fingerprint;
    }

    async function checkPremium(fp: string) {
      try {
        const user = auth.currentUser;
        if (!user) {
          setUsage(prev => prev ? { ...prev, isPremium: false, token: undefined } : prev);
          return;
        }
        if (user.email === process.env.NEXT_PUBLIC_OWNER_EMAIL) {
          const token = await user.getIdToken();
          setUsage(prev => prev ? { ...prev, isPremium: true, token } : prev);
          return;
        }
        const token = await user.getIdToken();
        const subRes = await fetch(`/api/usage?fp=${fp}&checkSub=1&token=${token}`);
        const subData = await subRes.json();
        setUsage(prev => prev ? { ...prev, isPremium: subData.isPremium ?? false, token } : prev);
      } catch {}
    }

    getFingerprint().then(fp => {
      // Initial check
      checkPremium(fp);

      // Re-check on auth state change (sign in / sign out)
      const unsub = onAuthStateChanged(auth, () => {
        checkPremium(fp);
      });

      return () => unsub();
    });
  }, []);

  const canEval = !!(usage?.isPremium) || (usage?.eval_count ?? 0) < FREE_EVAL_LIMIT;
  const canChat = !!(usage?.isPremium) || (usage?.chat_count ?? 0) < FREE_CHAT_LIMIT;

  const incrementEval = async () => {
    if (!usage) return;
    await fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprint: usage.fingerprint, type: 'eval' }),
    });
    setUsage(prev => prev ? { ...prev, eval_count: prev.eval_count + 1 } : prev);
  };

  const incrementChat = async () => {
    if (!usage) return;
    await fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprint: usage.fingerprint, type: 'chat' }),
    });
    setUsage(prev => prev ? { ...prev, chat_count: prev.chat_count + 1 } : prev);
  };

  return { usage, loading, canEval, canChat, incrementEval, incrementChat, FREE_EVAL_LIMIT, FREE_CHAT_LIMIT };
}
