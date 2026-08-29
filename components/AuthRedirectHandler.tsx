'use client';
import { useEffect } from 'react';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * A redirect sign-in lands back on whichever page started it, so the pending
 * result has to be consumed globally rather than in any one modal — the modal
 * that opened the flow no longer exists by the time we get back.
 * Mounted once in the root layout.
 */
export default function AuthRedirectHandler() {
  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      console.error('Redirect sign-in failed:', err);
    });
  }, []);

  return null;
}
