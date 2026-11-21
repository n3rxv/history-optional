"""Ingestion: books -> cleaned, section-aware chunks with headings, period tags, topics and OCR quality.

Commands
  python -m history_rag.ingest toc BOOK.pdf --id ID           # print a books.yaml skeleton from PDF bookmarks
  python -m history_rag.ingest build --books data/books.yaml  # extract, chunk, tag -> chunks.jsonl
  python -m history_rag.ingest index [--reset]                # embed chunks.jsonl into the vector store

Each chunk is stored with:
  header      "Sumit Sarkar, Modern India 1885-1947 › Ch. 8 … › The Cripps Mission | Modern India | 1942"
  context     one LLM-written sentence naming the event the passage is about
  embed_text  header + context + text  (what gets embedded, so "the plan" in a passage still
              carries "Cripps, 1942" into the vector)
  subject, year_start, year_end, topics, ocr_quality   (used for filtering and boosting)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import statistics
import sys
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path

from .config import PERIOD_PAD, SUBJECTS, Settings
from .timeline import Timeline, _fmt_years

SUBJECT_SHORT = {"ancient_india": "Ancient India", "medieval_india": "Medieval India",
                 "modern_india": "Modern India", "modern_world": "Modern World"}


# --------------------------------------------------------------------------- registry
def _year(v) -> int:
    if isinstance(v, int):
        return v
    m = re.fullmatch(r"\s*(\d{1,4})\s*(BCE|BC|CE|AD)?\s*", str(v), re.I)
    if not m:
        raise ValueError(f"bad year {v!r} (use 1946, -321 or '321 BCE')")
    n = int(m.group(1))
    return -n if (m.group(2) or "").upper() in {"BCE", "BC"} else n


def _period(v) -> tuple[int, int] | None:
    if v is None:
        return None
    if isinstance(v, (int, str)):
        y = _year(v)
        return (y, y)
    lo, hi = _year(v[0]), _year(v[1])
    return (min(lo, hi), max(lo, hi))


@dataclass
class Node:
    title: str
    pages: tuple[int, int]
    period: tuple[int, int] | None
    chapter: str = ""                 # chapter title (for sections)
    children: list["Node"] = field(default_factory=list)


@dataclass
class Book:
    id: str
    title: str
    author: str
    subject: str
    file: Path
    period: tuple[int, int] | None
    printed_page_offset: int = 0        # printed page = pdf page - offset
    chapters: list[Node] = field(default_factory=list)

    def leaves(self) -> list[Node]:
        out = []
        for ch in self.chapters:
            if ch.children:
                first = min(s.pages[0] for s in ch.children)
                if first > ch.pages[0]:   # chapter opening pages before its first section
                    out.append(Node("", (ch.pages[0], first - 1), ch.period, chapter=ch.title))
                for s in ch.children:
                    out.append(Node(s.title, s.pages, s.period or ch.period, chapter=ch.title))
            else:
                out.append(Node("", ch.pages, ch.period, chapter=ch.title))
        return sorted(out, key=lambda n: n.pages[0])


def load_registry(path: str | Path) -> list[Book]:
    import yaml

    path = Path(path)
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    books = []
    for b in data.get("books", []):
        if b.get("skip"):
            continue
        if b["subject"] not in SUBJECTS:
            raise ValueError(f"{b['id']}: unknown subject {b['subject']!r}; use one of {list(SUBJECTS)}")
        chapters = []
        for ch in b.get("chapters") or []:
            node = Node(ch["title"], tuple(ch["pages"]), _period(ch.get("period")))
            for sec in ch.get("sections") or []:
                node.children.append(Node(sec["title"], tuple(sec["pages"]), _period(sec.get("period"))))
            chapters.append(node)
        file = Path(b["file"])
        if not file.is_absolute():
            file = (path.parent / file).resolve()
        books.append(Book(b["id"], b["title"], b["author"], b["subject"], file, _period(b.get("period")),
                          int(b.get("printed_page_offset", 0)), chapters))
    return books


def toc_skeleton(pdf_path: str, book_id: str) -> str:
    """books.yaml entry built from the PDF's bookmarks. Fill in subject and periods by hand."""
    import pymupdf

    doc = pymupdf.open(pdf_path)
    toc = doc.get_toc()  # [[level, title, page], ...]
    n_pages = doc.page_count
    lines = [f"  - id: {book_id}", '    title: "TODO"', '    author: "TODO"',
             "    subject: TODO   # ancient_india | medieval_india | modern_india | modern_world",
             f"    file: {pdf_path}", "    period: [TODO, TODO]", "    printed_page_offset: 0",
             "    chapters:"]
    if not toc:
        lines.append("      # no bookmarks in this PDF: add chapters by hand (title, pages, period)")
        return "\n".join(lines)
    top = min(level for level, _, _ in toc)
    entries = [(lvl, title.strip(), page) for lvl, title, page in toc if lvl <= top + 1]
    for i, (lvl, title, page) in enumerate(entries):
        nxt = [p for l2, _, p in entries[i + 1:] if l2 <= lvl]
        end = (nxt[0] - 1 if nxt and nxt[0] > page else (nxt[0] if nxt else n_pages))
        title = title.replace('"', "'")
        if lvl == top:
            lines += [f'      - title: "{title}"', f"        pages: [{page}, {end}]",
                      "        period: [TODO, TODO]"]
            if any(l2 == top + 1 for l2, _, _ in entries[i + 1:i + 2]):
                lines.append("        sections:")
        else:
            lines += [f'          - title: "{title}"', f"            pages: [{page}, {end}]",
                      "            # period: [TODO, TODO]   # optional; inherits the chapter's"]
    return "\n".join(lines)


# --------------------------------------------------------------------------- text extraction & cleaning
def extract_pages(file: Path) -> list[str]:
    """Return page texts, index 0 = page 1. Scanned PDFs need an OCR text layer first (e.g. OCRmyPDF)."""
    if file.suffix.lower() == ".pdf":
        import pymupdf

        with pymupdf.open(file) as doc:
            return [page.get_text("text") for page in doc]
    return file.read_text(encoding="utf-8", errors="replace").split("\f")


def _norm_head(line: str) -> str:
    return re.sub(r"\d+", "#", line.strip().lower())


def strip_running_heads(pages: list[str]) -> list[str]:
    """Remove page numbers and running heads/feet (lines repeated at the top or bottom of many pages)."""
    counts: Counter = Counter()
    split = [[ln for ln in p.splitlines()] for p in pages]
    for lines in split:
        nonblank = [ln for ln in lines if ln.strip()]
        for ln in nonblank[:2] + nonblank[-2:]:
            counts[_norm_head(ln)] += 1
    threshold = max(3, int(0.2 * len(pages)))
    repeated = {k for k, v in counts.items() if v >= threshold and len(k) < 120}
    out = []
    for lines in split:
        idx = [i for i, ln in enumerate(lines) if ln.strip()]
        edges = set(idx[:2] + idx[-2:])            # only the top two and bottom two lines can be heads/feet
        kept = [ln for i, ln in enumerate(lines)
                if not (i in edges and (_norm_head(ln) in repeated
                                        or re.fullmatch(r"\s*[\divxlc]{1,5}\s*", ln, re.I)))]
        out.append("\n".join(kept))
    return out


def clean_text(text: str) -> str:
    text = text.replace("­", "").replace("\r", "")
    text = re.sub(r"(\w)-\n\s*(\w)", r"\1\2", text)          # re-join hyphenated line breaks
    text = re.sub(r"[ \t]+", " ", text)
    paras = re.split(r"\n\s*\n", text)
    paras = [re.sub(r"\s*\n\s*", " ", p).strip() for p in paras]
    return "\n\n".join(p for p in paras if p)


_GOOD_TOKEN = re.compile(
    r"[(\[\"'‘“]*"
    r"(?:(?:[^\W\d_]\.){2,5}"                                    # initials: B.R. / A.O.
    r"|[^\W\d_]+(?:['’\-–—/][^\W\d_]+)*(?:['’]s)?"              # words, hyphenated, possessive
    r"|\d[\d,.]*(?:[-–—/]\d[\d,.]*)?(?:st|nd|rd|th|s)?"           # 1946, 1,00,000, 1793–94, 1820s
    r"|&|[-–—]{1,2})"
    r"[.,;:!?)\]\"'’”]*")


def ocr_quality(text: str) -> float:
    """Share of tokens that look like real words or numbers (0..1). Garbled OCR scores low."""
    tokens = text.split()
    if not tokens:
        return 0.0
    good = 0
    for t in tokens:
        if not _GOOD_TOKEN.fullmatch(t):
            continue
        core = t.strip("()[]\"'‘“’”.,;:!?")
        if re.search(r"[a-z][A-Z]", core) or re.search(r"\d[^\W\d_]|[^\W\d_]\d", core):
            continue  # mid-word capitals ("unacceptaWe") or digits inside words ("1mporta")
        if (len(core) == 1 and core.isalpha() and core not in {"a", "A", "I"}
                and not (core.isupper() and t.rstrip("),;:").endswith("."))):   # "M. A. Jinnah" is fine
            continue  # stray single letters are typical OCR debris
        good += 1
    return round(good / len(tokens), 3)


# --------------------------------------------------------------------------- section text & chunking
def _title_pos(page_text: str, title: str) -> int:
    if not title:
        return -1
    words = [re.escape(w) for w in title.split()[:8]]
    m = re.search(r"\s+".join(words), page_text, re.I)
    return m.start() if m else -1


def leaf_texts(book: Book, pages: list[str]) -> list[tuple[Node, list[tuple[int, str]]]]:
    """Text of each leaf (section, or chapter without sections) as (pdf_page, text) pieces.
    Where a section starts part-way down a page, the page is split at the section title if found."""
    n = len(pages)
    leaves = book.leaves() or [Node("", (1, n), book.period, chapter="")]
    covered = set()
    out = []
    for i, leaf in enumerate(leaves):
        lo, hi = max(1, leaf.pages[0]), min(n, leaf.pages[1])
        nxt = leaves[i + 1] if i + 1 < len(leaves) else None
        pieces = []
        for p in range(lo, hi + 1):
            text = pages[p - 1]
            if p == lo and i > 0 and leaves[i - 1].pages[1] >= p:      # shared first page
                pos = _title_pos(text, leaf.title or leaf.chapter)
                if pos > 0:
                    text = text[pos:]
            if nxt and p == hi and nxt.pages[0] <= p:                   # shared last page
                pos = _title_pos(text, nxt.title or nxt.chapter)
                if pos > 0:
                    text = text[:pos]
            pieces.append((p, text))
            covered.add(p)
        out.append((leaf, pieces))
    uncovered = [p for p in range(1, n + 1) if p not in covered]
    if uncovered and book.chapters:
        out.append((Node("", (uncovered[0], uncovered[-1]), book.period, chapter="(pages outside the table of contents)"),
                    [(p, pages[p - 1]) for p in uncovered]))
    return out


_SENT = re.compile(r"(?<=[.!?])[\"'”’)]?\s+(?=[A-Z0-9“\"'(])")


def chunk_pieces(pieces: list[tuple[int, str]], target: int, overlap: int, min_words: int,
                 drop_below: float = 0.5, stats: dict | None = None) -> list[tuple[str, int, int]]:
    """Pack sentences into ~target-word chunks with overlap. Returns (text, first_page, last_page).
    Sentences whose OCR quality is below `drop_below` are dropped (counted in stats["dropped"]),
    so one garbled stretch doesn't drag a whole chunk below the retrieval OCR threshold."""
    sents: list[tuple[str, int]] = []
    for page, text in pieces:
        for para in clean_text(text).split("\n\n"):
            for s in _SENT.split(para):
                s = s.strip()
                if not s:
                    continue
                if len(s.split()) >= 3 and ocr_quality(s) < drop_below:
                    if stats is not None:
                        stats["dropped"] = stats.get("dropped", 0) + 1
                    continue
                sents.append((s, page))
    chunks: list[tuple[str, int, int]] = []
    cur: list[tuple[str, int]] = []
    words = 0
    for s, page in sents:
        cur.append((s, page))
        words += len(s.split())
        if words >= target:
            chunks.append((" ".join(x for x, _ in cur), cur[0][1], cur[-1][1]))
            carry, w = [], 0
            for x in reversed(cur):
                if w >= overlap:
                    break
                carry.insert(0, x)
                w += len(x[0].split())
            cur, words = (carry, w) if len(carry) < len(cur) else ([], 0)
    if cur:
        text = " ".join(x for x, _ in cur)
        if chunks and len(text.split()) < min_words:
            prev_text, p0, _ = chunks[-1]
            tail = [x for x, _ in cur]
            # avoid repeating the overlap that is already in the previous chunk
            new = [x for x in tail if x not in prev_text]
            chunks[-1] = (prev_text + (" " + " ".join(new) if new else ""), p0, cur[-1][1])
        elif len(text.split()) >= min(min_words, 25):
            chunks.append((text, cur[0][1], cur[-1][1]))
    return chunks


# --------------------------------------------------------------------------- tagging
TAG_SYSTEM = """TASK: tag_chunk
You label passages from history textbooks for a search index used by UPSC History Optional students.
Return JSON only: {"year_start": int, "year_end": int, "topics": [string], "context": string}
- year_start / year_end: years of the events the passage actually describes (BCE years negative).
  A passage in a 1946 chapter that discusses the 1942 Cripps offer gets 1942, not 1946.
  One year -> use it for both. If the passage is general or historiographical, use the section period.
- topics: 0-3 ids from TOPICS that the passage substantially discusses. Use only ids from the list.
- context: ONE plain sentence naming the specific event(s), place and date the passage is about,
  e.g. "Describes the Cripps offer of March 1942 and why the Muslim League rejected it."
  Name the event explicitly even when the passage only says "the plan", "the scheme" or "they"."""


def _cache_key(book_id: str, leaf: Node, text: str) -> str:
    return hashlib.sha1(f"{book_id}|{leaf.chapter}|{leaf.title}|{text}".encode()).hexdigest()


class TagCache:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.data: dict[str, dict] = {}
        if self.path.exists():
            for line in self.path.read_text(encoding="utf-8").splitlines():
                if line.strip():
                    rec = json.loads(line)
                    self.data[rec["key"]] = rec["tags"]

    def get(self, key: str) -> dict | None:
        return self.data.get(key)

    def put(self, key: str, tags: dict) -> None:
        self.data[key] = tags
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps({"key": key, "tags": tags}, ensure_ascii=False) + "\n")


def validate_tags(raw: dict, fallback: tuple[int, int], book_period: tuple[int, int] | None,
                  allowed_topics: set[str], pad: int) -> dict:
    period_source = "llm"
    try:
        ys, ye = int(raw["year_start"]), int(raw["year_end"])
        if ys > ye:
            ys, ye = ye, ys
    except (KeyError, TypeError, ValueError):
        ys, ye = fallback
        period_source = "section"
    if book_period and (ye < book_period[0] - pad or ys > book_period[1] + pad):
        ys, ye = fallback          # outside the whole book: a tagging error
        period_source = "section"
    topics = [t for t in (raw.get("topics") or []) if isinstance(t, str) and t in allowed_topics][:3]
    context = re.sub(r"\s+", " ", str(raw.get("context") or "")).strip()[:300]
    return {"year_start": ys, "year_end": ye, "topics": topics, "context": context,
            "period_source": period_source}


# --------------------------------------------------------------------------- build
def build_chunks(books: list[Book], timeline: Timeline, llm, s: Settings) -> list[dict]:
    cache = TagCache(s.tag_cache_path)
    all_chunks: list[dict] = []
    for book in books:
        if not book.file.exists():
            print(f"[skip] {book.id}: file not found {book.file}", file=sys.stderr)
            continue
        pages = strip_running_heads(extract_pages(book.file))
        pad = PERIOD_PAD[book.subject]
        jobs, stats = [], {}
        for leaf_idx, (leaf, pieces) in enumerate(leaf_texts(book, pages)):
            period = leaf.period or book.period or (0, 0)
            for chunk_idx, (text, p0, p1) in enumerate(
                    chunk_pieces(pieces, s.chunk_words, s.overlap_words, s.min_chunk_words, stats=stats)):
                jobs.append((leaf_idx, chunk_idx, leaf, period, text, p0, p1))
        if stats.get("dropped"):
            print(f"[ocr] {book.id}: dropped {stats['dropped']} garbled sentences; "
                  "consider re-running OCR on this book", file=sys.stderr)

        def tag(job):
            leaf_idx, chunk_idx, leaf, period, text, p0, p1 = job
            key = _cache_key(book.id, leaf, text)
            cands_years = (period[0] - 50, period[1] + 50)
            allowed = {t for t, info in timeline.topics.items()
                       if book.subject in info.subjects
                       and not (info.year_hi < cands_years[0] or info.year_lo > cands_years[1])}
            tags = cache.get(key)
            if tags is None and llm is not None:
                user = (f"BOOK: {book.author}, {book.title}\nCHAPTER: {leaf.chapter}\nSECTION: {leaf.title}\n"
                        f"SECTION PERIOD: {_fmt_years(*period)}\n\nTOPICS:\n"
                        f"{timeline.topic_catalogue([book.subject], cands_years) or '(none)'}\n\n"
                        f"PASSAGE:\n{text}")
                try:
                    tags = validate_tags(llm.json(TAG_SYSTEM, user, max_tokens=300), period,
                                         book.period, allowed, pad)
                    cache.put(key, tags)
                except Exception as e:  # keep going; fall back to the section's period
                    print(f"[tag failed] {book.id} p.{p0}: {e}", file=sys.stderr)
            if tags is None:
                tags = {"year_start": period[0], "year_end": period[1], "topics": [], "context": "",
                        "period_source": "section"}
            return job, tags

        workers = max(1, s.tag_workers if llm is not None else 1)
        with ThreadPoolExecutor(max_workers=workers) as pool:
            results = list(pool.map(tag, jobs))

        for (leaf_idx, chunk_idx, leaf, period, text, p0, p1), tags in results:
            years = _fmt_years(tags["year_start"], tags["year_end"])
            trail = " › ".join(x for x in (f"{book.author}, {book.title}", leaf.chapter, leaf.title) if x)
            header = f"{trail} | {SUBJECT_SHORT[book.subject]} | {years}"
            embed_text = header + ("\n" + tags["context"] if tags["context"] else "") + "\n\n" + text
            digest = hashlib.sha1(text.encode()).hexdigest()[:8]
            all_chunks.append({
                "id": f"{book.id}:{leaf_idx}:{chunk_idx}:{digest}",
                "book_id": book.id, "book_title": book.title, "author": book.author,
                "subject": book.subject, "chapter": leaf.chapter, "section": leaf.title,
                "page_start": p0 - book.printed_page_offset, "page_end": p1 - book.printed_page_offset,
                "year_start": tags["year_start"], "year_end": tags["year_end"],
                "period_source": tags["period_source"], "topics": tags["topics"],
                "context": tags["context"], "ocr_quality": ocr_quality(text),
                "header": header, "text": text, "embed_text": embed_text,
            })
    return all_chunks


def write_chunks(chunks: list[dict], path: str | Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        for c in chunks:
            fh.write(json.dumps(c, ensure_ascii=False) + "\n")


def report(chunks: list[dict], min_ocr: float) -> str:
    by_book = Counter(c["book_id"] for c in chunks)
    lines = [f"{len(chunks)} chunks from {len(by_book)} books"]
    for b, n in by_book.most_common():
        cs = [c for c in chunks if c["book_id"] == b]
        low = sum(c["ocr_quality"] < min_ocr for c in cs)
        llm_tagged = sum(c["period_source"] == "llm" for c in cs)
        med = statistics.median(c["ocr_quality"] for c in cs)
        lines.append(f"  {b}: {n} chunks, {llm_tagged} period-tagged by LLM, "
                     f"{low} below OCR quality {min_ocr} (median {med:.2f})")
    return "\n".join(lines)


# --------------------------------------------------------------------------- CLI
def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="python -m history_rag.ingest")
    sub = ap.add_subparsers(dest="cmd", required=True)
    t = sub.add_parser("toc", help="print a books.yaml skeleton from a PDF's bookmarks")
    t.add_argument("pdf")
    t.add_argument("--id", required=True)
    b = sub.add_parser("build", help="extract, chunk and tag books into chunks.jsonl")
    b.add_argument("--books", required=True)
    b.add_argument("--no-llm", action="store_true", help="skip tagging; use section periods only")
    sub_i = sub.add_parser("index", help="embed chunks.jsonl into the vector store")
    sub_i.add_argument("--reset", action="store_true", help="delete the collection first")
    args = ap.parse_args(argv)
    s = Settings.from_env()

    if args.cmd == "toc":
        print(toc_skeleton(args.pdf, args.id))
        return 0
    if args.cmd == "build":
        llm = None
        if not args.no_llm:
            from .llm import ChatLLM
            llm = ChatLLM(s)
        chunks = build_chunks(load_registry(args.books), Timeline.load(s.timeline_path), llm, s)
        write_chunks(chunks, s.chunks_path)
        print(report(chunks, s.min_ocr_quality))
        print(f"wrote {s.chunks_path}")
        return 0
    if args.cmd == "index":
        from .store import ChromaStore, get_embedder, read_chunks
        store = ChromaStore(s, get_embedder(s))
        if args.reset:
            store.client.delete_collection(s.collection)
            store = ChromaStore(s, store.embedder)
        n = store.upsert(read_chunks(s.chunks_path))
        print(f"indexed {n} chunks into {s.chroma_dir}/{s.collection}")
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
