#!/usr/bin/env bash
# Poll the database until it is responsive enough to export from.
#
#   bash scripts/db-watch.sh
#
# Read-only: it runs `select 1` and nothing else. With the Vercel project
# paused, this is close to the only load on the instance, so the latency it
# reports is a fair reading of how much the disk IO budget has recovered.
#
# Exits 0 once three consecutive probes come back under the threshold, which
# is the signal to start scripts/export-chunks.sh.
set -uo pipefail
cd "$(dirname "$0")/.."

INTERVAL=${INTERVAL:-120}     # seconds between probes
THRESHOLD_MS=${THRESHOLD_MS:-2000}
NEEDED=${NEEDED:-3}           # consecutive good probes before declaring ready
PROBE_TIMEOUT=${PROBE_TIMEOUT:-15}

DB=$(grep -m1 '^SUPABASE_DB_URL=' .env.local | cut -d= -f2- | tr -d '"')
[ -n "$DB" ] || { echo "SUPABASE_DB_URL not found in .env.local" >&2; exit 1; }

# A probe that cannot answer in PROBE_TIMEOUT is a failure, not something to
# wait on -- the point is to sample latency, not to block on it.
export PGCONNECT_TIMEOUT="$PROBE_TIMEOUT"
export PGOPTIONS="-c statement_timeout=$((PROBE_TIMEOUT * 1000))"

echo "watching (probe every ${INTERVAL}s, ready after ${NEEDED} probes under ${THRESHOLD_MS}ms)"
echo "ctrl-c to stop"

streak=0
while :; do
  start=$(python3 -c 'import time; print(int(time.time()*1000))')
  if psql "$DB" -X -q -t -A -c 'select 1' >/dev/null 2>&1; then
    end=$(python3 -c 'import time; print(int(time.time()*1000))')
    ms=$((end - start))
    if [ "$ms" -lt "$THRESHOLD_MS" ]; then
      streak=$((streak + 1))
      echo "$(date '+%H:%M:%S')  ok  ${ms}ms  (${streak}/${NEEDED})"
    else
      streak=0
      echo "$(date '+%H:%M:%S')  slow ${ms}ms  (still starved)"
    fi
  else
    streak=0
    echo "$(date '+%H:%M:%S')  no answer within ${PROBE_TIMEOUT}s"
  fi

  if [ "$streak" -ge "$NEEDED" ]; then
    echo ''
    echo "READY -- start the export:"
    echo "  bash scripts/export-chunks.sh"
    exit 0
  fi

  sleep "$INTERVAL"
done
