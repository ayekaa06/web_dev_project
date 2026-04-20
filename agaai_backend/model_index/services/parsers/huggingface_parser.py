"""
HuggingFace parser — расширенная версия.

Новое по сравнению с оригиналом:
  • @parser_cache(ttl=3600)   — результаты кэшируются в Redis/LocMem
  • rate_limiter.check(...)   — не улетаем в бан huggingface.co
  • model_size_bytes          — реальный размер из siblings (файлы .safetensors)
  • parameter_count           — из config.json или safetensors metadata
  • quantization              — Q4_K_M, GPTQ, AWQ, BitsAndBytes и др.
  • tensor_type               — float32, bfloat16, float16, int8, int4
  • context_length            — из config.json (max_position_embeddings)
  • architecture              — LlamaForCausalLM и т.п.
  • license                   — из card metadata
  • benchmarks                — eval_results из card если есть
"""

from __future__ import annotations

import re
import logging
import requests

from .base_parser import BaseParser
from ..utils.cache_layer import parser_cache
from ..utils.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────

_DOMAIN = "huggingface.co"
_API_BASE = "https://huggingface.co/api/models"

# Tags we don't want to show users
_TAG_BLACKLIST = {
    "pytorch", "tf", "jax", "rust", "onnx",
    "safetensors", "region:us", "has_space",
}

# Known quantization patterns (checked against filename and tags)
_QUANT_PATTERNS = [
    (r"\bQ\d[_K]?[_KLMS]?\b",      lambda m: m.group()),   # Q4_K_M, Q5_K_S …
    (r"\bGPTQ\b",                   lambda _: "GPTQ"),
    (r"\bAWQ\b",                    lambda _: "AWQ"),
    (r"\bGGUF\b",                   lambda _: "GGUF"),
    (r"\bGGML\b",                   lambda _: "GGML"),
    (r"\bEXL2\b",                   lambda _: "EXL2"),
    (r"\bbnb\b|bitsandbytes",       lambda _: "BitsAndBytes"),
    (r"\bint8\b",                   lambda _: "int8"),
    (r"\bint4\b|4bit",              lambda _: "int4"),
    (r"\bfp8\b",                    lambda _: "fp8"),
]

# Tensor dtype → canonical label
_DTYPE_MAP = {
    "float32": "float32", "fp32": "float32",
    "float16": "float16", "fp16": "float16", "half": "float16",
    "bfloat16": "bfloat16", "bf16": "bfloat16",
    "int8": "int8",
    "int4": "int4", "4bit": "int4",
    "fp8": "fp8",
}


class HuggingFaceParser(BaseParser):

    # ── Helpers you already had ───────────────────────────────────────────

    @staticmethod
    def trim_description(text: str, max_len: int = 300) -> str | None:
        if not text:
            return None
        return text[:max_len].strip()

    def fetch_readme(self, model_id: str) -> str | None:
        rate_limiter.check(_DOMAIN)
        url = f"https://huggingface.co/{model_id}/raw/main/README.md"
        try:
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                return r.text
        except Exception:
            pass
        return None

    @staticmethod
    def extract_description_from_readme(readme: str) -> str | None:
        if not readme:
            return None
        if "## Model description" in readme:
            parts = readme.split("## Model description")
            return parts[1].split("##")[0].strip()
        lines = readme.split("\n")
        for line in lines:
            line = line.strip()
            if line and not line.startswith("#") and line != "---":
                return line
        return None

    @staticmethod
    def extract_task(data: dict) -> str | None:
        task = data.get("pipeline_tag")
        if task:
            return task
        tags = data.get("tags", [])
        if "text-generation" in tags:
            return "text-generation"
        if any("text2text" in t for t in tags):
            return "text2text-generation"
        if "fill-mask" in tags:
            return "fill-mask"
        return None

    @staticmethod
    def clean_tags(tags: list[str]) -> list[str]:
        return [t for t in tags if not any(b in t for b in _TAG_BLACKLIST)]

    # ── NEW: model size / format / hardware info ──────────────────────────

    @staticmethod
    def extract_model_size(data: dict) -> dict:
        """
        Returns:
          model_size_bytes  — total bytes of all weight files (or None)
          model_size_str    — human-readable like "14.2 GB"
          weight_files      — list of {name, size_bytes} for the main files
        """
        siblings = data.get("siblings") or []
        total = 0
        files = []
        for f in siblings:
            name = f.get("rfilename", "")
            size = f.get("size") or 0
            # Only count actual weight files
            if any(name.endswith(ext) for ext in
                   (".safetensors", ".bin", ".pt", ".gguf", ".ggml", ".ckpt")):
                total += size
                files.append({"name": name, "size_bytes": size})

        if total == 0:
            # Fallback: safetensors metadata aggregate
            st = data.get("safetensors") or {}
            total = st.get("total") or 0  # this is param count not bytes; skip

        return {
            "model_size_bytes": total if total > 0 else None,
            "model_size_str": _human_bytes(total) if total > 0 else None,
            "weight_files": files[:10],  # cap to avoid huge payloads
        }

    @staticmethod
    def extract_parameter_count(data: dict, config: dict) -> str | None:
        """
        Try (in order):
          1. safetensors.total  — exact param count from index
          2. config.json num_parameters
          3. Regex on model name / tags  ("7B", "70B", "0.5B" …)
        """
        # 1. safetensors index
        st = data.get("safetensors") or {}
        total = st.get("total")
        if total and isinstance(total, int) and total > 0:
            return _format_params(total)

        # 2. config.json
        for key in ("num_parameters", "n_params", "num_params"):
            val = config.get(key)
            if val and isinstance(val, int):
                return _format_params(val)

        # 3. Regex on model ID / tags
        candidate = (data.get("modelId") or "") + " ".join(data.get("tags") or [])
        m = re.search(r"(\d+(?:\.\d+)?)\s*[Bb](?:illion)?\b", candidate)
        if m:
            return f"{m.group(1)}B"
        m = re.search(r"(\d+(?:\.\d+)?)\s*[Mm](?:illion)?\b", candidate)
        if m:
            return f"{m.group(1)}M"

        return None

    @staticmethod
    def extract_quantization(data: dict, config: dict) -> str | None:
        """
        Detect quantization from:
          • model name / filename patterns
          • tags
          • config.json quantization_config
        """
        # Check quantization_config in config.json
        qconf = config.get("quantization_config") or {}
        if qconf:
            load_in_8 = qconf.get("load_in_8bit")
            load_in_4 = qconf.get("load_in_4bit")
            quant_type = qconf.get("quant_type") or qconf.get("quant_method", "")
            bits = qconf.get("bits")
            if load_in_4:
                return f"BitsAndBytes-4bit ({quant_type})" if quant_type else "BitsAndBytes-4bit"
            if load_in_8:
                return "BitsAndBytes-8bit"
            if bits:
                return f"{bits}bit ({quant_type})" if quant_type else f"{bits}bit"
            if quant_type:
                return quant_type.upper()

        # Pattern matching on name + tags + filenames
        search_str = " ".join(filter(None, [
            data.get("modelId") or "",
            " ".join(data.get("tags") or []),
            " ".join(
                f.get("rfilename", "")
                for f in (data.get("siblings") or [])
            ),
        ])).upper()

        for pattern, labeller in _QUANT_PATTERNS:
            m = re.search(pattern, search_str, re.IGNORECASE)
            if m:
                return labeller(m)

        return None

    @staticmethod
    def extract_tensor_type(data: dict, config: dict) -> str | None:
        """
        Detect primary dtype from:
          • config.json torch_dtype / dtype
          • tags
          • filename patterns
        """
        # config.json
        for key in ("torch_dtype", "dtype", "model_type"):
            val = str(config.get(key) or "").lower()
            if val in _DTYPE_MAP:
                return _DTYPE_MAP[val]

        # Tags
        tags_str = " ".join(data.get("tags") or []).lower()
        for raw, canonical in _DTYPE_MAP.items():
            if raw in tags_str:
                return canonical

        # Filenames (e.g. model-bf16.safetensors)
        for f in (data.get("siblings") or []):
            name = f.get("rfilename", "").lower()
            for raw, canonical in _DTYPE_MAP.items():
                if raw in name:
                    return canonical

        return None

    @staticmethod
    def extract_context_length(config: dict) -> int | None:
        for key in ("max_position_embeddings", "max_seq_len",
                     "context_length", "n_ctx", "max_length"):
            val = config.get(key)
            if val and isinstance(val, int):
                return val
        return None

    @staticmethod
    def extract_architecture(data: dict, config: dict) -> str | None:
        archs = config.get("architectures") or []
        if archs:
            return archs[0]
        tags = data.get("tags") or []
        for t in tags:
            if "moe" in t.lower():
                return "MoE"
        return None

    @staticmethod
    def extract_license(data: dict) -> str | None:
        card = data.get("cardData") or {}
        lic = card.get("license") or data.get("license")
        if isinstance(lic, list):
            return lic[0] if lic else None
        return str(lic) if lic else None

    @staticmethod
    def extract_benchmarks(data: dict) -> list[dict]:
        card = data.get("cardData") or {}
        results = []
        for item in card.get("eval_results") or []:
            dataset = item.get("dataset") or {}
            task    = item.get("task") or {}
            for metric in item.get("metrics") or []:
                val = metric.get("value")
                results.append({
                    "name": (dataset.get("name") or task.get("name") or "unknown").lower(),
                    "score": round(float(val), 4) if val is not None else None,
                    "score_str": str(val) if val is not None else None,
                    "category": task.get("type"),
                    "source": "huggingface",
                })
        return results

    # ── Config fetcher ────────────────────────────────────────────────────
    def extract_benchmarks_from_readme(self, readme: str) -> list[dict]:
        if not readme or "Evaluation results" not in readme:
            return []

        # Берем текст после заголовка
        section = readme.split("Evaluation results")[1]

        # Собираем все строки таблицы
        lines = [l.strip() for l in section.split("\n") if l.strip().startswith("|")]

        # В Markdown таблице минимум 3 строки: заголовки, разделитель |---| и данные
        if len(lines) < 3:
            return []

        # Парсим заголовки (первая строка)
        headers = [h.strip().lower() for h in lines[0].split("|") if h.strip()]
        
        # Парсим значения (пропускаем вторую строку с дефисами и берем третью)
        values = [v.strip() for v in lines[2].split("|") if v.strip()]

        # Убираем колонку "Task", если она есть в начале
        if headers and headers[0] == "task":
            headers = headers[1:]
            # Если в строке значений первая ячейка была пустой (как в BERT), 
            # она уже могла отфильтроваться или сместиться. 
            # Проверим соответствие длины.
            if len(values) > len(headers):
                values = values[1:]

        results = []

        for h, v in zip(headers, values):
            # Пропускаем ненужные колонки
            if h in ("task", "average"):
                continue

            score = None
            # Обработка сдвоенных метрик (например, 84.6/83.4)
            if "/" in v:
                try:
                    parts = [float(p.strip()) for p in v.split("/")]
                    score = sum(parts) / len(parts)
                except (ValueError, ZeroDivisionError):
                    score = None
            else:
                try:
                    score = float(v)
                except ValueError:
                    score = None

            results.append({
                "name": h.upper(), # Приводим к верхнему регистру (MNLI, QQP)
                "score": score,
                "score_str": v,
                "category": "benchmark",
                "source": "readme"
            })

        return results
    def _fetch_config(self, model_id: str) -> dict:
        """Fetch config.json for architectural details."""
        rate_limiter.check(_DOMAIN)
        url = f"https://huggingface.co/{model_id}/raw/main/config.json"
        try:
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                return r.json()
        except Exception:
            pass
        return {}

    # ── Main method (cached) ──────────────────────────────────────────────

    @parser_cache(ttl=3600, prefix="hf")
    def get_model_info(self, name: str) -> dict:
        """
        Fetch full model metadata from HuggingFace Hub.

        Args:
            name: HF repo_id, e.g. "meta-llama/Llama-3.1-8B-Instruct"

        Returns:
            dict with all fields, or {} on error.
        """
        rate_limiter.check(_DOMAIN)
        url = f"{_API_BASE}/{name}"

        try:
            response = requests.get(
                url,
                params={"full": "true", "config": "true"},
                timeout=10,
            )
            if response.status_code == 404:
                logger.info("HF: model not found: %s", name)
                return {}
            if response.status_code != 200:
                logger.warning("HF: unexpected status %s for %s", response.status_code, name)
                return {}

            data = response.json()

        except Exception as exc:
            logger.error("HF: request failed for %s: %s", name, exc)
            return {}

        # Fetch supplementary data (each call is rate-limited individually)
        config = self._fetch_config(name)
        readme = self.fetch_readme(name)
        description = self.extract_description_from_readme(readme)

        hf_benchmarks = self.extract_benchmarks(data)
        if data.get("gated"):
            readme_benchmarks = []
        else:
            readme_benchmarks = self.extract_benchmarks_from_readme(readme)
        
        benchmarks = hf_benchmarks + readme_benchmarks
        # ── Assemble result ───────────────────────────────────────────
        size_info = self.extract_model_size(data)

        return {
            # ── Original fields (unchanged keys) ─────────────────────
            "name":        data.get("modelId"),
            "description": self.trim_description(description) or "No description available",
            "task":        self.extract_task(data),
            "tags":        self.clean_tags(data.get("tags", [])),
            "downloads":   data.get("downloads", 0),
            "likes":       data.get("likes", 0),
            "source":      ["huggingface"],

            # ── NEW: size / format / hardware ────────────────────────
            "parameter_count":  self.extract_parameter_count(data, config),
            "model_size_bytes": size_info["model_size_bytes"],
            "model_size_str":   size_info["model_size_str"],
            "weight_files":     size_info["weight_files"],
            "quantization":     self.extract_quantization(data, config),
            "tensor_type":      self.extract_tensor_type(data, config),
            "context_length":   self.extract_context_length(config),
            "architecture":     self.extract_architecture(data, config),

            # ── NEW: extra metadata ───────────────────────────────────
            "license":       self.extract_license(data),
            "benchmarks": benchmarks,
            "author":        data.get("author"),
            "created_at":    data.get("createdAt"),
            "last_modified": data.get("lastModified"),
            "homepage_url":  f"https://huggingface.co/{name}",
            "private":       data.get("private", False),
            "gated":         data.get("gated", False),
        }


# ── Private helpers ───────────────────────────────────────────────────────

def _human_bytes(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} PB"


def _format_params(n: int) -> str:
    if n >= 1_000_000_000:
        return f"{n / 1_000_000_000:.2f}B".rstrip("0").rstrip(".")+"B"
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    return f"{n:,}"
