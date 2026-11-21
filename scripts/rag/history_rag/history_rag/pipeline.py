"""End-to-end: plan -> retrieve -> answer -> check dates.  python -m history_rag.pipeline "question"

Use this as a reference for wiring the pieces into your own app."""
from __future__ import annotations

import sys
from dataclasses import dataclass

from .config import Settings
from .prompts import build_answer_messages
from .retrieve import Retriever, RetrievalResult, build_retriever, plan_query
from .timeline import DateIssue, Timeline, check_answer


@dataclass
class AnswerResult:
    answer: str
    retrieval: RetrievalResult
    date_issues: list[DateIssue]
    dated_claims: int
    unmatched_claims: int


def answer_question(question: str, llm, retriever: Retriever, timeline: Timeline,
                    allow_outside_knowledge: bool = True, style: str = "",
                    answer_extra_body: dict | None = {}) -> AnswerResult:
    plan = plan_query(question, llm, timeline)
    retrieval = retriever.retrieve(plan)
    events = timeline.events_for(plan.topics, plan.periods, plan.subjects)
    messages = build_answer_messages(plan, retrieval.hits, events, allow_outside_knowledge, style)
    answer = llm.text(messages, extra_body=answer_extra_body)
    issues, n, unmatched = check_answer(answer, timeline, llm, topics=plan.topics)
    return AnswerResult(answer, retrieval, issues, n, unmatched)


def main(argv: list[str] | None = None) -> int:
    from .llm import ChatLLM

    argv = sys.argv[1:] if argv is None else argv
    if not argv:
        print('usage: python -m history_rag.pipeline "question"')
        return 2
    s = Settings.from_env()
    res = answer_question(" ".join(argv), ChatLLM(s), build_retriever(s), Timeline.load(s.timeline_path))
    print(res.answer)
    print("\n" + "-" * 70)
    print(f"{len(res.retrieval.hits)} sources; {res.dated_claims} dated claims checked, "
          f"{len(res.date_issues)} mismatches, {res.unmatched_claims} not in the timeline")
    for i in res.date_issues:
        print(i)
    return 0


if __name__ == "__main__":
    sys.exit(main())
