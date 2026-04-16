"""
Django FBV views для AGAAI Index.

import_model_view:
  • POST /api/models/import/
  • throttled: 10/hour per user, burst 3/min
  • вызывает ModelInfoService.get_model_merged()
  • сохраняет все новые поля (size, quant, tensor_type и т.д.)

search_models_view:
  • GET /api/models/?q=llama&task=text-generation&quant=GPTQ&min_ctx=8192
  • фильтрация по новым полям прямо из БД
"""

from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .drf_throttles import ImportUserThrottle, ImportBurstThrottle
from .model_service import ModelInfoService

_service = ModelInfoService()


# ──────────────────────────────────────────────────────────────────────────
# POST /api/models/import/
# ──────────────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([ImportUserThrottle, ImportBurstThrottle])
def import_model_view(request):
    """
    Body (JSON):
    {
        "model_name": "meta-llama/Llama-3.1-8B-Instruct",
        "sources":    ["huggingface", "openrouter"]   // optional
    }
    """
    model_name = (request.data.get("model_name") or "").strip()
    sources = request.data.get("sources") or None

    if not model_name:
        return Response(
            {"error": "model_name is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    info = _service.get_model_merged(model_name, sources=sources)

    if not info:
        return Response(
            {"error": f"Could not find model '{model_name}' in any source."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Late import to avoid circular imports
    from .models import AIModel  # adjust to your app name
    from .serializers import AIModelSerializer

    obj, created = AIModel.objects.update_or_create(
        model_name=info.get("name") or model_name,
        defaults={
            "author":           info.get("author") or "",
            "description":      info.get("description") or "",
            "homepage_url":     info.get("homepage_url") or "",
            "license":          info.get("license") or "",
            "task":             info.get("task") or "",
            "context_length":   info.get("context_length"),
            "parameter_count":  info.get("parameter_count") or "",
            "model_size_bytes": info.get("model_size_bytes"),
            "model_size_str":   info.get("model_size_str") or "",
            "quantization":     info.get("quantization") or "",
            "tensor_type":      info.get("tensor_type") or "",
            "architecture":     info.get("architecture") or "",
            "price_input":      info.get("price_input"),
            "price_output":     info.get("price_output"),
            "arena_elo":        info.get("arena_elo"),
            "arena_rank":       info.get("arena_rank"),
            "downloads":        info.get("downloads") or 0,
            "likes":            info.get("likes") or 0,
            "benchmarks":       info.get("benchmarks") or [],   # JSONField
            "tags":             info.get("tags") or [],          # ArrayField / JSONField
            "sources_used":     info.get("source") or [],
            "added_by":         request.user,
        },
    )

    serializer = AIModelSerializer(obj)
    return Response(
        {
            "created":      created,
            "model":        serializer.data,
            "sources_used": info.get("source"),
        },
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


# ──────────────────────────────────────────────────────────────────────────
# GET /api/models/search/
# ──────────────────────────────────────────────────────────────────────────

@api_view(["GET"])
def search_models_view(request):
    """
    Query params (all optional):
      q          — substring search on model_name / author / description
      task       — exact pipeline_tag  (e.g. text-generation)
      quant      — quantization substring (GPTQ, AWQ, Q4_K_M …)
      tensor     — tensor_type  (float16, bfloat16, int8 …)
      min_ctx    — minimum context_length (int)
      max_size   — max model_size_bytes  (int, e.g. 15000000000 for ~15 GB)
      min_elo    — minimum arena_elo     (float)
      ordering   — field name, prefix with - for desc (default: -downloads)
      limit      — max results (default 20, max 100)
    """
    from .models import AIModel
    from .serializers import AIModelSerializer
    from django.db.models import Q

    qs = AIModel.objects.all()

    q = request.GET.get("q")
    if q:
        qs = qs.filter(
            Q(model_name__icontains=q)
            | Q(author__icontains=q)
            | Q(description__icontains=q)
        )

    task = request.GET.get("task")
    if task:
        qs = qs.filter(task__iexact=task)

    quant = request.GET.get("quant")
    if quant:
        qs = qs.filter(quantization__icontains=quant)

    tensor = request.GET.get("tensor")
    if tensor:
        qs = qs.filter(tensor_type__iexact=tensor)

    min_ctx = request.GET.get("min_ctx")
    if min_ctx:
        try:
            qs = qs.filter(context_length__gte=int(min_ctx))
        except ValueError:
            pass

    max_size = request.GET.get("max_size")
    if max_size:
        try:
            qs = qs.filter(model_size_bytes__lte=int(max_size))
        except ValueError:
            pass

    min_elo = request.GET.get("min_elo")
    if min_elo:
        try:
            qs = qs.filter(arena_elo__gte=float(min_elo))
        except ValueError:
            pass

    ordering = request.GET.get("ordering", "-downloads")
    allowed_orderings = {
        "downloads", "-downloads", "likes", "-likes",
        "arena_elo", "-arena_elo", "model_size_bytes", "-model_size_bytes",
        "context_length", "-context_length", "model_name", "-model_name",
    }
    if ordering in allowed_orderings:
        qs = qs.order_by(ordering)

    try:
        limit = min(int(request.GET.get("limit", 20)), 100)
    except ValueError:
        limit = 20

    qs = qs[:limit]
    serializer = AIModelSerializer(qs, many=True)
    return Response({"count": len(serializer.data), "results": serializer.data})
