'use client';
import React from 'react';

/**
 * Stat tiles that are also the filter. Counts come from the full set, so a tile
 * reports how many rows it would select rather than shrinking to the current
 * selection; otherwise every tile but the active one reads zero.
 *
 * Real buttons with aria-pressed, so this is reachable by keyboard and
 * announced as a toggle rather than as decoration.
 */
export type Facet<T> = {
  id: string;
  label: string;
  hint: string;
  test: (row: T) => boolean;
};

export function Facets<T>({ facets, rows, active, onChange }: {
  facets: Facet<T>[];
  rows: T[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {facets.map(f => {
        const on = f.id === active;
        return (
          <button
            key={f.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(f.id)}
            className={[
              'rounded-xl border px-4 py-3 text-left transition',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              on
                ? 'border-brand-600 bg-brand-primary shadow-sm'
                : 'border-secondary bg-primary hover:border-primary hover:bg-secondary',
            ].join(' ')}
          >
            <div className="text-xs font-medium uppercase tracking-wide text-tertiary">{f.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums text-primary">
              {rows.filter(f.test).length}
            </div>
            <div className={`mt-0.5 text-xs ${on ? 'text-brand-secondary' : 'text-quaternary'}`}>
              {on ? 'Showing' : f.hint}
            </div>
          </button>
        );
      })}
    </div>
  );
}
