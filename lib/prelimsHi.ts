'use client';

import { useEffect, useState } from 'react';

/**
 * The Prelims questions in Hindi, fetched the first time a Prelims page is
 * shown in Hindi mode and kept for the rest of the visit. English pages never
 * ask. A question without Hindi yet shows in English.
 */

export type PrelimsHi = {
  /** Question id to its Hindi: the question, and the options in the same order. */
  q: Record<string, { q: string; o: string[] }>;
  /** English topic name to Hindi. */
  topics: Record<string, string>;
};

let pending: Promise<PrelimsHi | null> | null = null;

export function loadPrelimsHi(): Promise<PrelimsHi | null> {
  if (!pending) {
    pending = fetch('/api/prelims-hi')
      .then((r) => (r.ok ? (r.json() as Promise<PrelimsHi>) : null))
      .catch(() => null)
      .then((d) => {
        if (!d) pending = null;   // a failed load is tried again next time
        return d;
      });
  }
  return pending;
}

/** The Hindi questions while Hindi mode is on and they have loaded, else null. */
export function usePrelimsHi(on: boolean): PrelimsHi | null {
  const [data, setData] = useState<PrelimsHi | null>(null);
  useEffect(() => {
    if (!on) return;
    let live = true;
    loadPrelimsHi().then((d) => { if (live) setData(d); });
    return () => { live = false; };
  }, [on]);
  return on ? data : null;
}
