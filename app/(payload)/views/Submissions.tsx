import React from 'react';
import { Shell, Stats, Pill, Empty } from './Shell';
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

const TONE: Record<string, 'error' | 'warning' | undefined> = {
  bug: 'error', issue: 'error', suggestion: 'warning',
};

export default async function SubmissionsView() {
  const { rows, error } = await readTable<Submission>(
    'contact_submissions', '*', { column: 'created_at' });

  return (
    <Shell title="Submissions" count={`${rows.length} on record`} error={error}>
      <Stats items={[
        { label: 'total', value: rows.length },
        { label: 'last 24h', value: since(rows, 86_400_000) },
        { label: 'with a page', value: rows.filter(r => r.page).length },
      ]} />
      {rows.length === 0 ? <Empty /> : (
        <table className="ops-table">
          <thead><tr><th>When</th><th>Type</th><th>From</th><th>Page</th><th>Message</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? i}>
                <td className="ops-dim">{relative(r.created_at)}</td>
                <td>{r.type ? <Pill tone={TONE[r.type.toLowerCase()]}>{r.type}</Pill> : '—'}</td>
                <td className="ops-dim">{r.name || r.email || '—'}</td>
                <td className="ops-dim">{r.page ?? '—'}</td>
                <td className="ops-wrap">{truncate(r.message, 160)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Shell>
  );
}
