'use client';
import { useAttemptedPyqs } from '@/hooks/useAttemptedPyqs';

/** The attempted tick on a question card, for pages the server draws. */
export default function AttemptTick({ id }: { id: number }) {
  const { isAttempted, toggle, ready } = useAttemptedPyqs();
  const done = ready && isAttempted(id);
  return (
    <button type="button" className={`pq-tick${done ? ' on' : ''}`} onClick={() => toggle(id)} aria-pressed={done}
      title={done ? 'Attempted. Tap to untick' : 'Mark as attempted'}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {done ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <circle cx="12" cy="12" r="8" />}
      </svg>
      {done ? 'Attempted' : 'Mark attempted'}
    </button>
  );
}
