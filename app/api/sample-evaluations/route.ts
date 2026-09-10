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

type Section = {
  analysis?: string; strengths?: string[]; weaknesses?: string[]; suggestions?: string[];
};

export async function GET() {
  const { data, error } = await createServerClient()
    .from('answer_evaluations')
    .select('id, question, answer_text, marks_awarded, marks_out_of, evaluation, share_label, created_at')
    .eq('shareable', true)
    .order('share_label', { ascending: true })
    .limit(6);

  if (error) return NextResponse.json({ samples: [] }, { status: 200 });

  const samples = (data ?? []).map(r => {
    const ev = (r.evaluation ?? {}) as Record<string, unknown> & {
      section_marks?: Record<string, { awarded?: number; out_of?: number; reasoning?: string }>;
      overall_feedback?: string;
      demand_of_question?: string[];
      historians_to_cite?: Array<{ name?: string; argument?: string }>;
      model_answer?: { introduction?: string; body?: string[]; conclusion?: string };
      introduction?: Section; body?: Section; conclusion?: Section;
    };
    const pick = (s?: Section) => ({
      analysis: typeof s?.analysis === 'string' ? s.analysis : null,
      strengths: s?.strengths ?? [],
      weaknesses: s?.weaknesses ?? [],
      suggestions: s?.suggestions ?? [],
    });
    return {
      id: r.id,
      label: r.share_label ?? 'A reader',
      question: r.question,
      answer: r.answer_text,
      marks: r.marks_awarded,
      outOf: r.marks_out_of,
      sectionMarks: ev.section_marks ?? null,
      demand: Array.isArray(ev.demand_of_question) ? ev.demand_of_question : [],
      historians: Array.isArray(ev.historians_to_cite) ? ev.historians_to_cite : [],
      modelAnswer: ev.model_answer ?? null,
      overall: typeof ev.overall_feedback === 'string' ? ev.overall_feedback : null,
      introduction: pick(ev.introduction),
      body: pick(ev.body),
      conclusion: pick(ev.conclusion),
    };
  });

  return NextResponse.json({ samples });
}
