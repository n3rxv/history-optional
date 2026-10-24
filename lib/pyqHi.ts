'use client';

import { useEffect, useState } from 'react';

/**
 * The question bank in Hindi, fetched the first time a PYQ page is shown in
 * Hindi mode and kept for the rest of the visit. English pages never ask.
 */

export type PyqHi = {
  q: Record<string, string>;
  official: number[];
  topics: Record<string, string>;
  subtopics: Record<string, string>;
  syllabus: Record<string, string>;
};

let pending: Promise<PyqHi | null> | null = null;

export function loadPyqHi(): Promise<PyqHi | null> {
  if (!pending) {
    pending = fetch('/api/pyq-hi')
      .then((r) => (r.ok ? (r.json() as Promise<PyqHi>) : null))
      .catch(() => null)
      .then((d) => {
        if (!d) pending = null;   // a failed load is tried again next time
        return d;
      });
  }
  return pending;
}

/** The Hindi bank while Hindi mode is on and it has loaded, else null. */
export function usePyqHi(on: boolean): PyqHi | null {
  const [data, setData] = useState<PyqHi | null>(null);
  useEffect(() => {
    if (!on) return;
    let live = true;
    loadPyqHi().then((d) => { if (live) setData(d); });
    return () => { live = false; };
  }, [on]);
  return on ? data : null;
}

/** "05. Mughal Empire" without its number, in Hindi when there is Hindi. */
export function topicLabel(topic: string, hi: PyqHi | null): string {
  return (hi?.topics[topic] ?? topic).replace(/^\d+\.\s*/, '');
}
