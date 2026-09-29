'use client';
import Mascot from '@/components/Mascot';

/**
 * Shown when a flashcard session has been worked all the way through, which
 * is an achievement; stopping part-way keeps the plain one-line note. The
 * count of cards known is the reader's own grades of Good or Easy, and the
 * "come back sooner" line is what spaced repetition actually does with the
 * others.
 */
export default function SessionComplete({
  reviewed, recalled, dueLeft, langHi, onNext, onDone,
}: {
  reviewed: number;
  recalled: number;
  dueLeft: number;
  langHi: boolean;
  onNext: () => void;
  onDone: () => void;
}) {
  const missed = reviewed - recalled;
  return (
    <div className="sc" role="status">
      <style>{SC_CSS}</style>
      <Mascot pose="celebrate" width={128} className="sc-owl" />
      <div className="sc-body">
        <div className="sc-title">{langHi ? 'सत्र पूरा!' : 'Session complete!'}</div>
        <p>
          {langHi
            ? `आपने सभी ${reviewed} कार्ड दोहराए और ${recalled} याद थे।`
            : `You went through all ${reviewed} card${reviewed === 1 ? '' : 's'} and knew ${recalled} of them.`}
          {missed > 0 && (langHi
            ? ` बाकी ${missed} जल्दी फिर सामने आएँगे।`
            : ` The other ${missed} will come round again sooner.`)}
        </p>
        <div className="sc-actions">
          {dueLeft > 0 && (
            <button className="sc-next" onClick={onNext}>
              {langHi ? `अगले ${dueLeft} शुरू करें` : `Start the next ${dueLeft} due`}
            </button>
          )}
          <button className="sc-done" onClick={onDone}>{langHi ? 'हो गया' : 'Done for now'}</button>
        </div>
      </div>
    </div>
  );
}

const SC_CSS = `
.sc {
  display: flex; align-items: center; gap: var(--space-6);
  padding: var(--space-5) var(--space-6); margin-bottom: var(--space-6);
  background: color-mix(in srgb, var(--accent) 5%, var(--bg2));
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent); border-radius: var(--radius-xl);
  font-family: var(--font-body);
}
.sc-owl { height: auto; flex-shrink: 0; }
.sc-title { font-size: 1.25rem; font-weight: 700; color: var(--text); margin-bottom: var(--space-1); }
.sc p { margin: 0; font-size: 0.92rem; line-height: 1.6; color: var(--text2); }
.sc-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-4); }
.sc-next, .sc-done {
  padding: var(--space-2) var(--space-4); border-radius: var(--radius-md);
  font-family: var(--font-body); font-size: 0.88rem; cursor: pointer;
}
.sc-next { background: var(--accent); color: var(--accent-on); border: 1px solid var(--accent); font-weight: 600; }
.sc-next:hover { background: color-mix(in srgb, var(--accent) 88%, var(--text)); }
.sc-done { background: none; color: var(--text2); border: 1px solid var(--border2); }
.sc-done:hover { color: var(--text); border-color: var(--border3); }
@media (max-width: 560px) {
  .sc { flex-direction: column; text-align: center; padding: var(--space-5) var(--space-4); gap: var(--space-3); }
  .sc-actions { justify-content: center; }
}
`;
