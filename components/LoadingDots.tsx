/**
 * A loading label whose trailing dots animate one after another.
 *
 * The dots are decorative and marked aria-hidden; the label carries the
 * meaning, and the container is a live region so a screen reader announces
 * the wait once rather than on every frame. The keyframes live in globals.css
 * so ten of these on a page still define the animation once.
 */
export default function LoadingDots({
  label,
  style,
}: {
  label: string;
  style?: React.CSSProperties;
}) {
  return (
    <div role="status" aria-live="polite" style={style}>
      {label}
      <span className="loading-dots" aria-hidden="true">
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </span>
    </div>
  );
}
