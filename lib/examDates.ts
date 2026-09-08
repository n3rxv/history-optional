/**
 * The exam dates the site counts down to.
 *
 * This was hardcoded twice with two different values: the navbar counted to
 * 2026-08-21 and the subscription gate to 2027-08-20. The first has now passed,
 * so that counter reads zero. Both read from here instead.
 *
 * Update NEXT_MAINS when UPSC announces the next calendar.
 */

/** UPSC History Optional is written in the Mains. */
export const NEXT_MAINS = '2027-08-20';

/** Whole days from now until the exam. Never negative. */
export function daysToMains(from: Date = new Date()): number {
  const diff = Math.ceil(
    (new Date(NEXT_MAINS).getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff > 0 ? diff : 0;
}
