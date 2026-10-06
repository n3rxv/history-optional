import PrelimsLanding, { type PrelimsTopic } from '@/components/prelims/PrelimsLanding';
import { prelimsQuestions } from '@/lib/prelimsData';

/**
 * The Prelims front page. The topic list and its counts are worked out here,
 * on the server, so the page does not carry the 830-question bank; the
 * practice page loads it.
 */
export default function PrelimsPage() {
  const byTopic = new Map<string, PrelimsTopic>();
  for (const q of prelimsQuestions) {
    // The day a topic first comes up places it in its period; its past
    // questions are tagged with assorted days.
    const t = byTopic.get(q.topic) ?? { name: q.topic, total: 0, pyq: 0, day: q.day };
    t.total += 1;
    if (q.type === 'pyq') t.pyq += 1;
    byTopic.set(q.topic, t);
  }
  // In the order the course first takes them up, which runs by period.
  const topics = [...byTopic.values()];
  const years = prelimsQuestions.map((q) => q.year).filter((y): y is number => y !== null);
  return (
    <PrelimsLanding
      topics={topics}
      first={Math.min(...years)}
    />
  );
}
