'use client';
import { useAttemptedPyqs } from '@/hooks/useAttemptedPyqs';
import { useLang } from '@/lib/i18n/LangContext';

/** The attempted tick on a question card, for pages the server draws. */
export default function AttemptTick({ id }: { id: number }) {
  const { isAttempted, toggle, ready } = useAttemptedPyqs();
  const done = ready && isAttempted(id);
  const { langHi } = useLang();
  const L = (en: string, hi: string) => (langHi ? hi : en);
  return (
    <button type="button" className={`pq-tick${done ? ' on' : ''}`} onClick={() => toggle(id)} aria-pressed={done}
      title={done ? L('Attempted. Tap to untick', 'हल किया। हटाने के लिए टैप करें') : L('Mark as attempted', 'हल किया चिह्नित करें')}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {done ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <circle cx="12" cy="12" r="8" />}
      </svg>
      {done ? L('Attempted', 'हल किया') : L('Mark attempted', 'हल किया चिह्नित करें')}
    </button>
  );
}
