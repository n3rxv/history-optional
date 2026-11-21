#!/bin/zsh
# Pull the tag files the cloud session pushed to the private repo n3rxv/ho-rag-tagging
# (local clone in flashwork/ho-rag-tagging), copy new ones into work/tags, and load
# them into book_chunks_v2. Light work: no AI, two upload threads, low priority.
#
#   zsh scripts/rag/sync_cloud_tags.sh
set -eu
CLONE=/Users/nirxv_03/Desktop/dc-design/flashwork/ho-rag-tagging
RAG=/Users/nirxv_03/Desktop/history-optional/scripts/rag
git -C $CLONE pull -q
n=0
for f in $CLONE/work/tags/b*.jsonl; do
  b=$(basename $f)
  if ! cmp -s $f $RAG/work/tags/$b; then cp $f $RAG/work/tags/$b; n=$((n + 1)); fi
done
echo "copied $n new tag files"
python3 $RAG/check_tags.py --all | head -2
(( n == 0 )) || (cd $RAG && nice -n 15 python3 -u build_collection.py --provisional --skip-existing --workers 2 | tail -2)
