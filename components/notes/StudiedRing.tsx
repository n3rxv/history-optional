'use client';
import { useSyllabusTracker } from '@/hooks/useSyllabusTracker';
import ProgressRing from '@/components/ProgressRing';

/**
 * How many of a page's topics the reader has ticked as studied, as a ring.
 * It reads the same ticks as the cards below it and moves as they change.
 * The server draws it empty; the count arrives once the ticks are read.
 */
export default function StudiedRing({ slugs }: { slugs: string[] }) {
  const { countCompleted, mounted } = useSyllabusTracker();
  return <ProgressRing done={mounted ? countCompleted(slugs) : 0} total={slugs.length} noun="topics studied" allDone="topics studied, all of them" />;
}
