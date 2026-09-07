'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getFingerprint } from '@/lib/fingerprint';
import { PhoneModal } from '@/components/PhoneModal';

/**
 * Asks for a phone number, at a strength that depends on who is asking.
 *
 *   Signed in  - mandatory. No cancel button, no backdrop dismiss, and it
 *                comes back on the next page load until a number is saved.
 *   Anonymous  - a soft prompt from the fifth pageview, dismissible, and once
 *                dismissed it stays away for DISMISS_DAYS.
 *
 * The split is deliberate. A hard wall on a visitor's first pageview is the
 * pattern Google treats as an intrusive interstitial, and this site's traffic
 * is mostly organic. Waiting until someone has opened several pages costs a
 * little coverage and keeps the search listing intact.
 *
 * Mounted once from the root layout, beside VisitorTracker.
 */

/**
 * Pageviews an anonymous visitor must have before being asked.
 *
 * Counted by VisitorTracker, which increments on every navigation, so this is
 * the nth page they open rather than the nth session. Someone who reads five
 * pages has shown enough intent to be worth interrupting; someone who bounces
 * off the first is not.
 */
const MIN_VISITS = 5;
/** How long a dismissal is honoured. */
const DISMISS_DAYS = 30;
/** Let the page paint and settle before anything covers it. */
const DELAY_MS = 4000;

const DISMISS_KEY = 'ho_phone_prompt_dismissed_at';

function dismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (!at) return false;
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    // Private mode throws on localStorage. Treat that as "not dismissed"
    // rather than suppressing the prompt forever.
    return false;
  }
}

export default function PhoneGate() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [mandatory, setMandatory] = useState(false);
  const pathname = usePathname();

  /**
   * Stops re-checking once the answer is settled.
   *
   * This component lives in the root layout, so it survives client-side
   * navigation. Without this it would re-query on every click for the rest of
   * the session, including for readers who already gave a number.
   */
  const settled = useRef(false);
  const [known, setKnown] = useState<{ first: string | null; last: string | null }>({ first: null, last: null });

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setAuthReady(true); }), []);

  useEffect(() => {
    if (!authReady || settled.current) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        // Signed-in and anonymous ask the same endpoint with different
        // identities; the answer decides which mode the modal opens in.
        const idToken = user ? await user.getIdToken() : null;
        // Needed even when signed in: it is how a number given while logged
        // out is found and moved onto the account.
        const fp = await getFingerprint();
        if (cancelled) return;

        if (!user && !fp) { settled.current = true; return; }   // no identity to key on
        if (!user && dismissedRecently()) { settled.current = true; return; }

        const qs = fp ? `?visitor_id=${encodeURIComponent(fp)}` : '';
        const res = await fetch(`/api/profile${qs}`, {
          headers: idToken ? { 'x-user-token': idToken } : {},
        });
        if (!res.ok || cancelled) return;

        const { phone, firstName, lastName, visits } = await res.json();
        if (phone) { settled.current = true; return; }   // already have it

        // A backfilled row has the name from Google and no number, so the
        // modal opens with the name filled and the cursor in the phone field.
        setKnown({ first: firstName ?? null, last: lastName ?? null });

        if (user) {
          settled.current = true;
          setAuthed(true);
          setVisitorId(fp);
          setMandatory(true);
          setShow(true);
          return;
        }

        // Anonymous: only once they have opened MIN_VISITS pages. visit_count
        // is incremented by VisitorTracker on every navigation, so this counts
        // clicks and fresh loads alike, across sessions.
        if ((visits ?? 0) < MIN_VISITS) return;   // deliberately not settled: check again next click
        settled.current = true;
        setVisitorId(fp);
        setMandatory(false);
        setShow(true);
      } catch {
        // A failed check must never block the page. Staying silent costs one
        // opportunity to ask; throwing here would break every route.
      }
    }, DELAY_MS);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [authReady, user, pathname]);

  if (!show) return null;

  return (
    <PhoneModal
      getToken={authed ? () => auth.currentUser?.getIdToken() ?? Promise.resolve(null) : undefined}
      visitorId={visitorId}
      initialFirstName={known.first}
      initialLastName={known.last}
      onDone={() => setShow(false)}
      onCancel={
        mandatory
          ? undefined
          : () => {
              try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
              setShow(false);
            }
      }
    />
  );
}
