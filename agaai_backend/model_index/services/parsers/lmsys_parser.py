from __future__ import annotations

import logging
import requests
from typing import Optional

from .base_parser import BaseParser
from ..utils.cache_layer import parser_cache
from ..utils.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)

_DOMAIN_HF   = "huggingface.co"
_DOMAIN_GH   = "raw.githubusercontent.com"


_HF_DATASET_URL = (
    "https://datasets-server.huggingface.co/rows?dataset=lmarena-ai%2Fleaderboard-dataset&config=text_style_control&split=latest&offset=0&length=100"
)
_GITHUB_SNAPSHOT = (
    "https://raw.githubusercontent.com/oolong-tea-2026/"
    "arena-ai-leaderboards/main/data/leaderboard_latest.json"
)


_NAME_KEYS  = ("model", "key", "name", "model_name", "Model")
_ELO_KEYS   = ("arena_elo_rating", "elo", "elo_rating", "arena_score",
               "rating", "Arena Elo rating")
_RANK_KEYS  = ("rank", "position", "#", "Rank")
_VOTES_KEYS = ("votes", "num_votes", "Votes")
_ORG_KEYS   = ("organization", "org", "Organization", "creator")


class LMSYSParser(BaseParser):


    def _load_leaderboard(self) -> Optional[list[dict]]:
        """Fetch & return all leaderboard rows.  Tries HF first, then GitHub."""
        rows = self._fetch_hf()
        if rows:
            logger.info("Arena: loaded %d rows from HF dataset", len(rows))
            return rows

        rows = self._fetch_github()
        if rows:
            logger.info("Arena: loaded %d rows from GitHub snapshot", len(rows))
            return rows

        logger.error("Arena: all sources failed")
        return None

    def _fetch_hf(self) -> Optional[list[dict]]:
        rate_limiter.check(_DOMAIN_HF)
        try:
            resp = requests.get(_HF_DATASET_URL, timeout=15)
            resp.raise_for_status()
            payload = resp.json()
            raw_rows = payload.get("rows") or []
            return [r.get("row") or r for r in raw_rows]
        except Exception as exc:
            logger.warning("Arena HF dataset failed: %s", exc)
        return None

    def _fetch_github(self) -> Optional[list[dict]]:
        rate_limiter.check(_DOMAIN_GH)
        try:
            resp = requests.get(_GITHUB_SNAPSHOT, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, list):
                return data
            if isinstance(data, dict):
                for key in ("models", "data", "rows"):
                    if key in data:
                        return data[key]
                return list(data.values())
        except Exception as exc:
            logger.warning("Arena GitHub snapshot failed: %s", exc)
        return None


    @staticmethod
    def _normalise(s: str) -> str:
        return s.lower().replace("-", "").replace("_", "").replace(" ", "").replace(".", "")

    def _find_row(self, name: str, rows: list[dict]) -> Optional[dict]:
        needle = self._normalise(name)
        best, best_score = None, 0

        for row in rows:
            # Find the model name field in this row
            candidate_raw = None
            for k in _NAME_KEYS:
                if k in row:
                    candidate_raw = str(row[k])
                    break
            if not candidate_raw:
                for v in row.values():
                    if isinstance(v, str):
                        candidate_raw = v
                        break
            if not candidate_raw:
                continue

            candidate = self._normalise(candidate_raw)

            if candidate == needle:
                return row                          # exact match
            elif needle in candidate:
                score = len(needle)
            elif candidate in needle:
                score = len(candidate)
            else:
                continue

            if score > best_score:
                best_score = score
                best = row

        return best

    # ── Parsing ───────────────────────────────────────────────────────────

    @staticmethod
    def _get(row: dict, *keys) -> Optional[str]:
        row_lower = {k.lower().replace(" ", "_"): v for k, v in row.items()}
        for k in keys:
            v = row_lower.get(k.lower().replace(" ", "_"))
            if v is not None and str(v).strip() not in ("", "N/A", "-"):
                return str(v).strip()
        return None

    def _parse_row(self, original_name: str, row: dict) -> dict:
        get = lambda *keys: self._get(row, *keys)

        elo_raw  = get(*_ELO_KEYS)
        rank_raw = get(*_RANK_KEYS)
        votes_raw = get(*_VOTES_KEYS)
        mt_raw   = get("mt_bench", "mt-bench", "mt_bench_score")
        mmlu_raw = get("mmlu", "mmlu_score")
        arena_name = get(*_NAME_KEYS) or original_name

        def to_float(v):
            try:
                return round(float(str(v).replace(",", "")), 2)
            except (TypeError, ValueError):
                return None

        elo  = to_float(elo_raw)
        rank = to_float(rank_raw)
        rank = int(rank) if rank is not None else None

        benchmarks = []
        if elo is not None:
            benchmarks.append({
                "name": "arena_elo",
                "score": elo,
                "score_str": str(elo),
                "category": "human_preference",
                "source": "chatbot_arena",
            })
        if mt_raw is not None:
            benchmarks.append({
                "name": "mt_bench",
                "score": to_float(mt_raw),
                "score_str": mt_raw,
                "category": "instruction_following",
                "source": "chatbot_arena",
            })
        if mmlu_raw is not None:
            benchmarks.append({
                "name": "mmlu",
                "score": to_float(mmlu_raw),
                "score_str": mmlu_raw,
                "category": "knowledge",
                "source": "chatbot_arena",
            })

        return {
            # Kept compatible with original return shape
            "name":         original_name,
            "description":  f"Arena ELO: {elo}  |  Rank: {rank}" if elo else "LMSYS Chatbot Arena model",
            "task":         "text-generation",
            "tags":         ["chatbot-arena", "lmsys"],
            "downloads":    0,
            "likes":        0,
            "source":       ["lmsys"],
            # NEW fields
            "arena_elo":    elo,
            "arena_rank":   rank,
            "votes":        to_float(votes_raw),
            "author":       get(*_ORG_KEYS),
            "license":      get("license"),
            "benchmarks":   benchmarks,
            "arena_model_name": arena_name,
            "knowledge_cutoff": get("knowledge_cutoff", "cutoff"),
        }

    # ── Main method (cached) ──────────────────────────────────────────────

    @parser_cache(ttl=21600, prefix="lmsys")   # 6 hours
    def get_model_info(self, name: str) -> dict:
        rows = self._load_leaderboard()
        if rows is None:
            return {
                "name": name, "description": "Arena data unavailable",
                "task": None, "tags": [], "downloads": 0, "likes": 0,
                "source": ["lmsys"],
            }

        row = self._find_row(name, rows)
        if row is None:
            logger.info("Arena: no match for '%s'", name)
            return {
                "name": name, "description": "Not found in Chatbot Arena",
                "task": None, "tags": [], "downloads": 0, "likes": 0,
                "source": ["lmsys"],
            }

        return self._parse_row(name, row)
