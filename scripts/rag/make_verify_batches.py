"""Batches for checking every timeline row against the book corpus.

For each row of timeline.csv, find the book passages most likely to state its date:
passages that name the event (words from its name and aliases) and mention its year,
preferring passages whose tags put them on the row's topic and years. Each candidate
is cut to a window around the year so a reader sees the sentence that dates it.

    python3 scripts/rag/make_verify_batches.py      -> work/verify/v01.txt ... + index.json
"""
from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORK = HERE / "work"
TIMELINE = HERE / "history_rag" / "history_rag" / "data" / "timeline.csv"
PER_BATCH = 24
MONTHS = ["Jan(?:uary)?", "Feb(?:ruary)?", "Mar(?:ch)?", "Apr(?:il)?", "May", "June?", "July?", "Aug(?:ust)?",
          "Sep(?:t(?:ember)?)?", "Oct(?:ober)?", "Nov(?:ember)?", "Dec(?:ember)?"]
PER_EVENT = 5
WINDOW = 700

STOP = set("""a an the of and in on at to for from by with as is was were be its it this that his her their
into over under after before during about against between first second third new great act war battle treaty
plan begins begin ends end signed founded foundation death accession reign rise fall revolt movement mission
conference statement resolution party india indian british empire state kingdom""".split())


def words(s: str) -> list[str]:
    return [w for w in re.findall(r"[a-z][a-z'-]{2,}", s.lower()) if w not in STOP]


def year_patterns(y: int) -> list[re.Pattern]:
    if y < 0:
        n = -y
        return [re.compile(rf"\b{n}\s*(?:B\.?\s?C\.?E?|BCE)\b", re.I), re.compile(rf"\bc\.\s*{n}\b")]
    return [re.compile(rf"(?<![\d,.]){y}(?![\d])")]


def row_year(v: str) -> int:
    v = v.strip()
    if v.upper().endswith(("BCE", "BC")):
        return -int(v.split()[0])
    return int(v.split("-")[0])


def main() -> None:
    import sys
    only = set(sys.argv[sys.argv.index("--rows") + 1].split(",")) if "--rows" in sys.argv else None
    second = only is not None
    global PER_EVENT
    if second:
        PER_EVENT = 8
    rows = [r for r in csv.DictReader(open(TIMELINE, encoding="utf-8")) if only is None or r["id"] in only]
    passages = {}
    for line in open(WORK / "passages.jsonl", encoding="utf-8"):
        r = json.loads(line)
        passages[r["id"]] = r
    tags = {}
    for f in (WORK / "tags").glob("b*.jsonl"):
        for line in f.read_text(encoding="utf-8").splitlines():
            if line.strip():
                t = json.loads(line)
                tags[t["id"]] = t

    from concurrent.futures import ThreadPoolExecutor
    from qdrant_io import qdrant
    from sparse import query_vector

    by_topic: dict[str, list[int]] = defaultdict(list)
    for pid, t in tags.items():
        for tp in t["t"]:
            by_topic[tp].append(pid)

    def bm25(r, filtered=True):
        y0 = row_year(r["start"]); y1 = row_year(r["end"]) if r["end"] else y0
        tol = int(r["tolerance_years"] or 0) + 2
        body = {"query": query_vector(f"{r['name']} {r['aliases'].replace('|', ' ')} {r['summary']}"),
                "using": "bm25", "limit": 40, "with_payload": False}
        if filtered:
            body["filter"] = {"must": [{"key": "year_start", "range": {"lte": y1 + tol}},
                                       {"key": "year_end", "range": {"gte": y0 - tol}}]}
        return [p["id"] for p in qdrant("POST", "/collections/book_chunks_v2/points/query", body)["result"]["points"]]

    with ThreadPoolExecutor(max_workers=4) as pool:
        ranked = list(pool.map(bm25, rows))

    out_dir = WORK / ("verify2" if second else "verify")
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("v*.txt"):
        old.unlink()
    blocks, meta = [], {}
    for r, hits in zip(rows, ranked):
        y0 = row_year(r["start"])
        pats = year_patterns(y0)
        dm = re.match(r"^\d{4}-(\d{2})(?:-(\d{2}))?$", r["start"])
        day_re = mon_re = None
        if dm:
            mon = MONTHS[int(dm.group(1)) - 1]
            mon_re = re.compile(rf"\b{mon}\b", re.I)
            if dm.group(2):
                d = int(dm.group(2))
                day_re = re.compile(rf"\b{d}(?:st|nd|rd|th)?\s+(?:of\s+)?{mon}\b|\b{mon}\.?\s+{d}(?:st|nd|rd|th)?\b", re.I)
        def pick(cands):
            scored = []
            for pid, bonus in cands.items():
                p = passages.get(pid)
                if not p:
                    continue
                t = tags.get(pid, {})
                in_years = t and t["y0"] <= y0 <= t["y1"]
                dated = (day_re and day_re.search(p["text"])) or (mon_re and mon_re.search(p["text"]))
                # A passage must write the year, or be tagged to it and give the day or month:
                # books often write "on 24 June" in a chapter whose year is stated earlier.
                if not (any(pt.search(p["text"]) for pt in pats) or (in_years and dated)):
                    continue
                sc = bonus
                if day_re and day_re.search(p["text"]): sc += 6
                elif mon_re and mon_re.search(p["text"]): sc += 2
                if r["topic"] in tags.get(pid, {}).get("t", []): sc += 3
                scored.append((sc, pid))
            scored.sort(key=lambda x: -x[0])
            out, books = [], defaultdict(int)
            for sc, pid in scored:
                b = passages[pid]["book_title"]
                if books[b] >= 2: continue
                books[b] += 1; out.append(pid)
                if len(out) >= PER_EVENT: break
            return out
        cands = {pid: (40 - i) / 10 for i, pid in enumerate(hits)}
        if second and r["end"]:
            # A span's end: also take passages that write the end year.
            ye = row_year(r["end"])
            for pid, t in tags.items():
                if r["topic"] in t["t"] and re.search(rf"(?<![\d]){abs(ye)}(?![\d])", passages.get(pid, {}).get("text", "")):
                    cands.setdefault(pid, 1.0)
        for pid in by_topic.get(r["topic"], []):
            cands.setdefault(pid, 0.0)
        picks = pick(cands)
        if not picks:       # tags can carry wrong years: one try without the year filter
            picks = pick({pid: (40 - i) / 10 for i, pid in enumerate(bm25(r, filtered=False))})
        lines = [f"### EVENT {r['id']}",
                 f"name: {r['name']}" + (f" | also: {r['aliases']}" if r["aliases"] else ""),
                 f"row date: start {r['start']}" + (f", end {r['end']}" if r["end"] else "") +
                 f"; precision {r['precision']}; tolerance {r['tolerance_years'] or 0} years",
                 f"summary: {r['summary']}" + (f" | note: {r['note']}" if r["note"] else "")]
        if not picks:
            lines.append("(no passage in the corpus names this event with its year)")
        for pid in picks:
            prev = passages.get(pid - 1)
            text = passages[pid]["text"]
            if second and prev and prev["book_title"] == passages[pid]["book_title"]:
                # The passage before, as context; the quote may come from either.
                text = prev["text"][-900:] + " " + text
            lines.append(f"[P{pid}] {passages[pid]['book_title']}: {re.sub(r'\\s+', ' ', text)}")
        blocks.append("\n".join(lines))
        meta[r["id"]] = {str(pid): (passages[pid - 1]["text"][-900:] + " " + passages[pid]["text"]
                                    if second and passages.get(pid - 1) and passages[pid - 1]["book_title"] == passages[pid]["book_title"]
                                    else passages[pid]["text"]) for pid in picks}

    ids = [r["id"] for r in rows]
    index_out = {}
    for i in range(0, len(blocks), PER_BATCH):
        vid = f"v{i // PER_BATCH + 1:02d}"
        (out_dir / f"{vid}.txt").write_text("\n\n".join(blocks[i:i + PER_BATCH]) + "\n", encoding="utf-8")
        index_out[vid] = ids[i:i + PER_BATCH]
    (out_dir / "index.json").write_text(json.dumps(index_out, indent=1), encoding="utf-8")
    (out_dir / "passages.json").write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")
    none = sum(1 for m in meta.values() if not m)
    print(f"{len(rows)} rows in {len(index_out)} batches; {none} rows with no candidate passage")


if __name__ == "__main__":
    main()
