import React from 'react';
import { Shell, Stats, TableFrame, Row, Cell } from './Shell';
import { Badge } from '../uui/base/badges';
import { readTable, relative, truncate, since } from './data';

type Evaluation = {
  id?: string | number;
  created_at: string;
  email?: string | null;
  question?: string | null;
  duration_ms?: number | null;
  marks_awarded?: number | null;
  marks_out_of?: number | null;
  pages?: number | null;
  evaluation?: unknown;
};

/** Anything at or past this took long enough to be worth noticing. */
const SLOW_MS = 8_000;

export default async function EvaluationsView() {
  const { rows, error } = await readTable<Evaluation>(
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
        {rows.map((r, i) => (
          <Row key={r.id ?? i}>
            <Cell dim>{relative(r.created_at)}</Cell>
            <Cell strong>{r.email ?? '—'}</Cell>
            <Cell wrap>{truncate(r.question, 90)}</Cell>
            <Cell align="right" mono dim>{r.pages ?? '—'}</Cell>
            <Cell align="right" mono>
              {r.marks_awarded != null ? `${r.marks_awarded}/${r.marks_out_of ?? '—'}` : '—'}
            </Cell>
            <Cell align="right" mono dim>
              {r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : '—'}
            </Cell>
            <Cell align="right">
              {!r.evaluation
                ? <Badge type="pill-color" size="sm" color="error">No result</Badge>
                : (r.duration_ms ?? 0) >= SLOW_MS
                  ? <Badge type="pill-color" size="sm" color="warning">Slow</Badge>
                  : <Badge type="pill-color" size="sm" color="success">Done</Badge>}
            </Cell>
          </Row>
        ))}
      </TableFrame>
    </Shell>
  );
}
