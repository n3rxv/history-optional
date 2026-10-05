'use client';
import { useSyllabusTracker } from '@/hooks/useSyllabusTracker';

/**
 * How many of a page's topics the reader has ticked as studied, as a ring.
 * It reads the same ticks as the cards below it and moves as they change.
 * The server draws it empty; the count arrives once the ticks are read.
 */
export default function StudiedRing({ slugs }: { slugs: string[] }) {
  const { countCompleted, mounted } = useSyllabusTracker();
  const done = mounted ? countCompleted(slugs) : 0;
  const total = slugs.length;
  const pct = total ? done / total : 0;
  const R = 30, C = 2 * Math.PI * R;
  return (
    <div className="sr" role="img" aria-label={`${done} of ${total} topics studied`}>
      <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
        <circle cx="38" cy="38" r={R} fill="none" stroke="var(--sr-track)" strokeWidth="7" />
        <circle cx="38" cy="38" r={R} fill="none" stroke="var(--success-text)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${C * pct} ${C}`} transform="rotate(-90 38 38)" style={{ transition: 'stroke-dasharray 0.4s ease' }} />
        <text x="38" y="38" textAnchor="middle" dominantBaseline="central" className="sr-pct">{Math.round(pct * 100)}%</text>
      </svg>
      <div className="sr-text">
        <strong>{done} of {total}</strong>
        <span>{done === total && total > 0 ? 'topics studied, all of them' : 'topics studied'}</span>
      </div>
    </div>
  );
}
