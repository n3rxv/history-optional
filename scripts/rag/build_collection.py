"""Build the tagged collection (book_chunks_v2) from the live one plus the tagging output.

For every passage that has a valid tag line in work/tags/:
  - the dense vector is copied from book_chunks (no re-embedding, no API spend)
  - a BM25 keyword vector is built from heading + context + text (sparse.py)
  - the payload gains subject, years, topics, the one-line context, a heading and an
    OCR-quality score, all indexed for filtering

The live collection is never written to. The site switches over by setting
QDRANT_COLLECTION=book_chunks_v2, and switches back by unsetting it.

    python3 scripts/rag/build_collection.py              # every tagged batch
    python3 scripts/rag/build_collection.py --batches b210 b211
    python3 scripts/rag/build_collection.py --recreate   # drop and rebuild v2 first
"""
from __future__ import annotations

import argparse
import json
import statistics
import sys
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "history_rag"))
from history_rag.ingest import ocr_quality  # noqa: E402
from history_rag.timeline import _fmt_years  # noqa: E402

from check_tags import check  # noqa: E402
from qdrant_io import WORK, qdrant  # noqa: E402
from sparse import doc_vector, tokens  # noqa: E402

SOURCE, TARGET = "book_chunks", "book_chunks_v2"
SUBJECT_SHORT = {"ancient_india": "Ancient India", "medieval_india": "Medieval India",
                 "modern_india": "Modern India", "modern_world": "Modern World"}
INDEXES = {"book_title": "keyword", "subject": "keyword", "topics": "keyword",
           "year_start": "integer", "year_end": "integer", "ocr_quality": "float"}


def ensure_collection(recreate: bool) -> None:
    names = {c["name"] for c in qdrant("GET", "/collections")["result"]["collections"]}
    if TARGET in names and recreate:
        qdrant("DELETE", f"/collections/{TARGET}")
        names.discard(TARGET)
        print(f"dropped {TARGET}")
    if TARGET not in names:
        qdrant("PUT", f"/collections/{TARGET}", {
            "vectors": {"dense": {"size": 1024, "distance": "Cosine"}},
            "sparse_vectors": {"bm25": {"modifier": "idf"}},
            "on_disk_payload": True,
        })
        for field, schema in INDEXES.items():
            qdrant("PUT", f"/collections/{TARGET}/index?wait=true", {"field_name": field, "field_schema": schema})
        print(f"created {TARGET} with indexes on {', '.join(INDEXES)}")


def load_tags(batches: list[str], index: dict) -> dict[int, dict]:
    tags: dict[int, dict] = {}
    for bid in batches:
        path = WORK / "tags" / f"{bid}.jsonl"
        problems = check(bid, index[bid], path)
        if problems:
            print(f"  skip {bid}: {len(problems)} problems (run check_tags.py {bid})")
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                r = json.loads(line)
                tags[r["id"]] = r
    return tags


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--batches", nargs="*")
    ap.add_argument("--recreate", action="store_true")
    ap.add_argument("--provisional", action="store_true",
                    help="also load untagged passages, tagged from their book (registry subject and period, no topics)")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--skip-existing", action="store_true",
                    help="leave points already in the target with the same tagged state alone")
    args = ap.parse_args()

    index = json.loads((WORK / "batches" / "index.json").read_text(encoding="utf-8"))
    batches = args.batches or sorted(index)
    tags = load_tags(batches, index)
    if not tags:
        raise SystemExit("no valid tagged batches")

    registry = yaml.safe_load((HERE / "books_registry.yaml").read_text(encoding="utf-8"))["books"]
    passages = {}
    for line in open(WORK / "passages.jsonl", encoding="utf-8"):
        r = json.loads(line)
        if r["id"] in tags:
            passages[r["id"]] = r
        elif args.provisional:
            # Until its batch is tagged, a passage carries its book's first subject and whole
            # period: searchable, filtered by syllabus part, and never excluded by years.
            meta = registry[r["book_title"]]
            tags[r["id"]] = {"id": r["id"], "s": meta["subjects"][0], "y0": meta["period"][0],
                             "y1": meta["period"][1], "t": [], "c": "", "provisional": True}
            passages[r["id"]] = r
    print(f"{sum(1 for t in tags.values() if not t.get('provisional'))} tagged, "
          f"{sum(1 for t in tags.values() if t.get('provisional'))} provisional passages")

    # avgdl must describe the whole corpus, not just the batches in this run, or the
    # BM25 weights of an incremental build would not match those of a full one.
    lengths = []
    for line in open(WORK / "passages.jsonl", encoding="utf-8"):
        lengths.append(len(tokens(json.loads(line)["text"])) + 40)   # + heading and context, roughly
    avgdl = statistics.mean(lengths)

    ensure_collection(args.recreate)
    ids = sorted(passages)
    if args.skip_existing:
        have, offset = {}, None
        while True:
            body = {"limit": 1000, "with_payload": ["tagged"], "with_vector": False}
            if offset is not None:
                body["offset"] = offset
            res = qdrant("POST", f"/collections/{TARGET}/points/scroll", body)["result"]
            have.update({p["id"]: p["payload"].get("tagged", True) for p in res["points"]})
            offset = res.get("next_page_offset")
            if offset is None:
                break
        ids = [i for i in ids if have.get(i) != (not tags[i].get("provisional"))]
        print(f"{len(ids)} points to write ({len(have)} already in {TARGET})")
    def write(part: list[int]) -> int:
        # Vectors are fetched 32 at a time: a 1.5 MB response kept arriving truncated.
        vectors = {}
        for j in range(0, len(part), 32):
            got = qdrant("POST", f"/collections/{SOURCE}/points",
                         {"ids": part[j:j + 32], "with_vector": True, "with_payload": False})
            vectors.update({p["id"]: p["vector"] for p in got["result"]})
        points = []
        for pid in part:
            p, t = passages[pid], tags[pid]
            vec = vectors.get(pid)
            if vec is None:
                print(f"  {pid}: no vector in {SOURCE}, skipped")
                continue
            header = (p["book_title"] if t.get("provisional")
                      else f"{p['book_title']} | {SUBJECT_SHORT[t['s']]} | {_fmt_years(t['y0'], t['y1'])}")
            points.append({
                "id": pid,
                "vector": {"dense": vec, "bm25": doc_vector(f"{header} {t['c']} {p['text']}", avgdl)},
                "payload": {
                    "text": p["text"], "book_title": p["book_title"], "author": p["author"],
                    "subject": t["s"], "year_start": t["y0"], "year_end": t["y1"], "topics": t["t"],
                    "context": t["c"], "header": header, "ocr_quality": ocr_quality(p["text"]),
                    "tagged": not t.get("provisional"),
                },
            })
        qdrant("PUT", f"/collections/{TARGET}/points?wait=true", {"points": points})
        return len(points)

    from concurrent.futures import ThreadPoolExecutor
    done = 0
    parts = [ids[i:i + 64] for i in range(0, len(ids), 64)]
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for n in pool.map(write, parts):
            done += n
            if done % 640 < 64 or done == len(ids):
                print(f"  upserted {done}/{len(ids)}", flush=True)
    info = qdrant("GET", f"/collections/{TARGET}")["result"]
    print(f"{TARGET}: {info.get('points_count')} points, status {info['status']}")


if __name__ == "__main__":
    main()
