'use client';

import { useEffect, useState } from 'react';

/**
 * Each topper copy's own question in Hindi (lib/topperQuestionsHi.ts, keyed by
 * questionKey). About 200 KB, so it is fetched only once a reader is in Hindi
 * mode, and kept for the visit. Copies that answer a PYQ word for word are not
 * in it: they show the PYQ's official Hindi instead.
 */
type QuestionsHi = Record<string, string>;
let pending: Promise<QuestionsHi> | null = null;

export function useTopperQuestionsHi(on: boolean): QuestionsHi | null {
  const [data, setData] = useState<QuestionsHi | null>(null);
  useEffect(() => {
    if (!on) return;
    let live = true;
    pending ??= import('@/lib/topperQuestionsHi').then((m) => m.TOPPER_QUESTION_HI);
    pending.then((d) => { if (live) setData(d); }, () => { pending = null; });
    return () => { live = false; };
  }, [on]);
  return on ? data : null;
}
