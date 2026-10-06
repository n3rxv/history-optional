'use client';
import { useAttemptedPyqs } from '@/hooks/useAttemptedPyqs';
import ProgressRing from '@/components/ProgressRing';

/** How many of the given questions the reader has marked attempted, as a ring. */
export default function AttemptedRing({ ids }: { ids: number[] }) {
  const { attempted, ready } = useAttemptedPyqs();
  const done = ready ? ids.filter((id) => attempted[id] !== undefined).length : 0;
  return <ProgressRing done={done} total={ids.length} noun="questions attempted" allDone="questions attempted, every one" />;
}
