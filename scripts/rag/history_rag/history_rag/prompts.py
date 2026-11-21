"""Answer prompt: shows the model each source's book/chapter/period and the curated timeline rows,
with rules that stop it using a passage about a different event, adopting the question's premise,
or inventing dates."""
from __future__ import annotations

from .retrieve import Hit, QueryPlan
from .timeline import Event

ANSWER_RULES = """You write answers for UPSC History Optional aspirants.

Evidence
1. Use only the numbered SOURCES and the TIMELINE below{outside}.
2. Every source shows its book, chapter, section and period. Use a source for a claim only if it is
   about the same event and period as the claim. A passage about a different event is not evidence,
   however similar its wording (e.g. the 1942 Cripps offer is not the 1946 Cabinet Mission Plan).
3. Take every date from the TIMELINE or from a source that states it. If neither gives a date,
   describe the event without one. Never guess a date.
4. If sources conflict, say so and give both, with their citations.

The question
5. If the question quotes a historian's claim, treat it as a claim to examine, not as a fact. Check its
   factual parts (who accepted or rejected what, and when) against the sources before you build on it.

Citations
6. Put [S1], [S2]... or [T:event_id] after each factual statement.{outside_rule}"""

OUTSIDE_ALLOWED = (", plus your own knowledge only for historiographical framing (schools of thought, "
                   "names of historians and their arguments)")
OUTSIDE_RULE_ALLOWED = ("\n7. Mark anything not supported by a source or the timeline with [not from sources]. "
                        "Never use outside knowledge for dates, figures or who-did-what.")
OUTSIDE_RULE_STRICT = "\n7. If the sources don't cover a point the question needs, say so plainly instead of filling it in."


def format_sources(hits: list[Hit]) -> str:
    blocks = []
    for i, h in enumerate(hits, 1):
        c = h.chunk
        pages = f"pp. {c['page_start']}-{c['page_end']}" if c.get("page_start") else ""
        blocks.append(f"[S{i}] {c['header']} {pages}\n{c['text']}")
    return "\n\n".join(blocks) or "(no sources found)"


def format_timeline(events: list[Event]) -> str:
    return "\n".join(e.grounding_line() for e in events) or "(no timeline rows)"


def build_answer_messages(plan: QueryPlan, hits: list[Hit], events: list[Event],
                          allow_outside_knowledge: bool = True, style: str = "") -> list[dict]:
    """Messages for the final answer call (any chat API). `style` can add your format instructions,
    e.g. word limit or the intro-body-conclusion structure your site uses."""
    system = ANSWER_RULES.format(
        outside=OUTSIDE_ALLOWED if allow_outside_knowledge else "",
        outside_rule=OUTSIDE_RULE_ALLOWED if allow_outside_knowledge else OUTSIDE_RULE_STRICT)
    if style:
        system += "\n\nFormat\n" + style.strip()
    claims = ""
    if plan.claims_to_examine:
        claims = "CLAIMS IN THE QUESTION (to examine, not to assume):\n" + "\n".join(
            f"- {c}" for c in plan.claims_to_examine) + "\n\n"
    user = (f"QUESTION:\n{plan.question}\n\n{claims}"
            f"TIMELINE (curated dates; prefer these over any other date):\n{format_timeline(events)}\n\n"
            f"SOURCES:\n{format_sources(hits)}")
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]
