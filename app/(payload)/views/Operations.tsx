import React from 'react';
import { Shell } from './Shell';
import { ExportButtons } from './ExportButtons';

/**
 * Backups. Exports are built client-side from a live fetch so a backup is
 * always of what is actually stored, never of a cached copy.
 */
export default async function OperationsView() {
  return (
    <Shell title="Operations">
      <div className="ops-card">
        <h2>Backups</h2>
        <ExportButtons />
      </div>
    </Shell>
  );
}
