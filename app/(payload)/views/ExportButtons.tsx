'use client';
import React, { useState } from 'react';
import { Button } from '../uui/base/button';

const EXPORTS = [
  { id: 'notes', label: 'Notes',
    desc: 'Every note in the CMS, with its section, paper and both language bodies.',
    url: '/cms-api/notes?limit=1000&depth=0' },
  { id: 'articles', label: 'Articles',
    desc: 'All articles and current affairs, published and draft.',
    url: '/cms-api/articles?limit=1000&depth=0' },
  { id: 'announcements', label: 'Announcements',
    desc: 'Everything currently shown to readers as a notification.',
    url: '/cms-api/announcements?limit=1000&depth=0' },
] as const;

/** Exports are built from a live fetch, so a backup is of what is stored now. */
export function ExportButtons() {
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const stamp = new Date().toISOString().slice(0, 10);

  const run = async (id: string, url: string) => {
    setBusy(id);
    setProblem(null);
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(String(res.status));
      const blob = new Blob([JSON.stringify(await res.json(), null, 2)], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${id}-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(href);
    } catch (e) {
      setProblem(`${id} export failed: ${e instanceof Error ? e.message : 'unknown'}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {problem ? (
        <div className="mb-3 rounded-lg border border-error_subtle bg-error-primary px-3 py-2 text-sm text-error-primary">
          {problem}
        </div>
      ) : null}
      {EXPORTS.map(x => (
        <div
          key={x.id}
          className="flex flex-col gap-3 border-b border-secondary py-3 last:border-0 sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-primary">{x.label}</div>
            <div className="mt-0.5 text-sm text-tertiary">{x.desc}</div>
          </div>
          <Button
            color="secondary"
            size="md"
            isDisabled={busy === x.id}
            onClick={() => run(x.id, x.url)}
          >
            {busy === x.id ? 'Exporting…' : 'Export'}
          </Button>
        </div>
      ))}
    </>
  );
}
