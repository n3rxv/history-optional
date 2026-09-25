#!/usr/bin/env bash
# Rescue the irreplaceable tables first.
#
#   bash scripts/export-appdata.sh
#
# book_chunks can be rebuilt from books/ -- the source PDFs and text are all
# still on disk, so the worst case there is re-chunking and paying Voyage to
# re-embed. Subscriptions, payments and user profiles cannot be rebuilt from
# anything. This project has no database backups, so while the instance is
# flapping these tables are the ones genuinely at risk.
#
# They are also small, which is the point: each one should fit inside one of
# the short windows where the database is answering. Tables are ordered by how
# painful they would be to lose. Each is written to its own file and skipped
# if that file already exists, so re-running only fetches what is still
# missing.
set -uo pipefail
cd "$(dirname "$0")/.."

OUTDIR=${OUTDIR:-data/appdata}
MAX_RETRIES=${MAX_RETRIES:-200}
STATEMENT_TIMEOUT_MS=${STATEMENT_TIMEOUT_MS:-30000}
CONNECT_TIMEOUT=${CONNECT_TIMEOUT:-10}
RETRY_WAIT=${RETRY_WAIT:-5}
MAX_RETRY_WAIT=${MAX_RETRY_WAIT:-30}

DB=$(grep -m1 '^SUPABASE_DB_URL=' .env.local | cut -d= -f2- | tr -d '"')
[ -n "$DB" ] || { echo "SUPABASE_DB_URL not found in .env.local" >&2; exit 1; }

export PGOPTIONS="-c statement_timeout=$STATEMENT_TIMEOUT_MS"
export PGCONNECT_TIMEOUT="$CONNECT_TIMEOUT"

mkdir -p "$OUTDIR"

# Money and identity first, then work the users would grieve, then analytics.
TABLES=(
  subscriptions
  payment_events
  topper_subscriptions
  user_profiles
  usage_tracking
  answer_evaluations
  map_evaluations
  eval_usage
  chat_usage
  writing_pads
  annotations
  canvas_annotations
  note_overrides
  positions
  pyq_answers
  pyq_comments
  debates
  posts
  topper_copies
  topper_copy_pyq_map
  notifications
  contact_submissions
  site_config
  device_sessions
  admin_sessions
  user_sessions
)

ok=0
missed=()

for table in "${TABLES[@]}"; do
  dest="$OUTDIR/$table.jsonl"
  if [ -s "$dest" ]; then
    echo "skip  $table (already have $(wc -l < "$dest" | tr -d ' ') rows)"
    ok=$((ok + 1))
    continue
  fi

  # row_to_json keeps this schema-agnostic: no column list to drift out of
  # date, and every column comes across including ones added later.
  sql="select row_to_json(t)::text from public.$table t"

  attempt=1
  got=""
  while [ "$attempt" -le "$MAX_RETRIES" ]; do
    if got=$(psql "$DB" -X -q -t -A -v ON_ERROR_STOP=1 -c "$sql" 2>/dev/null); then
      break
    fi
    wait=$((attempt * RETRY_WAIT))
    [ "$wait" -gt "$MAX_RETRY_WAIT" ] && wait=$MAX_RETRY_WAIT
    printf '\r  %s: attempt %d/%d failed, retrying in %ds   ' "$table" "$attempt" "$MAX_RETRIES" "$wait"
    sleep "$wait"
    attempt=$((attempt + 1))
    got=""
  done
  printf '\r%*s\r' 60 ''

  if [ "$attempt" -gt "$MAX_RETRIES" ]; then
    echo "MISSED $table after $MAX_RETRIES attempts"
    missed+=("$table")
    continue
  fi

  # An empty table is a legitimate result, so write the file either way --
  # otherwise the skip-if-exists check would retry it forever.
  printf '%s\n' "$got" | sed '/^$/d' > "$dest"
  echo "ok    $table ($(wc -l < "$dest" | tr -d ' ') rows)"
  ok=$((ok + 1))
done

echo ''
echo "$ok/${#TABLES[@]} tables saved to $OUTDIR"
if [ ${#missed[@]} -gt 0 ]; then
  echo "still missing: ${missed[*]}"
  echo "re-run this script -- it only fetches what is not already on disk."
  exit 1
fi
echo "All application data is on disk. book_chunks can wait; it is rebuildable."
