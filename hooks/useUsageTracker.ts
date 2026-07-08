'use client';
import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export type UsageData = {
  fingerprint: string;
  firebase_uid: string;
  eval_count: number;
  chat_count: number;
  subscribed: boolean;
};

const FREE_EVAL_LIMIT = 1;
const FREE_CHAT_LIMIT = 3;

export function useUsageTracker() {
  const [usage, setUsage]   = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let fp = '';

    async function getFingerprint() {
      const fpAgent = await FingerprintJS.load();
      const result  = await fpAgent.get();
      fp = result.visitorId;
      document.cookie = `fp=${fp};max-age=315360000;path=/`;
      localStorage.setItem('fp', fp);
      return fp;
    }

    async function fetchUsage(fingerprint: string, token: string) {
      const res  = await fetch(`/api/usage?fp=${fingerprint}&token=${token}`);
      const data = await res.json();
      return data;
    }

    async function init() {
      const fingerprint = await getFingerprint();

      const unsub = onAuthStateChanged(auth, async (user) => {
        setAuthReady(true);

        if (!user) {
          setUsage(null);
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        const data  = await fetchUsage(fingerprint, token);

        setUsage({
          fingerprint:  data.fingerprint ?? fingerprint,
          firebase_uid: user.uid,
          eval_count:   data.eval_count  ?? 0,
          chat_count:   data.chat_count  ?? 0,
          subscribed:   data.subscribed  ?? false,
        });
        setLoading(false);
      });

      return () => unsub();
    }

    init();
  }, []);

  const isSubscribed = usage?.subscribed ?? false;
  const canEval = isSubscribed || (usage?.eval_count ?? 0) < FREE_EVAL_LIMIT;
  const canChat = isSubscribed || (usage?.chat_count ?? 0) < FREE_CHAT_LIMIT;

  const incrementEval = async () => {
    if (!usage) return;
    await fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fingerprint:  usage.fingerprint,
        firebase_uid: usage.firebase_uid,
        type: 'eval',
      }),
    });
    setUsage(prev => prev ? { ...prev, eval_count: prev.eval_count + 1 } : prev);
  };

  const incrementChat = async () => {
    if (!usage) return;
    await fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fingerprint:  usage.fingerprint,
        firebase_uid: usage.firebase_uid,
        type: 'chat',
      }),
    });
    setUsage(prev => prev ? { ...prev, chat_count: prev.chat_count + 1 } : prev);
  };

  return {
    usage,
    loading,
    authReady,
    canEval,
    canChat,
    incrementEval,
    incrementChat,
    FREE_EVAL_LIMIT,
    FREE_CHAT_LIMIT,
  };
}
