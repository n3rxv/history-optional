import { pyqs, type PYQ } from '@/lib/pyqData';

/**
 * The five questions shown by the daily answer-writing panel.
 *
 * This used to run in the browser, which meant components/DailyAnswerWriting
 * imported lib/pyqData — 403KB of question bank, roughly a quarter of the
 * homepage's JavaScript — to pick five items from it. The selection is
 * deterministic on the date, so the server can do it and send five questions
 * instead of sixteen hundred.
 *
 * Moving it also settled a question the client version answered inconsistently:
 * "today" was the visitor's local date, so two people practising at the same
 * moment in different timezones got different questions. It is now Asia/Kolkata
 * for everyone, which is the exam's timezone and makes the set genuinely shared.
 */

/** Fields the panel actually renders. Keeps the payload to what is used. */
export type DailyQuestion = Pick<PYQ, 'id' | 'question' | 'section' | 'marks' | 'year'>;

/** Current date in Asia/Kolkata, as the seed components. */
function istDateParts(now: Date): { y: number; m: number; d: number } {
  // en-CA renders as YYYY-MM-DD, which splits cleanly.
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(now)
    .split('-')
    .map(Number);
  return { y, m, d };
}

/**
 * Same five questions for a given day, everywhere.
 *
 * The pool pattern — Paper I, Paper II, Paper I, Paper II, then either —
 * matches what the client version did, so the mix of papers is unchanged.
 */
export function getDailyQuestions(now: Date = new Date()): DailyQuestion[] {
  const { y, m, d } = istDateParts(now);
  let s = y * 10000 + m * 100 + d;

  // Linear congruential generator, as before: cheap and reproducible.
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };

  const p1 = pyqs.filter((q) => q.section.includes('Ancient') || q.section.includes('Medieval'));
  const p2 = pyqs.filter((q) => q.section.includes('Modern') || q.section.includes('World'));

  const picked: DailyQuestion[] = [];
  const used = new Set<number>();
  const pools = [p1, p2, p1, p2, p1.concat(p2)];

  for (let i = 0; i < 5; i++) {
    const pool = pools[i].filter((q) => !used.has(q.id));
    if (!pool.length) continue;
    const chosen = pool[Math.floor(rand() * pool.length)];
    used.add(chosen.id);
    picked.push({
      id: chosen.id,
      question: chosen.question,
      section: chosen.section,
      marks: chosen.marks,
      year: chosen.year,
    });
  }

  return picked;
}
