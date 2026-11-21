"""Offline tests. The end-to-end test rebuilds the failure from the HistoryOptional.xyz answer:
a Cripps (1942) passage and a US 'Congress' passage competing with Cabinet Mission (1946) passages."""
from __future__ import annotations

from pathlib import Path

import pymupdf
import pytest

from history_rag.config import Settings
from history_rag.ingest import (build_chunks, chunk_pieces, load_registry, ocr_quality,
                                strip_running_heads, validate_tags, write_chunks)
from history_rag.prompts import build_answer_messages
from history_rag.retrieve import Retriever, plan_query, validate_plan
from history_rag.store import ChromaStore, Filter
from history_rag.timeline import (Timeline, check_answer, compare_claim, parse_date_text)

from .fakes import FakeLLM, HashEmbedder

HEAD = "TEST MODERN INDIA"

CRIPPS_1 = ("In March 1942 Stafford Cripps arrived in Delhi with a draft declaration approved by the War Cabinet. "
            "It promised India post-war Dominion Status with the right to leave the Commonwealth. "
            "A constitution-making body would be elected by the provincial legislatures after the war. "
            "Any province unwilling to accept the new constitution could stay out of the Union. "
            "Congress objected that nothing real was offered during the war itself. ")
CRIPPS_2 = ("The Muslim League also turned the scheme down. Its leaders said the plan did not clearly concede "
            "Pakistan and that the right of Muslims to decide their own future was not accepted. "
            "Cripps left India in April 1942 without an agreement, and the Quit India resolution followed in August. ")
CMP_1 = ("The Cabinet Mission Plan of 16 May 1946 proposed a Union of India dealing with defence, foreign "
         "affairs and communications. Provinces were placed in Sections A, B and C, which would meet "
         "separately to settle provincial and group constitutions. The Muslim League accepted the Plan on "
         "6 June 1946 because it saw the basis of Pakistan in compulsory grouping. ")
CMP_2 = ("On 25 June 1946 the Congress Working Committee accepted the long-term plan with its own reading of "
         "the grouping clauses but rejected the interim government proposals of 16 June. "
         "At a press conference on 10 July 1946 Nehru said that grouping would probably not happen. "
         "The League withdrew its acceptance on 29 July 1946 and called for Direct Action. ")
GARBLED = ("Tħe Ĩ Ī 1mporta t · e h. 'bl) d 'd fi S W ( ht. ch mpst Ħany ^ ® thprp unacceptaWe "
           "Plan 1946 r r Ī ĩ Ĩ e h. d 'd fi 1m cas ior pohc1es 7h3 ")
REAGAN = ("In the Congressional elections of November 1986 the Republicans lost seats and the Democrats "
          "kept control of Congress. Reagan found it hard to persuade Congress to vote for his policies "
          "in his last two years as president. ")


def _pdf(path: Path, pages: list[str], head: str) -> None:
    doc = pymupdf.open()
    for i, body in enumerate(pages, 1):
        page = doc.new_page()
        page.insert_textbox(pymupdf.Rect(50, 40, 550, 60), head, fontsize=9)
        page.insert_textbox(pymupdf.Rect(50, 80, 550, 760), body, fontsize=10)
        page.insert_textbox(pymupdf.Rect(290, 780, 320, 800), str(i), fontsize=9)
    doc.save(path)


@pytest.fixture(scope="module")
def setup(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("rag")
    _pdf(tmp / "india.pdf", [CRIPPS_1 * 2, CRIPPS_2 * 2, CMP_1 * 2, CMP_2 * 2, GARBLED * 6], HEAD)
    _pdf(tmp / "world.pdf", [REAGAN * 3, "Mid-term politics. " + REAGAN * 3,
                              "The last years of the presidency. " + REAGAN * 3], "TEST WORLD")
    (tmp / "books.yaml").write_text("""
books:
  - id: test_india
    title: "Test Modern India"
    author: "A. Author"
    subject: modern_india
    file: india.pdf
    period: [1885, 1947]
    chapters:
      - title: "The Cripps Mission"
        pages: [1, 2]
        period: [1942, 1942]
      - title: "Towards Freedom"
        pages: [3, 5]
        period: [1945, 1947]
        sections:
          - title: "The Cabinet Mission"
            pages: [3, 5]
  - id: test_world
    title: "Test World History"
    author: "B. Author"
    subject: modern_world
    file: world.pdf
    period: [1980, 1990]
  - id: skipped_book
    title: "Not yet configured"
    author: "?"
    subject: modern_india
    file: missing.pdf
    period: [TODO, TODO]
    skip: true
""")
    s = Settings(chroma_dir=str(tmp / "chroma"), chunks_path=str(tmp / "chunks.jsonl"),
                 tag_cache_path=str(tmp / "tags.jsonl"), chunk_words=60, overlap_words=15,
                 min_chunk_words=20, rerank_model=None, top_k=6, candidates=20, tag_workers=2)
    tl = Timeline.load()
    llm = FakeLLM()
    books = load_registry(tmp / "books.yaml")
    chunks = build_chunks(books, tl, llm, s)
    write_chunks(chunks, s.chunks_path)
    store = ChromaStore(s, HashEmbedder())
    store.upsert(chunks)
    return s, tl, chunks, store, llm


CMP_QUESTION = ('"... instead of rejecting the plan (Cabinet Mission Plan), they (the Congress Leadership) '
                'resorted to a half-baked legalistic stratagem to reserve their position on its long-term '
                'arrangements and accepted its short-term provisions." Critically examine.')
CMP_PLAN = {
    "subjects": ["modern_india", "not_a_subject"],
    "periods": [[1946, 1946]],
    "topics": ["cabinet_mission_1946", "invented_topic"],
    "comparative": False,
    "queries": ["Cabinet Mission Plan 1946 grouping sections Congress response",
                "Congress Working Committee June 1946 interim government proposals",
                "Muslim League withdrawal July 1946 Direct Action"],
    "claims_to_examine": ["Congress accepted the short-term provisions and reserved its position on the long-term ones."],
}


# --------------------------------------------------------------------------- timeline
def test_timeline_is_valid():
    tl = Timeline.load()
    assert tl.validate() == []
    assert len(tl.events) > 400
    assert {"ancient_india", "medieval_india", "modern_india", "modern_world"} <= {
        s for e in tl.events for s in e.subjects}


def test_parse_date_text():
    assert parse_date_text("on 25 June 1946") == (1946, 6, 25)
    assert parse_date_text("June 25, 1946") == (1946, 6, 25)
    assert parse_date_text("the 16 May statement") == (None, 5, 16)
    assert parse_date_text("c. 321 BCE") == (-321, None, None)
    assert parse_date_text("in 1192") == (1192, None, None)


def test_compare_claim_respects_precision_and_tolerance():
    tl = Timeline.load()
    cwc = tl.by_id["cwc_resolution_cmp"]                # 25 June 1946, day precision
    assert compare_claim(1946, 6, 25, cwc) is None
    assert compare_claim(1946, 6, None, cwc) is None    # "June 1946" is fine
    assert "26 June 1946" in compare_claim(1946, 6, 26, cwc)
    kalinga = tl.by_id["kalinga_war"]                   # c. 261 BCE, tolerance 3
    assert compare_claim(-262, None, None, kalinga) is None
    assert compare_claim(-250, None, None, kalinga) is not None
    swaraj = tl.by_id["swaraj_party"]                   # 1 Jan 1923, tolerance 1
    assert compare_claim(1922, 12, None, swaraj) is None


# --------------------------------------------------------------------------- ingestion
def test_ocr_quality_separates_clean_from_garbled():
    assert ocr_quality(CMP_1) > 0.9
    assert ocr_quality(GARBLED) < 0.6
    stats = {}
    out = chunk_pieces([(1, CMP_2 + GARBLED * 3)], 200, 20, 10, stats=stats)
    assert stats["dropped"] > 0 and "thprp" not in out[0][0] and "29 July 1946" in out[0][0]


def test_running_heads_and_page_numbers_removed():
    pages = [f"{HEAD}\nBody text {i} here.\n{i}" for i in range(1, 8)]
    cleaned = strip_running_heads(pages)
    assert all(HEAD not in p for p in cleaned)
    assert all(not p.strip().endswith(str(i)) for i, p in enumerate(cleaned, 1))


def test_chunking_overlap_and_pages():
    text = " ".join(f"Sentence number {i} is here." for i in range(60))
    chunks = chunk_pieces([(1, text[: len(text) // 2]), (2, text[len(text) // 2:])], 50, 10, 20)
    assert len(chunks) >= 4
    assert chunks[0][1] == 1 and chunks[-1][2] == 2
    first_tail = chunks[0][0].split(". ")[-1]
    assert first_tail.rstrip(".") in chunks[1][0]        # overlap carried into the next chunk


def test_validate_tags_rejects_bad_output():
    allowed = {"cabinet_mission_1946"}
    t = validate_tags({"year_start": "x"}, (1945, 1947), (1885, 1947), allowed, 1)
    assert (t["year_start"], t["year_end"], t["period_source"]) == (1945, 1947, "section")
    t = validate_tags({"year_start": 1700, "year_end": 1700, "topics": ["cabinet_mission_1946", "zzz"]},
                      (1945, 1947), (1885, 1947), allowed, 1)
    assert t["year_start"] == 1945 and t["topics"] == ["cabinet_mission_1946"]


def test_chunks_have_headings_tags_and_quality(setup):
    s, tl, chunks, store, llm = setup
    assert not any(c["book_id"] == "skipped_book" for c in chunks)
    cripps = [c for c in chunks if "Cripps" in c["text"]]
    cmp = [c for c in chunks if "Cabinet Mission Plan" in c["text"] or "Congress Working Committee" in c["text"]]
    assert cripps and cmp
    assert all(c["year_start"] == 1942 and "The Cripps Mission" in c["header"] for c in cripps)
    assert all(c["year_start"] == 1946 and "The Cabinet Mission" in c["header"] for c in cmp)
    assert all("cabinet_mission_1946" in c["topics"] and "bogus_topic" not in c["topics"] for c in cmp)
    assert all(HEAD not in c["text"] for c in chunks)
    assert not any("thprp" in c["text"] for c in chunks)       # garbled sentences dropped
    withdrawal = [c for c in chunks if "29 July 1946" in c["text"]]
    assert withdrawal and all(c["ocr_quality"] >= s.min_ocr_quality for c in withdrawal)
    assert all(c["embed_text"].startswith(c["header"]) for c in chunks)


def test_tag_cache_avoids_repeat_calls(setup):
    s, tl, chunks, store, _ = setup
    llm2 = FakeLLM()
    again = build_chunks(load_registry(Path(s.chunks_path).parent / "books.yaml"), tl, llm2, s)
    assert llm2.calls == []                               # every chunk came from the cache
    assert [c["id"] for c in again] == [c["id"] for c in chunks]


# --------------------------------------------------------------------------- planning & retrieval
def test_plan_validation_drops_unknown_values_and_uses_timeline_years():
    tl = Timeline.load()
    plan = validate_plan(CMP_PLAN, CMP_QUESTION, tl)
    assert plan.subjects == ["modern_india"]
    assert plan.topics == ["cabinet_mission_1946"]
    assert plan.periods == [(1946, 1946)]
    assert not any("half-baked" in q for q in plan.queries)


def test_plan_falls_back_to_raw_question_when_llm_fails():
    class Broken:
        def json(self, *a, **k):
            raise RuntimeError("boom")
    plan = plan_query("Who won at Plassey?", Broken(), Timeline.load())
    assert plan.fallback and plan.queries == ["Who won at Plassey?"] and plan.periods == []


def test_retrieval_excludes_other_events_and_garbled_text(setup):
    s, tl, chunks, store, _ = setup
    retriever = Retriever(s, store, chunks)
    plan = plan_query(CMP_QUESTION, FakeLLM(plan=CMP_PLAN), tl)
    res = retriever.retrieve(plan)
    assert res.hits and not res.relaxed
    for h in res.hits:
        c = h.chunk
        assert c["subject"] == "modern_india"
        assert c["year_start"] <= 1947 and c["year_end"] >= 1945      # 1946 +/- padding
        assert "Cripps" not in c["text"] and "Reagan" not in c["text"]
        assert c["ocr_quality"] >= s.min_ocr_quality
    assert any("25 June 1946" in h.chunk["text"] for h in res.hits)
    assert any("29 July 1946" in h.chunk["text"] for h in res.hits)


def test_unfiltered_search_would_have_returned_the_wrong_passages(setup):
    """Sanity check that the filter is doing the work: without it, Cripps/Reagan passages compete."""
    s, tl, chunks, store, _ = setup
    ids = [cid for q in CMP_PLAN["queries"] for cid, _ in store.search(q, None, 20)]
    texts = [next(c["text"] for c in chunks if c["id"] == i) for i in ids]
    assert any("Cripps" in t for t in texts) and any("Reagan" in t for t in texts)


def test_relaxes_period_filter_once_when_too_few_results(setup):
    s, tl, chunks, store, _ = setup
    plan = validate_plan({"subjects": ["modern_india"], "periods": [[1949, 1949]], "topics": [],
                          "queries": ["Cabinet Mission Plan grouping"]}, "q", tl)
    res = Retriever(s, store, chunks).retrieve(plan)
    assert res.relaxed and res.hits
    assert Filter(periods=[(1949, 1949)]).matches({"year_start": 1946, "year_end": 1946}) is False


# --------------------------------------------------------------------------- prompt & date checks
def test_answer_prompt_shows_headers_timeline_and_claims(setup):
    s, tl, chunks, store, _ = setup
    plan = validate_plan(CMP_PLAN, CMP_QUESTION, tl)
    res = Retriever(s, store, chunks).retrieve(plan)
    events = tl.events_for(plan.topics, plan.periods, plan.subjects)
    msgs = build_answer_messages(plan, res.hits, events, allow_outside_knowledge=False)
    system, user = msgs[0]["content"], msgs[1]["content"]
    assert "not evidence" in system and "Never guess a date" in system
    assert "[S1] A. Author, Test Modern India" in user
    assert "[T:cwc_resolution_cmp] 25 June 1946" in user
    assert "CLAIMS IN THE QUESTION" in user


def test_date_checker_flags_the_errors_from_the_real_answer():
    tl = Timeline.load()
    answer = ("The Congress accepted the Plan on 26 June 1946, reserving its position on grouping. "
              "The League withdrew its acceptance on 29 July 1946. "
              "The Cabinet Mission's own clarification on 16 May explained the grouping procedure.")
    claims = [
        {"sentence": "The Congress accepted the Plan on 26 June 1946, reserving its position on grouping.",
         "date_text": "26 June 1946", "event_id": "cwc_resolution_cmp", "year": 1946, "month": 6, "day": 26},
        {"sentence": "The League withdrew its acceptance on 29 July 1946.", "date_text": "29 July 1946",
         "event_id": "league_withdraws", "year": 1946, "month": 7, "day": 29},
        {"sentence": "The Cabinet Mission's own clarification on 16 May explained the grouping procedure.",
         "date_text": "16 May", "event_id": "cmp_clarification", "year": 1946, "month": 5, "day": 16,
         "year_inferred": True},
    ]
    issues, n, unmatched = check_answer(answer, tl, FakeLLM(claims=claims))
    assert n == 3 and unmatched == 0
    flagged = {i.event.id for i in issues}
    assert flagged == {"cwc_resolution_cmp", "cmp_clarification"}
    assert all(i.severity == "warning" for i in issues)          # rows not yet verified
    tl.by_id["cwc_resolution_cmp"].verified = "checked"
    issues, _, _ = check_answer(answer, tl, FakeLLM(claims=claims))
    assert {i.event.id: i.severity for i in issues}["cwc_resolution_cmp"] == "error"


def test_heuristic_checker_works_offline():
    tl = Timeline.load()
    answer = "The Battle of Plassey was fought on 23 June 1757. The Battle of Buxar was fought in 1765."
    issues, n, _ = check_answer(answer, tl, llm=None)
    assert n == 2
    assert [i.event.id for i in issues] == ["buxar"]
