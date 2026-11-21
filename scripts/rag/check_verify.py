"""Check a verify batch's output (VERIFY-BRIEF.md) and, with --all, summarise every batch.

Beyond format, it checks that each quote is really in its passage, and that the date a
reader reports for a `confirmed` row agrees with the row at the row's precision, so a
row cannot be confirmed on a date that does not match.

    python3 scripts/rag/check_verify.py v10
    python3 scripts/rag/check_verify.py --all
"""
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
VDIR = HERE / "work" / ("verify2" if "--dir" in sys.argv and sys.argv[sys.argv.index("--dir") + 1] == "verify2" else "verify")
TIMELINE = HERE / "history_rag" / "history_rag" / "data" / "timeline.csv"
VERDICTS = {"confirmed", "corrected", "disputed", "unsupported"}
MONTHS = {m: i for i, m in enumerate(["january", "february", "march", "april", "may", "june", "july", "august",
                                       "september", "october", "november", "december"], 1)}
MONTHS.update({k[:3]: v for k, v in list(MONTHS.items())})
MONTHS["sept"] = 9

norm = lambda s: re.sub(r"\s+", " ", s or "").strip().lower()


def parse_date(text: str):
    """(year, month, day) from a reader's date string; any part may be None."""
    t = text.strip()
    m = re.search(r"(\d{1,4})\s*(BCE|BC|B\.C\.?)", t, re.I)
    if m:
        return (-int(m.group(1)), None, None)
    m = re.search(r"\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\.?,?\s+(\d{3,4})\b", t)
    if m and m.group(2).lower() in MONTHS:
        return (int(m.group(3)), MONTHS[m.group(2).lower()], int(m.group(1)))
    m = re.search(r"\b([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{3,4})\b", t)
    if m and m.group(1).lower() in MONTHS:
        return (int(m.group(3)), MONTHS[m.group(1).lower()], int(m.group(2)))
    m = re.search(r"\b([A-Za-z]+)\.?,?\s+(\d{3,4})\b", t)
    if m and m.group(1).lower() in MONTHS:
        return (int(m.group(2)), MONTHS[m.group(1).lower()], None)
    m = re.search(r"\b(\d{3,4})\b", t)
    if m:
        return (int(m.group(1)), None, None)
    return (None, None, None)


def row_date(v: str):
    v = v.strip()
    if not v:
        return None
    if v.upper().endswith(("BCE", "BC")):
        return (-int(v.split()[0]), None, None)
    parts = [int(x) for x in v.split("-")]
    return tuple(parts + [None] * (3 - len(parts)))


def agrees(claim, row) -> bool:
    """Does a reader's date fit the row at the row's precision?"""
    y, m, d = claim
    if y is None:
        return False
    s, e = row_date(row["start"]), row_date(row["end"]) or row_date(row["start"])
    tol = int(row["tolerance_years"] or 0)
    if not (s[0] - tol <= y <= e[0] + tol):
        return False
    prec = row["precision"]
    if prec in ("year", "circa", "contested"):
        return True
    if m is None:
        return False   # a month or day row is not confirmed by a bare year
    lo = (s[0], s[1] or 1, s[2] or 1 if prec == "day" else 1)
    hi = (e[0], e[1] or 12, e[2] or 31 if prec == "day" else 31)
    if prec == "day" and d is None:
        return False
    c = (y, m, d or 1) if prec == "day" else (y, m, 1)
    c2 = (y, m, d or 31) if prec == "day" else (y, m, 31)
    return not (c2 < lo or c > hi)


def check(vid: str, index: dict, rows: dict, passages: dict) -> list[str]:
    path = VDIR / f"{vid}.out.jsonl"
    if not path.exists():
        return ["no output file"]
    problems, seen = [], set()
    for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            r = json.loads(line)
        except json.JSONDecodeError as e:
            problems.append(f"line {n}: not JSON ({e})")
            continue
        rid = r.get("id")
        where = f"line {n} {rid}"
        if rid not in index[vid]:
            problems.append(f"{where}: id not in this batch")
            continue
        if rid in seen:
            problems.append(f"{where}: duplicate")
        seen.add(rid)
        v = r.get("verdict")
        if v not in VERDICTS:
            problems.append(f"{where}: verdict {v!r}")
            continue
        books = r.get("books")
        if not isinstance(books, list):
            problems.append(f"{where}: books must be a list")
            continue
        if v != "unsupported" and not books:
            problems.append(f"{where}: {v} needs at least one book entry")
        cands = passages.get(rid, {})
        for b in books:
            p, q = str(b.get("p")), b.get("quote") or ""
            if p not in cands:
                problems.append(f"{where}: passage {p} is not one of this row's passages")
                continue
            if norm(q) not in norm(cands[p]):
                problems.append(f"{where}: quote not found word for word in P{p}: {q[:80]!r}")
            nw = len(q.split())
            if nw < 6 or nw > 50:
                problems.append(f"{where}: quote is {nw} words; give 8-40")
            if not b.get("date"):
                problems.append(f"{where}: P{p} has no date")
            elif v == "confirmed" and not agrees(parse_date(b["date"]), rows[rid]):
                problems.append(f"{where}: confirmed, but P{p}'s date {b['date']!r} does not match the row "
                                f"({rows[rid]['start']}{'–' + rows[rid]['end'] if rows[rid]['end'] else ''}, "
                                f"{rows[rid]['precision']}, ±{rows[rid]['tolerance_years'] or 0})")
        if v in ("corrected", "disputed"):
            sg = r.get("suggest")
            if not isinstance(sg, dict) or not sg.get("start") or sg.get("precision") not in (
                    "day", "month", "year", "circa", "contested"):
                problems.append(f"{where}: {v} needs suggest with start and precision")
            else:
                try:
                    row_date(sg["start"]); row_date(sg.get("end") or "")
                except ValueError:
                    problems.append(f"{where}: suggest dates must look like 1946-06-24, 1946-06, 1946 or 321 BCE")
        if not (r.get("why") or "").strip():
            problems.append(f"{where}: why missing")
    for rid in index[vid]:
        if rid not in seen:
            problems.append(f"{rid}: no line")
    return problems


def main() -> int:
    if "--dir" in sys.argv:
        i = sys.argv.index("--dir")
        del sys.argv[i:i + 2]
    index = json.loads((VDIR / "index.json").read_text())
    passages = json.loads((VDIR / "passages.json").read_text())
    rows = {r["id"]: r for r in csv.DictReader(open(TIMELINE, encoding="utf-8"))}
    if len(sys.argv) > 1 and sys.argv[1] == "--all":
        from collections import Counter
        done, broken, todo, counts = [], [], [], Counter()
        for vid in index:
            p = check(vid, index, rows, passages)
            if p == ["no output file"]:
                todo.append(vid)
            elif p:
                broken.append(vid)
            else:
                done.append(vid)
                for line in (VDIR / f"{vid}.out.jsonl").read_text().splitlines():
                    if line.strip():
                        counts[json.loads(line)["verdict"]] += 1
        print(f"done {len(done)}/{len(index)}; broken {len(broken)} {' '.join(broken)}; not started {len(todo)}")
        print("verdicts:", dict(counts))
        return 0 if not broken and not todo else 1
    vid = sys.argv[1] if len(sys.argv) > 1 else ""
    if vid not in index:
        print("give a batch id like v10, or --all")
        return 2
    problems = check(vid, index, rows, passages)
    for p in problems[:40]:
        print(p)
    print(f"{vid}: {len(index[vid])} rows, {len(problems)} problems")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
