import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * Real evaluations the homepage may show.
 *
 * Only rows explicitly flagged `shareable` are returned, and the identifying
 * columns are never selected: the author's email and uid do not leave the
 * database. What ships is the question, their answer, the marks and the
 * feedback, under whatever label was set by hand.
 *
 * Nothing is shareable by default. An evaluation belongs to the person who
 * wrote it, and the Privacy Policy says their data runs the platform rather
 * than advertising it.
 */
export const revalidate = 300;

type Section = { marks?: number; marks_out_of?: number; strengths?: string[]; weaknesses?: string[] };

export async function GET() {
  const { data, error } = await createServerClient()
    .from('answer_evaluations')
    .select('id, question, answer_text, marks_awarded, marks_out_of, evaluation, share_label, created_at')
    .eq('shareable', true)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) return NextResponse.json({ samples: [] }, { status: 200 });

  const samples = (data ?? []).map(r => {
    const ev = (r.evaluation ?? {}) as Record<string, unknown> & {
      section_marks?: Record<string, number>;
      overall_feedback?: string;
      introduction?: Section; body?: Section; conclusion?: Section;
    };
    const pick = (s?: Section) => ({
      strengths: (s?.strengths ?? []).slice(0, 2),
      weaknesses: (s?.weaknesses ?? []).slice(0, 2),
    });
    return {
      id: r.id,
      label: r.share_label ?? 'A reader',
      question: r.question,
      answer: r.answer_text,
      marks: r.marks_awarded,
      outOf: r.marks_out_of,
      sectionMarks: ev.section_marks ?? null,
      overall: typeof ev.overall_feedback === 'string' ? ev.overall_feedback : null,
      introduction: pick(ev.introduction),
      body: pick(ev.body),
      conclusion: pick(ev.conclusion),
    };
  });

  return NextResponse.json({ samples });
}
