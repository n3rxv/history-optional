'use client';
import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export type UsageData = {
  fingerprint: string;
  eval_count: number;
  chat_count: number;
  isPremium?: boolean;
};

const FREE_EVAL_LIMIT = 1;
const FREE_CHAT_LIMIT = 5;

export function useUsageTracker() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // Get fingerprint
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const fingerprint = result.visitorId;

      // Store in cookie as backup
      document.cookie = `fp=${fingerprint};max-age=31536000;path=/`;

      // Fetch usage from DB
      const res = await fetch(`/api/usage?fp=${fingerprint}`);
      const data = await res.json();
      let isPremium = false;
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const subRes = await fetch(`/api/usage?fp=${fingerprint}&checkSub=1&token=${session.access_token}`);
          const subData = await subRes.json();
          isPremium = subData.isPremium ?? false;
        }
      } catch {}
      setUsage({ ...data, isPremium });
      setLoading(false);
    }
    init();
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