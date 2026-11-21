import data from './timeline.json';

/**
 * The curated timeline of key events (446 rows, 131 topics) across Ancient,
 * Medieval and Modern India and the Modern World.
 *
 * It does three jobs at chat time: it tells the search which years and syllabus
 * part a question is about, it gives the answering model dates to use instead
 * of its memory, and it checks the dates in the finished answer.
 *
 * The source is scripts/rag/history_rag/history_rag/data/timeline.csv. Edit
 * that file, then run `python3 scripts/rag/build_runtime_data.py` to rewrite
 * timeline.json and the topic vectors. A row's `verified` column holds the
 * initials of whoever checked it against a textbook. It is empty until then,
 * and the date check only reports against unverified rows as warnings.
 */

export type Subject = 'ancient_india' | 'medieval_india' | 'modern_india' | 'modern_world';

export type TimelineEvent = {
  id: string;
  topic: string;
  subjects: Subject[];
  name: string;
  aliases: string[];
  y0: number;
  y1: number;
  /** [year, month | null, day | null]; years BCE are negative. */
  start: [number, number | null, number | null];
  end: [number, number | null, number | null] | null;
  precision: 'day' | 'month' | 'year' | 'circa' | 'contested';
  tolerance: number;
  summary: string;
  note: string;
  verified: string;
  display: string;
};

export type TimelineTopic = {
  id: string;
  y0: number;
  y1: number;
  subjects: Subject[];
  maxTolerance: number;
  names: string[];
};

export const EVENTS = data.events as TimelineEvent[];
export const TOPICS = new Map((data.topics as TimelineTopic[]).map((t) => [t.id, t]));

export const SUBJECT_LABEL: Record<Subject, string> = {
  ancient_india: 'Ancient India',
  medieval_india: 'Medieval India',
  modern_india: 'Modern India',
  modern_world: 'Modern World',
};

/** One line for the answering model: date, event, and what happened. */
export function groundingLine(e: TimelineEvent): string {
  return [`${e.display} — ${e.name}.`, e.summary, e.note ? `(Note: ${e.note})` : ''].filter(Boolean).join(' ');
}

/**
 * Rows to show the answering model: the plan's topics first, then other rows
 * inside its periods and subjects, in date order within each group.
 */
export function eventsFor(topics: string[], periods: [number, number][], subjects: Subject[], limit = 24): TimelineEvent[] {
  const wanted = new Set(topics);
  const picked = EVENTS.filter((e) => wanted.has(e.topic));
  if (periods.length) {
    for (const e of EVENTS) {
      if (wanted.has(e.topic)) continue;
      if (subjects.length && !e.subjects.some((s) => subjects.includes(s))) continue;
      if (periods.some(([lo, hi]) => e.y0 <= hi && e.y1 >= lo)) picked.push(e);
    }
  }
  const key = (e: TimelineEvent) => e.start[0] * 10000 + (e.start[1] ?? 1) * 100 + (e.start[2] ?? 1);
  picked.sort((a, b) => Number(!wanted.has(a.topic)) - Number(!wanted.has(b.topic)) || key(a) - key(b));
  return picked.slice(0, limit);
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Every event name and alias of five or more characters, lower-cased, with the events it names. */
const ALIASES: { re: RegExp; ids: string[] }[] = (() => {
  const m = new Map<string, Set<string>>();
  for (const e of EVENTS) {
    for (const a of [e.name, ...e.aliases]) {
      const k = a.toLowerCase().trim();
      if (k.length < 5) continue;
      if (!m.has(k)) m.set(k, new Set());
      m.get(k)!.add(e.id);
    }
  }
  return [...m].map(([k, ids]) => ({ re: new RegExp(`\\b${escape(k)}\\b`, 'i'), ids: [...ids] }));
})();

/** Events whose name or alias appears in the text. */
export function eventsNamedIn(text: string): TimelineEvent[] {
  const ids = new Set<string>();
  for (const a of ALIASES) if (a.re.test(text)) a.ids.forEach((id) => ids.add(id));
  return EVENTS.filter((e) => ids.has(e.id));
}

/** Events named in the text with no other event sharing the alias: safe to check a date against. */
export function uniqueEventsNamedIn(text: string): TimelineEvent[] {
  const ids = new Set<string>();
  for (const a of ALIASES) if (a.ids.length === 1 && a.re.test(text)) ids.add(a.ids[0]);
  return EVENTS.filter((e) => ids.has(e.id));
}
