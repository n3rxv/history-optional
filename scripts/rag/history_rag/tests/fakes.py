"""Offline stand-ins for the LLM and the embedding model, so the tests need no API key or downloads."""
from __future__ import annotations

import hashlib
import math
import re


class HashEmbedder:
    """Bag-of-words hashed into a fixed vector. Crude, but deterministic and lexical enough for tests."""

    def __init__(self, dims: int = 512):
        self.dims = dims

    def _vec(self, text: str) -> list[float]:
        v = [0.0] * self.dims
        for w in re.findall(r"[a-z0-9]+", text.lower()):
            if len(w) < 3:
                continue
            h = int(hashlib.md5(w.encode()).hexdigest(), 16)
            v[h % self.dims] += 1.0
        n = math.sqrt(sum(x * x for x in v)) or 1.0
        return [x / n for x in v]

    def embed_documents(self, texts):
        return [self._vec(t) for t in texts]

    def embed_query(self, text):
        return self._vec(text)


class FakeLLM:
    """Answers the three JSON tasks by simple rules; records calls for assertions."""

    def __init__(self, plan: dict | None = None, claims: list[dict] | None = None):
        self.plan, self.claims, self.calls = plan or {}, claims or [], []

    def json(self, system: str, user: str, max_tokens: int = 1500) -> dict:
        task = re.search(r"TASK: (\w+)", system).group(1)
        self.calls.append(task)
        if task == "tag_chunk":
            passage = user.split("PASSAGE:", 1)[1]
            topics_block = user.split("TOPICS:", 1)[1].split("PASSAGE:", 1)[0]
            allowed = set(re.findall(r"^(\w+) \(", topics_block, re.M))
            if "Cripps" in passage or "1942" in passage:
                return {"year_start": 1942, "year_end": 1942,
                        "topics": [t for t in ["cripps_mission_1942"] if t in allowed],
                        "context": "Describes the Cripps offer of March 1942."}
            if "1946" in passage or "Cabinet Mission" in passage:
                return {"year_start": 1946, "year_end": 1946,
                        "topics": [t for t in ["cabinet_mission_1946", "bogus_topic"] if t in allowed],
                        "context": "Describes the Cabinet Mission Plan of 1946 and the parties' responses."}
            if "Reagan" in passage:
                return {"year_start": 1986, "year_end": 1986, "topics": [],
                        "context": "Describes US mid-term elections in 1986."}
            return {"year_start": "not a year", "topics": []}   # forces the section-period fallback
        if task == "plan_query":
            return self.plan
        if task == "extract_date_claims":
            return {"claims": self.claims}
        raise AssertionError(f"unexpected task {task}")

    def text(self, messages, max_tokens=4000, extra_body=None):
        return "The Congress accepted the Plan on 26 June 1946 [S1]."
