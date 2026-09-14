import React from 'react';
import { Shell } from './Shell';
import { ExportButtons } from './ExportButtons';

export default async function OperationsView() {
  return (
    <Shell title="Operations">
      <div className="rounded-xl border border-secondary bg-primary p-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-tertiary">Backups</h2>
        <div className="mt-2">
          <ExportButtons />
        </div>
      </div>
    </Shell>
  );
}
