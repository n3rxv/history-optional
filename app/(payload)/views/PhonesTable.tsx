'use client';
import React, { useMemo, useState } from 'react';
import { Badge } from '../uui/base/badges';
import { Button } from '../uui/base/button';
import { Input } from '../uui/base/input';

export type Profile = {
  phone: string | null;
  name: string | null;
  source: string | null;
  verified: boolean;
  signedIn: boolean;
  updated: string;
  key: string;
};

/**
 * Built from Untitled UI's own components (MIT), not from a local imitation of
 * them. Everything renders inside .uui, which is where our isolated Tailwind
 * applies: preflight is never imported, so none of this reaches Payload's own
 * screens. See views/uui.css.
 */
const FACETS = [
  { id: 'all',      label: 'Profiles',      hint: 'Show everything',  test: (_: Profile) => true },
  { id: 'number',   label: 'With a number', hint: 'Has a phone',      test: (r: Profile) => Boolean(r.phone) },
  { id: 'verified', label: 'Verified',      hint: 'Number confirmed', test: (r: Profile) => r.verified },
  { id: 'signedin', label: 'Signed in',     hint: 'Has an account',   test: (r: Profile) => r.signedIn },
];

export function PhonesTable({ rows }: { rows: Profile[] }) {
  const [facet, setFacet] = useState('all');
  const [filter, setFilter] = useState('');

  const active = FACETS.find(f => f.id === facet)!;
  const q = filter.trim().toLowerCase();

  const visible = useMemo(
    () => rows.filter(active.test).filter(r =>
      !q || [r.phone, r.name, r.source].some(v => v?.toLowerCase().includes(q))),
    [rows, active, q]);

  const csv = () => {
    const head = ['phone', 'name', 'source', 'verified', 'updated'];
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const body = visible.map(r => [r.phone, r.name, r.source, r.verified, r.updated].map(esc).join(','));
    const blob = new Blob([[head.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phones-${active.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="uui">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FACETS.map(f => {
          const on = f.id === facet;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => setFacet(f.id)}
              className={[
                'rounded-xl border px-4 py-3 text-left transition',
                'ring-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                on
                  ? 'border-brand-600 bg-brand-primary shadow-sm'
                  : 'border-secondary bg-primary hover:border-primary hover:bg-secondary',
              ].join(' ')}
            >
              <div className="text-xs font-medium text-tertiary uppercase tracking-wide">{f.label}</div>
              <div className="mt-1 text-2xl font-semibold text-primary tabular-nums">
                {rows.filter(f.test).length}
              </div>
              <div className={`mt-0.5 text-xs ${on ? 'text-brand-secondary' : 'text-quaternary'}`}>
                {on ? 'Showing' : f.hint}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full sm:w-auto sm:min-w-64 sm:flex-1">
          <Input
            aria-label="Filter profiles"
            placeholder={`Filter ${active.id === 'all' ? 'profiles' : active.label.toLowerCase()} by phone, name or source`}
            value={filter}
            onChange={setFilter}
          />
        </div>
        <Button color="secondary" size="md" onClick={csv} isDisabled={!visible.length}>
          Export {visible.length} as CSV
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-secondary">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-secondary bg-secondary">
              {['Phone', 'Name', 'Source', 'Verified', 'Updated'].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-xs font-medium text-tertiary ${i === 4 ? 'text-right' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.slice(0, 400).map(r => (
              <tr key={r.key} className="border-b border-secondary last:border-0 hover:bg-secondary">
                <td className="px-4 py-3 text-sm font-medium text-primary tabular-nums">{r.phone ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-secondary">{r.name ?? '—'}</td>
                <td className="px-4 py-3">
                  {r.source
                    ? <Badge type="pill-color" size="sm" color={r.source === 'authed' ? 'success' : 'gray'}>{r.source}</Badge>
                    : <span className="text-sm text-quaternary">—</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge type="pill-color" size="sm" color={r.verified ? 'success' : 'warning'}>
                    {r.verified ? 'Verified' : 'Unverified'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right text-sm text-tertiary tabular-nums">{r.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-tertiary">Nothing matches.</p>
        ) : null}
      </div>

      {visible.length > 400 ? (
        <p className="mt-3 text-sm text-tertiary">Showing 400 of {visible.length}.</p>
      ) : null}
    </div>
  );
}
