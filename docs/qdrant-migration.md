# Moving book retrieval off Postgres

**Status: done, 25 Sep 2026.** 30,305 vectors live in Qdrant; `book_chunks`
has been dropped from Supabase.

Measured before and after the drop, same probe (connect + `select 1`, from a
laptop, against the direct endpoint):

| | Before | After |
|---|---|---|
| Probes answering | 1 in 20 | 6 of 6 |
| Latency when it did answer | 8–13 s (once 660 ms) | 351–484 ms |
| Largest table on the instance | `book_chunks` + ~200 MB HNSW index | `note_overrides`, 1.5 MB |

The whole remaining database is about 6 MB. It was a 6 MB application
carrying a ~350 MB vector index on a 500 MB box.

## Why

`book_chunks` held ~100k rows of `vector(1024)` embeddings behind an HNSW
index. The embeddings were roughly 410 MB, the index a comparable amount, and
the TOASTed `content` another 150–250 MB — call it 1–1.5 GB of hot data on a
`t4g.nano` with about 0.5 GB of RAM.

Under a fifth of that working set could ever be cached, so every retrieval
read from disk. That drained the project's disk IO budget, and once the budget
was gone throughput fell to the 5 MB/s baseline and the database stopped
answering anything: 183 of 192 gateway requests failing, Supabase's own Table
Editor timing out, and — because every subscription check reads
`data` without checking `error` — paying users being shown *Upgrade*.

The corpus was the only thing on this database whose size was incompatible
with the instance. `subscriptions`, `usage_tracking`, `user_sessions` and
`rate_limits` are small and fit fine. So the corpus moves out and Postgres
keeps the work it is sized for.

Qdrant Cloud's free tier (1 GB RAM, 4 GB disk, no expiry, no inactivity pause)
holds the corpus comfortably. Cloudflare Vectorize was considered and rejected:
its free tier is 5M *stored dimensions*, about 4,900 vectors at 1024 dims —
roughly 20× too small.

## Running the migration

**The existing embeddings are reused as-is.** No re-embedding, no Voyage
spend, no change in retrieval quality.

### 0. Let the IO budget refill first

Rebuilding and exporting are both IO-heavy. On a starved instance the export
will crawl or fail. Pause the Vercel deployment so demand drops below
baseline, and give it time to recover before step 2.

### 1. Create the Qdrant cluster

Sign up at https://cloud.qdrant.io, create a free cluster, and put the URL and
API key in `.env.local`:

```
QDRANT_URL=https://xxxxxxxx.region.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=...
QDRANT_COLLECTION=book_chunks
```

### 2. Export from Postgres

```bash
bash scripts/export-chunks.sh
```

Writes `data/book_chunks.jsonl`. Batched, retried, and resumable — if it dies
partway, just run it again and it picks up from the last id written. **Keep
this file.** This project has no database backups, so until Qdrant is verified
it is your only second copy.

### 3. Load into Qdrant

```bash
node scripts/qdrant-load.mjs
```

Creates the collection with the dimension found in the data, sets Cosine
distance to match what pgvector's `<=>` was doing, adds a keyword index on
`book_title` (needed by both the grouped query and the single-book filter),
then streams the file in. Upserts are keyed on the original Postgres id, so
re-running is safe. It prints a final point count — check it against the row
count from Postgres.

### 4. Verify the app

Set the same three variables in Vercel, deploy, and exercise:

- **Chat, All Books** → `searchDiverse`, should cite several different
  historians
- **Chat, single book** → `searchBook`, should stay within that book
- **Evaluate** → `lib/ragSearch.ts`
- **Model answer** → `searchDiverse` followed by the Voyage rerank

### 5. Drop the table

Only once step 4 passes. See `supabase/drop_book_chunks.sql` — it goes
section by section, verifying counts before anything irreversible. This is
the step where the IO problem actually ends.

## What changed in the code

| File | Change |
|---|---|
| `lib/vectorStore.ts` | New. Qdrant REST client, no new npm dependency. |
| `lib/ragSearch.ts` | `match_book_chunks_diverse` RPC → `searchDiverse` |
| `app/api/chat/route.ts` | Both modes → `searchDiverse` / `searchBook` |
| `app/api/model-answer/route.ts` | → `searchDiverse`, rerank untouched |
| `supabase/drop_book_chunks.sql` | New. The teardown, to run last. |

Retrieval semantics are preserved. The old SQL took a top-150 candidate pool,
ranked it per book with a window function, and emitted every book's best chunk
before any book's second. `searchDiverse` asks Qdrant to group by
`book_title` server-side and then interleaves the groups by within-book rank —
the same ordering, but over Qdrant's own candidate set rather than a fixed 150
rows, so a third book that previously fell outside the pool can now surface.

The 0.45 similarity floor carries over unchanged because Qdrant's Cosine score
is on the same 0–1 scale as `1 - (embedding <=> query_embedding)`.

## Tuning, 25 Sep 2026

Measured with `npx tsx scripts/rag-bench.ts` (6 questions, 3 runs each,
median). Run from a laptop in India against a cluster in Virginia, so roughly
285ms of every figure below is network round-trip that Vercel — which runs in
`iad1`, the same region as the cluster — does not pay.

| Config | Median | books@6 |
|---|---|---|
| Before: 20 groups, 2,145 vectors unindexed | 327ms | 6.00 |
| After: 12 groups (8 for chat/evaluate), fully indexed | 304 / 289ms | 6.00 |

Two changes:

1. **`searchDiverse` requested 20 groups** while the widest caller sliced to
   12 and most sliced to 6. The default is now 12, and chat and `ragSearch`
   pass 8. Grouping is the expensive part of the query, and CPU is the binding
   constraint on a 0.5 vCPU cluster, so the real gain is concurrency headroom
   rather than latency.

2. **2,145 vectors sat in a segment below the indexing threshold** and were
   brute-forced on every search. Qdrant Cloud sets `indexing_threshold` to
   10,000 KB; the segment was 8.8 MB, just under. Lowered to 1,000 KB via
   `PATCH /collections/book_chunks`, and all 30,305 vectors indexed within
   four seconds. This matters more as the corpus grows — brute-force cost
   scales linearly with unindexed vectors.

Scalar quantization was considered and rejected: it cuts vector RAM ~4×, but
the collection uses only ~15% of the free tier's 1 GiB, so it would trade
recall for headroom that is not needed. Revisit if the corpus grows several
times over.

`books@6` — distinct books among the six chunks a caller actually uses — is
the guard on all of this. It stayed at the 6.00 ceiling throughout.

## Still outstanding

- **Subscription checks swallow errors.** `app/api/sub-status/route.ts:20` and
  ~8 siblings destructure `data` without `error`, so a failed query is
  reported as "not premium". This is why the outage showed paying users
  *Upgrade*. Not fixed yet — deferred by request.
- **`VisitorTracker` writes per pageview** plus a 5-minute heartbeat per open
  tab, each one WAL plus a dirtied page. Worth cutting on a free-tier box.
- **`components/AuthGuard.tsx:37` POSTs to `/api/ping`**, which only exports
  `GET`. It 405s every sign-in and the health probe never runs.
