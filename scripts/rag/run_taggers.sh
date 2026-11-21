#!/bin/zsh
# Tag batches with headless Claude Code (Sonnet) on the user's subscription, PARALLEL at a time.
# Each batch gets one retry if its tags fail check_tags.py. Logs go to work/logs/<batch>.log.
#
#   scripts/rag/run_taggers.sh 8 b029 b030 ...      # given batches, 8 at a time
#   scripts/rag/run_taggers.sh 8 $(python3 scripts/rag/check_tags.py --todo)
#
# Stops starting new batches when free disk falls under 600 MB.
set -u
REPO=/Users/nirxv_03/Desktop/history-optional
RAG=$REPO/scripts/rag
PARALLEL=${1:-8}; shift
mkdir -p $RAG/work/logs $RAG/work/tags

# Bill the Max subscription only. ~/.zshrc exports an ANTHROPIC_API_KEY, which a
# headless run would otherwise use instead of the claude.ai login.
if ! env -u ANTHROPIC_API_KEY claude auth status 2>/dev/null | grep -q '"authMethod": "claude.ai"'; then
  echo "not signed in to claude.ai without the API key; refusing to run"; exit 1
fi

# Keep the Mac usable (8 GB of RAM): before each batch, wait until at least
# MIN_FREE_PCT of memory is free and the 1-minute load is under MAX_LOAD.
MIN_FREE_PCT=${MIN_FREE_PCT:-30}
MAX_LOAD=${MAX_LOAD:-12}
wait_for_room() {
  local b=$1 said=0
  while true; do
    local free=$(memory_pressure -Q 2>/dev/null | awk -F': ' '/free percentage/ {print $2+0}')
    local load=$(sysctl -n vm.loadavg | awk '{print int($2)}')
    if (( ${free:-0} >= MIN_FREE_PCT && load < MAX_LOAD )); then return; fi
    (( said )) || echo "$b waiting: memory free ${free}% load ${load}"
    said=1
    sleep 20
  done
}

tag_one() {
  local b=$1
  local free_mb=$(df -m /System/Volumes/Data | tail -1 | awk '{print $4}')
  if (( free_mb < 600 )); then echo "$b SKIPPED low disk ${free_mb}MB"; return; fi
  wait_for_room $b
  for attempt in 1 2; do
    cd $REPO && nice -n 15 env -u ANTHROPIC_API_KEY claude -p "Tag one batch of history-textbook passages for a search index.

Read the brief first and follow it exactly: $RAG/TAGGING-BRIEF.md

Your batch: $b
Input: $RAG/work/batches/$b.txt
Output: $RAG/work/tags/$b.jsonl
Check: python3 $RAG/check_tags.py $b

Write only your output file. When the check reports 0 problems, reply in one or two lines as the brief says." \
      --model sonnet --permission-mode acceptEdits \
      --allowedTools "Read" "Write" "Edit" "Bash(python3 $RAG/check_tags.py:*)" \
      < /dev/null > $RAG/work/logs/$b.log 2>&1
    if python3 $RAG/check_tags.py $b > /dev/null 2>&1; then echo "$b OK (attempt $attempt)"; return; fi
  done
  echo "$b FAILED (see work/logs/$b.log)"
}

for b in "$@"; do
  while (( $(jobs -r | wc -l) >= PARALLEL )); do sleep 5; done
  tag_one $b &
done
wait
python3 $RAG/check_tags.py --all
