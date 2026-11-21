# history_rag

Grounding tools for a UPSC History Optional RAG system:

| Part | Fixes |
|---|---|
| **Ingestion** (`ingest.py`): section-aware chunks with a heading (book › chapter › section › period), an LLM-written context line, period and topic tags, OCR-quality score, garbled sentences dropped | Chunks that lose their chapter context (a Cripps passage read as the Cabinet Mission); OCR junk in the index |
| **Query planning + retrieval** (`retrieve.py`): question → subjects, periods, timeline topics and 3–5 factual queries; vector + BM25 search restricted by subject, period and OCR quality; rank fusion, optional reranker, topic boost, threshold | Rhetorical question words ("half-baked", "short-term") matching unrelated passages; US "Congress" and world-history books turning up for Indian questions |
| **Curated timeline** (`data/timeline.csv`, 446 events, 131 topics): Ancient India, Medieval India, Modern India, Modern World | Dates filled in from model memory |
| **Answer prompt** (`prompts.py`) and **date checker** (`timeline.py`) | Using a passage about a different event; taking the question's premise as fact; wrong dates going out unnoticed |

`pipeline.py` wires them together; use it as a reference for your own app.

## Install

```bash
pip install -e .                       # core: openai, chromadb, pymupdf, rank-bm25, pyyaml
pip install -e ".[local-models]"       # sentence-transformers, for local embeddings + reranker
pip install -e ".[dev]" && pytest      # 17 offline tests, no API key needed
```

Scanned PDFs need a text layer first (e.g. `ocrmypdf in.pdf out.pdf`).

## Configure

All settings are in `config.py`; override any with `HRAG_<NAME>` environment variables.

```bash
export DEEPSEEK_API_KEY=sk-...            # or HRAG_LLM_API_KEY
# defaults: HRAG_LLM_BASE_URL=https://api.deepseek.com  HRAG_LLM_MODEL=deepseek-flash
# Any OpenAI-compatible endpoint works, e.g. Groq:
#   HRAG_LLM_BASE_URL=https://api.groq.com/openai/v1 HRAG_LLM_MODEL=openai/gpt-oss-120b HRAG_LLM_EXTRA_BODY='{}'

export HRAG_EMBED_MODEL=BAAI/bge-base-en-v1.5     # or HRAG_EMBED_BACKEND=openai + HRAG_EMBED_BASE_URL/...
export HRAG_RERANK_MODEL=BAAI/bge-reranker-base   # empty string disables reranking
export HRAG_CHROMA_DIR=./chroma_db HRAG_CHUNKS_PATH=./data/chunks.jsonl
```

For DeepSeek, tagging, planning and claim extraction run with thinking off (faster, cheaper, and
`temperature=0` only works with thinking off). The final answer call uses the provider default.
JSON calls send `response_format={"type": "json_object"}`; if a provider rejects it, set
`HRAG_LLM_JSON_MODE=false` (the parser also handles plain-text JSON).

## Workflow

**1. Review the timeline.** `data/timeline.csv` is a draft written by Claude. The less certain dates were
spot-checked against sources, but nobody has verified every row. Open it in a spreadsheet, check rows
against your standard textbooks, and put your initials in `verified`. Until a row is verified, a date
that disagrees with it is reported as a *warning*, not an *error*.
```bash
python -m history_rag.timeline validate      # format checks; run after every edit
```

**2. Register your books** in `data/books.yaml`. If the PDF has bookmarks, generate the entry:
```bash
python -m history_rag.ingest toc books/sarkar.pdf --id sarkar_modern_india
```
Fill in `subject` and chapter `period`s. Chapter-level periods are the single biggest help to tagging.

**3. Build chunks** (one short LLM call per chunk; results are cached in `tag_cache.jsonl`, so reruns
only tag new or changed chunks):
```bash
python -m history_rag.ingest build --books history_rag/data/books.yaml
```
The report shows, per book, how many chunks the LLM tagged and how many fall below the OCR threshold.
Books with many dropped or low-quality chunks need better OCR.

**4. Index:** `python -m history_rag.ingest index --reset`

**5. Inspect retrieval** before wiring it in:
```bash
python -m history_rag.retrieve '"...instead of rejecting the plan (Cabinet Mission Plan)..." Critically examine.'
```
It prints the plan (subjects, periods, topics, queries, claims to examine), the filter, and each passage
with its heading, score and OCR quality.

**6. Answer and check:** `python -m history_rag.pipeline "question"`, or in code:
```python
from history_rag.config import Settings
from history_rag.llm import ChatLLM
from history_rag.retrieve import build_retriever
from history_rag.timeline import Timeline
from history_rag.pipeline import answer_question

s = Settings.from_env()
res = answer_question(question, ChatLLM(s), build_retriever(s), Timeline.load(s.timeline_path),
                      allow_outside_knowledge=True,       # False = sources and timeline only
                      style="Intro, body with both sides, conclusion. 250 words.")
res.answer, res.date_issues
```
To check an answer produced elsewhere: `python -m history_rag.timeline check answer.txt`
(`--heuristic` runs without an LLM but only catches sentences that name exactly one event).

## Timeline format

`id, topic, subjects, name, aliases, start, end, precision, tolerance_years, actors, summary, note, verified`

- Dates: `1946-06-25`, `1946-06`, `1946`, `321 BCE`. `end` only for spans.
- `precision`: `day`, `month`, `year`, `circa`, `contested`. Month and day are compared only for `day`/`month` rows.
- `tolerance_years`: accepted spread, for dates that differ between textbooks (Ashoka's accession ±5, Kanishka ±50).
- `topic` groups rows into the vocabulary used for chunk tags and query plans. Keep topics tight in time:
  `validate` flags topics spanning over 1,000 years, because they make period filters useless.
- Granular rows matter: the Cabinet Mission topic has 11 rows (16 May plan, 25 May clarification, 6 June League
  acceptance, 25 June Congress resolution, 10 July press conference, 29 July withdrawal, 6 December statement...),
  so the checker can tell "the plan" from "the clarification".

## Tuning

| Setting | Default | Notes |
|---|---|---|
| `chunk_words` / `overlap_words` | 380 / 60 | |
| `min_ocr_quality` | 0.6 | chunks below are never retrieved |
| `PERIOD_PAD` / `RELAX_PAD` (config.py) | ancient 25/100, medieval 5/20, modern 1/5 | years added around period filters |
| `rerank_threshold` | 0.2 | calibrate on your test set |
| `min_results` | 2 | fewer hits → one retry with relaxed periods |
| `topic_boost` | 0.05 | bonus when a chunk's topics match the plan's |

## Known limits

- The timeline is a draft until reviewed, and covers 446 key events, not the whole syllabus. Claims about
  events not in it are counted as "not in the timeline" and aren't checked.
- LLM tags can be wrong. Validation stops topics outside the vocabulary and years outside the book's
  period, and the tag cache makes it cheap to fix the registry and rebuild.
- Period filters can hide passages for questions that span eras; the planner marks those `comparative`
  and gives several periods, and the filter relaxes once if too little is found.
- Nothing here checks interpretation (e.g. misrepresenting a historian's argument). For that, keep a
  question set with reviewed answers and compare against it after each change.
