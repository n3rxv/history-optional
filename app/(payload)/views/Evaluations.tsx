import React from 'react';
import { Shell, Stats, Pill, Empty } from './Shell';
import { readTable, relative, truncate, since } from './data';

type Evaluation = {
  id?: string | number;
  created_at: string;
  email?: string | null;
  firebase_uid?: string | null;
  question?: string | null;
  duration_ms?: number | null;
  marks_awarded?: number | null;
  marks_out_of?: number | null;
  pages?: number | null;
  lang?: string | null;
  evaluation?: unknown;
};

const SLOW_MS = 8_000;

export default async function EvaluationsView() {
  const { rows, error } = await readTable<Evaluation>(
    'answer_evaluations', '*', { column: 'created_at' });

  const times = rows.map(r => r.duration_ms).filter((n): n is number => typeof n === 'number' && n > 0);
  const median = times.length ? [...times].sort((a, b) => a - b)[Math.floor(times.length / 2)] : null;

  return (
    <Shell title="Evaluations" count={`${rows.length} on record`} error={error}>
      <Stats items={[
        { label: 'total', value: rows.length },
        { label: 'last 24h', value: since(rows, 86_400_000) },
        { label: 'median time', value: median ? `${(median / 1000).toFixed(1)}s` : '—' },
        { label: 'no result', value: rows.filter(r => !r.evaluation).length },
      ]} />
      {rows.length === 0 ? <Empty /> : (
        <table className="ops-table">
          <thead><tr>
            <th>When</th><th>User</th><th>Question</th>
            <th className="ops-num">Pages</th><th className="ops-num">Marks</th>
            <th className="ops-num">Time</th><th className="ops-num">State</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? i}>
                <td className="ops-dim">{relative(r.created_at)}</td>
                <td>{r.email ?? '—'}</td>
                <td className="ops-wrap">{truncate(r.question, 90)}</td>
                <td className="ops-num">{r.pages ?? '—'}</td>
                <td className="ops-num">{r.marks_awarded != null ? `${r.marks_awarded}/${r.marks_out_of ?? '—'}` : '—'}</td>
                <td className="ops-num">{r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : '—'}</td>
                <td className="ops-num">
                  {!r.evaluation ? <Pill tone="error">no result</Pill>
                    : (r.duration_ms ?? 0) >= SLOW_MS ? <Pill tone="warning">slow</Pill>
                    : <Pill tone="success">done</Pill>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Shell>
  );
}
