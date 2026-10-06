/**
 * How much of something the reader has done, as a ring with the count beside
 * it: topics studied on the notes pages, questions attempted on the PYQ pages.
 * Styled by .sr in the design system.
 */
export default function ProgressRing({ done, total, noun, allDone }: {
  done: number;
  total: number;
  /** What is being counted, e.g. "topics studied". */
  noun: string;
  /** Said instead when every one is done, e.g. "topics studied, all of them". */
  allDone?: string;
}) {
  const pct = total ? done / total : 0;
  const R = 30, C = 2 * Math.PI * R;
  return (
    <div className="sr" role="img" aria-label={`${done} of ${total} ${noun}`}>
      <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
        <circle cx="38" cy="38" r={R} fill="none" stroke="var(--sr-track)" strokeWidth="7" />
        <circle cx="38" cy="38" r={R} fill="none" stroke="var(--success-text)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${C * pct} ${C}`} transform="rotate(-90 38 38)" style={{ transition: 'stroke-dasharray 0.4s ease' }} />
        <text x="38" y="38" textAnchor="middle" dominantBaseline="central" className="sr-pct">{Math.round(pct * 100)}%</text>
      </svg>
      <div className="sr-text">
        <strong>{done.toLocaleString('en-IN')} of {total.toLocaleString('en-IN')}</strong>
        <span>{done === total && total > 0 && allDone ? allDone : noun}</span>
      </div>
    </div>
  );
}
