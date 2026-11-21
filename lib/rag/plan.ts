import topicVectors from './topicVectors.json';
import { EVENTS, TOPICS, eventsNamedIn, type Subject } from './timeline';

/**
 * Turns an exam question into a search plan without a model call.
 *
 * The answer that set this off (Cabinet Mission, 1946) went wrong because the
 * question was embedded as written: "short-term provisions" matched a 1930s
 * passage on legislatures, "Congress" matched the US Congress, and the 1942
 * Cripps offer looked like the 1946 plan. A plan says which part of the
 * syllabus and which years the question is about, so the search can be
 * restricted to them, and adds factual queries built from the curated
 * timeline's event names.
 *
 * Signals, strongest first:
 *  1. Events named in the question ("Cabinet Mission", "Cripps") via the
 *     timeline's names and aliases.
 *  2. The question's own embedding against each timeline topic's embedding
 *     (lib/rag/topicVectors.json, built by scripts/rag/build_runtime_data.py),
 *     which also works for Hindi questions.
 *  3. Years written in the question.
 *
 * When none is confident the plan carries no filter, and the search falls
 * back to relevance and the reranker alone.
 */

export type QueryPlan = {
  subjects: Subject[];
  periods: [number, number][];
  topics: string[];
  /** Factual search texts: the question with its exam directives removed, then one per topic. */
  queries: string[];
  /** Quoted statements in the question: to be examined, not assumed. */
  claims: string[];
  /** Why each topic was chosen, for logs. */
  why: string[];
};

/** Years of padding around a period filter; ancient dates are loose, so they get more. */
export const PERIOD_PAD: Record<Subject, number> = { ancient_india: 25, medieval_india: 5, modern_india: 1, modern_world: 1 };
/** Extra padding for the one retry when a strict search finds too little. */
export const RELAX_PAD: Record<Subject, number> = { ancient_india: 100, medieval_india: 20, modern_india: 5, modern_world: 5 };

// Calibrated on the PYQ bank (scripts/rag/calibrate_plan.ts): a topic this
// close to the question's embedding is about the same thing.
const TOPIC_SIM_STRONG = 0.62;
/** Topics within this distance of the best match come along with it. */
const TOPIC_SIM_BAND = 0.04;
const MAX_TOPICS = 3;

type Quantised = { scale: number; q: string };
/** Each timeline topic's voyage-4-lite query embedding, unit length. Also a search vector for that topic. */
export const VECTORS: [string, Float32Array][] = Object.entries((topicVectors as { topics: Record<string, Quantised> }).topics)
  .map(([id, v]) => {
    const raw = Buffer.from(v.q, 'base64');
    const out = new Float32Array(raw.length);
    let norm = 0;
    for (let i = 0; i < raw.length; i++) {
      const x = (raw[i] > 127 ? raw[i] - 256 : raw[i]) * v.scale;
      out[i] = x;
      norm += x * x;
    }
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < out.length; i++) out[i] /= norm;
    return [id, out];
  });

function cosine(a: number[], b: Float32Array): number {
  let dot = 0, na = 0;
  for (let i = 0; i < b.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; }
  return dot / (Math.sqrt(na) || 1);
}

/**
 * Everyday names for big topics that no single timeline row carries ("the
 * Second World War" names a topic, not an event). Checked like event names.
 */
const TOPIC_NAMES: [RegExp, string][] = ([
  [/\b(second world war|world war (?:ii|2|two)|ww ?(?:ii|2))\b/i, 'world_war_two'],
  [/\b(first world war|great war|world war (?:i|1|one)|ww ?(?:i|1))\b/i, 'world_war_one'],
  [/\b(inter-?war|between the (?:two )?(?:world )?wars)\b/i, 'interwar_europe'],
  [/\bcold war\b/i, 'cold_war'],
  [/\bfrench revolution\b/i, 'french_revolution'],
  [/\b(russian|bolshevik|october) revolution\b/i, 'russian_revolution'],
  [/\bamerican (?:revolution|war of independence)\b/i, 'american_revolution'],
  [/\bamerican civil war\b/i, 'american_civil_war'],
  [/\bindustrial revolution\b/i, 'industrial_revolution'],
  [/\bchinese revolution\b/i, 'chinese_revolution'],
  [/\b(revolt|mutiny|uprising|rebellion) of 1857\b|\b1857 (?:revolt|mutiny|uprising)\b/i, 'revolt_1857'],
  [/\bquit india\b/i, 'quit_india'],
  [/\bnon-?cooperation\b/i, 'non_cooperation'],
  [/\bcivil disobedience\b/i, 'civil_disobedience'],
  [/\bswadeshi\b/i, 'swadeshi_movement'],
  [/\b(harappan|indus valley|indus civili[sz]ation)\b/i, 'harappan_civilisation'],
  [/\b(vedic|rig ?veda|rigvedic)\b/i, 'vedic_age'],
  [/\bmauryan?s?\b/i, 'mauryan_empire'],
  [/\bguptas?\b(?! ?period art)/i, 'gupta_empire'],
  [/\bcholas?\b/i, 'cholas'],
  [/\bdelhi sultanate\b/i, 'delhi_sultanate'],
  [/\bmarathas?\b/i, 'marathas'],
] as [RegExp, string][]).filter(([, id]) => TOPICS.has(id));

/** Topics whose years are this close are read as one stretch: a question linking them wants what lies between. */
const JOIN_GAP_YEARS = 25;

/** Exam directives and evaluative words that match unrelated passages if searched for. */
const RHETORIC = new RegExp('\\b(' + [
  'critically', 'examine', 'evaluate', 'analy[sz]e', 'assess', 'discuss', 'comment(?: upon| on)?', 'elucidate',
  'explain', 'describe', 'elaborate', 'justify', 'substantiate', 'illustrate', 'trace', 'delineate', 'enumerate',
  'highlight', 'bring out', 'account for', 'how far', 'to what extent', 'do you agree(?: with)?', 'in your opinion',
  'with suitable examples', 'give reasons', 'write (?:a )?short (?:essay|notes?) on', 'half[- ]baked', 'stratagem',
  'legalistic', 'mere(?:ly)?', 'so-called', 'marks?', 'words?',
].join('|') + ')\\b', 'gi');

export function stripRhetoric(question: string): string {
  return question
    .replace(/\(\s*\d+\s*(?:marks?|words?)\s*\)|\[\s*\d+\s*marks?\s*\]/gi, ' ')
    .replace(RHETORIC, ' ')
    .replace(/["“”‘’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Statements quoted in the question, five words or longer. */
function quotedClaims(question: string): string[] {
  const out: string[] = [];
  for (const m of question.matchAll(/["“]([^"”]{20,600})["”]/g)) {
    if (m[1].trim().split(/\s+/).length >= 5) out.push(m[1].trim());
  }
  // An unclosed quote, as in a pasted PYQ that lost its opening mark.
  if (!out.length) {
    const m = question.match(/^(.{20,600}?)["”]\s*(?:critically|examine|comment|discuss|evaluate|analy[sz]e|elucidate|do you agree)/i);
    if (m && m[1].trim().split(/\s+/).length >= 5) out.push(m[1].replace(/^["“]/, '').trim());
  }
  return out;
}

/** Years written in the question: "1946", "321 BCE", "c. 1200 BC". */
function yearsIn(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(/\b(\d{3,4})\s*(BCE|BC|CE|AD)?\b/gi)) {
    const y = Number(m[1]);
    const bce = /^b/i.test(m[2] ?? '');
    if (!m[2] && (y < 500 || y > 2030)) continue;   // bare numbers: only plausible years
    out.push(bce ? -y : y);
  }
  return out;
}

function mergeRanges(ranges: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (const [lo, hi] of [...ranges].sort((a, b) => a[0] - b[0])) {
    const last = out[out.length - 1];
    if (last && lo <= last[1] + 1) last[1] = Math.max(last[1], hi);
    else out.push([lo, hi]);
  }
  return out;
}

/** Joins ranges at most JOIN_GAP_YEARS apart (Versailles 1919 and the Second World War 1939 become 1912–1945). */
function joinNear(ranges: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (const r of ranges) {
    const last = out[out.length - 1];
    if (last && r[0] - last[1] <= JOIN_GAP_YEARS) last[1] = Math.max(last[1], r[1]);
    else out.push([r[0], r[1]]);
  }
  return out;
}

function topicQuery(id: string): string {
  const rows = EVENTS.filter((e) => e.topic === id).slice(0, 6).map((e) => e.name);
  return `${id.replace(/_/g, ' ')}: ${rows.join('; ')}`;
}

/**
 * @param question     the student's question as written
 * @param questionVec  its voyage-4-lite query embedding (already computed for the search)
 */
export function planQuery(question: string, questionVec: number[] | null): QueryPlan {
  const why: string[] = [];
  const chosen = new Map<string, number>();   // topic -> strength

  for (const e of eventsNamedIn(question)) {
    if (!chosen.has(e.topic)) { chosen.set(e.topic, 1); why.push(`${e.topic}: names "${e.name}"`); }
  }
  for (const [re, id] of TOPIC_NAMES) {
    const m = question.match(re);
    if (m && !chosen.has(id)) { chosen.set(id, 1); why.push(`${id}: names "${m[0]}"`); }
  }

  if (questionVec) {
    const sims = VECTORS.map(([id, v]) => [id, cosine(questionVec, v)] as const).sort((a, b) => b[1] - a[1]);
    const best = sims[0]?.[1] ?? 0;
    if (best >= TOPIC_SIM_STRONG) {
      for (const [id, s] of sims) {
        if (s < best - TOPIC_SIM_BAND || chosen.size >= MAX_TOPICS) break;
        if (!chosen.has(id)) { chosen.set(id, s); why.push(`${id}: embedding ${s.toFixed(2)}`); }
      }
    }
  }

  const topics = [...chosen.keys()].slice(0, MAX_TOPICS);
  const subjects = new Set<Subject>();
  const ranges: [number, number][] = [];
  for (const id of topics) {
    const t = TOPICS.get(id)!;
    t.subjects.forEach((s) => subjects.add(s));
    ranges.push([t.y0 - t.maxTolerance, t.y1 + t.maxTolerance]);
  }
  for (const y of yearsIn(question)) ranges.push([y, y]);

  // Years with no topic say nothing about the syllabus part; infer it from the year.
  if (!subjects.size && ranges.length) {
    for (const [lo] of ranges) subjects.add(lo < 750 ? 'ancient_india' : lo < 1750 ? 'medieval_india' : 'modern_india');
    // A post-1750 year is as likely world history as Indian.
    if ([...subjects].includes('modern_india')) subjects.add('modern_world');
  }

  const cleaned = stripRhetoric(question);
  return {
    subjects: [...subjects],
    periods: joinNear(mergeRanges(ranges)),
    topics,
    queries: [cleaned || question, ...topics.map(topicQuery)],
    claims: quotedClaims(question),
    why,
  };
}

/** The plan's period ranges, padded for the subjects in play (and once more when relaxing). */
export function paddedPeriods(plan: QueryPlan, relax = false): [number, number][] {
  if (!plan.periods.length) return [];
  const subs = plan.subjects.length ? plan.subjects : (['modern_india'] as Subject[]);
  const pad = Math.max(...subs.map((s) => PERIOD_PAD[s] + (relax ? RELAX_PAD[s] : 0)));
  return mergeRanges(plan.periods.map(([lo, hi]) => [lo - pad, hi + pad]));
}
