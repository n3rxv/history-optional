import React from 'react';
import { Shell, Stats, TableFrame, Row, Cell } from './Shell';
import { Badge } from '../uui/base/badges';
import { readTable, relative, truncate, since } from './data';

type Submission = {
  id?: string | number;
  created_at: string;
  name?: string | null;
  email?: string | null;
  message?: string | null;
  type?: string | null;
  page?: string | null;
};

const TONE: Record<string, 'error' | 'warning' | 'blue'> = {
  bug: 'error', issue: 'error', suggestion: 'warning', feedback: 'blue',
};

export default async function SubmissionsView() {
  const { rows, error } = await readTable<Submission>(
    'contact_submissions', '*', { column: 'created_at' });

  return (
    <Shell title="Submissions" count={`${rows.length} on record`} error={error}>
      <Stats items={[
        { label: 'Total', value: rows.length },
        { label: 'Last 24h', value: since(rows, 86_400_000) },
        { label: 'With a page', value: rows.filter(r => r.page).length },
      ]} />

      <TableFrame
        min={760}
        empty={rows.length === 0}
        head={[{ label: 'When' }, { label: 'Type' }, { label: 'From' }, { label: 'Page' }, { label: 'Message' }]}
      >
        {rows.map((r, i) => (
          <Row key={r.id ?? i}>
            <Cell dim>{relative(r.created_at)}</Cell>
            <Cell>
              {r.type
                ? <Badge type="pill-color" size="sm" color={TONE[r.type.toLowerCase()] ?? 'gray'}>{r.type}</Badge>
                : <span className="text-tertiary">—</span>}
            </Cell>
            <Cell strong>{r.name || r.email || '—'}</Cell>
            <Cell dim>{r.page ?? '—'}</Cell>
            <Cell wrap>{truncate(r.message, 160)}</Cell>
          </Row>
        ))}
      </TableFrame>
    </Shell>
  );
}
