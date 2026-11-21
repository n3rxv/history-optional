"""Query planning (rewriting) and filtered hybrid retrieval.

plan_query():  exam question -> subjects, periods, timeline topics, 3-5 factual search queries,
               and the claims the question quotes (so the answer treats them as claims, not facts).
Retriever:     for each factual query: vector search + BM25, both restricted to the plan's subjects,
               periods and minimum OCR quality -> reciprocal-rank fusion -> cross-encoder rerank
               -> topic boost -> score threshold -> top_k. Relaxes the period filter once if too few
               passages survive.

CLI:  python -m history_rag.retrieve "question text"
"""
from __future__ import annotations

import math
import re
import sys
from dataclasses import dataclass, field

from .config import PERIOD_PAD, RELAX_PAD, SUBJECTS, Settings
from .store import Filter
from .timeline import Timeline

# --------------------------------------------------------------------------- plan
PLAN_SYSTEM = """TASK: plan_query
You prepare search plans for a retrieval system that answers UPSC History Optional questions from textbooks.
Return JSON only:
{
 "subjects": [subject keys],
 "periods": [[start_year, end_year], ...],
 "topics": [topic ids],
 "comparative": bool,
 "queries": [string, ...],
 "claims_to_examine": [string, ...]
}
Rules:
- subjects: from SUBJECTS. Use more than one only if the question really spans them.
- periods: the year ranges the question is about (BCE years negative). Keep them tight: the events
  themselves, not their whole era. Several ranges if the question compares different periods.
- topics: ids from TOPICS that the question is about (0-6). Only ids from the list.
- comparative: true if the question compares or links events from clearly different periods.
- queries: 3-5 short factual search queries in plain English. Each names the specific event, actors
  and year, and targets one sub-issue the answer needs (e.g. the plan's terms; one party's response;
  the other party's response; the outcome). Do NOT copy rhetorical or evaluative words from the question
  (e.g. "half-baked", "stratagem", "critically examine"): they match unrelated passages.
- claims_to_examine: if the question quotes or paraphrases a historian's claim, restate each claim
  neutrally. These are claims to test, not facts. Empty list if none."""


@dataclass
class QueryPlan:
    question: str
    subjects: list[str]
    periods: list[tuple[int, int]]
    topics: list[str]
    comparative: bool
    queries: list[str]
    claims_to_examine: list[str] = field(default_factory=list)
    fallback: bool = False   # True if the LLM plan failed and we searched with the raw question

    def filter(self, s: Settings, relax: bool = False) -> Filter:
        periods = None
        if self.periods:
            periods = []
            for lo, hi in self.periods:
                pad = max(PERIOD_PAD.get(sub, 1) + (RELAX_PAD.get(sub, 5) if relax else 0)
                          for sub in (self.subjects or ["modern_india"]))
                periods.append((lo - pad, hi + pad))
            periods = merge_ranges(periods)
        return Filter(subjects=self.subjects or None, periods=periods, min_ocr_quality=s.min_ocr_quality)


def merge_ranges(ranges: list[tuple[int, int]]) -> list[tuple[int, int]]:
    out: list[tuple[int, int]] = []
    for lo, hi in sorted(ranges):
        if out and lo <= out[-1][1] + 1:
            out[-1] = (out[-1][0], max(out[-1][1], hi))
        else:
            out.append((lo, hi))
    return out


def plan_query(question: str, llm, timeline: Timeline) -> QueryPlan:
    subjects_txt = "\n".join(f"{k}: {v}" for k, v in SUBJECTS.items())
    user = (f"SUBJECTS:\n{subjects_txt}\n\nTOPICS (id (years; subjects): example events):\n"
            f"{timeline.topic_catalogue()}\n\nQUESTION:\n{question}")
    try:
        raw = llm.json(PLAN_SYSTEM, user, max_tokens=900)
    except Exception as e:
        print(f"[plan failed, searching with the raw question] {e}", file=sys.stderr)
        return QueryPlan(question, [], [], [], False, [question], [], fallback=True)
    return validate_plan(raw, question, timeline)


def validate_plan(raw: dict, question: str, timeline: Timeline) -> QueryPlan:
    subjects = [x for x in raw.get("subjects") or [] if x in SUBJECTS]
    topics = [x for x in raw.get("topics") or [] if x in timeline.topics][:6]
    periods: list[tuple[int, int]] = []
    for p in raw.get("periods") or []:
        try:
            lo, hi = int(p[0]), int(p[1])
            periods.append((min(lo, hi), max(lo, hi)))
        except (TypeError, ValueError, IndexError):
            continue
    # The timeline's own dates for the chosen topics are more reliable than the model's years.
    for t in topics:
        info = timeline.topics[t]
        periods.append((info.year_lo - info.max_tolerance, info.year_hi + info.max_tolerance))
        if not subjects:
            subjects = sorted(info.subjects)
    periods = merge_ranges(periods)
    queries = [q.strip() for q in raw.get("queries") or [] if isinstance(q, str) and q.strip()][:5]
    if not queries:
        queries = [question]
    claims = [c.strip() for c in raw.get("claims_to_examine") or [] if isinstance(c, str) and c.strip()]
    return QueryPlan(question, subjects, periods, topics, bool(raw.get("comparative")), queries, claims)


# --------------------------------------------------------------------------- BM25
_STOP = set("""a an the of and or in on at to for from by with as is was were be been are it its this that these those
which who whom whose what when where why how not no but if then than so such into over under after before during
about against between through their there they them he she his her we you our your i also had has have do did""".split())


def tokenize(text: str) -> list[str]:
    return [w for w in re.findall(r"[a-z0-9]+", text.lower()) if w not in _STOP and len(w) > 1]


class BM25Index:
    def __init__(self, chunks: list[dict]):
        from rank_bm25 import BM25Okapi

        self.chunks = chunks
        # Index header + text so book, chapter and section titles also match.
        self.bm25 = BM25Okapi([tokenize(c["header"] + " " + c.get("context", "") + " " + c["text"])
                               for c in chunks])

    def search(self, query: str, flt: Filter | None, n: int) -> list[tuple[str, float]]:
        scores = self.bm25.get_scores(tokenize(query))
        order = sorted(range(len(scores)), key=lambda i: -scores[i])
        out = []
        for i in order:
            if scores[i] <= 0:
                break
            c = self.chunks[i]
            if flt is None or flt.matches(c):
                out.append((c["id"], float(scores[i])))
                if len(out) >= n:
                    break
        return out


# --------------------------------------------------------------------------- reranker
class CrossEncoderReranker:
    def __init__(self, model_name: str):
        from sentence_transformers import CrossEncoder

        self.model = CrossEncoder(model_name)

    def score(self, pairs: list[tuple[str, str]]) -> list[float]:
        raw = [float(x) for x in self.model.predict(pairs)]
        if any(x < 0 or x > 1 for x in raw):        # logits -> probabilities
            raw = [1 / (1 + math.exp(-x)) for x in raw]
        return raw


# --------------------------------------------------------------------------- retriever
@dataclass
class Hit:
    chunk: dict
    score: float
    rrf: float
    topic_match: bool


@dataclass
class RetrievalResult:
    plan: QueryPlan
    hits: list[Hit]
    relaxed: bool
    filter_used: Filter


class Retriever:
    def __init__(self, s: Settings, store, chunks: list[dict], reranker=None):
        self.s, self.store, self.reranker = s, store, reranker
        self.by_id = {c["id"]: c for c in chunks}
        self.bm25 = BM25Index(chunks)

    def _candidates(self, plan: QueryPlan, flt: Filter) -> dict[str, float]:
        rrf: dict[str, float] = {}
        for q in plan.queries:
            for results in (self.store.search(q, flt, self.s.candidates), self.bm25.search(q, flt, self.s.candidates)):
                for rank, (cid, _) in enumerate(results):
                    if cid in self.by_id:
                        rrf[cid] = rrf.get(cid, 0.0) + 1.0 / (60 + rank + 1)
        return rrf

    def _rank(self, plan: QueryPlan, rrf: dict[str, float]) -> list[Hit]:
        ids = sorted(rrf, key=lambda c: -rrf[c])[: self.s.candidates]
        topics = set(plan.topics)
        if self.reranker is not None and ids:
            pairs = [(q, self.by_id[c]["header"] + "\n" + self.by_id[c]["text"]) for c in ids for q in plan.queries]
            scores = self.reranker.score(pairs)
            nq = len(plan.queries)
            base = {c: max(scores[i * nq:(i + 1) * nq]) for i, c in enumerate(ids)}
        else:
            top = max(rrf.values(), default=1.0)
            base = {c: rrf[c] / top for c in ids}   # normalised fusion score when no reranker
        hits = []
        for c in ids:
            match = bool(topics & set(self.by_id[c].get("topics", [])))
            hits.append(Hit(self.by_id[c], base[c] + (self.s.topic_boost if match else 0.0), rrf[c], match))
        hits.sort(key=lambda h: -h.score)
        if self.reranker is not None:
            hits = [h for h in hits if h.score >= self.s.rerank_threshold]
        return hits[: self.s.top_k]

    def retrieve(self, plan: QueryPlan) -> RetrievalResult:
        flt = plan.filter(self.s)
        hits = self._rank(plan, self._candidates(plan, flt))
        relaxed = False
        if len(hits) < self.s.min_results and plan.periods:
            flt = plan.filter(self.s, relax=True)
            hits = self._rank(plan, self._candidates(plan, flt))
            relaxed = True
        return RetrievalResult(plan, hits, relaxed, flt)


def build_retriever(s: Settings) -> Retriever:
    from .store import ChromaStore, get_embedder, read_chunks

    reranker = CrossEncoderReranker(s.rerank_model) if s.rerank_model else None
    return Retriever(s, ChromaStore(s, get_embedder(s)), read_chunks(s.chunks_path), reranker)


# --------------------------------------------------------------------------- CLI
def main(argv: list[str] | None = None) -> int:
    from .llm import ChatLLM

    argv = sys.argv[1:] if argv is None else argv
    if not argv:
        print('usage: python -m history_rag.retrieve "question"')
        return 2
    question = " ".join(argv)
    s = Settings.from_env()
    timeline = Timeline.load(s.timeline_path)
    plan = plan_query(question, ChatLLM(s), timeline)
    print("PLAN")
    print(f"  subjects: {plan.subjects}\n  periods: {plan.periods}\n  topics: {plan.topics}")
    print(f"  comparative: {plan.comparative}\n  claims to examine: {plan.claims_to_examine}")
    for q in plan.queries:
        print(f"  query: {q}")
    res = build_retriever(s).retrieve(plan)
    print(f"\nFILTER {res.filter_used}{'  (relaxed)' if res.relaxed else ''}")
    for i, h in enumerate(res.hits, 1):
        c = h.chunk
        print(f"\n[S{i}] score={h.score:.3f} topic_match={h.topic_match} ocr={c['ocr_quality']}")
        print(f"  {c['header']}  (pp. {c['page_start']}-{c['page_end']})")
        print(f"  {c['context']}")
        print(f"  {c['text'][:240]}...")
    return 0


if __name__ == "__main__":
    sys.exit(main())
