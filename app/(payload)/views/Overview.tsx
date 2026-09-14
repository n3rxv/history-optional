import React from 'react';
import { allNotes } from '@/lib/notes';
import { Shell, Stats } from './Shell';
import { readTable, since } from './data';

type Override = { slug: string; content: string | null; updated_at: string };
type Stamped = { created_at?: string | null };

const SECTIONS = ['Ancient India', 'Medieval India', 'Modern India', 'World History'];

function Bars({ title, rows }: {
  title: string;
  rows: { label: string; value: number; max: number; caption: string }[];
}) {
  return (
    <div className="rounded-xl border border-secondary bg-primary p-4">
      <h2 className="text-xs font-medium uppercase tracking-wide text-tertiary">{title}</h2>
      <div className="mt-4 flex flex-col gap-3">
        {rows.map(r => (
          <div key={r.label} className="grid grid-cols-1 gap-1 sm:grid-cols-[9rem_1fr_3.5rem] sm:items-center sm:gap-3">
            <span className="text-sm text-secondary">{r.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-secondary">
              <span
                className="block h-full rounded-full bg-brand-solid"
                style={{ width: `${Math.min(100, (r.value / Math.max(1, r.max)) * 100)}%` }}
              />
            </span>
            <span className="text-sm tabular-nums text-tertiary sm:text-right">{r.caption}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Content and activity from admin records, not page traffic. */
export default async function OverviewView() {
  const [overrides, evals, subs, copies] = await Promise.all([
    readTable<Override>('note_overrides', 'slug, content, updated_at', { column: 'updated_at' }),
    readTable<Stamped>('answer_evaluations', 'created_at', { column: 'created_at' }),
    readTable<Stamped>('contact_submissions', 'created_at', { column: 'created_at' }),
    readTable<{ id: string }>('topper_copies', 'id', undefined, 1000),
  ]);

  const edited = new Set(overrides.rows.map(o => o.slug));
  const bySection = SECTIONS.map(sec => {
    const items = allNotes.filter(n => n.section === sec);
    return {
      sec,
      total: items.length,
      edited: items.filter(n => edited.has(n.slug)).length,
      chars: items.reduce((sum, n) =>
        sum + (overrides.rows.find(o => o.slug === n.slug)?.content?.length ?? 0), 0),
    };
  });
  const maxChars = Math.max(1, ...bySection.map(s => s.chars));

  return (
    <Shell title="Overview" count="from admin records, not page traffic" error={overrides.error}>
      <Stats items={[
        { label: 'Syllabus topics', value: allNotes.length },
        { label: 'Edited in CMS', value: edited.size },
        { label: 'Evaluations', value: evals.error ? '—' : evals.rows.length },
        { label: 'Eval last 24h', value: evals.error ? '—' : since(evals.rows, 86_400_000) },
        { label: 'Submissions', value: subs.error ? '—' : subs.rows.length },
        { label: 'Topper questions', value: copies.error ? '—' : copies.rows.length },
      ]} />

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Bars
          title="Topics edited, by section"
          rows={bySection.map(s => ({
            label: s.sec, value: s.edited, max: s.total, caption: `${s.edited}/${s.total}`,
          }))}
        />
        <Bars
          title="Content size, by section"
          rows={bySection.map(s => ({
            label: s.sec, value: s.chars, max: maxChars, caption: `${Math.round(s.chars / 1000)}k`,
          }))}
        />
      </div>
    </Shell>
  );
}
