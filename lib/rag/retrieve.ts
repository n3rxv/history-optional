import { qdrant } from '@/lib/vectorStore';
import { planQuery, paddedPeriods, VECTORS, type QueryPlan } from './plan';
import { queryVector } from './sparse';
import { eventsFor, type Subject, type TimelineEvent } from './timeline';

/**
 * Book-passage retrieval for the chat, answer evaluation and model answers.
 *
 * What it replaced searched with the question as written, took each book's
 * best passage before any book's second, and when fewer than three passages
 * cleared its similarity floor it used all of them anyway. A Cabinet Mission
 * (1946) question got six passages of which one was about 1946: two on the
 * 1942 Cripps offer, a 1930s debate on legislatures, the US Congress under
 * Reagan, and European policy in the 1990s.
 *
 * Here, every passage of book_chunks_v2 carries its syllabus part, the years
 * it is about, timeline topics and a one-line note naming its event
 * (scripts/rag/build_collection.py). A question is planned first (plan.ts),
 * then:
 *
 *   1. each planned query runs as one hybrid search in Qdrant: the dense
 *      vector and a BM25 keyword vector, both restricted to the plan's
 *      syllabus parts, years and a minimum OCR quality, fused by rank;
 *   2. the queries' results are merged by rank;
 *   3. Voyage's reranker scores the top candidates against the question,
 *      reading each passage with its heading and note;
 *   4. passages under the relevance cut-off are dropped. Fewer than two
 *      left -> one retry with wider years, then one without the plan's
 *      filters. Never pads out with passages that failed the cut-off.
 */

const COLLECTION = process.env.RAG_COLLECTION ?? 'book_chunks_v2';
const PAYLOAD = ['text', 'book_title', 'author', 'header', 'context', 'subject', 'year_start', 'year_end', 'topics', 'tagged'];
const PER_SEARCH = 40;
const CANDIDATES = 30;
const MIN_OCR = 0.6;
/** Voyage rerank-2.5 relevance below which a passage is not evidence. Calibrated in scripts/rag/rag_eval.ts. */
const RERANK_MIN = 0.35;
const TOPIC_BOOST = 0.05;
const MIN_RESULTS = 2;

export type RagHit = {
  id: number | string;
  text: string;
  book_title: string;
  author: string;
  /** "Sumit Sarkar — Modern India (1885-1947) | Modern India | 1946" */
  header: string;
  /** One sentence naming the event the passage is about. */
  context: string;
  subject: Subject;
  year_start: number;
  year_end: number;
  topics: string[];
  /** False until the passage's batch is tagged: its subject and years are then only its book's. */
  tagged: boolean;
  score: number;
};

export type Retrieval = {
  plan: QueryPlan;
  hits: RagHit[];
  /** Curated timeline rows for the plan, for the answering model and the date check. */
  events: TimelineEvent[];
  /** 'strict' | 'relaxed' | 'unfiltered' | 'failed' */
  stage: string;
  ms: number;
};

async function voyage<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`https://api.voyageai.com/v1/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.VOYAGE_API_KEY}` },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`Voyage ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<T>;
}

async function embedQueries(texts: string[], signal?: AbortSignal): Promise<number[][]> {
  const d = await voyage<{ data: { index: number; embedding: number[] }[] }>(
    'embeddings', { model: 'voyage-4-lite', input: texts, input_type: 'query' }, signal);
  return d.data.sort((a, b) => a.index - b.index).map((x) => x.embedding);
}

type Filter = Record<string, unknown>;

function buildFilter(plan: QueryPlan, mode: 'strict' | 'relaxed' | 'unfiltered', bookTitle?: string | null): Filter {
  const must: Filter[] = [{ key: 'ocr_quality', range: { gte: MIN_OCR } }];
  if (bookTitle) must.push({ key: 'book_title', match: { value: bookTitle } });
  if (mode !== 'unfiltered') {
    // A chosen book already fixes the subject; the years still narrow it.
    if (!bookTitle && plan.subjects.length) must.push({ key: 'subject', match: { any: plan.subjects } });
    const periods = paddedPeriods(plan, mode === 'relaxed');
    if (periods.length) {
      must.push({
        should: periods.map(([lo, hi]) => ({
          must: [{ key: 'year_start', range: { lte: hi } }, { key: 'year_end', range: { gte: lo } }],
        })),
      });
    }
  }
  return { must };
}

type Point = { id: number | string; payload: Record<string, unknown> };

async function hybridSearch(
  vectors: { dense: number[] | Float32Array; text: string }[],
  filter: Filter,
  signal?: AbortSignal,
): Promise<Map<string, { point: Point; rrf: number }>> {
  const searches = vectors.map(({ dense, text }) => {
    const sparse = queryVector(text);
    const prefetch: Filter[] = [{ query: Array.from(dense), using: 'dense', filter, limit: PER_SEARCH }];
    if (sparse.indices.length) prefetch.push({ query: sparse, using: 'bm25', filter, limit: PER_SEARCH });
    return { prefetch, query: { fusion: 'rrf' }, limit: PER_SEARCH, with_payload: PAYLOAD };
  });
  const data = await qdrant(`/collections/${COLLECTION}/points/query/batch`, { searches }, signal);
  const results = (data.result as unknown as { points: Point[] }[]) ?? [];
  const merged = new Map<string, { point: Point; rrf: number }>();
  for (const r of results) {
    r.points.forEach((p, rank) => {
      const key = String(p.id);
      const cur = merged.get(key) ?? { point: p, rrf: 0 };
      cur.rrf += 1 / (60 + rank + 1);
      merged.set(key, cur);
    });
  }
  return merged;
}

function toHit(p: Point, score: number): RagHit {
  const pl = p.payload;
  return {
    id: p.id,
    text: String(pl.text ?? ''),
    book_title: String(pl.book_title ?? 'Unknown'),
    author: String(pl.author ?? 'Unknown'),
    header: String(pl.header ?? pl.book_title ?? ''),
    context: String(pl.context ?? ''),
    subject: pl.subject as Subject,
    year_start: Number(pl.year_start),
    year_end: Number(pl.year_end),
    topics: (pl.topics as string[]) ?? [],
    tagged: pl.tagged !== false,
    score,
  };
}

async function rankCandidates(
  question: string,
  plan: QueryPlan,
  merged: Map<string, { point: Point; rrf: number }>,
  topK: number,
  signal?: AbortSignal,
): Promise<RagHit[]> {
  const pool = [...merged.values()].sort((a, b) => b.rrf - a.rrf).slice(0, CANDIDATES);
  if (!pool.length) return [];
  const topics = new Set(plan.topics);
  const boost = (p: Point) => ((p.payload.topics as string[] | undefined) ?? []).some((t) => topics.has(t)) ? TOPIC_BOOST : 0;
  try {
    const docs = pool.map(({ point: p }) =>
      `${p.payload.header ?? ''}\n${p.payload.context ?? ''}\n${p.payload.text ?? ''}`.slice(0, 2500));
    const r = await voyage<{ data: { index: number; relevance_score: number }[] }>(
      'rerank', { model: 'rerank-2.5', query: question, documents: docs }, signal);
    return r.data
      .map((x) => toHit(pool[x.index].point, x.relevance_score + boost(pool[x.index].point)))
      .filter((h) => h.score >= RERANK_MIN)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  } catch (e) {
    // Without the reranker there is no relevance score to cut on; the filters
    // already did the main work, so keep the fused order.
    console.error('[rag] rerank failed, using fused order:', (e as Error).message);
    const top = pool[0].rrf || 1;
    return pool.slice(0, topK).map(({ point, rrf }) => toHit(point, rrf / top + boost(point)));
  }
}

/**
 * Passages for `question`, best first, each at least RERANK_MIN relevant. May be
 * empty: no passage is better than a wrong one.
 */
export async function retrieve(
  question: string,
  opts: { bookTitle?: string | null; topK?: number; signal?: AbortSignal } = {},
): Promise<Retrieval> {
  const t0 = Date.now();
  const { bookTitle = null, topK = 6, signal } = opts;
  const [qVec] = await embedQueries([question], signal);
  const plan = planQuery(question, qVec);
  const events = eventsFor(plan.topics, paddedPeriods(plan), plan.subjects);

  // The cleaned question needs its own vector only when cleaning changed it.
  const cleaned = plan.queries[0];
  const cleanedVec = cleaned !== question ? (await embedQueries([cleaned], signal))[0] : qVec;
  const topicVecs = new Map(VECTORS);
  const vectors = [
    { dense: cleanedVec, text: cleaned },
    ...plan.topics.map((t, i) => ({ dense: topicVecs.get(t)!, text: plan.queries[i + 1] })),
  ];

  const modes: ('strict' | 'relaxed' | 'unfiltered')[] =
    plan.periods.length ? ['strict', 'relaxed', 'unfiltered'] : plan.subjects.length ? ['strict', 'unfiltered'] : ['unfiltered'];
  let hits: RagHit[] = [];
  let stage = 'failed';
  for (const mode of modes) {
    const merged = await hybridSearch(vectors, buildFilter(plan, mode, bookTitle), signal);
    hits = await rankCandidates(question, plan, merged, topK, signal);
    stage = mode;
    if (hits.length >= MIN_RESULTS) break;
  }
  return { plan, hits, events, stage, ms: Date.now() - t0 };
}
