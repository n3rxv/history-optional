/**
 * Book-passage vector search, served from Qdrant instead of Postgres.
 *
 * The embeddings and their HNSW index were roughly a gigabyte of hot data on
 * a t4g.nano with ~0.5 GB of RAM, so no useful part of the working set could
 * stay cached and every retrieval went to disk. That drained the instance's
 * disk IO budget, and once the budget was gone the whole database became
 * unresponsive -- including the subscription lookups, which have nothing to
 * do with retrieval. Moving the corpus out leaves Postgres serving only the
 * small, hot application tables it is actually sized for.
 *
 * Qdrant's grouped query reproduces what match_book_chunks_diverse did in
 * SQL. There the pool was a top-150 by distance, ranked per book with a
 * window function; here Qdrant does the grouping server-side over its own
 * candidate set, which is strictly better -- the old query could only find a
 * book that happened to land inside those 150 rows.
 *
 * Talking to the REST API directly rather than through @qdrant/js-client-rest
 * keeps this to zero new dependencies, which matters because the same code
 * runs inside Vercel functions.
 */

const COLLECTION = process.env.QDRANT_COLLECTION ?? 'book_chunks';

export type BookChunk = {
  id: string | number;
  content: string;
  book_title: string;
  author: string;
  similarity: number;
};

type QdrantHit = {
  id: string | number;
  score?: number;
  payload?: Record<string, unknown>;
};

function endpoint(path: string): string {
  const base = process.env.QDRANT_URL;
  if (!base) throw new Error('QDRANT_URL is not set');
  return `${base.replace(/\/$/, '')}${path}`;
}

async function qdrant(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<{ result?: Record<string, unknown> }> {
  const key = process.env.QDRANT_API_KEY;
  if (!key) throw new Error('QDRANT_API_KEY is not set');

  const res = await fetch(endpoint(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': key },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    // The body carries Qdrant's actual complaint; without it a 400 here is
    // indistinguishable from a 500 and costs an afternoon.
    throw new Error(`Qdrant ${path} returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.json();
}

function toChunk(hit: QdrantHit): BookChunk {
  const payload = hit.payload ?? {};
  return {
    id: hit.id,
    content: String(payload.content ?? ''),
    book_title: String(payload.book_title ?? 'Unknown'),
    author: String(payload.author ?? 'Unknown'),
    // With Cosine distance Qdrant scores hits as cosine similarity, the same
    // 0-1 scale `1 - (embedding <=> query_embedding)` produced in SQL, so the
    // callers' 0.45 floor carries across unchanged.
    similarity: typeof hit.score === 'number' ? hit.score : 0,
  };
}

/**
 * Best passages for `embedding`, spread across books.
 *
 * Returns every book's best chunk before any book's second, which is what
 * surfaces several historians on a contested question -- History Optional
 * answers are marked on citing more than one. For pure relevance instead,
 * sort the result by `similarity`.
 */
export async function searchDiverse(
  embedding: number[],
  opts: { perBook?: number; maxResults?: number; signal?: AbortSignal } = {},
): Promise<BookChunk[]> {
  // 12 rather than 20: the widest caller (model-answer) slices to 12 before
  // reranking, so groups beyond that were computed and thrown away. Grouping
  // is the expensive part of this query and CPU is the binding constraint on
  // a 0.5 vCPU cluster, so the saving is concurrency headroom rather than
  // user-visible latency.
  const { perBook = 3, maxResults = 12, signal } = opts;

  const data = await qdrant(
    `/collections/${COLLECTION}/points/query/groups`,
    {
      query: embedding,
      group_by: 'book_title',
      group_size: perBook,
      // `limit` counts groups, not hits. Asking for maxResults groups lets the
      // interleave below fill its quota from distinct books when the corpus
      // has that many relevant ones.
      limit: maxResults,
      with_payload: ['content', 'book_title', 'author'],
    },
    signal,
  );

  const groups = (data.result?.groups ?? []) as { hits?: QdrantHit[] }[];

  // Rebuild `order by rn, dist`: bucket by within-book rank, sort each bucket
  // by similarity, then concatenate the buckets.
  const tiers: BookChunk[][] = [];
  for (const group of groups) {
    (group.hits ?? []).forEach((hit, rank) => {
      (tiers[rank] ??= []).push(toChunk(hit));
    });
  }

  return tiers
    .flatMap((tier) => tier.sort((a, b) => b.similarity - a.similarity))
    .slice(0, maxResults);
}

/**
 * Best passages for `embedding` from one book. Replaces the filter_book form
 * of match_book_chunks.
 */
export async function searchBook(
  embedding: number[],
  bookTitle: string,
  opts: { limit?: number; signal?: AbortSignal } = {},
): Promise<BookChunk[]> {
  const { limit = 12, signal } = opts;

  const data = await qdrant(
    `/collections/${COLLECTION}/points/query`,
    {
      query: embedding,
      filter: { must: [{ key: 'book_title', match: { value: bookTitle } }] },
      limit,
      with_payload: ['content', 'book_title', 'author'],
    },
    signal,
  );

  const points = (data.result?.points ?? []) as QdrantHit[];
  return points.map(toChunk);
}
