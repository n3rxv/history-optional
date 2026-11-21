import { EVENTS, uniqueEventsNamedIn, type TimelineEvent } from './timeline';

/**
 * Checks the dates in a finished answer against the curated timeline.
 *
 * It looks at each sentence that names exactly one timeline event (by a name
 * or alias no other event shares) and gives one date, and compares the two.
 * That misses sentences that only say "the plan" or name two events, so it
 * reports what it can prove wrong and says nothing about the rest. Mismatches
 * against a row nobody has verified yet are warnings; against a verified row,
 * errors.
 *
 * Port of check_claims/compare_claim in scripts/rag/history_rag/.../timeline.py.
 */

export type DateIssue = {
  severity: 'error' | 'warning';
  sentence: string;
  said: string;
  event: TimelineEvent;
};

const MONTHS: Record<string, number> = {};
['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
  .forEach((m, i) => { MONTHS[m] = i + 1; MONTHS[m.slice(0, 3)] = i + 1; });
MONTHS.sept = 9;
const M = '(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)\\.?';

type Said = { y: number | null; m: number | null; d: number | null; text: string };

const PATTERNS: [RegExp, ('d' | 'm' | 'y')[]][] = [
  [new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${M},?\\s+(\\d{3,4})\\b`, 'i'), ['d', 'm', 'y']],
  [new RegExp(`\\b${M}\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{3,4})\\b`, 'i'), ['m', 'd', 'y']],
  [new RegExp(`\\b${M},?\\s+(\\d{3,4})\\b`, 'i'), ['m', 'y']],
  [new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${M}\\b`, 'i'), ['d', 'm']],
  [new RegExp(`\\b${M}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'), ['m', 'd']],
];
const ERA = /\b(\d{1,4})\s*(BCE|BC|CE|AD)\b|\bAD\s+(\d{1,4})\b|\b(1\d{3}|20\d{2}|[5-9]\d{2})\b/i;

/** The first date written in the text, as far as it goes. */
export function firstDate(text: string): Said | null {
  for (const [re, order] of PATTERNS) {
    const m = text.match(re);
    if (!m) continue;
    const v: Record<string, string> = {};
    order.forEach((k, i) => { v[k] = m[i + 1]; });
    const d = v.d ? Number(v.d) : null;
    if (d !== null && (d < 1 || d > 31)) continue;
    return { y: v.y ? Number(v.y) : null, m: MONTHS[v.m.toLowerCase().replace('.', '')], d, text: m[0] };
  }
  const m = text.match(ERA);
  if (!m) return null;
  if (m[1]) return { y: /^b/i.test(m[2]) ? -Number(m[1]) : Number(m[1]), m: null, d: null, text: m[0] };
  return { y: Number(m[3] ?? m[4]), m: null, d: null, text: m[0] };
}

const key = (y: number, m: number, d: number) => y * 10000 + m * 100 + d;

/** A description of the mismatch, or null when the date fits the event. */
export function mismatch(said: Said, e: TimelineEvent): string | null {
  if (said.y === null) return null;
  if (said.y < e.y0 - e.tolerance || said.y > e.y1 + e.tolerance) return `says ${said.text}; timeline has ${e.display}`;
  if ((e.precision !== 'day' && e.precision !== 'month') || said.m === null) return null;
  const [sy, sm, sd] = e.start;
  const [ey, em, ed] = e.end ?? e.start;
  if (said.y < sy || said.y > ey) return null;   // inside the year tolerance but outside the dated span
  const lo = e.precision === 'month' ? key(sy, sm ?? 1, 1) : key(sy, sm ?? 1, sd ?? 1);
  const hi = e.precision === 'month' ? key(ey, em ?? 12, 31) : key(ey, em ?? 12, ed ?? 31);
  const cLo = key(said.y, said.m, said.d ?? 1);
  const cHi = key(said.y, said.m, said.d ?? 31);
  return cHi < lo || cLo > hi ? `says ${said.text}; timeline has ${e.display}` : null;
}

export function checkDates(answer: string): DateIssue[] {
  const issues: DateIssue[] = [];
  for (const sentence of answer.split(/(?<=[.!?;])\s+(?=[A-Z(*"“])/)) {
    const said = firstDate(sentence);
    if (!said) continue;
    const named = uniqueEventsNamedIn(sentence);
    if (named.length !== 1) continue;
    // A sentence with a day and month but no year inherits the event's year.
    const withYear = said.y === null ? { ...said, y: named[0].start[0] } : said;
    const why = mismatch(withYear, named[0]);
    // The date may belong to another event the sentence mentions without its
    // full name ("Nehru's press conference of 10 July" beside "the interim
    // government"). A day or month that is some dated event's own date is
    // treated as that event; a bare year is excused only within the topic.
    const other = (e: TimelineEvent) => e.id !== named[0].id && !mismatch(withYear, e) &&
      (withYear.m !== null ? e.precision === 'day' || e.precision === 'month' : e.topic === named[0].topic);
    if (why && EVENTS.some(other)) continue;
    if (why) issues.push({ severity: named[0].verified ? 'error' : 'warning', sentence: sentence.trim(), said: why, event: named[0] });
  }
  return issues;
}
