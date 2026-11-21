"""Curated timeline: loading, validation, grounding rows for prompts, and checking dates in answers.

CSV columns (data/timeline.csv):
  id, topic, subjects (a|b), name, aliases (a|b), start, end, precision, tolerance_years,
  actors (a;b), summary, note, verified
Dates: "1946-06-25", "1946-06", "1946", "321 BCE" or "78" (CE assumed).
precision: day | month | year | circa | contested. tolerance_years widens the accepted year range.
verified: leave blank until someone has checked the row against a textbook; the checker reports
mismatches against unverified rows as warnings and against verified rows as errors.
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

from .config import SUBJECTS, Settings

PRECISIONS = {"day", "month", "year", "circa", "contested"}
MONTHS = {m: i for i, m in enumerate(
    ["january", "february", "march", "april", "may", "june", "july", "august",
     "september", "october", "november", "december"], 1)}
MONTHS.update({k[:3]: v for k, v in list(MONTHS.items())})
MONTHS["sept"] = 9
MONTH_NAMES = [None, "January", "February", "March", "April", "May", "June", "July", "August",
               "September", "October", "November", "December"]


# --------------------------------------------------------------------------- dates
@dataclass(frozen=True)
class PartialDate:
    year: int                 # negative for BCE
    month: int | None = None
    day: int | None = None

    def low(self) -> tuple[int, int, int]:
        return (self.year, self.month or 1, self.day or 1)

    def high(self) -> tuple[int, int, int]:
        return (self.year, self.month or 12, self.day or 31)

    def display(self) -> str:
        y = f"{-self.year} BCE" if self.year < 0 else str(self.year)
        if self.day and self.month:
            return f"{self.day} {MONTH_NAMES[self.month]} {y}"
        if self.month:
            return f"{MONTH_NAMES[self.month]} {y}"
        return y


_CSV_ISO = re.compile(r"^(\d{4})-(\d{2})(?:-(\d{2}))?$")
_CSV_YEAR = re.compile(r"^(\d{1,4})\s*(BCE|BC|CE|AD)?$", re.I)


def parse_csv_date(value: str) -> PartialDate | None:
    value = (value or "").strip()
    if not value:
        return None
    m = _CSV_ISO.match(value)
    if m:
        return PartialDate(int(m.group(1)), int(m.group(2)), int(m.group(3)) if m.group(3) else None)
    m = _CSV_YEAR.match(value)
    if m:
        year = int(m.group(1))
        return PartialDate(-year if (m.group(2) or "").upper() in {"BCE", "BC"} else year)
    raise ValueError(f"unparseable date {value!r}")


_MONTH_RE = r"(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)\.?"
_TEXT_PATTERNS = [
    # 25 June 1946 / 25th June, 1946
    (re.compile(rf"\b(\d{{1,2}})(?:st|nd|rd|th)?\s+{_MONTH_RE},?\s+(\d{{3,4}})\b", re.I), ("d", "m", "y")),
    # June 25, 1946
    (re.compile(rf"\b{_MONTH_RE}\s+(\d{{1,2}})(?:st|nd|rd|th)?,?\s+(\d{{3,4}})\b", re.I), ("m", "d", "y")),
    # June 1946
    (re.compile(rf"\b{_MONTH_RE},?\s+(\d{{3,4}})\b", re.I), ("m", "y")),
    # 25 June (no year)
    (re.compile(rf"\b(\d{{1,2}})(?:st|nd|rd|th)?\s+{_MONTH_RE}\b", re.I), ("d", "m")),
    # June 25 (no year)
    (re.compile(rf"\b{_MONTH_RE}\s+(\d{{1,2}})(?:st|nd|rd|th)?\b", re.I), ("m", "d")),
    # 321 BCE / c. 321 BC / AD 712 / 712 CE / 1946
    (re.compile(r"\b(?:AD\s+)?(\d{1,4})\s*(BCE|BC|CE|AD)\b|\b(?:AD\s+(\d{1,4}))\b|\b(1\d{3}|20\d{2}|[5-9]\d{2})\b", re.I), ("era",)),
]


def parse_date_text(text: str) -> tuple[int | None, int | None, int | None]:
    """Parse the first date expression in free text. Returns (year, month, day); any part may be None."""
    text = text or ""
    for rx, order in _TEXT_PATTERNS:
        m = rx.search(text)
        if not m:
            continue
        if order == ("era",):
            if m.group(1):
                n = int(m.group(1))
                return (-n if m.group(2).upper() in {"BCE", "BC"} else n, None, None)
            if m.group(3):
                return (int(m.group(3)), None, None)
            return (int(m.group(4)), None, None)
        vals = dict(zip(order, m.groups()))
        month = MONTHS[vals["m"].lower().rstrip(".")]
        day = int(vals["d"]) if "d" in vals else None
        year = int(vals["y"]) if "y" in vals else None
        if day is not None and not 1 <= day <= 31:
            continue
        return (year, month, day)
    return (None, None, None)


# --------------------------------------------------------------------------- events
@dataclass
class Event:
    id: str
    topic: str
    subjects: list[str]
    name: str
    aliases: list[str]
    start: PartialDate
    end: PartialDate | None
    precision: str
    tolerance: int
    actors: list[str]
    summary: str
    note: str
    verified: str

    @property
    def year_range(self) -> tuple[int, int]:
        return (self.start.year, (self.end or self.start).year)

    def display_date(self) -> str:
        prefix = "c. " if self.precision in {"circa", "contested"} else ""
        if self.end and self.end != self.start:
            a, b = self.start.display(), self.end.display()
            if self.start.year < 0 and self.end.year < 0:
                a = a.replace(" BCE", "")
            return f"{prefix}{a}–{b}"
        return prefix + self.start.display()

    def grounding_line(self) -> str:
        parts = [f"[T:{self.id}] {self.display_date()} — {self.name}"]
        if self.summary:
            parts.append(self.summary)
        if self.note:
            parts.append(f"(Note: {self.note})")
        return " ".join(parts)


@dataclass
class TopicInfo:
    id: str
    year_lo: int
    year_hi: int
    subjects: set[str] = field(default_factory=set)
    names: list[str] = field(default_factory=list)
    max_tolerance: int = 0


class Timeline:
    def __init__(self, events: list[Event]):
        self.events = events
        self.by_id = {e.id: e for e in events}
        self.topics: dict[str, TopicInfo] = {}
        for e in events:
            lo, hi = e.year_range
            t = self.topics.get(e.topic)
            if t is None:
                t = self.topics[e.topic] = TopicInfo(e.topic, lo, hi)
            t.year_lo, t.year_hi = min(t.year_lo, lo), max(t.year_hi, hi)
            t.subjects.update(e.subjects)
            t.max_tolerance = max(t.max_tolerance, e.tolerance)
            if len(t.names) < 3:
                t.names.append(e.name)

    @classmethod
    def load(cls, path: str | Path | None = None) -> "Timeline":
        path = Path(path or Settings().timeline_path)
        events = []
        with open(path, newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                events.append(Event(
                    id=row["id"].strip(),
                    topic=row["topic"].strip(),
                    subjects=[s.strip() for s in row["subjects"].split("|") if s.strip()],
                    name=row["name"].strip(),
                    aliases=[a.strip() for a in row["aliases"].split("|") if a.strip()],
                    start=parse_csv_date(row["start"]),
                    end=parse_csv_date(row["end"]),
                    precision=row["precision"].strip(),
                    tolerance=int(row["tolerance_years"] or 0),
                    actors=[a.strip() for a in row["actors"].split(";") if a.strip()],
                    summary=row["summary"].strip(),
                    note=row["note"].strip(),
                    verified=(row.get("verified") or "").strip(),
                ))
        return cls(events)

    # ---------------------------------------------------------------- catalogue for prompts
    def topic_catalogue(self, subjects: list[str] | None = None,
                        year_range: tuple[int, int] | None = None) -> str:
        lines = []
        for t in sorted(self.topics.values(), key=lambda t: (t.year_lo, t.id)):
            if subjects and not (t.subjects & set(subjects)):
                continue
            if year_range and (t.year_hi < year_range[0] or t.year_lo > year_range[1]):
                continue
            yrs = _fmt_years(t.year_lo, t.year_hi)
            lines.append(f"{t.id} ({yrs}; {', '.join(sorted(t.subjects))}): {'; '.join(t.names)}")
        return "\n".join(lines)

    def events_for(self, topics: list[str] | None = None, periods: list[tuple[int, int]] | None = None,
                   subjects: list[str] | None = None, limit: int = 30) -> list[Event]:
        """Timeline rows to show the answering model: rows of the plan's topics first, then other
        rows in the plan's periods and subjects."""
        topics = set(topics or [])
        picked = [e for e in self.events if e.topic in topics]
        if periods:
            for e in self.events:
                if e in picked or (subjects and not set(e.subjects) & set(subjects)):
                    continue
                lo, hi = e.year_range
                if any(lo <= p_hi and hi >= p_lo for p_lo, p_hi in periods):
                    picked.append(e)
        picked.sort(key=lambda e: (e.topic not in topics, e.start.low()))
        return picked[:limit]

    # ---------------------------------------------------------------- validation
    def validate(self) -> list[str]:
        problems = []
        seen = set()
        for e in self.events:
            where = f"{e.id}:"
            if e.id in seen:
                problems.append(f"{where} duplicate id")
            seen.add(e.id)
            if not re.fullmatch(r"[a-z0-9_]+", e.id):
                problems.append(f"{where} id must be lowercase letters, digits and underscores")
            if not re.fullmatch(r"[a-z0-9_]+", e.topic):
                problems.append(f"{where} bad topic id {e.topic!r}")
            for s in e.subjects:
                if s not in SUBJECTS:
                    problems.append(f"{where} unknown subject {s!r}")
            if e.precision not in PRECISIONS:
                problems.append(f"{where} precision must be one of {sorted(PRECISIONS)}")
            if e.tolerance < 0:
                problems.append(f"{where} negative tolerance")
            if e.end and e.end.low() < e.start.low():
                problems.append(f"{where} end is before start")
            for d in (e.start, e.end):
                if d and d.month and not 1 <= d.month <= 12:
                    problems.append(f"{where} bad month")
                if d and d.day and not 1 <= d.day <= 31:
                    problems.append(f"{where} bad day")
            if e.precision == "day" and not e.start.day:
                problems.append(f"{where} precision 'day' but start has no day")
            if e.precision == "month" and not e.start.month:
                problems.append(f"{where} precision 'month' but start has no month")
            if e.precision in {"year", "circa", "contested"} and e.start.month:
                problems.append(f"{where} has a month but precision {e.precision!r}")
            if not e.name:
                problems.append(f"{where} missing name")
        for t in self.topics.values():
            if t.year_hi - t.year_lo > 1000:
                problems.append(f"topic {t.id}: spans {t.year_hi - t.year_lo} years; split it so that "
                                "period filters built from it stay tight")
        return problems


def _fmt_years(lo: int, hi: int) -> str:
    def f(y: int) -> str:
        return f"{-y} BCE" if y < 0 else str(y)
    return f(lo) if lo == hi else f"{f(lo)}–{f(hi)}"


# --------------------------------------------------------------------------- date checking
@dataclass
class DateClaim:
    sentence: str
    date_text: str
    event_id: str | None
    year: int | None
    month: int | None
    day: int | None
    year_inferred: bool = False


@dataclass
class DateIssue:
    severity: str          # "error" (verified row) or "warning" (unverified row)
    claim: DateClaim
    event: Event
    message: str

    def __str__(self) -> str:
        return (f"[{self.severity}] {self.message}\n    sentence: {self.claim.sentence.strip()}\n"
                f"    timeline: {self.event.grounding_line()}")


def compare_claim(year: int, month: int | None, day: int | None, ev: Event) -> str | None:
    """Return a description of the mismatch, or None if the claimed date fits the event."""
    lo_y, hi_y = ev.year_range
    if year < lo_y - ev.tolerance or year > hi_y + ev.tolerance:
        tol = f" (±{ev.tolerance} years allowed)" if ev.tolerance else ""
        return f"answer says {PartialDate(year).display()}; timeline has {ev.display_date()}{tol}"
    if ev.precision not in {"day", "month"} or month is None:
        return None
    start, end = ev.start, ev.end or ev.start
    if year < start.year or year > end.year:  # inside year tolerance but outside the dated span
        return None
    if ev.precision == "month":
        ev_low, ev_high = (start.year, start.month or 1, 1), (end.year, end.month or 12, 31)
    else:
        ev_low, ev_high = start.low(), end.high()
    claim_low, claim_high = (year, month, day or 1), (year, month, day or 31)
    if claim_high < ev_low or claim_low > ev_high:
        return f"answer says {PartialDate(year, month, day).display()}; timeline has {ev.display_date()}"
    return None


def check_claims(claims: list[DateClaim], timeline: Timeline) -> tuple[list[DateIssue], int]:
    """Compare claims against the timeline. Returns (issues, number of claims that matched no event)."""
    issues, unmatched = [], 0
    for c in claims:
        ev = timeline.by_id.get(c.event_id or "")
        if ev is None or c.year is None:
            unmatched += 1
            continue
        msg = compare_claim(c.year, c.month, c.day, ev)
        if msg:
            if c.year_inferred:
                msg += " (year inferred from context)"
            issues.append(DateIssue("error" if ev.verified else "warning", c, ev, msg))
    return issues, unmatched


_SENT_SPLIT = re.compile(r"(?<=[.!?;])\s+(?=[A-Z(\"'“])")
_YEAR_MENTION = re.compile(r"\b(\d{3,4})\s*(BCE|BC)?\b", re.I)


def years_in_text(text: str) -> set[int]:
    out = set()
    for m in _YEAR_MENTION.finditer(text):
        y = int(m.group(1))
        out.add(-y if m.group(2) else y)
    return out


def candidate_events(answer: str, timeline: Timeline, topics: list[str] | None = None,
                     limit: int = 250) -> list[Event]:
    years = years_in_text(answer)
    topics = set(topics or [])
    cands = []
    for e in timeline.events:
        lo, hi = e.year_range
        pad = e.tolerance + 2
        if e.topic in topics or any(lo - pad <= y <= hi + pad for y in years):
            cands.append(e)
    return cands[:limit] if cands else timeline.events[:limit]


EXTRACT_SYSTEM = """TASK: extract_date_claims
You check history answers. List every statement in the ANSWER that ties a specific event to a date.
For each, return:
- "sentence": the sentence, copied exactly
- "date_text": the date words exactly as written in the answer (e.g. "26 June 1946", "16 May", "c. 321 BCE")
- "event_id": the id from the EVENTS list that the sentence is about, or null if none fits.
   Match the specific event, not just the topic: e.g. a plan's announcement, a later clarification and a
   party's resolution on it are different events. Judge by what happened, never by the date.
- "year", "month", "day": the claimed date as integers (BCE years negative); null where not stated.
   If the sentence gives no year but the context makes it clear, fill "year" and set "year_inferred": true.
Do not correct the answer. Report what it says.
Return JSON only: {"claims": [ ... ]}"""


def extract_date_claims_llm(answer: str, llm, events: list[Event]) -> list[DateClaim]:
    catalogue = "\n".join(f"{e.id} | {e.name}" + (f" | also: {', '.join(e.aliases)}" if e.aliases else "")
                          for e in events)
    data = llm.json(EXTRACT_SYSTEM, f"EVENTS:\n{catalogue}\n\nANSWER:\n{answer}", max_tokens=3000)
    claims = []
    for c in data.get("claims", []):
        date_text = str(c.get("date_text") or "")
        y, m, d = parse_date_text(date_text)   # trust our parser over the model's numbers
        inferred = False
        if y is None and isinstance(c.get("year"), int):
            y, inferred = c["year"], True
        if m is None and isinstance(c.get("month"), int) and date_text:
            m = c["month"]
        if d is None and isinstance(c.get("day"), int) and date_text:
            d = c["day"]
        claims.append(DateClaim(sentence=str(c.get("sentence") or ""), date_text=date_text,
                                event_id=c.get("event_id"), year=y, month=m, day=d,
                                year_inferred=inferred or bool(c.get("year_inferred"))))
    return claims


def extract_date_claims_heuristic(answer: str, timeline: Timeline) -> list[DateClaim]:
    """Offline fallback: a sentence with one date and exactly one unambiguous alias match."""
    alias_index: dict[str, set[str]] = {}
    for e in timeline.events:
        for a in [e.name, *e.aliases]:
            alias_index.setdefault(a.lower(), set()).add(e.id)
    claims = []
    for sent in _SENT_SPLIT.split(answer):
        y, m, d = parse_date_text(sent)
        if y is None:
            continue
        hits: set[str] = set()
        low = sent.lower()
        for alias, ids in alias_index.items():
            if len(alias) >= 5 and re.search(rf"\b{re.escape(alias)}\b", low) and len(ids) == 1:
                hits |= ids
        if len(hits) == 1:
            claims.append(DateClaim(sent, sent, hits.pop(), y, m, d))
    return claims


def check_answer(answer: str, timeline: Timeline, llm=None,
                 topics: list[str] | None = None) -> tuple[list[DateIssue], int, int]:
    """Check every dated claim in an answer. Returns (issues, claims_checked, claims_unmatched)."""
    if llm is not None:
        claims = extract_date_claims_llm(answer, llm, candidate_events(answer, timeline, topics))
    else:
        claims = extract_date_claims_heuristic(answer, timeline)
    issues, unmatched = check_claims(claims, timeline)
    return issues, len(claims), unmatched


# --------------------------------------------------------------------------- CLI
def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="python -m history_rag.timeline")
    sub = ap.add_subparsers(dest="cmd", required=True)
    v = sub.add_parser("validate", help="check the timeline CSV for format problems")
    v.add_argument("--path")
    c = sub.add_parser("check", help="check the dates in an answer file against the timeline")
    c.add_argument("answer_file")
    c.add_argument("--path")
    c.add_argument("--heuristic", action="store_true", help="no LLM: simple alias matching only")
    args = ap.parse_args(argv)

    tl = Timeline.load(args.path)
    if args.cmd == "validate":
        problems = tl.validate()
        for p in problems:
            print(p)
        n_verified = sum(1 for e in tl.events if e.verified)
        print(f"{len(tl.events)} events, {len(tl.topics)} topics, {n_verified} verified, "
              f"{len(problems)} problems")
        return 1 if problems else 0

    answer = Path(args.answer_file).read_text(encoding="utf-8")
    llm = None
    if not args.heuristic:
        from .llm import ChatLLM
        llm = ChatLLM(Settings.from_env())
    issues, n, unmatched = check_answer(answer, tl, llm)
    for i in issues:
        print(i, end="\n\n")
    print(f"{n} dated claims, {len(issues)} mismatches, {unmatched} not in the timeline")
    return 1 if any(i.severity == "error" for i in issues) else 0


if __name__ == "__main__":
    sys.exit(main())
