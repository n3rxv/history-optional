-- Retire the in-Postgres vector corpus.
--
-- DO NOT RUN THIS until the Qdrant collection is loaded and the app has been
-- verified against it. This is the irreversible step: there are no backups on
-- this project ("No backups" on the dashboard), so once book_chunks is gone
-- the only copy of the embeddings is the Qdrant collection plus whatever
-- data/book_chunks.jsonl you kept from the export. Keep that file.
--
-- Why this exists at all:
--
-- book_chunks held ~100k rows of vector(1024) embeddings behind an HNSW index
-- (m=16, ef_construction=64). The embeddings alone were ~410 MB, the index a
-- comparable amount again, and the TOASTed content another 150-250 MB. The
-- instance is a t4g.nano with roughly 0.5 GB of RAM, of which shared_buffers
-- gets a fraction -- so under a fifth of the working set could ever be
-- cached. Every retrieval read from disk, the disk IO budget drained, and at
-- the 5 MB/s baseline the whole database stopped answering: gateway errors
-- at 183/192, subscription checks timing out, paying users shown "Upgrade".
--
-- The corpus was the only thing on this database whose size was incompatible
-- with the instance. Everything else -- subscriptions, usage_tracking,
-- user_sessions, rate_limits -- is small and hot and fits comfortably.
--
-- Run each section separately and check the app in between.

-- ── 1. Verify Qdrant really has everything first ────────────────────────────
-- Compare this against the point count that scripts/qdrant-load.mjs reported.
-- They should match. If they do not, stop.
select count(*) as rows_in_postgres,
       count(embedding) as rows_with_embeddings
  from book_chunks;

-- ── 2. Drop the functions that read the column ──────────────────────────────
-- Nothing calls these now: chat/route.ts, model-answer/route.ts and
-- lib/ragSearch.ts all go through lib/vectorStore.ts. Dropping them first
-- means a missed caller fails loudly here rather than silently returning
-- nothing after the data is gone.
drop function if exists public.match_book_chunks_diverse(vector, integer);
drop function if exists public.match_book_chunks(vector, integer, text);

-- ── 3. Drop the index, then the table ───────────────────────────────────────
-- The index is the larger half of the problem and dropping it is itself
-- IO-cheap, so it is worth doing as its own statement.
drop index if exists public.book_chunks_embedding_idx;

drop table if exists public.book_chunks;

-- ── 4. Reclaim the space ────────────────────────────────────────────────────
-- DROP TABLE releases the files, but the catalog and the freed extents are
-- worth a vacuum before you judge whether the IO budget is recovering.
vacuum (analyze);

-- ── 5. Optional: drop pgvector entirely ─────────────────────────────────────
-- Only if nothing else uses it. This removes ~95 functions from public.
-- Check first:
--   select count(*) from pg_attribute a join pg_class c on c.oid = a.attrelid
--    where a.atttypid = 'vector'::regtype and not a.attisdropped;
-- If that returns 0:
-- drop extension if exists vector;
