"""Summarise the verify outputs for review, and write the audit trail.

    python3 scripts/rag/review_verify.py            # print corrected and disputed rows with their quotes
    python3 scripts/rag/review_verify.py --audit    # also write work/timeline_sources.csv (local only)

A row counts as fully confirmed only when the books back every date in it: for a span,
both its start and its end; for a day or month row, the day or month. A start-only
confirmation of a span is reported separately and not marked verified.
"""
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

from check_verify import agrees, parse_date, row_date

HERE = Path(__file__).resolve().parent
VDIR = HERE / "work" / "verify"
DATA = HERE / "history_rag" / "history_rag" / "data"


def end_row(r: dict) -> dict:
    """The row's end as a one-point row, to test a book date against the end alone."""
    return {**r, "start": r["end"], "end": ""}


def start_row(r: dict) -> dict:
    return {**r, "end": ""}


def load():
    rows = {r["id"]: r for r in csv.DictReader(open(DATA / "timeline.csv", encoding="utf-8"))}
    out = {}
    for f in sorted(VDIR.glob("v*.out.jsonl")):
        for line in f.read_text(encoding="utf-8").splitlines():
            if line.strip():
                o = json.loads(line)
                out[o["id"]] = o
    return rows, out


def all_dates(text: str) -> list:
    """Every date in a reader's date string: "1556-1605" and "268–232 BCE" give two."""
    import re
    bce = re.search(r"B\.?\s?C", text, re.I)
    parts = re.split(r"\s*(?:–|—|-|\bto\b|\band\b)\s*(?=(?:c\.\s*)?\d|[A-Za-z]+\s+\d)", text)
    out = []
    for part in parts:
        if bce and not re.search(r"B\.?\s?C", part, re.I):
            part = part + " BCE"
        d = parse_date(part)
        if d[0] is not None:
            out.append(d)
    return out or [parse_date(text)]


def coverage(r: dict, o: dict) -> str:
    """'full', 'start-only', 'end-only' or 'none' for a confirmed row."""
    dates = [d for b in o["books"] for d in all_dates(b["date"])]
    if not r["end"]:
        return "full" if any(agrees(d, r) for d in dates) else "none"
    s = any(agrees(d, start_row(r)) for d in dates)
    e = any(agrees(d, end_row(r)) for d in dates)
    return "full" if s and e else "start-only" if s else "end-only" if e else "none"


def main() -> None:
    rows, out = load()
    missing = [i for i in rows if i not in out]
    by = {"confirmed": [], "corrected": [], "disputed": [], "unsupported": []}
    for i, o in out.items():
        by[o["verdict"]].append(i)
    full = [i for i in by["confirmed"] if coverage(rows[i], out[i]) == "full"]
    partial = [i for i in by["confirmed"] if i not in full]
    print(f"{len(rows)} rows: {len(full)} fully confirmed, {len(partial)} partly confirmed (span start or end only), "
          f"{len(by['corrected'])} corrected, {len(by['disputed'])} disputed, {len(by['unsupported'])} unsupported, "
          f"{len(missing)} not checked")
    if "--audit" not in sys.argv:
        for v in ("corrected", "disputed"):
            print(f"\n==== {v.upper()} ({len(by[v])})")
            for i in by[v]:
                r, o = rows[i], out[i]
                print(f"\n{i}: row {r['start']}{'–' + r['end'] if r['end'] else ''} ({r['precision']}, ±{r['tolerance_years'] or 0}) — {r['name']}")
                print(f"   suggest: {json.dumps(o.get('suggest'), ensure_ascii=False)}")
                print(f"   why: {o['why']}")
                for b in o["books"]:
                    print(f"   P{b['p']} [{b['date']}] {b['quote'][:220]}")
        print("\nPARTLY CONFIRMED:", " ".join(partial))
        print("UNSUPPORTED:", " ".join(by["unsupported"]))
        return
    # Audit trail: what each row's verdict rests on.
    passages = json.loads((VDIR / "passages.json").read_text())
    books_of = {}
    for line in open(HERE / "work" / "passages.jsonl", encoding="utf-8"):
        p = json.loads(line)
        books_of[str(p["id"])] = p["book_title"]
    with open(HERE / "work" / "timeline_sources.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["id", "verdict", "coverage", "book", "passage", "book_date", "quote"])
        for i in rows:
            o = out.get(i)
            if not o:
                w.writerow([i, "not checked", "", "", "", "", ""])
                continue
            cov = coverage(rows[i], o) if o["verdict"] == "confirmed" else ""
            if not o["books"]:
                w.writerow([i, o["verdict"], cov, "", "", "", ""])
            for b in o["books"]:
                w.writerow([i, o["verdict"], cov, books_of.get(str(b["p"]), ""), b["p"], b["date"], b["quote"]])
    print(f"wrote {HERE / "work" / "timeline_sources.csv"}")


if __name__ == "__main__":
    main()
