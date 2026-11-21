"""Embeddings, metadata filters and the vector store (Chroma by default).

To use another vector database, write a class with the same two methods as ChromaStore
(upsert, search) and translate `Filter` into that database's filter syntax.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Protocol

from .config import Settings


# --------------------------------------------------------------------------- embeddings
class Embedder(Protocol):
    def embed_documents(self, texts: list[str]) -> list[list[float]]: ...
    def embed_query(self, text: str) -> list[float]: ...


class SentenceTransformerEmbedder:
    def __init__(self, s: Settings):
        from sentence_transformers import SentenceTransformer

        self.model = SentenceTransformer(s.embed_model)
        self.prefix, self.batch = s.query_prefix or "", s.embed_batch

    def embed_documents(self, texts):
        return self.model.encode(texts, batch_size=self.batch, normalize_embeddings=True,
                                 show_progress_bar=len(texts) > 500).tolist()

    def embed_query(self, text):
        return self.model.encode([self.prefix + text], normalize_embeddings=True)[0].tolist()


class OpenAICompatibleEmbedder:
    def __init__(self, s: Settings):
        from openai import OpenAI

        self.client = OpenAI(base_url=s.embed_base_url, api_key=s.embed_api_key or s.llm_api_key)
        self.model, self.prefix, self.batch = s.embed_model, s.query_prefix or "", s.embed_batch

    def _embed(self, texts):
        out = []
        for i in range(0, len(texts), self.batch):
            resp = self.client.embeddings.create(model=self.model, input=texts[i : i + self.batch])
            out.extend(d.embedding for d in resp.data)
        return out

    def embed_documents(self, texts):
        return self._embed(texts)

    def embed_query(self, text):
        return self._embed([self.prefix + text])[0]


def get_embedder(s: Settings) -> Embedder:
    if s.embed_backend == "openai":
        return OpenAICompatibleEmbedder(s)
    if s.embed_backend == "sentence-transformers":
        return SentenceTransformerEmbedder(s)
    raise ValueError(f"unknown embed_backend {s.embed_backend!r}")


# --------------------------------------------------------------------------- filters
@dataclass
class Filter:
    subjects: list[str] | None = None
    periods: list[tuple[int, int]] | None = None   # keep chunks overlapping ANY of these year ranges
    min_ocr_quality: float | None = None

    def matches(self, meta: dict) -> bool:
        if self.subjects and meta.get("subject") not in self.subjects:
            return False
        if self.periods:
            lo, hi = meta.get("year_start"), meta.get("year_end")
            if not any(lo <= p_hi and hi >= p_lo for p_lo, p_hi in self.periods):
                return False
        if self.min_ocr_quality is not None and meta.get("ocr_quality", 1.0) < self.min_ocr_quality:
            return False
        return True

    def to_chroma(self) -> dict | None:
        clauses: list[dict] = []
        if self.subjects:
            clauses.append({"subject": {"$in": list(self.subjects)}})
        if self.periods:
            ranges = [{"$and": [{"year_start": {"$lte": hi}}, {"year_end": {"$gte": lo}}]}
                      for lo, hi in self.periods]
            clauses.append(ranges[0] if len(ranges) == 1 else {"$or": ranges})
        if self.min_ocr_quality is not None:
            clauses.append({"ocr_quality": {"$gte": self.min_ocr_quality}})
        if not clauses:
            return None
        return clauses[0] if len(clauses) == 1 else {"$and": clauses}


# --------------------------------------------------------------------------- chunks file
def read_chunks(path: str | Path) -> list[dict]:
    with open(path, encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


def chunk_metadata(c: dict) -> dict:
    """Scalar metadata stored with each vector (Chroma accepts only str/int/float/bool)."""
    return {
        "book_id": c["book_id"], "subject": c["subject"], "chapter": c.get("chapter") or "",
        "section": c.get("section") or "", "year_start": int(c["year_start"]),
        "year_end": int(c["year_end"]), "topics": "|" + "|".join(c.get("topics", [])) + "|",
        "ocr_quality": float(c.get("ocr_quality", 1.0)), "page_start": int(c.get("page_start") or 0),
    }


# --------------------------------------------------------------------------- Chroma
class ChromaStore:
    def __init__(self, s: Settings, embedder: Embedder):
        import chromadb

        self.embedder = embedder
        self.client = chromadb.PersistentClient(path=s.chroma_dir)
        try:
            self.col = self.client.get_or_create_collection(
                s.collection, embedding_function=None, configuration={"hnsw": {"space": "cosine"}})
        except TypeError:  # older chromadb
            self.col = self.client.get_or_create_collection(
                s.collection, embedding_function=None, metadata={"hnsw:space": "cosine"})
        self.batch = s.embed_batch

    def upsert(self, chunks: Iterable[dict]) -> int:
        chunks = list(chunks)
        n = 0
        for i in range(0, len(chunks), self.batch):
            part = chunks[i : i + self.batch]
            vecs = self.embedder.embed_documents([c["embed_text"] for c in part])
            self.col.upsert(ids=[c["id"] for c in part], embeddings=vecs,
                            documents=[c["embed_text"] for c in part],
                            metadatas=[chunk_metadata(c) for c in part])
            n += len(part)
        return n

    def search(self, query: str, flt: Filter | None, n: int) -> list[tuple[str, float]]:
        """Return (chunk_id, similarity) pairs, best first."""
        kwargs = {"query_embeddings": [self.embedder.embed_query(query)], "n_results": n,
                  "include": ["distances"]}
        where = flt.to_chroma() if flt else None
        if where:
            kwargs["where"] = where
        try:
            res = self.col.query(**kwargs)
        except Exception as e:  # e.g. fewer matching items than n in some versions
            if "n_results" in str(e) or "contigious" in str(e) or "contiguous" in str(e):
                kwargs["n_results"] = max(1, n // 4)
                res = self.col.query(**kwargs)
            else:
                raise
        ids, dists = res["ids"][0], res["distances"][0]
        return [(i, 1.0 - d) for i, d in zip(ids, dists)]
