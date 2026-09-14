'use client';
import React from 'react';

/**
 * Stat tiles that are also the filter. Counts always come from the full set, so
 * a tile reports how many rows it would select rather than shrinking to the
 * current selection; otherwise every tile but the active one reads zero.
 *
 * Real buttons with aria-pressed, so this works by keyboard and is announced
 * as a toggle rather than as decoration.
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
    <div className="ops-stats">
      {facets.map(f => {
        const on = f.id === active;
        return (
          <button
            key={f.id}
            type="button"
            className="ops-stat"
            aria-pressed={on}
            onClick={() => onChange(f.id)}
          >
            <span>
              {f.label}
              <span className="ops-stat-hint">{on ? 'showing' : f.hint}</span>
            </span>
            <strong>{rows.filter(f.test).length}</strong>
          </button>
        );
      })}
    </div>
  );
}
