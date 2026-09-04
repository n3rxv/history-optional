'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Reports pageviews to /api/track-visit.
 *
 * Rendered from the root layout, so everything here runs on every page. Three
 * things it previously got wrong:
 *
 *  - Two separate effects each called getVisitorId(), so a visitor with no
 *    cached id loaded FingerprintJS twice on first visit.
 *  - The heartbeat effect added visibilitychange and beforeunload listeners
 *    but its cleanup only cleared the interval, leaking both on unmount.
 *  - getFirebaseUid used require('firebase/auth') inside a client component,
 *    which happens to work under webpack and breaks under other bundlers.
 */

const HEARTBEAT_MS = 5 * 60 * 1000;

let visitorIdPromise: Promise<{ visitor_id: string; old_fp: string | null }> | null = null;

/** Memoised so concurrent callers share one FingerprintJS load. */
function getVisitorId(): Promise<{ visitor_id: string; old_fp: string | null }> {
  visitorIdPromise ??= (async () => {
    const fromLS = localStorage.getItem('fp');
    const fromCookie = document.cookie.match(/fp=([^;]+)/)?.[1] ?? null;
    const cached = fromLS || fromCookie;

    if (cached) {
      localStorage.setItem('fp', cached);
      document.cookie = `fp=${cached};max-age=315360000;path=/`;
      return { visitor_id: cached, old_fp: null };
    }

    // Only sent once, to fold a pre-FingerprintJS id into the new one.
    const old_fp = localStorage.getItem('ho_visitor_id');
    const FP = await (await import('@fingerprintjs/fingerprintjs')).default.load();
    const { visitorId } = await FP.get();
    localStorage.setItem('fp', visitorId);
    document.cookie = `fp=${visitorId};max-age=315360000;path=/`;
    return { visitor_id: visitorId, old_fp };
  })();
  return visitorIdPromise;
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let device = 'desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) device = 'tablet';
  else if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) device = 'mobile';

  let os = 'unknown';
  if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac/i.test(ua)) os = 'Mac';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'unknown';
  if ((navigator as { brave?: unknown }).brave) browser = 'Brave';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';

  return { device, os, browser };
}

async function getFirebaseUid(): Promise<string | null> {
  try {
    const [{ auth }, { onAuthStateChanged }] = await Promise.all([
      import('@/lib/firebase'),
      import('firebase/auth'),
    ]);
    // Read through a function: after an early `return auth.currentUser.uid`,
    // TypeScript narrows the field to never for the rest of the body and
    // cannot see that awaiting may populate it.
    const currentUid = () => auth.currentUser?.uid ?? null;

    const known = currentUid();
    if (known) return known;

    // Auth restores asynchronously on load; give it a moment, but never hold
    // the pageview ping open for longer than that.
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 2000);
      const unsub = onAuthStateChanged(auth, () => {
        clearTimeout(timer);
        unsub();
        resolve();
      });
    });
    return currentUid();
  } catch {
    return null;
  }
}

export default function VisitorTracker() {
  const pathname = usePathname();
  // Reported once per visitor, not once per route change.
  const firstVisitReported = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { visitor_id, old_fp } = await getVisitorId();
        if (cancelled) return;

        const isFirstVisit = !localStorage.getItem('ho_visited');
        if (isFirstVisit) localStorage.setItem('ho_visited', '1');

        const { device, os, browser } = getDeviceInfo();
        const firebase_uid = await getFirebaseUid();
        if (cancelled) return;

        void fetch('/api/track-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitor_id,
            // Only worth sending while the old id is still around.
            ...(old_fp && !firstVisitReported.current ? { old_fp } : {}),
            page: pathname,
            referrer: isFirstVisit ? document.referrer || 'direct' : undefined,
            device, os, browser,
            firebase_uid,
          }),
        }).catch(() => {});
        firstVisitReported.current = true;
      } catch {
        // Analytics must never surface to the reader.
      }
    })();
    return () => { cancelled = true; };
  }, [pathname]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    let onVisibility: (() => void) | undefined;
    let onUnload: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { visitor_id } = await getVisitorId();
        if (cancelled) return;

        const beat = () => {
          void fetch('/api/track-visit', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitor_id }),
          }).catch(() => {});
        };

        beat();
        interval = setInterval(beat, HEARTBEAT_MS);
        // Only on the way out or back — firing on every visibility change sent
        // a request each time the reader switched tabs.
        onVisibility = () => { if (document.visibilityState === 'hidden') beat(); };
        onUnload = beat;
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('beforeunload', onUnload);
      } catch {
        // As above.
      }
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
      if (onUnload) window.removeEventListener('beforeunload', onUnload);
    };
  }, []);

  return null;
}
