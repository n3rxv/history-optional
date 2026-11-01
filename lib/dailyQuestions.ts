import { pyqs, type PYQ } from '@/lib/pyqData';
import { istDay } from '@/lib/istDay';

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

/**
 * Same five questions for a given day, everywhere.
 *
 * The pool pattern — Paper I, Paper II, Paper I, Paper II, then either —
 * matches what the client version did, so the mix of papers is unchanged.
 */
export function getDailyQuestions(now: Date = new Date()): DailyQuestion[] {
  const rand = seeded(istDay(now));

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

/**
 * A random sequence fixed by a string: FNV-1a to hash it, mulberry32 to draw.
 * It was a plain LCG seeded with the date as a number, and consecutive dates
 * are consecutive numbers, so its first draws barely moved from day to day:
 * the first question (the dashboard's question for today) came back two or
 * three days running, and the fourth stepped through the list in order.
 */
function seeded(key: string): () => number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The set for a YYYY-MM-DD day in Asia/Kolkata, or null for a malformed day. */
export function dailyQuestionsFor(day: string): DailyQuestion[] | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const noon = new Date(`${day}T12:00:00+05:30`);
  return Number.isNaN(noon.getTime()) || istDay(noon) !== day ? null : getDailyQuestions(noon);
}
