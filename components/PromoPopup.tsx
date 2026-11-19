'use client';
import { useEffect } from 'react';
import { SHOWN_KEY as REVIEW_SHOWN } from '@/components/ReviewPrompt';

const SESSION_KEY = 'promo_popup_shown';
const AFTER_MS = 5 * 60 * 1000;

/**
 * Once a session, five minutes in, the Go Premium panel: the navbar's own,
 * which decides whether to show it (not to subscribers, not over another
 * dialog). This used to be a 750-line popup of its own in the old design,
 * and it read /api/usage on every visit to learn who had subscribed; the
 * navbar already knows. A session where the review prompt has opened gets no
 * second pop-up.
 */
export default function PromoPopup() {
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');
    const timer = window.setTimeout(() => {
      if (sessionStorage.getItem(REVIEW_SHOWN)) return;
      window.dispatchEvent(new Event('promo-premium'));
    }, AFTER_MS);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
