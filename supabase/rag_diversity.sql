-- Make "All Books" retrieval actually diverse.
--
-- match_book_chunks_diverse declared per_book_count, every caller passed 3, and
-- the body never referenced it — it was a plain `order by distance limit 50`.
-- All 50 chunks could come from one book, and app/api/chat/route.ts carried a
-- comment claiming Postgres did per-book ranking "via a window function" that
-- did not exist. History Optional answers are graded on citing several
-- historians, so this cost real answer quality.
--
-- Two further problems fixed here:
--   * LIMIT 50 was run against pgvector's default hnsw.ef_search of 40. The
--     guidance is ef_search >= the limit, so the top 50 was being drawn from a
--     narrower search than intended and recall degraded silently.
--   * match_book_chunks existed as two overloads. A two-argument call matched
--     both (the third parameter defaults), which Postgres rejects as "function
--     is not unique", and the older one returned no id — which chat's dedup
--     (seen.has(chunk.id)) relies on.

-- ── 1. Diverse retrieval ─────────────────────────────────────────────────────
-- Signature and return columns are unchanged, so no client change is required.
create or replace function public.match_book_chunks_diverse(
  query_embedding vector,
  per_book_count  integer default 3
)
returns table (
  id         bigint,
  content    text,
  book_title text,
  author     text,
  similarity double precision
)
language plpgsql
-- Must be >= the candidate limit below, or HNSW searches too narrowly.
set hnsw.ef_search = '200'
as $function$
begin
  return query
  with candidates as (
    -- HNSW serves this top-K directly; the window function below only ever
    -- sees these 150 rows, so the index stays the right shape for this query.
    select
      bc.id,
      bc.content,
      bc.book_title,
      bc.author,
      bc.embedding <=> query_embedding as dist
    from book_chunks bc
    where bc.embedding is not null
    order by bc.embedding <=> query_embedding
    limit 150
  ),
  ranked as (
    select c.*,
           row_number() over (partition by c.book_title order by c.dist) as rn
    from candidates c
  )
  select r.id, r.content, r.book_title, r.author, 1 - r.dist
  from ranked r
  where r.rn <= per_book_count
  -- Ordering by rn first interleaves books: every book's best chunk before any
  -- book's second. That is what surfaces several historians on a contested
  -- question. For pure relevance instead, order by r.dist alone.
  order by r.rn, r.dist
  limit 20;
end;
$function$;

-- ── 2. Remove the ambiguous legacy overload ──────────────────────────────────
-- Nothing calls the two-argument form; chat/route.ts passes filter_book.
drop function if exists public.match_book_chunks(vector, integer);

-- ── 3. Same ef_search fix for single-book retrieval ──────────────────────────
alter function public.match_book_chunks(vector, integer, text)
  set hnsw.ef_search = '200';
