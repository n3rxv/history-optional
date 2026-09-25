#!/usr/bin/env bash
# Run supabase/drop_book_chunks.sql in guarded stages.
#
#   bash scripts/drop-book-chunks.sh
#
# This is the irreversible step. The guard below refuses to proceed unless the
# row count in Postgres matches what is already in Qdrant and in the local
# export, so a partial export cannot quietly become a partial corpus.
#
# The instance has been answering intermittently, so every stage retries.
set -uo pipefail
cd "$(dirname "$0")/.."

EXPECTED=${EXPECTED:-30305}
MAX_RETRIES=${MAX_RETRIES:-60}
RETRY_WAIT=${RETRY_WAIT:-5}

DB=$(grep -m1 '^SUPABASE_DB_URL=' .env.local | cut -d= -f2- | tr -d '"')
[ -n "$DB" ] || { echo "SUPABASE_DB_URL not found in .env.local" >&2; exit 1; }

export PGOPTIONS='-c statement_timeout=60000'
export PGCONNECT_TIMEOUT=10

# Run one statement, retrying while the instance is flapping.
run() {
  local label=$1 sql=$2 out attempt=1
  while [ "$attempt" -le "$MAX_RETRIES" ]; do
    if out=$(psql "$DB" -X -q -t -A -v ON_ERROR_STOP=1 -c "$sql" 2>&1); then
      printf '%s\n' "$out"
      return 0
    fi
    printf '\r  %s: attempt %d/%d …   ' "$label" "$attempt" "$MAX_RETRIES" >&2
    sleep "$RETRY_WAIT"
    attempt=$((attempt + 1))
  done
  printf '\n' >&2
  echo "FAILED: $label" >&2
  return 1
}

echo "── 1. verifying the corpus is fully mirrored ──"
count=$(run "count" "select count(*) from public.book_chunks") || exit 1
printf '\r%*s\r' 50 ''
echo "  rows in Postgres : $count"
echo "  expected         : $EXPECTED"

if [ "$count" != "$EXPECTED" ]; then
  echo ''
  echo "REFUSING TO DROP: Postgres holds $count rows but Qdrant and the export hold $EXPECTED."
  echo "Something was added or missed. Re-run scripts/export-chunks.sh before continuing."
  exit 1
fi
echo "  ✓ match — safe to proceed"

echo ''
echo "── 2. dropping the retrieval functions ──"
# Dropped before the table so that any caller we missed fails loudly here,
# while the data is still present, rather than silently returning nothing.
run "drop fn diverse" "drop function if exists public.match_book_chunks_diverse(vector, integer)" >/dev/null || exit 1
run "drop fn single"  "drop function if exists public.match_book_chunks(vector, integer, text)" >/dev/null || exit 1
printf '\r%*s\r' 50 ''
echo "  ✓ functions gone"

echo ''
echo "── 3. dropping the HNSW index ──"
run "drop index" "drop index if exists public.book_chunks_embedding_idx" >/dev/null || exit 1
printf '\r%*s\r' 50 ''
echo "  ✓ index gone (this was the larger half of the problem)"

echo ''
echo "── 4. dropping the table ──"
run "drop table" "drop table if exists public.book_chunks" >/dev/null || exit 1
printf '\r%*s\r' 50 ''
echo "  ✓ book_chunks gone"

echo ''
echo "── 5. what is left on the instance ──"
run "sizes" "select relname, pg_size_pretty(pg_total_relation_size(c.oid)) as size
             from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relkind = 'r'
             order by pg_total_relation_size(c.oid) desc limit 10" || exit 1
printf '\r%*s\r' 50 ''

echo ''
echo "Done. Watch the dashboard: if the corpus was the cause, disk IO demand"
echo "should fall away and the budget should start refilling."
