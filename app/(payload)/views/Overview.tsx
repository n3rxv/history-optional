import React from 'react';
import { allNotes } from '@/lib/notes';
import { Shell, Stats, Empty } from './Shell';
import { readTable, since } from './data';

type Override = { slug: string; content: string | null; updated_at: string };
type Stamped = { created_at?: string | null };

const SECTIONS = ['Ancient India', 'Medieval India', 'Modern India', 'World History'];

/**
 * Content and activity at a glance, from admin records rather than page
 * traffic. Every bar is labelled with the figure it represents and every
 * scale comes from the data.
 */
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
        { label: 'syllabus topics', value: allNotes.length },
        { label: 'edited in cms', value: edited.size },
        { label: 'evaluations', value: evals.error ? '—' : evals.rows.length },
        { label: 'eval last 24h', value: evals.error ? '—' : since(evals.rows, 86_400_000) },
        { label: 'submissions', value: subs.error ? '—' : subs.rows.length },
        { label: 'topper questions', value: copies.error ? '—' : copies.rows.length },
      ]} />

      <div className="ops-cards">
        <div className="ops-card">
          <h2>Topics edited, by section</h2>
          <div className="ops-bars">
            {bySection.map(s => (
              <div className="ops-bar" key={s.sec}>
                <span>{s.sec}</span>
                <span className="ops-bar-track">
                  <span className="ops-bar-fill" style={{ width: `${(s.edited / s.total) * 100}%` }} />
                </span>
                <span className="ops-bar-value">{s.edited}/{s.total}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ops-card">
          <h2>Content size, by section</h2>
          <div className="ops-bars">
            {bySection.map(s => (
              <div className="ops-bar" key={s.sec}>
                <span>{s.sec}</span>
                <span className="ops-bar-track">
                  <span className="ops-bar-fill" style={{ width: `${(s.chars / maxChars) * 100}%` }} />
                </span>
                <span className="ops-bar-value">{Math.round(s.chars / 1000)}k</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {overrides.rows.length === 0 ? <Empty>No CMS edits recorded yet.</Empty> : null}
    </Shell>
  );
}
