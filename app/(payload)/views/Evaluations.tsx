import React from 'react';
import { Shell, Stats, TableFrame } from './Shell';
import { readTable, since } from './data';
import EvaluationRows, { type EvaluationRow } from './EvaluationRows';

export default async function EvaluationsView() {
  const { rows, error } = await readTable<EvaluationRow>(
    'answer_evaluations', '*', { column: 'created_at' });

  const times = rows.map(r => r.duration_ms).filter((n): n is number => typeof n === 'number' && n > 0);
  const median = times.length ? [...times].sort((a, b) => a - b)[Math.floor(times.length / 2)] : null;

  return (
    <Shell title="Evaluations" count={`${rows.length} on record`} error={error}>
      <Stats items={[
        { label: 'Total', value: rows.length },
        { label: 'Last 24h', value: since(rows, 86_400_000) },
        { label: 'Median time', value: median ? `${(median / 1000).toFixed(1)}s` : '—' },
        { label: 'No result', value: rows.filter(r => !r.evaluation).length },
      ]} />

      <TableFrame
        min={820}
        empty={rows.length === 0}
        head={[
          { label: 'When' }, { label: 'User' }, { label: 'Question' },
          { label: 'Pages', align: 'right' }, { label: 'Marks', align: 'right' },
          { label: 'Time', align: 'right' }, { label: 'State', align: 'right' },
        ]}
      >
        <EvaluationRows rows={rows} />
      </TableFrame>
    </Shell>
  );
}
