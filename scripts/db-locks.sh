#!/usr/bin/env bash
# Who is blocking whom, and what is that aborted transaction holding?
#
# Read-only -- reports only, kills nothing. Returns in seconds because it
# never touches the tables that may be locked.
#
#   bash scripts/db-locks.sh
set -uo pipefail
cd "$(dirname "$0")/.."

DB=$(grep -m1 '^SUPABASE_DB_URL=' .env.local | cut -d= -f2- | tr -d '"')
[ -n "$DB" ] || { echo "SUPABASE_DB_URL not found in .env.local" >&2; exit 1; }

psql "$DB" -X -P pager=off <<'SQL'
\echo '=== Sessions, with who they are and what they last ran ==='
select
  pid,
  usename,
  left(coalesce(application_name, '-'), 22)      as app,
  state,
  now() - state_change                           as in_state_for,
  left(regexp_replace(coalesce(query,''), '\s+', ' ', 'g'), 70) as last_query
from pg_stat_activity
where datname = current_database()
order by state_change;

\echo ''
\echo '=== Locks held on book_chunks (the table that hung) ==='
select
  l.pid,
  a.usename,
  l.mode,
  l.granted,
  left(regexp_replace(coalesce(a.query,''), '\s+', ' ', 'g'), 60) as query
from pg_locks l
join pg_stat_activity a using (pid)
where l.relation = 'book_chunks'::regclass
order by l.granted, l.pid;

\echo ''
\echo '=== Anyone actually blocked, and by whom ==='
select
  w.pid                        as waiting_pid,
  left(w.query, 50)            as waiting_query,
  w.wait_event_type,
  pg_blocking_pids(w.pid)      as blocked_by
from pg_stat_activity w
where cardinality(pg_blocking_pids(w.pid)) > 0;

\echo ''
\echo '=== Is autovacuum being held back? (dead rows piling up = more disk IO) ==='
select
  relname,
  n_live_tup,
  n_dead_tup,
  round(100.0 * n_dead_tup / nullif(n_live_tup + n_dead_tup, 0), 1) as dead_pct,
  last_autovacuum
from pg_stat_user_tables
where n_dead_tup > 0
order by n_dead_tup desc
limit 10;
SQL
