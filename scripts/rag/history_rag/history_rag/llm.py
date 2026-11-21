"""Thin JSON-returning wrapper around any OpenAI-compatible chat endpoint (DeepSeek, Groq, OpenAI...)."""
from __future__ import annotations

import json
import re
import time
from typing import Protocol

from .config import Settings


class LLM(Protocol):
    def json(self, system: str, user: str, max_tokens: int = 1500) -> dict: ...


class LLMError(RuntimeError):
    pass


def parse_json(text: str) -> dict:
    """Parse a JSON object from model output, tolerating code fences or stray text around it."""
    text = (text or "").strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
    try:
        out = json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end <= start:
            raise LLMError(f"no JSON object in model output: {text[:200]!r}")
        out = json.loads(text[start : end + 1])
    if not isinstance(out, dict):
        raise LLMError("model returned JSON that is not an object")
    return out


class ChatLLM:
    def __init__(self, settings: Settings):
        from openai import OpenAI  # imported lazily so tests run without the SDK configured

        if not settings.llm_api_key:
            raise LLMError("No API key: set HRAG_LLM_API_KEY (or DEEPSEEK_API_KEY).")
        self.s = settings
        self.client = OpenAI(base_url=settings.llm_base_url, api_key=settings.llm_api_key,
                             timeout=settings.llm_timeout)

    def json(self, system: str, user: str, max_tokens: int = 1500) -> dict:
        kwargs = dict(
            model=self.s.llm_model,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0,
            max_tokens=max_tokens,
        )
        if self.s.llm_extra_body:
            kwargs["extra_body"] = self.s.llm_extra_body
        if self.s.llm_json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        last: Exception | None = None
        for attempt in range(4):
            try:
                resp = self.client.chat.completions.create(**kwargs)
                return parse_json(resp.choices[0].message.content)
            except (LLMError, json.JSONDecodeError) as e:  # malformed output: retry as is
                last = e
            except Exception as e:  # network / rate limit: back off
                last = e
                time.sleep(2 ** attempt)
        raise LLMError(f"LLM call failed after retries: {last}")

    def text(self, messages: list[dict], max_tokens: int = 4000, extra_body: dict | None = None) -> str:
        """Free-text completion for the final answer. Pass extra_body={} to use the provider's
        default (for DeepSeek that means thinking mode on, which suits multi-source answers)."""
        kwargs = dict(model=self.s.llm_model, messages=messages, max_tokens=max_tokens)
        body = self.s.llm_extra_body if extra_body is None else extra_body
        if body:
            kwargs["extra_body"] = body
        last: Exception | None = None
        for attempt in range(3):
            try:
                return self.client.chat.completions.create(**kwargs).choices[0].message.content or ""
            except Exception as e:
                last = e
                time.sleep(2 ** attempt)
        raise LLMError(f"LLM call failed after retries: {last}")
