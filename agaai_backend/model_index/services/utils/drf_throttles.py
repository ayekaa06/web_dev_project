"""
DRF throttle classes для import_model endpoint.

Подключение в settings.py:
    REST_FRAMEWORK = {
        "DEFAULT_THROTTLE_CLASSES": [],   # глобально без ограничений
        "DEFAULT_THROTTLE_RATES": {
            "import_user":    "10/hour",   # каждый юзер — 10 импортов в час
            "import_anon":    "3/hour",    # анонимы ещё строже
            "import_burst":   "3/minute",  # защита от burst
        },
    }

Использование во view:
    from .drf_throttles import ImportUserThrottle, ImportBurstThrottle

    @api_view(["POST"])
    @throttle_classes([ImportUserThrottle, ImportBurstThrottle])
    def import_model_view(request):
        ...
"""

from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class ImportUserThrottle(UserRateThrottle):
    """Authenticated users: 10 imports / hour."""
    scope = "import_user"


class ImportAnonThrottle(AnonRateThrottle):
    """Anonymous users: 3 imports / hour."""
    scope = "import_anon"


class ImportBurstThrottle(UserRateThrottle):
    """
    Burst protection: max 3 imports / minute per user.
    Prevents someone from hammering the endpoint even within the hourly quota.
    """
    scope = "import_burst"
