"""Split work/passages.jsonl into tagging batches for in-session subagents.

Each batch is one book's consecutive passages (reading order, so a passage that only
says "the plan" can be read with the passages before it). The batch file carries
everything the tagger needs: the book, the subjects and years it may use, and the
timeline topics that fit the book. work/batches/index.json records, per batch, the
ids and the allowed values that check_tags.py validates against.

    python3 scripts/rag/make_batches.py [--size 120]
"""
from __future__ import annotations

import argparse
import json
import sys
import textwrap
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "history_rag"))
from history_rag.timeline import Timeline, _fmt_years  # noqa: E402

WORK = HERE / "work"
SUBJECT_NAMES = {
    "ancient_india": "Ancient India (to c. 750 CE)",
    "medieval_india": "Medieval India (c. 750 CE to the mid-18th century)",
    "modern_india": "Modern India (European arrival and the East India Companies to the 1960s)",
    "modern_world": "Modern World (Enlightenment to 1991)",
}


def load_registry() -> dict:
    data = yaml.safe_load((HERE / "books_registry.yaml").read_text(encoding="utf-8"))
    return data["books"]


def allowed_topics(tl: Timeline, subjects: list[str], period: tuple[int, int]) -> list[str]:
    lo, hi = period[0] - 50, period[1] + 50
    return sorted((t for t, info in tl.topics.items()
                   if info.subjects & set(subjects) and not (info.year_hi < lo or info.year_lo > hi)),
                  key=lambda t: (tl.topics[t].year_lo, t))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--size", type=int, default=120)
    args = ap.parse_args()

    tl = Timeline.load(HERE / "history_rag" / "history_rag" / "data" / "timeline.csv")
    registry = load_registry()
    by_book: dict[str, list[dict]] = {}
    for line in open(WORK / "passages.jsonl", encoding="utf-8"):
        r = json.loads(line)
        by_book.setdefault(r["book_title"], []).append(r)
    missing = sorted(set(by_book) - set(registry))
    if missing:
        raise SystemExit(f"books missing from books_registry.yaml: {missing}")

    out_dir = WORK / "batches"
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("b*.txt"):
        old.unlink()
    index, n = {}, 0
    for book in sorted(by_book):
        rows = sorted(by_book[book], key=lambda r: r["id"])
        meta = registry[book]
        subjects, period = meta["subjects"], tuple(meta["period"])
        topics = allowed_topics(tl, subjects, period)
        catalogue = "\n".join(
            f"{t} ({_fmt_years(tl.topics[t].year_lo, tl.topics[t].year_hi)}): {'; '.join(tl.topics[t].names)}"
            for t in topics) or "(none)"
        size = args.size
        parts = [rows[i:i + size] for i in range(0, len(rows), size)]
        if len(parts) > 1 and len(parts[-1]) < size // 3:   # fold a small tail into the previous batch
            parts[-2].extend(parts.pop())
        for part in parts:
            n += 1
            bid = f"b{n:03d}"
            lines = [
                f"BATCH {bid}",
                f"BOOK: {book}",
                f"AUTHOR: {part[0]['author']}",
                "SUBJECTS ALLOWED (pick one per passage):",
                *[f"  {s}: {SUBJECT_NAMES[s]}" for s in subjects],
                f"BOOK PERIOD: {_fmt_years(*period)}  (years must fall inside it)",
                "",
                "TOPICS (id (years): example events). Use 0-3 per passage, ids from this list only:",
                catalogue,
                "",
                f"PASSAGES ({len(part)}, in reading order; each starts with '=== <id>'):",
            ]
            for r in part:
                lines.append(f"=== {r['id']}")
                lines.extend(textwrap.wrap(r["text"], 900, break_long_words=False, break_on_hyphens=False))
            (out_dir / f"{bid}.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
            index[bid] = {"book": book, "ids": [r["id"] for r in part], "subjects": subjects,
                          "period": list(period), "topics": topics}
    (out_dir / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")
    sizes = [len(v["ids"]) for v in index.values()]
    print(f"{n} batches, {sum(sizes)} passages, {min(sizes)}-{max(sizes)} per batch -> {out_dir}")


if __name__ == "__main__":
    main()
