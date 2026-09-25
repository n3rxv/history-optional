#!/usr/bin/env bash
# Read-only diagnostics for the disk IO budget warning.
#
# Nothing here writes. Run from the project root:
#   bash scripts/db-diagnose.sh
#
# Connection choice: the session pooler (DATABASE_URL_SESSION) was tried first
# and returned ECHECKOUTTIMEOUT -- its pool is saturated. So this tries the
# direct connection, then falls back to the transaction pooler on 6543.
# Transaction mode cannot hold a session GUC across statements, so ef_search is
# set with SET LOCAL inside an explicit transaction, which works in both.
set -uo pipefail
cd "$(dirname "$0")/.."

read_env() { grep -m1 "^$1=" .env.local | cut -d= -f2- | tr -d '"'; }

DIRECT=$(read_env SUPABASE_DB_URL)
TXN=$(read_env DATABASE_URL)

DB=""
for candidate in "$DIRECT" "$TXN"; do
  [ -n "$candidate" ] || continue
  host=$(printf '%s' "$candidate" | sed -E 's|.*@([^:/]+).*|\1|')
  printf 'trying %s ... ' "$host"
  if psql "$candidate" -X -q -t -c 'select 1' >/dev/null 2>&1; then
    echo "ok"
    DB="$candidate"
    break
  fi
  echo "failed"
done

[ -n "$DB" ] || { echo "No reachable connection. Both the direct host and the transaction pooler refused." >&2; exit 1; }

psql "$DB" -X -P pager=off <<'SQL'
\echo ''
\echo '=== 0. Who is holding connections? (the session pool timed out) ==='
select state, count(*), max(now() - state_change) as longest
from pg_stat_activity
where datname = current_database()
group by state
order by count(*) desc;

\echo ''
\echo '=== 1. How big is the vector index vs the RAM a nano has (~0.5 GB)? ==='
select
  pg_size_pretty(pg_relation_size('book_chunks'))                as heap,
  pg_size_pretty(pg_relation_size('book_chunks_embedding_idx'))  as hnsw_index,
  pg_size_pretty(pg_total_relation_size('book_chunks'))          as total_incl_toast,
  (select count(*) from book_chunks)                             as chunks,
  (select count(distinct book_title) from book_chunks)           as books;

\echo ''
\echo '=== 2. What is actually reading from disk? (top 10 by blocks read) ==='
select
  left(query, 90)                            as query,
  calls,
  shared_blks_read                           as disk_blocks_read,
  round(100.0 * shared_blks_hit
        / nullif(shared_blks_hit + shared_blks_read, 0), 1) as cache_hit_pct,
  round(mean_exec_time::numeric, 1)          as avg_ms
from pg_stat_statements
order by shared_blks_read desc
limit 10;

\echo ''
\echo '=== 3. Cache hit ratio overall (below ~99% is trouble on a nano) ==='
select
  round(100.0 * sum(heap_blks_hit)
        / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) as heap_cache_hit_pct
from pg_statio_user_tables;
SQL

# EXPLAIN cannot see inside a plpgsql function -- calling
# match_book_chunks_diverse directly would only show a Function Scan. So the
# body is inlined below, with the same ef_search, and the buffer counts are
# the real ones.
psql "$DB" -X -P pager=off <<'SQL'
\echo ''
\echo '=== 4. Cost of one real RAG search, as the function runs it today ==='

begin;
set local hnsw.ef_search = '200';

explain (analyze, buffers, costs off)
with q as (
  select embedding as e from book_chunks where embedding is not null limit 1
),
candidates as (
  select bc.id, bc.content, bc.book_title, bc.author,
         bc.embedding <=> (select e from q) as dist
  from book_chunks bc
  where bc.embedding is not null
  order by bc.embedding <=> (select e from q)
  limit 150
),
ranked as (
  select c.*, row_number() over (partition by c.book_title order by c.dist) as rn
  from candidates c
)
select r.id, r.content, r.book_title, r.author, 1 - r.dist
from ranked r
where r.rn <= 3
order by r.rn, r.dist
limit 20;

commit;

\echo ''
\echo '=== 5. Same search WITHOUT pulling content for all 150 candidates ==='
\echo '    (the proposed rewrite -- compare "Buffers: shared read" to part 4)'

begin;
set local hnsw.ef_search = '200';

explain (analyze, buffers, costs off)
with q as (
  select embedding as e from book_chunks where embedding is not null limit 1
),
candidates as (
  select bc.id, bc.book_title, bc.author,
         bc.embedding <=> (select e from q) as dist
  from book_chunks bc
  where bc.embedding is not null
  order by bc.embedding <=> (select e from q)
  limit 150
),
ranked as (
  select c.*, row_number() over (partition by c.book_title order by c.dist) as rn
  from candidates c
),
winners as (
  select r.id, r.book_title, r.author, r.dist, r.rn
  from ranked r
  where r.rn <= 3
  order by r.rn, r.dist
  limit 20
)
select w.id, bc.content, w.book_title, w.author, 1 - w.dist
from winners w
join book_chunks bc on bc.id = w.id
order by w.rn, w.dist;

commit;
SQL
