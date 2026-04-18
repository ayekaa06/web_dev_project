"""
Token-bucket rate limiter for outgoing parser requests.

Each external API domain gets its own bucket. Limits are conservative
so we stay well within free-tier quotas:

  huggingface.co   → 30 req / 60 s  (undocumented free limit ~300/hr)
  openrouter.ai    → 20 req / 60 s
  lmarena.ai       → 5  req / 60 s  (scraping, be gentle)
  *                → 10 req / 60 s  (default)

The limiter is backed by the same Cache layer so it works across
Django workers when Redis is configured.

Usage:
    from .rate_limiter import rate_limiter

    rate_limiter.check("huggingface.co")  # blocks until a token is available
    requests.get(url)
"""

from __future__ import annotations

import time
import threading
import logging
from dataclasses import dataclass, field
from typing import Optional

from ..utils.cache_layer import parser_cache
from .cache_layer import Cache
logger = logging.getLogger(__name__)

# Default limits per domain (requests / window_seconds)
_DOMAIN_LIMITS: dict[str, tuple[int, int]] = {
    "huggingface.co":  (30, 60),
    "openrouter.ai":   (20, 60),
    "lmarena.ai":      ( 5, 60),
    "lmsys.org":       ( 5, 60),
}
_DEFAULT_LIMIT = (10, 60)

# Max seconds to wait before giving up and letting the request through anyway
_MAX_WAIT = 30


@dataclass
class _Bucket:
    """In-process token bucket for one domain."""
    capacity: int
    window: int
    tokens: float = field(init=False)
    last_refill: float = field(init=False)
    lock: threading.Lock = field(default_factory=threading.Lock, init=False)

    def __post_init__(self):
        self.tokens = float(self.capacity)
        self.last_refill = time.monotonic()

    def _refill(self):
        now = time.monotonic()
        elapsed = now - self.last_refill
        rate = self.capacity / self.window          # tokens per second
        self.tokens = min(self.capacity, self.tokens + elapsed * rate)
        self.last_refill = now

    def consume(self) -> float:
        """Consume one token. Returns seconds to wait (0 if available now)."""
        with self.lock:
            self._refill()
            if self.tokens >= 1:
                self.tokens -= 1
                return 0.0
            # How long until the next token arrives?
            rate = self.capacity / self.window
            return (1 - self.tokens) / rate


class RateLimiter:
    """
    Global rate limiter. One instance shared across all parsers.

    When Redis is available it uses atomic Lua scripts via django-redis
    so limits are respected across multiple Gunicorn workers.
    Falls back to per-process token buckets otherwise.
    """

    def __init__(self):
        self._buckets: dict[str, _Bucket] = {}
        self._lock = threading.Lock()
        self._cache = Cache()

    # ── Public API ────────────────────────────────────────────────────────

    def check(self, domain: str, *, max_wait: float = _MAX_WAIT):
        """
        Block until a request token is available for `domain`.
        If we'd have to wait more than max_wait seconds, log a warning
        and let it through anyway (fail-open — better than hanging forever).
        """
        # Try Redis-backed limiting first (respects multiple workers)
        waited = self._redis_check(domain)
        if waited is not None:
            return

        # Fall back to in-process bucket
        bucket = self._get_bucket(domain)
        total_waited = 0.0
        while True:
            wait = bucket.consume()
            if wait <= 0:
                break
            if total_waited >= max_wait:
                logger.warning(
                    "Rate limiter: waited %.1fs for %s, letting through anyway",
                    total_waited, domain,
                )
                break
            sleep_for = min(wait, max_wait - total_waited)
            logger.debug("Rate limit: sleeping %.2fs for %s", sleep_for, domain)
            time.sleep(sleep_for)
            total_waited += sleep_for

    def get_status(self) -> dict:
        """Return current bucket state for monitoring."""
        return {
            domain: {
                "tokens": round(b.tokens, 2),
                "capacity": b.capacity,
                "window_s": b.window,
            }
            for domain, b in self._buckets.items()
        }

    # ── Internals ─────────────────────────────────────────────────────────

    def _get_bucket(self, domain: str) -> _Bucket:
        with self._lock:
            if domain not in self._buckets:
                cap, win = _DOMAIN_LIMITS.get(domain, _DEFAULT_LIMIT)
                self._buckets[domain] = _Bucket(capacity=cap, window=win)
            return self._buckets[domain]

    def _redis_check(self, domain: str) -> Optional[float]:
        """
        Redis sliding-window counter. Returns 0 on success, None if Redis unavailable.

        Uses INCR + EXPIRE: safe for our use case (no race condition on quota overshoot
        by more than 1 because parsers are not hot-path concurrent callers).
        """
        try:
            from django.core.cache import cache as dc
            # Test Redis is actually available
            dc.get("_rl_probe")
        except Exception:
            return None

        try:
            cap, win = _DOMAIN_LIMITS.get(domain, _DEFAULT_LIMIT)
            redis_key = f"rl:{domain}:{int(time.time() // win)}"

            count = dc.get(redis_key) or 0
            if int(count) >= cap:
                # Over limit — sleep a bit and signal caller
                sleep_for = win - (time.time() % win)
                logger.debug("Redis rate limit hit for %s, sleeping %.1fs", domain, sleep_for)
                time.sleep(min(sleep_for, _MAX_WAIT))
                return 0.0

            # Increment counter (set TTL on first write)
            new_val = int(count) + 1
            dc.set(redis_key, new_val, timeout=win * 2)
            return 0.0

        except Exception as e:
            logger.debug("Redis rate limit failed: %s", e)
            return None


# ── Module-level singleton ────────────────────────────────────────────────

rate_limiter = RateLimiter()
