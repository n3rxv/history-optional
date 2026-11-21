"""Write the data files the site reads at chat time.

  lib/rag/timeline.json      events and topics from the curated timeline (history_rag/.../timeline.csv)
  lib/rag/topicVectors.json  one voyage-4-lite query embedding per topic, int8-quantised, so a
                             question's own embedding can be matched to timeline topics without
                             an extra model call

Rerun after every edit to timeline.csv:   python3 scripts/rag/build_runtime_data.py
"""
from __future__ import annotations

import base64
import json
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "history_rag"))
from history_rag.timeline import Timeline  # noqa: E402

from qdrant_io import REPO, env  # noqa: E402

OUT = REPO / "lib" / "rag"


def topic_text(tl: Timeline, tid: str) -> str:
    rows = [e for e in tl.events if e.topic == tid]
    names = "; ".join(e.name for e in rows)
    summaries = " ".join(e.summary for e in rows if e.summary)
    return f"{tid.replace('_', ' ')}. {names}. {summaries}"[:1500]


def embed(texts: list[str]) -> list[list[float]]:
    req = urllib.request.Request(
        "https://api.voyageai.com/v1/embeddings",
        json.dumps({"model": "voyage-4-lite", "input": texts, "input_type": "query"}).encode(),
        {"Content-Type": "application/json", "Authorization": "Bearer " + env("VOYAGE_API_KEY")})
    data = json.load(urllib.request.urlopen(req, timeout=120))
    return [d["embedding"] for d in sorted(data["data"], key=lambda d: d["index"])]


def quantise(vec: list[float]) -> dict:
    scale = max(abs(x) for x in vec) / 127 or 1.0
    raw = bytes((round(x / scale) & 0xFF) for x in vec)
    return {"scale": scale, "q": base64.b64encode(raw).decode()}


def main() -> None:
    tl = Timeline.load(HERE / "history_rag" / "history_rag" / "data" / "timeline.csv")
    problems = tl.validate()
    if problems:
        raise SystemExit("timeline.csv has problems:\n" + "\n".join(problems))
    OUT.mkdir(parents=True, exist_ok=True)

    events = [{
        "id": e.id, "topic": e.topic, "subjects": e.subjects, "name": e.name, "aliases": e.aliases,
        "y0": e.year_range[0], "y1": e.year_range[1],
        "start": [e.start.year, e.start.month, e.start.day],
        "end": [e.end.year, e.end.month, e.end.day] if e.end else None,
        "precision": e.precision, "tolerance": e.tolerance, "summary": e.summary, "note": e.note,
        "verified": e.verified, "display": e.display_date(),
    } for e in tl.events]
    topics = [{"id": t.id, "y0": t.year_lo, "y1": t.year_hi, "subjects": sorted(t.subjects),
               "maxTolerance": t.max_tolerance, "names": t.names} for t in tl.topics.values()]
    (OUT / "timeline.json").write_text(json.dumps({"events": events, "topics": topics}, ensure_ascii=False), encoding="utf-8")

    ids = [t["id"] for t in topics]
    vectors = []
    for i in range(0, len(ids), 64):
        vectors += embed([topic_text(tl, t) for t in ids[i:i + 64]])
    (OUT / "topicVectors.json").write_text(json.dumps(
        {"model": "voyage-4-lite", "topics": {t: quantise(v) for t, v in zip(ids, vectors)}}), encoding="utf-8")
    print(f"wrote {len(events)} events, {len(topics)} topics and their vectors to {OUT}")


if __name__ == "__main__":
    main()
