/**
 * Merging two copies of a reader's study progress.
 *
 * Kept apart from the route so the rules can be reasoned about -- and tested --
 * without a database or a request. See supabase/study_progress.sql for why the
 * merge unions rather than replaces, and for the un-ticking limitation that
 * choice carries.
 */

export type SyllabusDoc = {
  completed: Record<string, boolean>;
  completionDates?: Record<string, string>;
};

/** id -> ISO date the question was marked attempted. */
export type PyqDoc = Record<string, string>;

/** Anything stored under an unrecognised shape is treated as absent. */
function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/** The earlier of two ISO dates, tolerating a missing or malformed one. */
function earliest(a: string | undefined, b: string | undefined): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a <= b ? a : b;
}

export function mergeSyllabus(a: unknown, b: unknown): SyllabusDoc {
  const ao = asObject(a);
  const bo = asObject(b);
  const aCompleted = asObject(ao.completed);
  const bCompleted = asObject(bo.completed);
  const aDates = asObject(ao.completionDates);
  const bDates = asObject(bo.completionDates);

  const completed: Record<string, boolean> = {};
  const completionDates: Record<string, string> = {};

  for (const slug of new Set([...Object.keys(aCompleted), ...Object.keys(bCompleted)])) {
    // The store writes `true` and deletes the key rather than writing `false`,
    // but a hand-edited or older value could hold false, and that must not
    // count as completion.
    if (aCompleted[slug] !== true && bCompleted[slug] !== true) continue;
    completed[slug] = true;
    // When a topic was first finished, which is what the dashboard's "not
    // revised in 30+ days" prompt measures from.
    const d = earliest(
      typeof aDates[slug] === 'string' ? (aDates[slug] as string) : undefined,
      typeof bDates[slug] === 'string' ? (bDates[slug] as string) : undefined,
    );
    if (d) completionDates[slug] = d;
  }

  return { completed, completionDates };
}

export function mergePyq(a: unknown, b: unknown): PyqDoc {
  // The hook accepts an older array-of-ids shape as well as the current map,
  // so both have to be understood here or a long-standing reader syncs as
  // empty and their ticks are lost on the round trip.
  const normalise = (v: unknown): PyqDoc => {
    if (Array.isArray(v)) {
      return Object.fromEntries(
        v.filter((x) => typeof x === 'number' || typeof x === 'string').map((x) => [String(x), '']),
      );
    }
    const o = asObject(v);
    const out: PyqDoc = {};
    for (const [k, date] of Object.entries(o)) {
      if (!Number.isFinite(Number(k))) continue;
      out[k] = typeof date === 'string' ? date : '';
    }
    return out;
  };

  const ao = normalise(a);
  const bo = normalise(b);
  const out: PyqDoc = {};
  for (const id of new Set([...Object.keys(ao), ...Object.keys(bo)])) {
    out[id] = earliest(ao[id] || undefined, bo[id] || undefined) ?? '';
  }
  return out;
}
