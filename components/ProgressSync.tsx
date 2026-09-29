'use client';
import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * Keeps a reader's syllabus ticks and PYQ attempts on the server as well as
 * in this browser, so they survive a new device or a cleared cache.
 *
 * Mounted once in the layout rather than on the dashboard: progress is made on
 * the note and PYQ pages, and syncing only where it is displayed would mean a
 * reader who never opens the dashboard is never backed up.
 *
 * Syncs at two moments, both cheap and both sufficient:
 *
 *   on sign-in     pull the server's copy, union it with this browser's, write
 *                  the result to both. This is what makes a second device show
 *                  the reader's real progress instead of an empty page.
 *   on tab hidden  push whatever has changed since.
 *
 * Deliberately not on every tick. Each sync rewrites two rows, and this
 * project runs against a disk IO budget; a reader ticking their way through a
 * paper would otherwise generate a write per checkbox. The cost of the
 * looser schedule is that work done in a tab that is killed outright syncs on
 * next load instead of immediately -- nothing is lost, because localStorage
 * still holds it.
 */

const SYLLABUS_KEY = 'ho_syllabus_v1';
const PYQ_KEY = 'ho_pyq_attempted_v1';

function readLocal(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Write the merged document back and tell the rest of the app.
 *
 * `storage` events only fire in other tabs, so the hooks holding this data in
 * this tab would otherwise keep rendering the pre-merge copy until a reload.
 * Dispatching the event by hand is what lets them pick it up; both readers
 * already listen for it.
 */
function writeLocal(key: string, value: unknown) {
  try {
    const next = JSON.stringify(value);
    if (localStorage.getItem(key) === next) return;
    localStorage.setItem(key, next);
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: next }));
  } catch {
    // Private mode or a full quota. The server copy is still correct.
  }
}

export default function ProgressSync() {
  // One sync at a time, so a hide during a sign-in sync cannot interleave and
  // send a document that is mid-merge.
  const busy = useRef(false);

  useEffect(() => {
    const sync = async (opts: { keepalive?: boolean } = {}) => {
      if (busy.current) return;
      const user = auth.currentUser;
      if (!user) return;

      busy.current = true;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-token': token },
          body: JSON.stringify({
            syllabus: readLocal(SYLLABUS_KEY),
            pyq: readLocal(PYQ_KEY),
          }),
          keepalive: opts.keepalive,
        });
        if (!res.ok) return;
        const merged = await res.json();
        if (!merged?.signedIn) return;
        if (merged.syllabus) writeLocal(SYLLABUS_KEY, merged.syllabus);
        if (merged.pyq) writeLocal(PYQ_KEY, merged.pyq);
      } catch {
        // Offline, or the request was cut short on unload. The local copy is
        // untouched and the next sync will carry it.
      } finally {
        busy.current = false;
      }
    };

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) void sync();
    });

    const onHide = () => {
      // `hidden` rather than beforeunload: it fires on mobile when the app is
      // backgrounded, which beforeunload does not, and keepalive lets the
      // request outlive the page.
      if (document.visibilityState === 'hidden') void sync({ keepalive: true });
    };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      unsub();
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  return null;
}
