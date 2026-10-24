'use client';
import { useAttemptedPyqs } from '@/hooks/useAttemptedPyqs';
import ProgressRing from '@/components/ProgressRing';
import { useLang } from '@/lib/i18n/LangContext';

/** How many of the given questions the reader has marked attempted, as a ring. */
export default function AttemptedRing({ ids }: { ids: number[] }) {
  const { attempted, ready } = useAttemptedPyqs();
  const { langHi } = useLang();
  const done = ready ? ids.filter((id) => attempted[id] !== undefined).length : 0;
  return langHi
    ? <ProgressRing done={done} total={ids.length} of="/" noun="प्रश्न हल किए" allDone="सभी प्रश्न हल किए" />
    : <ProgressRing done={done} total={ids.length} noun="questions attempted" allDone="questions attempted, every one" />;
}
