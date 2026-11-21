"""Apply the textbook check to timeline.csv, with a full audit trail.

Rule: a row's final date must be stated by at least one book in the corpus. A row is
marked verified (its `verified` column names the books) only when the books back every
date in it. Where books disagree with each other, the note says which book says what
and the date range or tolerance is widened so that no book's date is reported as wrong.
The corrected and disputed rows were decided by hand against the quotes printed by
review_verify.py; those decisions are in DECISIONS below.

    python3 scripts/rag/apply_verify.py            # dry run: print what would change
    python3 scripts/rag/apply_verify.py --write    # write timeline.csv and work/timeline_sources.csv (local only: it quotes the books)
"""
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

from check_verify import agrees, parse_date
from review_verify import all_dates, coverage, end_row, start_row

HERE = Path(__file__).resolve().parent
DATA = HERE / "history_rag" / "history_rag" / "data"
COLS = ["id", "topic", "subjects", "name", "aliases", "start", "end", "precision", "tolerance_years",
        "actors", "summary", "note", "verified"]

# id -> fields to set. Every value here is stated by at least one corpus book (quotes in
# timeline_sources.csv). "note" replaces the row's note.
DECISIONS: dict[str, dict] = {
    # ---- books give a different date from the draft row
    "mansabdari": {"start": "1567", "end": "1574", "precision": "contested", "tolerance_years": "0",
                   "note": "Satish Chandra: the numerical division of mansabs was effected in 1567; the dagh (branding) system and reorganisation followed in 1573-74."},
    "haldighati": {"start": "1576", "end": "", "precision": "year", "tolerance_years": "0",
                   "note": "Satish Chandra prints '18 Feb. 1576'; the other books give only 1576."},
    "chaitanya": {"start": "1486", "end": "1533", "note": "Vipul Singh, J.L. Mehta and Eaton give 1486-1533."},
    "aligarh_mao": {"start": "1875", "end": "", "tolerance_years": "2",
                    "note": "Grover dates the school and Bipan Chandra the college to 1875."},
    "cripps_declaration": {"start": "1942-03-29", "end": "1942-03-30",
                           "note": "Grover: the proposals were made public at a press conference on 29 March; published on 30 March."},
    "opium_war_second": {"note": "Hobsbawm dates the war 1856-8 and the sack of Peking 1860."},
    "battle_of_britain": {"note": "Lowe gives July to September 1940."},
    "gorbachev_leader": {"start": "1985-03", "precision": "month",
                         "note": "Hobsbawm gives 15 March 1985; Lowe gives March 1985."},
    "august_coup": {"start": "1991-08-18", "end": "1991-08-21",
                    "note": "Lowe: Gorbachev was arrested on 18 August and the coup leaders admitted defeat on 21 August."},
    # ---- books disagree with each other
    "harappa_excavation": {"precision": "contested", "tolerance_years": "1",
                           "note": "Upinder Singh gives 1920; Ajeet Jha gives 1921."},
    "mahajanapadas": {"end": "300 BCE", "precision": "contested", "tolerance_years": "50",
                      "note": "Ajeet Jha gives 600-400 BCE; Chakravarti gives c. 600-300 BC."},
    "alexander_campaign": {"tolerance_years": "1",
                           "note": "The books agree on 327 BCE; Kosambi puts the revolt at the Beas in 326 BCE."},
    "rajaraja_reign": {"precision": "contested", "tolerance_years": "4",
                       "note": "Upinder Singh, Ajeet Jha and Vipul Singh give 985-1014; one Vipul Singh chapter gives 985-1018."},
    "rajendra_reign": {"start": "1012", "precision": "contested", "tolerance_years": "2",
                       "note": "Upinder Singh dates Rajendra I to 1012-44 (co-rule from 1012); India in the Persianate Age has him rule in his own right from 1014."},
    "raziya_reign": {"precision": "contested", "tolerance_years": "1",
                     "note": "Vipul Singh gives 1236-40; Satish Chandra gives 1236-39."},
    "krishnadevaraya_reign": {"tolerance_years": "1",
                              "note": "Most books give 1509-29; one J.L. Mehta passage reads 1509-30."},
    "panipat_first": {"start": "1526-04-20", "end": "1526-04-21",
                      "note": "J.L. Mehta and India in the Persianate Age give 21 April 1526; Satish Chandra gives 20 April 1526."},
    "hyderabad_autonomy": {"precision": "contested", "tolerance_years": "1",
                           "note": "The books give 1723 (Bandopadhyay), 1724 (Persianate Age; Satish Chandra) and 1725 (another Satish Chandra passage)."},
    "kabir": {"start": "1398", "end": "1518", "precision": "contested", "tolerance_years": "30",
              "note": "Vipul Singh gives 1398-1518, J.L. Mehta c. 1440-1510 and Basham 1440-1518."},
    "guru_nanak": {"tolerance_years": "1",
                   "note": "All books give 1469 for his birth; the Persianate Age gives 1539 for his death, J.L. Mehta 1538."},
    "bassein": {"tolerance_years": "1",
                "note": "Grover and Bipan Chandra give 31 December 1802; Bandopadhyay places the signing in 1803."},
    "muslim_league_founded": {"note": "Bandopadhyay gives 30 December 1906; one Sarkar passage has October 1906."},
    "ncm_launch": {"note": "Bipan Chandra (India's Struggle) and Bandopadhyay give 1 August 1920; Bipan Chandra's History of Modern India dates the Khilafat Committee's launch to 31 August 1920."},
    "swaraj_party": {"start": "1923-01", "end": "1923-03", "precision": "month", "tolerance_years": "0",
                     "note": "Bipan Chandra gives 1 January 1923; Sarkar gives March 1923."},
    "congress_ministries": {"note": "Grover dates the resignations to October 1939, Bandopadhyay to November 1939."},
    "cwc_resolution_cmp": {"start": "1946-06-24", "end": "1946-06-25",
                           "note": "Bandopadhyay dates the Working Committee's approval to 25 June 1946; Sarkar dates Congress acceptance of the plan to 24 June."},
    "taiping": {"tolerance_years": "2", "note": "Both books start it in 1850; Lowe ends it in 1864, Hobsbawm in 1866."},
    "crimean_war": {"tolerance_years": "1",
                    "note": "Thomson: Turkey declared war on Russia in October 1853 and Britain and France entered in 1854."},
    "meiji_restoration": {"tolerance_years": "1",
                          "note": "Lowe dates the restoration to 1868; Thomson dates Japan's internal revolution to 1867."},
    "munich_agreement": {"note": "Lowe gives September 1938; Hobsbawm writes October 1938."},
    "stalingrad": {"note": "Lowe dates the surrender to 2 February 1943; Hobsbawm runs the battle to March 1943."},
    "cultural_revolution": {"note": "Both books start it in 1966; Lowe ends it in 1969, Hobsbawm in 1976."},
    # ---- disputes found in the second pass
    "balban_reign": {"precision": "contested", "tolerance_years": "1",
                     "note": "India in the Persianate Age gives 1266-87, J.L. Mehta 1266-86; Vipul Singh dates his accession to 1265."},
    "communal_award": {"start": "1932-08", "end": "1932-09", "precision": "month", "tolerance_years": "0",
                       "note": "Bipan Chandra, Sarkar and Bandopadhyay say August 1932; another Bandopadhyay passage says September 1932. No book gives the day."},
    "telangana_struggle": {"tolerance_years": "1",
                           "note": "Sarkar: July 1946 to October 1951; Bandopadhyay: began July 1946; Ranajit Guha: 1947-51."},
}

# Rows whose decision above settles the date but leaves an end the books don't state.
NOT_VERIFIED = {"opium_war_second", "battle_of_britain", "crimean_war"}


def short_book(title: str) -> str:
    head = re.split(r"\s+[—-]\s+", title)[0]
    return head.strip()


def load_results() -> dict:
    out = {}
    for d in ("verify", "verify2"):
        for f in sorted((HERE / "work" / d).glob("v*.out.jsonl")):
            for line in f.read_text(encoding="utf-8").splitlines():
                if not line.strip():
                    continue
                o = json.loads(line)
                prev = out.get(o["id"])
                # The second pass only replaces a first-pass result it improves on.
                rank = {"unsupported": 0, "confirmed": 1, "disputed": 2, "corrected": 2}
                if prev is None or d == "verify2" and (rank[o["verdict"]] > rank[prev["verdict"]] or
                                                       (o["verdict"] == "confirmed" and prev["verdict"] == "confirmed")):
                    o["_pass"] = d
                    out[o["id"]] = o if prev is None or o["books"] else {**o, "books": prev["books"]}
    return out


def main() -> None:
    write = "--write" in sys.argv
    rows = list(csv.DictReader(open(DATA / "timeline.csv", encoding="utf-8")))
    by_id = {r["id"]: r for r in rows}
    results = load_results()
    passages_meta = {}
    for line in open(HERE / "work" / "passages.jsonl", encoding="utf-8"):
        p = json.loads(line)
        passages_meta[str(p["id"])] = p["book_title"]

    unknown = set(DECISIONS) - set(by_id)
    assert not unknown, f"decisions for unknown rows: {unknown}"
    changed, verified, partial, unsupported = [], [], [], []
    for r in rows:
        o = results.get(r["id"])
        books = sorted({short_book(passages_meta.get(str(b["p"]), "")) for b in (o or {}).get("books", [])} - {""})
        if r["id"] in DECISIONS:
            before = {k: r[k] for k in COLS}
            r.update(DECISIONS[r["id"]])
            if r["precision"] in ("year", "circa", "contested"):
                for k in ("start", "end"):   # these precisions take years only
                    if r[k] and re.match(r"^\d{4}-", r[k]):
                        r[k] = r[k][:4]
            changed.append((r["id"], {k: (before[k], r[k]) for k in COLS if before[k] != r[k]}))
            if r["id"] not in NOT_VERIFIED and books:
                r["verified"] = "books: " + "; ".join(books)
                verified.append(r["id"])
            else:
                partial.append(r["id"])
            continue
        if not o or o["verdict"] == "unsupported":
            unsupported.append(r["id"])
            continue
        if o["verdict"] == "confirmed" and coverage(r, o) == "full":
            r["verified"] = "books: " + "; ".join(books)
            verified.append(r["id"])
        elif o["verdict"] == "confirmed":
            partial.append(r["id"])
        else:
            # A corrected or disputed row from the second pass that has no decision yet.
            print(f"!! {r['id']}: {o['verdict']} in {o['_pass']} without a decision; left as is")
            unsupported.append(r["id"])

    print(f"{len(rows)} rows: {len(verified)} verified, {len(partial)} partly supported, "
          f"{len(unsupported)} not stated in the books; {len(changed)} rows changed")
    for i, ch in changed:
        print(f"  {i}: " + "; ".join(f"{k} {a!r} -> {b!r}" for k, (a, b) in ch.items() if k != 'verified'))
    if not write:
        return

    sys.path.insert(0, str(HERE / "history_rag"))
    with open(DATA / "timeline.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=COLS)
        w.writeheader()
        w.writerows(rows)
    from history_rag.timeline import Timeline
    problems = Timeline.load(DATA / "timeline.csv").validate()
    assert not problems, problems
    with open(HERE / "work" / "timeline_sources.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["id", "status", "book", "passage", "book_date", "quote"])
        for r in rows:
            o = results.get(r["id"])
            status = "verified" if r["id"] in verified else "partly supported" if r["id"] in partial else "not stated in the books"
            if not o or not o["books"]:
                w.writerow([r["id"], status, "", "", "", ""])
            for b in (o or {}).get("books", []):
                w.writerow([r["id"], status, passages_meta.get(str(b["p"]), ""), b["p"], b["date"], b["quote"]])
    print("wrote timeline.csv and timeline_sources.csv; validation clean")


if __name__ == "__main__":
    main()
