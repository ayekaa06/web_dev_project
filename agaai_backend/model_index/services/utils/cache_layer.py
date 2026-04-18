"""
Pluggable cache layer for parser results.

Priority:
  1. Django cache (Redis via django-redis, if Django is configured)
  2. In-process TTL dict (works in plain Python scripts / tests)

Usage:
    from .cache_layer import parser_cache

    @parser_cache(ttl=3600)
    def expensive_call(name):
        ...

Or manually:
    from .cache_layer import Cache
    cache = Cache()
    cache.set("key", value, ttl=600)
    cache.get("key")   # None if missing or expired
"""

from __future__ import annotations

import time
import hashlib
import logging
import functools
from typing import Any, Optional

logger = logging.getLogger(__name__)

# ── In-process fallback ───────────────────────────────────────────────────

class _LocalCache:
    """Thread-safe enough for a single-process dev server."""

    def __init__(self):
        self._store: dict[str, tuple[Any, float]] = {}  # key → (value, expires_at)

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.monotonic() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl: int = 3600):
        self._store[key] = (value, time.monotonic() + ttl)

    def delete(self, key: str):
        self._store.pop(key, None)

    def clear(self):
        self._store.clear()


_local = _LocalCache()


# ── Django cache wrapper ──────────────────────────────────────────────────

class Cache:
    """
    Thin wrapper: prefers Django's cache backend (Redis), falls back to _local.

    In Django: configure CACHES in settings.py (see README below).
    Outside Django: silently uses the in-process dict.
    """

    def _django_cache(self):
        try:
            from django.core.cache import cache
            return cache
        except Exception:
            return None

    def get(self, key: str) -> Optional[Any]:
        dc = self._django_cache()
        if dc is not None:
            try:
                return dc.get(key)
            except Exception as e:
                logger.debug("Django cache get failed, using local: %s", e)
        return _local.get(key)

    def set(self, key: str, value: Any, ttl: int = 3600):
        dc = self._django_cache()
        if dc is not None:
            try:
                dc.set(key, value, timeout=ttl)
                return
            except Exception as e:
                logger.debug("Django cache set failed, using local: %s", e)
        _local.set(key, value, ttl)

    def delete(self, key: str):
        dc = self._django_cache()
        if dc is not None:
            try:
                dc.delete(key)
            except Exception:
                pass
        _local.delete(key)


# ── Decorator ─────────────────────────────────────────────────────────────

_default_cache = Cache()


def parser_cache(ttl: int = 3600, prefix: str = "parser"):
    """
    Decorator for parser methods.  Cache key = prefix + sha256(args).

    @parser_cache(ttl=3600, prefix="hf")
    def get_model_info(self, name: str) -> dict:
        ...
    """
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            # Build a stable key from all positional/keyword args (skip 'self')
            key_parts = str(args[1:]) + str(sorted(kwargs.items()))
            digest = hashlib.sha256(key_parts.encode()).hexdigest()[:16]
            cache_key = f"{prefix}:{fn.__name__}:{digest}"

            cached = _default_cache.get(cache_key)
            if cached is not None:
                logger.debug("cache HIT  %s", cache_key)
                return cached

            logger.debug("cache MISS %s", cache_key)
            result = fn(*args, **kwargs)

            # Only cache non-empty results so a transient 503 doesn't poison the cache
            if result:
                _default_cache.set(cache_key, result, ttl)

            return result
        return wrapper
    return decorator


"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DJANGO SETTINGS SNIPPET (copy to settings.py)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

pip install django-redis

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "SOCKET_CONNECT_TIMEOUT": 5,
            "SOCKET_TIMEOUT": 5,
            "IGNORE_EXCEPTIONS": True,   # fall back to DB if Redis is down
        },
        "KEY_PREFIX": "agaai",
        "TIMEOUT": 3600,
    }
}

# Without Redis (dev):
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
