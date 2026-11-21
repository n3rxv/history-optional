"""Settings and syllabus constants. Every setting can be overridden with an HRAG_* environment variable."""
from __future__ import annotations

import json
import os
from dataclasses import dataclass, field, fields
from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent
DATA_DIR = PACKAGE_DIR / "data"

# Subject keys follow the UPSC History Optional syllabus, not strict chronology.
# (e.g. European arrival is in Paper II, the 18th-century Mughal decline in Paper I.)
SUBJECTS: dict[str, str] = {
    "ancient_india": "Ancient India: prehistory to c. 750 CE (Paper I, Section A)",
    "medieval_india": "Medieval India: c. 750 CE to the mid-18th century (Paper I, Section B)",
    "modern_india": "Modern India: European arrival to the 1960s (Paper II, Section A)",
    "modern_world": "Modern World: Enlightenment to 1991 (Paper II, Section B)",
}

# Years of padding added around a period filter. Ancient dates are approximate, so pad more.
PERIOD_PAD: dict[str, int] = {"ancient_india": 25, "medieval_india": 5, "modern_india": 1, "modern_world": 1}
# Extra padding used once if a strict search returns too few passages.
RELAX_PAD: dict[str, int] = {"ancient_india": 100, "medieval_india": 20, "modern_india": 5, "modern_world": 5}


@dataclass
class Settings:
    # Chat model (any OpenAI-compatible endpoint). Defaults to DeepSeek Flash.
    llm_base_url: str = "https://api.deepseek.com"
    llm_api_key: str | None = None
    llm_model: str = "deepseek-flash"
    llm_extra_body: dict = field(default_factory=dict)  # e.g. {"thinking": {"type": "disabled"}}
    llm_json_mode: bool = True
    llm_timeout: float = 90.0

    # Embeddings: "sentence-transformers" (local) or "openai" (any OpenAI-compatible /embeddings API).
    embed_backend: str = "sentence-transformers"
    embed_model: str = "BAAI/bge-base-en-v1.5"
    embed_base_url: str | None = None
    embed_api_key: str | None = None
    query_prefix: str = "Represent this sentence for searching relevant passages: "  # bge-en convention
    embed_batch: int = 64

    # Cross-encoder reranker; set HRAG_RERANK_MODEL="" to disable.
    rerank_model: str | None = "BAAI/bge-reranker-base"
    rerank_threshold: float = 0.2

    # Storage
    chroma_dir: str = "./chroma_db"
    collection: str = "history_chunks"
    chunks_path: str = "./data/chunks.jsonl"
    tag_cache_path: str = "./data/tag_cache.jsonl"
    timeline_path: str = str(DATA_DIR / "timeline.csv")

    # Chunking
    chunk_words: int = 380
    overlap_words: int = 60
    min_chunk_words: int = 60

    # Retrieval
    min_ocr_quality: float = 0.6
    candidates: int = 40       # per query, per method (vector, BM25)
    top_k: int = 8
    min_results: int = 2       # fewer than this after filtering -> relax the period filter once
    topic_boost: float = 0.05  # added to a passage's score when its topics match the plan's
    tag_workers: int = 8

    @classmethod
    def from_env(cls) -> "Settings":
        s = cls()
        for f in fields(cls):
            raw = os.environ.get(f"HRAG_{f.name.upper()}")
            if raw is None:
                continue
            current = getattr(s, f.name)
            if isinstance(current, bool):
                value = raw.strip().lower() in {"1", "true", "yes", "on"}
            elif isinstance(current, int) and not isinstance(current, bool):
                value = int(raw)
            elif isinstance(current, float):
                value = float(raw)
            elif isinstance(current, dict):
                value = json.loads(raw)
            else:
                value = raw or None
            setattr(s, f.name, value)
        if s.llm_api_key is None:
            s.llm_api_key = os.environ.get("DEEPSEEK_API_KEY") or os.environ.get("OPENAI_API_KEY")
        if not s.llm_extra_body and "deepseek" in (s.llm_base_url or ""):
            # Tagging, planning and claim extraction are lookups, not reasoning tasks:
            # thinking off makes them faster, cheaper and lets temperature=0 take effect.
            s.llm_extra_body = {"thinking": {"type": "disabled"}}
        return s
