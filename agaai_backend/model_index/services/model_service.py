"""
ModelInfoService — публичный API для Django views.
"""

from __future__ import annotations

import logging
from typing import Optional

from .parsers.huggingface_parser import HuggingFaceParser
from .parsers.lmsys_parser import LMSYSParser
from .parsers.openrouter_parser import OpenRouterParser

logger = logging.getLogger(__name__)


def _merge(base: dict, overlay: dict) -> dict:
    """
    Fill empty fields in `base` with values from `overlay`.
    Lists are merged (union). Non-empty base values are never overwritten.
    """
    result = dict(base)
    for key, val in overlay.items():
        if key == "source":
            # Combine source lists
            result["source"] = list(set(result.get("source", []) + (val or [])))
        elif key == "benchmarks":
            # Merge benchmark lists, dedup by name
            existing_names = {b["name"] for b in result.get("benchmarks", [])}
            extra = [b for b in (val or []) if b["name"] not in existing_names]
            result["benchmarks"] = result.get("benchmarks", []) + extra
        elif key == "tags":
            result["tags"] = list(set(result.get("tags", []) + (val or [])))
        else:
            # Fill only if base has None / 0 / "" / missing
            current = result.get(key)
            if current is None or current == "" or current == 0:
                result[key] = val
    return result


class ModelInfoService:

    def __init__(self):
        self.hf = HuggingFaceParser()
        self.lmsys = LMSYSParser()
        self.or_  = OpenRouterParser()

    # ── Single-source methods (same API as before) ────────────────────────

    def get_model(self, name: str) -> dict:
        """
        Routing:
          hf:<name>      → HuggingFace only
          lmsys:<name>   → LMSYS / Chatbot Arena only
          or:<name>      → OpenRouter only
          <name>         → all sources, merged
        """
        if name.startswith("hf:"):
            return self.hf.get_model_info(name[3:])

        if name.startswith("lmsys:"):
            return self.lmsys.get_model_info(name[6:])

        if name.startswith("or:"):
            return self.or_.get_model_info(name[3:])

        # Default: run all, merge
        return self.get_model_merged(name)

    # ── Multi-source merge ────────────────────────────────────────────────

    def get_model_merged(
        self,
        name: str,
        sources: Optional[list[str]] = None,
    ) -> dict:
        """
        Run all (or specified) parsers and merge results.

        Args:
            name:    model identifier
            sources: list of "huggingface" | "lmsys" | "openrouter"
                     None = all three

        Returns:
            Merged dict. Empty dict if nothing found at all.
        """
        run_all = sources is None
        result: dict = {}

        if run_all or "huggingface" in sources:
            hf_data = self.hf.get_model_info(name)
            if hf_data:
                result = _merge(result, hf_data)

        if run_all or "lmsys" in sources:
            lmsys_data = self.lmsys.get_model_info(name)
            if lmsys_data:
                result = _merge(result, lmsys_data)

        if run_all or "openrouter" in sources:
            or_data = self.or_.get_model_info(name)
            if or_data:
                result = _merge(result, or_data)

        if not result:
            logger.warning("ModelInfoService: no data found for '%s'", name)

        return result

    def invalidate(self, name: str):
        """Clear cached results for a model (call after manual edits)."""
        from .utils.cache_layer import Cache
        cache = Cache()
        # Best-effort: clear known key patterns
        import hashlib
        for prefix, fn_name in [("hf", "get_model_info"), ("lmsys", "get_model_info"),
                                  ("or", "get_model_info")]:
            key_parts = f"('{name}',){{}}"
            digest = hashlib.sha256(key_parts.encode()).hexdigest()[:16]
            cache.delete(f"{prefix}:{fn_name}:{digest}")
