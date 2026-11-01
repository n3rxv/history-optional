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
/**
 * Sessions are measured from these beats (supabase/real_sessions.sql): a tab
 * left open in the background used to beat every 5 minutes for days. Now the
 * timer only beats while the page is visible and the reader has scrolled,
 * tapped or typed since the last beat; hiding the tab still sends one, which
 * marks where the session ended.
 */
let lastInput = Date.now();
const INPUT_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'] as const;

/**
 * A first visit is recorded only once the visitor has stayed: after
 * FIRST_VISIT_AFTER_MS, on moving to another page, or on leaving after at
 * least MIN_DWELL_SECS. It used to be written the moment the page loaded,
 * so everyone who bounced straight off left a row with a 0-second session.
 * The time already spent travels with the ping, so the row starts with it.
 */
const FIRST_VISIT_AFTER_MS = 10 * 1000;
const MIN_DWELL_SECS = 1;
// A new key, so visitors counted under the old rule go through the new one once.
const COUNTED_KEY = 'ho_visit_counted';
const pageLoadedAt = typeof performance !== 'undefined' ? Date.now() - performance.now() : Date.now();

/**
 * Local dev writes to the production database, and an automated browser
 * (puppeteer, Playwright: navigator.webdriver is set) gets a fresh
 * fingerprint on every launch, so each test run left a new visitor row.
 * Neither is a reader.
 */
function shouldTrack(): boolean {
  if (navigator.webdriver) return false;
  return !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
}

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

function post(body: Record<string, unknown>, keepalive: boolean) {
  void fetch('/api/track-visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive,
  }).catch(() => {});
}

export default function VisitorTracker() {
  const pathname = usePathname();
  // Reported once per visitor, not once per route change.
  const firstVisitReported = useRef(false);
  // The first visit, held back until the visitor has stayed. Calling it sends
  // it if they have been here long enough.
  const pendingFirst = useRef<((keepalive: boolean) => void) | null>(null);

  useEffect(() => {
    if (!shouldTrack()) return;
    let cancelled = false;
    (async () => {
      try {
        const { visitor_id, old_fp } = await getVisitorId();
        if (cancelled) return;

        const { device, os, browser } = getDeviceInfo();
        const firebase_uid = await getFirebaseUid();
        if (cancelled) return;

        const body = {
          visitor_id,
          // Only worth sending while the old id is still around.
          ...(old_fp && !firstVisitReported.current ? { old_fp } : {}),
          page: pathname,
          device, os, browser,
          firebase_uid,
        };

        // Moving to another page means the visitor stayed, so a first visit
        // still held back for the page they came from is recorded now.
        pendingFirst.current?.(false);

        if (!localStorage.getItem(COUNTED_KEY)) {
          pendingFirst.current = (keepalive: boolean) => {
            const dwell = Math.floor((Date.now() - pageLoadedAt) / 1000);
            if (dwell < MIN_DWELL_SECS) return;
            pendingFirst.current = null;
            localStorage.setItem(COUNTED_KEY, '1');
            firstVisitReported.current = true;
            post({ ...body, referrer: document.referrer || 'direct', first: true, dwell }, keepalive);
          };
          // Resolving the visitor id can take a while on a first visit; if the
          // wait has already passed, there is no reason to hold on.
          if (Date.now() - pageLoadedAt >= FIRST_VISIT_AFTER_MS) pendingFirst.current(false);
          return;
        }

        post(body, false);
        firstVisitReported.current = true;
      } catch {
        // Analytics must never surface to the reader.
      }
    })();
    return () => { cancelled = true; };
  }, [pathname]);

  // What releases a held-back first visit: staying FIRST_VISIT_AFTER_MS, or
  // leaving the page (the tab is hidden, or the page is unloaded).
  useEffect(() => {
    if (!shouldTrack()) return;
    const timer = setTimeout(() => pendingFirst.current?.(false), Math.max(0, FIRST_VISIT_AFTER_MS - (Date.now() - pageLoadedAt)));
    const onHide = () => { if (document.visibilityState === 'hidden') pendingFirst.current?.(true); };
    const onPageHide = () => pendingFirst.current?.(true);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  useEffect(() => {
    if (!shouldTrack()) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    let onVisibility: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { visitor_id } = await getVisitorId();
        if (cancelled) return;

        // keepalive, so the beat sent as the tab closes still arrives.
        const beat = () => {
          void fetch('/api/track-visit', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitor_id }),
            keepalive: true,
          }).catch(() => {});
        };

        // No beat on mount: the pageview POST already sets last_active
        // (record_visit). And none on beforeunload: closing a tab hides it
        // first, so that listener only ever sent a second, duplicate beat.
        interval = setInterval(() => {
          if (document.visibilityState === 'visible' && Date.now() - lastInput < HEARTBEAT_MS) beat();
        }, HEARTBEAT_MS);
        onVisibility = () => { if (document.visibilityState === 'hidden') beat(); };
        document.addEventListener('visibilitychange', onVisibility);
      } catch {
        // As above.
      }
    })();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Notes when the reader last did something, for the heartbeat above.
  useEffect(() => {
    if (!shouldTrack()) return;
    const onInput = () => { lastInput = Date.now(); };
    for (const e of INPUT_EVENTS) window.addEventListener(e, onInput, { passive: true });
    return () => { for (const e of INPUT_EVENTS) window.removeEventListener(e, onInput); };
  }, []);

  return null;
}
