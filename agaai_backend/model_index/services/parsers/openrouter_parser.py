"""
OpenRouter parser — цены, контекстное окно, modalities.

GET https://openrouter.ai/api/v1/models  (публичный, без ключа)
"""

from __future__ import annotations

import logging
import requests
from typing import Optional

from .base_parser import BaseParser
from ..utils.cache_layer import parser_cache
from ..utils.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)
_DOMAIN = "openrouter.ai"
_MODELS_URL = "https://openrouter.ai/api/v1/models"

# Module-level cache for the full model list (avoids re-fetching on every call)
_ALL_MODELS: Optional[list[dict]] = None


class OpenRouterParser(BaseParser):

    def _load_all(self) -> Optional[list[dict]]:
        global _ALL_MODELS
        if _ALL_MODELS is not None:
            return _ALL_MODELS

        rate_limiter.check(_DOMAIN)
        try:
            resp = requests.get(
                _MODELS_URL,
                headers={"HTTP-Referer": "https://agaai.index"},
                timeout=15,
            )
            resp.raise_for_status()
            _ALL_MODELS = resp.json().get("data") or []
            logger.info("OpenRouter: cached %d models", len(_ALL_MODELS))
        except Exception as exc:
            logger.error("OpenRouter: load failed: %s", exc)
            return None

        return _ALL_MODELS

    @staticmethod
    def _find(name: str, models: list[dict]) -> Optional[dict]:
        needle = name.lower().replace("_", "-").replace(" ", "-")
        for m in models:
            if (m.get("id") or "").lower() == needle:
                return m
        for m in models:
            if needle in (m.get("id") or "").lower():
                return m
        for m in models:
            if needle in (m.get("name") or "").lower():
                return m
        return None

    @parser_cache(ttl=3600, prefix="or")
    def get_model_info(self, name: str) -> dict:
        models = self._load_all()
        if not models:
            return {}

        match = self._find(name, models)
        if not match:
            logger.info("OpenRouter: no match for '%s'", name)
            return {}

        pricing = match.get("pricing") or {}
        arch = match.get("architecture") or {}

        def per_million(v) -> Optional[float]:
            try:
                f = float(v)
                return round(f * 1_000_000, 4) if f else None
            except (TypeError, ValueError):
                return None

        ctx = (
            arch.get("context_length")
            or (match.get("top_provider") or {}).get("context_length")
            or match.get("context_length")
        )

        return {
            "name":            match.get("id"),
            "description":     (match.get("description") or "")[:400] or None,
            "task":            "text-generation",
            "tags":            [],
            "downloads":       0,
            "likes":           0,
            "source":          ["openrouter"],
            # Pricing
            "price_input":     per_million(pricing.get("prompt")),
            "price_output":    per_million(pricing.get("completion")),
            # Capability
            "context_length":  int(ctx) if ctx else None,
            "modalities_in":   arch.get("input_modalities") or ["text"],
            "modalities_out":  arch.get("output_modalities") or ["text"],
            "author":          (match.get("id") or "").split("/")[0] or None,
            "homepage_url":    f"https://openrouter.ai/{match.get('id', '')}",
            "created_at":      match.get("created"),
            "benchmarks":      [],
        }

    @staticmethod
    def clear_cache():
        global _ALL_MODELS
        _ALL_MODELS = None
