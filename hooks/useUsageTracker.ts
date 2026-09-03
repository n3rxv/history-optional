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

    // The token goes in a header, not the query string. As a URL parameter it
    // landed in Vercel access logs, browser history and any proxy in between —
    // a live credential written to places that outlive it.
    async function fetchUsage(fingerprint: string, token: string) {
      const res  = await fetch(`/api/usage?fp=${encodeURIComponent(fingerprint)}`, {
        headers: { 'x-user-token': token },
      });
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

        // Cached; the SDK refreshes on its own. Forcing it made every
        // usage read a round-trip to Google.
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

  const refetchUsage = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const fp = localStorage.getItem('fp') ?? document.cookie.match(/fp=([^;]+)/)?.[1] ?? '';
    const token = await user.getIdToken();
    const res = await fetch(`/api/usage?fp=${encodeURIComponent(fp)}`, {
      headers: { 'x-user-token': token },
    });
    const data = await res.json();
    setUsage(prev => prev ? {
      ...prev,
      eval_count:  data.eval_count  ?? prev.eval_count,
      chat_count:  data.chat_count  ?? prev.chat_count,
      subscribed:  data.subscribed  ?? prev.subscribed,
    } : prev);
  };

  // Counters are incremented server-side by the routes that spend the money.
  // These used to POST to /api/usage, which trusted the identity in the body
  // and did a read-modify-write. They now only refresh the local view.
  const incrementEval = async () => {
    setUsage(prev => prev ? { ...prev, eval_count: prev.eval_count + 1 } : prev);
  };

  const incrementChat = async () => {
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
    refetchUsage,
    FREE_EVAL_LIMIT,
    FREE_CHAT_LIMIT,
  };
}
