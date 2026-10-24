'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useLang } from '@/lib/i18n/LangContext';
import { usePyqHi, topicLabel } from '@/lib/pyqHi';

/**
 * Small pieces for the server-drawn PYQ pages: the server sends the English,
 * which is what search engines read, and in Hindi mode each piece swaps to
 * its Hindi once the Hindi bank has loaded.
 */

/** The page's own words: English or Hindi, given both. */
export function HiText({ en, hi }: { en: ReactNode; hi: ReactNode }) {
  const { langHi } = useLang();
  return <>{langHi ? hi : en}</>;
}

/** A question's text. */
export function PyqQ({ id, en }: { id: number; en: string }) {
  const { langHi } = useLang();
  const hi = usePyqHi(langHi)?.q[id];
  return hi ? <span lang="hi">{hi}</span> : <>{en}</>;
}

/** A book topic's name, without its number. */
export function PyqTopic({ topic }: { topic: string }) {
  const { langHi } = useLang();
  return <>{topicLabel(topic, usePyqHi(langHi))}</>;
}

/** A sub-topic heading. */
export function PyqSub({ sub }: { sub: string }) {
  const { langHi } = useLang();
  return <>{usePyqHi(langHi)?.subtopics[sub] ?? sub}</>;
}

/** The syllabus items a topic serves, without the paper. */
export function PyqSyllabus({ items }: { items: string[] }) {
  const { langHi } = useLang();
  const hi = usePyqHi(langHi);
  return <>{langHi ? 'पाठ्यक्रम' : 'Syllabus'}: {items.map((s) => (hi?.syllabus[s] ?? s).replace(/^(Paper|प्रश्नपत्र) I+, /, '')).join(langHi ? ', ' : '; ')}</>;
}

/** "Write an answer", taking the question in the language it is shown in. */
export function PyqWriteLink({ id, en, marks, children }: { id: number; en: string; marks: number; children?: ReactNode }) {
  const { langHi } = useLang();
  const text = usePyqHi(langHi)?.q[id] ?? en;
  return (
    <Link className="pq-write" href={`/evaluate?question=${encodeURIComponent(text)}&marks=${marks}`}>
      {langHi ? 'उत्तर लिखें' : 'Write an answer'} {children}
    </Link>
  );
}
