import { cache } from 'react';
import { createServerClient } from '@/lib/supabase';

/**
 * A shared answer check, as the public card shows it: the question, the
 * marks, the marks for each part and a few lines of feedback. Never the
 * answer, the email or the uid, which are not even selected.
 */
export type SharedCheck = {
  question: string;
  marks: number;
  outOf: number;
  lang: 'en' | 'hi';
  date: string;
  sections: { key: 'introduction' | 'body' | 'conclusion' | 'presentation'; awarded: number; outOf: number }[];
  worked: string[];
  improve: string[];
};

const SECTION_KEYS = ['introduction', 'body', 'conclusion', 'presentation'] as const;
const ID_RE = /^[A-Za-z0-9_-]{11}$/;

type Part = { strengths?: unknown; weaknesses?: unknown; suggestions?: unknown };

const lines = (v: unknown): string[] =>
  (Array.isArray(v) ? v : typeof v === 'string' ? [v] : [])
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((x) => (x.length > 240 ? x.slice(0, 237).trimEnd() + '…' : x.trim()));

/** The first lines across the parts, body first since it carries most marks. */
const firstLines = (parts: (Part | undefined)[], key: keyof Part, n: number) =>
  parts.flatMap((p) => lines(p?.[key])).slice(0, n);

export const loadSharedCheck = cache(async (shareId: string): Promise<SharedCheck | null> => {
  if (!ID_RE.test(shareId)) return null;
  const { data } = await createServerClient()
    .from('answer_evaluations')
    .select('question, marks_awarded, marks_out_of, evaluation, lang, shared_at')
    .eq('share_id', shareId)
    .maybeSingle();
  if (!data) return null;

  const ev = (data.evaluation ?? {}) as {
    marks?: number; marks_out_of?: number;
    section_marks?: Record<string, { awarded?: number; out_of?: number }>;
    introduction?: Part; body?: Part; conclusion?: Part;
  };
  const parts = [ev.body, ev.introduction, ev.conclusion];
  const improve = firstLines(parts, 'suggestions', 2);
  return {
    question: data.question ?? '',
    marks: Number(data.marks_awarded ?? ev.marks ?? 0),
    outOf: Number(ev.marks_out_of ?? data.marks_out_of ?? 0),
    lang: data.lang === 'hi' ? 'hi' : 'en',
    date: data.shared_at ?? new Date().toISOString(),
    sections: SECTION_KEYS.flatMap((key) => {
      const s = ev.section_marks?.[key];
      return s && typeof s.awarded === 'number' && typeof s.out_of === 'number'
        ? [{ key, awarded: s.awarded, outOf: s.out_of }] : [];
    }),
    worked: firstLines(parts, 'strengths', 2),
    improve: improve.length ? improve : firstLines(parts, 'weaknesses', 2),
  };
});
