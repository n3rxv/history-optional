'use client';
import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'ho_pyq_attempted_v1';

/**
 * Which PYQs the reader has marked as attempted.
 *
 * Stored per browser, like the rest of the progress in this app (syllabus
 * tracking, flashcards, answer history). That means it does not follow anyone
 * to another device and is lost if they clear the browser — a known limitation
 * recorded in docs/SCALING-OVERHAUL.md rather than a surprise.
 *
 * Ids, not question text: text gets corrected (55 questions were repaired in
 * the topic pass alone) and a reader's ticks must survive that.
 *
 * Marks are dated so "what did I do this week" stays answerable later without
 * a migration.
 */
export type AttemptedMap = Record<number, string>;   // id -> ISO date marked

function load(): AttemptedMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // An earlier shape, or a hand-edited value, must not break the page.
    if (Array.isArray(parsed)) {
      return Object.fromEntries(parsed.map((id: number) => [id, '']));
    }
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function save(data: AttemptedMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Private mode, or the quota is full. Losing a tick is not worth an error.
  }
}

/**
 * Kept in a module-level set of listeners so a tick on the list page and the
 * same question's detail page agree without a reload. `storage` events only
 * fire in *other* tabs, so they cannot do this on their own.
 */
const listeners = new Set<(m: AttemptedMap) => void>();
function broadcast(m: AttemptedMap) {
  for (const fn of listeners) fn(m);
}

export function useAttemptedPyqs() {
  const [attempted, setAttempted] = useState<AttemptedMap>({});
  const [ready, setReady] = useState(false);

  // Read after mount: localStorage does not exist during prerender, and
  // reading in useState would make the server and client markup disagree.
  useEffect(() => {
    setAttempted(load());
    setReady(true);
    const fn = (m: AttemptedMap) => setAttempted(m);
    listeners.add(fn);

    // Another tab of the same site.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setAttempted(load());
    };
    window.addEventListener('storage', onStorage);
    return () => { listeners.delete(fn); window.removeEventListener('storage', onStorage); };
  }, []);

  const toggle = useCallback((id: number) => {
    setAttempted(prev => {
      const next = { ...prev };
      if (next[id] !== undefined) delete next[id];
      else next[id] = new Date().toISOString();
      save(next);
      broadcast(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    save({});
    broadcast({});
    setAttempted({});
  }, []);

  return {
    attempted,
    /** False until the first read, so nothing renders a wrong state briefly. */
    ready,
    isAttempted: (id: number) => attempted[id] !== undefined,
    count: Object.keys(attempted).length,
    toggle,
    clearAll,
  };
}
