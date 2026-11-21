"""Validate a tagger's output against its batch.

    python3 scripts/rag/check_tags.py b210            # one batch
    python3 scripts/rag/check_tags.py --all           # every batch: done / missing / broken
    python3 scripts/rag/check_tags.py b210 --file work/tags/pilot.jsonl

A tag file holds one JSON object per passage:
    {"id": 31234, "s": "modern_india", "y0": 1942, "y1": 1942, "t": ["cripps_mission_1942"], "c": "..."}
Exit status 0 only when every id in the batch has exactly one valid line.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORK = HERE / "work"
PAD = {"ancient_india": 25, "medieval_india": 5, "modern_india": 1, "modern_world": 1}


def check(bid: str, meta: dict, path: Path) -> list[str]:
    if not path.exists():
        return ["no tag file"]
    problems, seen = [], {}
    allowed_ids, topics = set(meta["ids"]), set(meta["topics"])
    lo, hi = meta["period"]
    for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            r = json.loads(line)
        except json.JSONDecodeError as e:
            problems.append(f"line {n}: not JSON ({e})")
            continue
        pid = r.get("id")
        where = f"line {n} id {pid}"
        if pid not in allowed_ids:
            problems.append(f"{where}: id is not in this batch")
            continue
        if pid in seen:
            problems.append(f"{where}: duplicate (first on line {seen[pid]})")
        seen[pid] = n
        s = r.get("s")
        if s not in meta["subjects"]:
            problems.append(f"{where}: subject {s!r} not in {meta['subjects']}")
        y0, y1 = r.get("y0"), r.get("y1")
        if not (isinstance(y0, int) and isinstance(y1, int)):
            problems.append(f"{where}: y0/y1 must be integers")
        else:
            if y0 > y1:
                problems.append(f"{where}: y0 {y0} is after y1 {y1}")
            pad = PAD.get(s, 1)
            if y1 < lo - pad or y0 > hi + pad:
                problems.append(f"{where}: years {y0}-{y1} outside the book period {lo}-{hi}")
        t = r.get("t")
        if not isinstance(t, list) or len(t) > 3 or any(x not in topics for x in t):
            bad = [x for x in (t or []) if x not in topics] if isinstance(t, list) else t
            problems.append(f"{where}: topics must be 0-3 ids from the batch list (bad: {bad})")
        c = r.get("c")
        if not isinstance(c, str) or not c.strip():
            problems.append(f"{where}: context sentence missing")
        elif len(c) > 300:
            problems.append(f"{where}: context over 300 characters")
    for pid in sorted(allowed_ids - set(seen)):
        problems.append(f"id {pid}: no line")
    return problems


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("batch", nargs="?")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--todo", action="store_true", help="print the batches not yet tagged or failing the check")
    ap.add_argument("--file")
    args = ap.parse_args()
    index = json.loads((WORK / "batches" / "index.json").read_text(encoding="utf-8"))

    if args.todo:
        print(" ".join(b for b, meta in index.items()
                       if check(b, meta, WORK / "tags" / f"{b}.jsonl")))
        return 0

    if args.all:
        done, todo, broken = [], [], []
        for bid, meta in index.items():
            path = WORK / "tags" / f"{bid}.jsonl"
            if not path.exists():
                todo.append(bid)
            elif check(bid, meta, path):
                broken.append(bid)
            else:
                done.append(bid)
        n_done = sum(len(index[b]["ids"]) for b in done)
        print(f"done {len(done)}/{len(index)} batches ({n_done} passages); broken {len(broken)}; not started {len(todo)}")
        if broken:
            print("broken:", " ".join(broken))
        return 0 if not broken and not todo else 1

    if not args.batch or args.batch not in index:
        print("give a batch id like b210, or --all")
        return 2
    path = Path(args.file) if args.file else WORK / "tags" / f"{args.batch}.jsonl"
    problems = check(args.batch, index[args.batch], path)
    for p in problems[:40]:
        print(p)
    if len(problems) > 40:
        print(f"... and {len(problems) - 40} more")
    print(f"{args.batch}: {len(index[args.batch]['ids'])} passages, {len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
