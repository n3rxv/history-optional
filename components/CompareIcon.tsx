/** Two opposed arrows: the mark for comparing topper copies side by side. */
export default function CompareIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M2.5 5h10M9.5 2l3 3-3 3M13.5 11h-10M6.5 8l-3 3 3 3"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
