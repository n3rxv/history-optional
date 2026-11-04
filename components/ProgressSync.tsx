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
 *                  Restoring the session on a page load counts as signing in,
 *                  so it pulls at most once every PULL_EVERY_MS per browser.
 *   on tab hidden  push whatever has changed since, and nothing when nothing
 *                  has. Phones hide the tab at every app switch, and each sync
 *                  is a server call against a small CPU allowance.
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
/** The last sync this browser made: whose, when, and a hash of what both sides then held. */
const SYNCED_KEY = 'ho_progress_synced';
const PULL_EVERY_MS = 10 * 60 * 1000;

type Synced = { uid: string; at: number; hash: number };

function readSynced(): Synced | null {
  try {
    const s = JSON.parse(localStorage.getItem(SYNCED_KEY) ?? 'null');
    return s && typeof s.uid === 'string' && typeof s.at === 'number' && typeof s.hash === 'number' ? s : null;
  } catch {
    return null;
  }
}

/** FNV-1a: enough to tell whether the document changed, without keeping a second copy of it. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

const localDoc = () => JSON.stringify({ syllabus: readLocal(SYLLABUS_KEY), pyq: readLocal(PYQ_KEY) });

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
    const sync = async (opts: { keepalive?: boolean; reason: 'sign-in' | 'hide' }) => {
      if (busy.current) return;
      const user = auth.currentUser;
      if (!user) return;

      const doc = localDoc();
      const last = readSynced();
      if (last?.uid === user.uid) {
        if (opts.reason === 'hide' && last.hash === hash(doc)) return;
        if (opts.reason === 'sign-in' && Date.now() - last.at < PULL_EVERY_MS) return;
      }

      busy.current = true;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-token': token },
          body: doc,
          keepalive: opts.keepalive,
        });
        if (!res.ok) return;
        const merged = await res.json();
        if (!merged?.signedIn) return;
        if (merged.syllabus) writeLocal(SYLLABUS_KEY, merged.syllabus);
        if (merged.pyq) writeLocal(PYQ_KEY, merged.pyq);
        // Both sides now hold the merge, so a hide with nothing new since has nothing to send.
        localStorage.setItem(SYNCED_KEY, JSON.stringify({ uid: user.uid, at: Date.now(), hash: hash(localDoc()) }));
      } catch {
        // Offline, or the request was cut short on unload. The local copy is
        // untouched and the next sync will carry it.
      } finally {
        busy.current = false;
      }
    };

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) void sync({ reason: 'sign-in' });
    });

    const onHide = () => {
      // `hidden` rather than beforeunload: it fires on mobile when the app is
      // backgrounded, which beforeunload does not, and keepalive lets the
      // request outlive the page.
      if (document.visibilityState === 'hidden') void sync({ keepalive: true, reason: 'hide' });
    };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      unsub();
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  return null;
}
