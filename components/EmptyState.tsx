import type { ReactNode } from 'react';
import Mascot, { type MascotPose } from '@/components/Mascot';

/**
 * The owl for a place with nothing in it yet: no results, no history, a
 * filter that matched nothing. It says what is empty, why, and what to do
 * next, so an empty panel reads as a starting point rather than a fault.
 *
 * size "sm" is for narrow places (a sidebar, a modal list); "md" for the
 * main column.
 */
export default function EmptyState({
  title,
  children,
  action,
  size = 'md',
  pose = 'peek',
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  size?: 'sm' | 'md';
  pose?: MascotPose;
}) {
  return (
    <div className={`es es-${size}`}>
      <style>{ES_CSS}</style>
      <Mascot pose={pose} width={size === 'sm' ? 64 : 96} className="es-owl" />
      <div className="es-title">{title}</div>
      {children && <div className="es-text">{children}</div>}
      {action && <div className="es-action">{action}</div>}
    </div>
  );
}

const ES_CSS = `
.es { display: flex; flex-direction: column; align-items: center; text-align: center; }
.es-md { padding: var(--space-10) var(--space-4); }
.es-sm { padding: var(--space-6) var(--space-3); }
.es-owl { height: auto; margin-bottom: var(--space-3); }
.es-title { font-family: var(--font-body); font-weight: 700; color: var(--text); }
.es-md .es-title { font-size: 1.05rem; }
.es-sm .es-title { font-size: 0.9rem; }
.es-text { color: var(--text2); line-height: 1.6; margin-top: var(--space-1); max-width: 380px; }
.es-md .es-text { font-size: 0.9rem; }
.es-sm .es-text { font-size: 0.8rem; }
.es-action { margin-top: var(--space-4); display: flex; gap: var(--space-2); flex-wrap: wrap; justify-content: center; }
.es-action a, .es-action button {
  display: inline-flex; align-items: center; gap: var(--space-1);
  padding: var(--space-2) var(--space-4); border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
  background: var(--accent-dim); color: var(--accent-text);
  font-family: var(--font-body); font-size: 0.85rem; text-decoration: none; cursor: pointer;
}
.es-action a:hover, .es-action button:hover { border-color: var(--accent); }
`;
