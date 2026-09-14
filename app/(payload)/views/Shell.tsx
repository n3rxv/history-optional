import React from 'react';
import { Gutter } from '@payloadcms/ui';
import './ops.css';

/** The frame every operational view shares, so they sit flush with Payload's own screens. */
export function Shell({ title, count, error, children }: {
  title: string;
  count?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <Gutter>
      <div className="ops-head">
        <h1>{title}</h1>
        {count !== undefined && !error ? <span className="ops-count">{count}</span> : null}
      </div>
      {error ? <div className="ops-error">Could not load: {error}</div> : children}
    </Gutter>
  );
}

export function Stats({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <div className="ops-stats">
      {items.map(i => (
        <div className="ops-stat" key={i.label}>
          <span>{i.label}</span><strong>{i.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function Pill({ tone, children }: { tone?: 'success' | 'error' | 'warning'; children: React.ReactNode }) {
  return <span className="ops-pill" data-tone={tone}>{children}</span>;
}

export function Empty({ children = 'Nothing here yet.' }: { children?: React.ReactNode }) {
  return <p className="ops-empty">{children}</p>;
}
