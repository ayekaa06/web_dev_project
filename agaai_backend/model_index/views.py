from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FileUploadParser
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import BasePermission, IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import OrderingFilter

from .filters import MLModelRecordFilter, UseCaseFilter, UserReviewFilter
from .models import (
    Badge,
    Benchmark,
    MLArchitectureFile,
    MLModel,
    MLModelRecord,
    Prompt,
    UseCase,
    UserReview,
)
from .serializers import (
    BadgeSerializer,
    BenchmarkSetSerializer,
    BenchmarkSerializer,
    MLModelRecordListSerializer,
    MLModelRecordSerializer,
    MLModelSerializer,
    PromptSerializer,
    MLArchitectureFileSerializer,
    UseCaseSerializer,
    UserReviewSerializer,
)


class ReviewPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = "page_size"
    max_page_size = 25


class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        owner = getattr(obj, "user_id", None)
        owner_id = getattr(owner, "id", owner)
        return bool(
            request.user.is_authenticated
            and (
                request.user.is_staff
                or request.user.is_superuser
                or owner_id == request.user.id
            )
        )


class MLModelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MLModel.objects.all()
    serializer_class = MLModelSerializer
    permission_classes = [IsAuthenticated]

    def _apply_ordering(self, queryset, ordering, allowed_fields, default_ordering):
        if ordering in allowed_fields:
            return queryset.order_by(ordering)
        return queryset.order_by(default_ordering)

    @action(detail=True, methods=["get", "post"], url_path="use-cases")
    def use_cases(self, request, pk=None):
        model = self.get_object()
        queryset = (
            model.use_cases.select_related("user_id", "model_fullref")
            .order_by("-created_at")
        )

        if request.method == "POST":
            data = request.data.copy()
            data["model_id"] = model.id
            serializer = UseCaseSerializer(data=data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            serializer.save(user_id=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        queryset = UseCaseFilter(request.query_params, queryset=queryset).qs
        queryset = self._apply_ordering(
            queryset,
            request.query_params.get("ordering"),
            {"id", "-id", "created_at", "-created_at", "sphere", "-sphere"},
            "-created_at",
        )
        return Response(UseCaseSerializer(queryset, many=True).data)

    @action(detail=True, methods=["get", "post"], url_path="user-reviews")
    def user_reviews(self, request, pk=None):
        model = self.get_object()
        queryset = (
            model.reviews.select_related("user_id", "model_fullref")
            .order_by("-created_at")
        )

        if request.method == "POST":
            data = request.data.copy()
            data["model_id"] = model.id
            serializer = UserReviewSerializer(data=data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            serializer.save(user_id=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        queryset = UserReviewFilter(request.query_params, queryset=queryset).qs
        queryset = self._apply_ordering(
            queryset,
            request.query_params.get("ordering"),
            {
                "id",
                "-id",
                "created_at",
                "-created_at",
                "updated_at",
                "-updated_at",
                "rank",
                "-rank",
            },
            "-created_at",
        )
        paginator = ReviewPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            serializer = UserReviewSerializer(page, many=True, context={"request": request})
            return paginator.get_paginated_response(serializer.data)

        serializer = UserReviewSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)


class MLModelRecordViewSet(viewsets.ModelViewSet):
    queryset = (
        MLModelRecord.objects.all()
        .select_related("user_id", "model_fullref")
        .prefetch_related("architecture", "benchmarks", "prompts", "badges")
        .distinct()
    )
    serializer_class = MLModelRecordSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [
        DjangoFilterBackend,
        OrderingFilter,
    ]
    filterset_class = MLModelRecordFilter
    ordering_fields = ["id", "model_fullref__model_name", "updated_at"]
    ordering = ["id"]

    def get_serializer_class(self):
        if self.action in ["list"]:
            return MLModelRecordListSerializer
        else:
            return MLModelRecordSerializer

    @action(detail=True, methods=["post"], url_path="add-benchmarks")
    def add_benchmark(self, request, pk=None):
        record = self.get_object()
        benchmark_id = request.data.get("benchmark_id")
        benchmark_name = request.data.get("benchmark_name") or request.data.get("name")
        value = request.data.get("value")

        if value is None:
            return Response(
                {"error": "value is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        benchmark = None
        if benchmark_id:
            try:
                benchmark = Benchmark.objects.get(id=benchmark_id)
            except Benchmark.DoesNotExist:
                return Response(
                    {"error": "Benchmark not found by id"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        elif benchmark_name:
            benchmark, _ = Benchmark.objects.get_or_create(
                name=benchmark_name,
                defaults={
                    "description": request.data.get("description", ""),
                    "source": request.data.get("source", ""),
                    "formula": request.data.get("formula", ""),
                },
            )
        else:
            return Response(
                {"error": "benchmark_id or benchmark_name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ensure numeric value
        try:
            value_num = float(value)
        except Exception:
            return Response(
                {"error": "value must be numeric"}, status=status.HTTP_400_BAD_REQUEST
            )

        record.benchmarks.add(benchmark, through_defaults={"value": value_num})
        return Response(
            # {
            #     "message": "Benchmark added successfully",
            #     "data": BenchmarkSerializer(record.benchmarks.all(), many=True).data,
            # }
            BenchmarkSetSerializer(record.benchmark_sets.all(), many=True).data
        )

    @action(detail=True, methods=["post"], url_path="remove-benchmarks")
    def remove_benchmark(self, request, pk=None):
        record = self.get_object()
        benchmark_id = request.data.get("benchmark_id")
        benchmark_name = request.data.get("benchmark_name") or request.data.get("name")

        if not benchmark_id and not benchmark_name:
            return Response(
                {"error": "benchmark_id or benchmark_name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if benchmark_id:
                benchmark = Benchmark.objects.get(id=benchmark_id)
            else:
                benchmark = Benchmark.objects.get(name=benchmark_name)
        except Benchmark.DoesNotExist:
            return Response(
                {"error": "Benchmark not found"}, status=status.HTTP_404_NOT_FOUND
            )

        record.benchmarks.remove(benchmark)
        return Response(
            # {
            #     "message": "Benchmark removed successfully",
            #     "data": BenchmarkSerializer(record.benchmarks.all(), many=True).data,
            # }
            BenchmarkSetSerializer(record.benchmark_sets.all(), many=True).data
        )

    @action(detail=True, methods=["post"], url_path="add-prompts")
    def add_prompt(self, request, pk=None):
        record = self.get_object()
        prompt_id = request.data.get("prompt_id")
        prompt_name = request.data.get("prompt_name") or request.data.get("name")
        prompt_template = request.data.get("prompt_template") or request.data.get(
            "content"
        )

        if not prompt_id and not prompt_name:
            return Response(
                {"error": "prompt_id or prompt_name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if prompt_id:
                prompt = Prompt.objects.get(id=prompt_id)
            elif prompt_name:
                prompt, _ = Prompt.objects.get_or_create(name=prompt_name)
        except Prompt.DoesNotExist:
            return Response(
                {"error": "Prompt not found by id or name"},
                status=status.HTTP_404_NOT_FOUND,
            )

        prompt.prompt_template = prompt_template or prompt.prompt_template
        prompt.save()

        record.prompts.add(prompt)
        return Response(
            # {
            #     "message": "Prompt added successfully",
            #     "data": PromptSerializer(record.prompts.all(), many=True).data,
            # }
            PromptSerializer(record.prompts.all(), many=True).data
        )

    @action(detail=True, methods=["post"], url_path="remove-prompts")
    def remove_prompt(self, request, pk=None):
        record = self.get_object()
        prompt_id = request.data.get("prompt_id")
        prompt_name = request.data.get("prompt_name") or request.data.get("name")

        if not prompt_id and not prompt_name:
            return Response(
                {"error": "prompt_id or prompt_name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if prompt_id:
                prompt = Prompt.objects.get(id=prompt_id)
            else:
                prompt = Prompt.objects.get(name=prompt_name)
        except Prompt.DoesNotExist:
            return Response(
                {"error": "Prompt not found"}, status=status.HTTP_404_NOT_FOUND
            )

        record.prompts.remove(prompt)
        return Response(
            # {
            #     "message": "Prompt removed successfully",
            #     "data": PromptSerializer(record.prompts.all(), many=True).data,
            # }
            PromptSerializer(record.prompts.all(), many=True).data
        )

    @action(detail=True, methods=["post"], url_path="add-badges")
    def add_badge(self, request, pk=None):
        record = self.get_object()
        badge_id = request.data.get("badge_id")
        badge_name = request.data.get("badge_name")

        if badge_id:
            try:
                badge = Badge.objects.get(id=badge_id)
            except Badge.DoesNotExist:
                return Response(
                    {"error": "Badge not found"}, status=status.HTTP_404_NOT_FOUND
                )
        elif badge_name:
            badge, _ = Badge.objects.get_or_create(
                name=badge_name,
                defaults={"description": request.data.get("description", "")},
            )
        else:
            return Response(
                {"error": "badge_id or badge_name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # attach badge via many-to-many
        record.badges.add(badge)
        return Response(
            # {"message": "Badge assigned", "data": BadgeSerializer(record.badges.all(), many=True).data}
            BadgeSerializer(record.badges.all(), many=True).data
        )

    @action(detail=True, methods=["post"], url_path="remove-badges")
    def remove_badge(self, request, pk=None):
        record = self.get_object()
        badge_id = request.data.get("badge_id")
        badge_name = request.data.get("badge_name")
        badge = None
        if badge_id:
            try:
                badge = Badge.objects.get(id=badge_id)
            except Badge.DoesNotExist:
                return Response(
                    {"error": "Badge not found"}, status=status.HTTP_404_NOT_FOUND
                )
        elif badge_name:
            try:
                badge = Badge.objects.get(name=badge_name)
            except Badge.DoesNotExist:
                badge = None
        else:
            return Response(
                {"error": "badge_id or badge_name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if badge:
            record.badges.remove(badge)
        return Response(
            # {"message": "Badge removed", "data": BadgeSerializer(record.badges.all(), many=True).data}
            BadgeSerializer(record.badges.all(), many=True).data
        )
    
    def _normalize_model_metadata(self, data):
        metadata = {}

        param_count = data.get("param_count")
        if param_count not in (None, ""):
            metadata["param_count"] = str(param_count)

        if "is_quantized" in data:
            is_quantized = data.get("is_quantized")
            if isinstance(is_quantized, str):
                metadata["is_quantized"] = is_quantized.lower() in {"true", "1", "yes", "on"}
            elif is_quantized is not None:
                metadata["is_quantized"] = bool(is_quantized)

        return metadata

    def _resolve_model_fullref(self, data):
        model_id = data.get("model_id")
        metadata = self._normalize_model_metadata(data)

        if model_id:
            try:
                model_obj = MLModel.objects.get(id=model_id)
            except MLModel.DoesNotExist:
                return None, Response(
                    {"error": "Model not found by id"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if metadata:
                for attr, value in metadata.items():
                    setattr(model_obj, attr, value)
                model_obj.save(update_fields=list(metadata.keys()))

            return model_obj, None

        author = data.get("author")
        version = data.get("version")
        model_name = data.get("model_name")

        if not (author and version and model_name):
            return None, Response(
                {
                    "error": "Either provide model_id or provide model_name, author and version"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        model_obj, _ = MLModel.objects.update_or_create(
            model_name=model_name,
            author=author,
            version=version,
            defaults=metadata,
        )
        return model_obj, None

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        model_obj, error_response = self._resolve_model_fullref(data)
        if error_response is not None:
            return error_response
        data["model_id"] = model_obj.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def update(self, request, *args, **kwargs):
        # Allow updating model_fullref via author/version/model_name trio as well
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        data = request.data.copy()

        if not data.get("model_id") and (
            "author" in data and "version" in data and "model_name" in data
        ):
            author = data.get("author")
            version = data.get("version")
            model_name = data.get("model_name")
            if author and version and model_name:
                model_obj, created = MLModel.objects.get_or_create(
                    model_name=model_name,
                    author=author,
                    version=version,
                )
                data["model_id"] = model_obj.id

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    # @action(detail=True, methods=['patch'], url_path='update-fields')
    # def update_fields(self, request, pk=None):
    #     record = self.get_object()
    #     serializer = MLModelRecordPartialUpdateSerializer(record, data=request.data, partial=True)
    #     if serializer.is_valid():
    #         serializer.save()
    #         return Response(serializer.data)
    #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # @action(detail=True, methods=['post'], url_path='update-dependencies')
    # def update_dependencies(self, request, pk=None):
    #     record = self.get_object()
    #     dependencies = request.data.get('dependencies')
    #     if dependencies is None:
    #         return Response({'error': 'dependencies is required'}, status=status.HTTP_400_BAD_REQUEST)
    #     record.dependencies = dependencies
    #     record.save()
    #     return Response({'message': 'Dependencies updated successfully'})

    @action(detail=True, methods=["post"], url_path="parse-sources")
    def parse_sources(self, request, pk=None):
        record = self.get_object()
        fullref = record.model_fullref

        model_name = f"{fullref.author}/{fullref.model_name}" if fullref.author else fullref.model_name

        from model_index.services.model_service import ModelInfoService
        service = ModelInfoService()
        data = service.get_model_merged(model_name)

        if not data:
            return Response(
                {"error": f"No data found for model '{model_name}'"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Обновляем MLModelRecord — только пустые поля
        record_dirty = False
        for parser_key, record_field in [("description", "description")]:
            value = data.get(parser_key)
            if value and not getattr(record, record_field, None):
                setattr(record, record_field, value)
                record_dirty = True

        if record_dirty:
            record.save()

        # Добавляем бенчмарки из парсера
        existing_names = set(record.benchmarks.values_list("name", flat=True))
        for b in (data.get("benchmarks") or []):
            name = b.get("name") or ""
            score = b.get("score")
            if not name or score is None:
                continue
            if name.lower() in {n.lower() for n in existing_names}:
                continue
            benchmark, _ = Benchmark.objects.get_or_create(
                name=name,
                defaults={
                    "description": b.get("category") or "",
                    "source": b.get("source") or "",
                },
            )
            try:
                record.benchmarks.add(benchmark, through_defaults={"value": float(score)})
                existing_names.add(name)
            except Exception:
                pass

        record.refresh_from_db()
        serializer = MLModelRecordSerializer(record, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user)


class BenchmarkViewSet(viewsets.ModelViewSet):
    queryset = Benchmark.objects.all()
    serializer_class = BenchmarkSerializer


class PromptViewSet(viewsets.ModelViewSet):
    queryset = Prompt.objects.all()
    serializer_class = PromptSerializer


class BadgeViewSet(viewsets.ModelViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer


class UseCaseViewSet(viewsets.ModelViewSet):
    queryset = (
        UseCase.objects.all()
        .select_related("user_id", "model_fullref")
        .order_by("-created_at")
    )
    serializer_class = UseCaseSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [
        DjangoFilterBackend,
        OrderingFilter,
    ]
    filterset_class = UseCaseFilter
    ordering_fields = ["id", "created_at", "model_fullref__model_name", "sphere"]
    ordering = ["-created_at"]


class UserReviewViewSet(viewsets.ModelViewSet):
    queryset = (
        UserReview.objects.all()
        .select_related("user_id", "model_fullref")
        .order_by("-created_at")
    )
    serializer_class = UserReviewSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    pagination_class = ReviewPagination
    filter_backends = [
        DjangoFilterBackend,
        OrderingFilter,
    ]
    filterset_class = UserReviewFilter
    ordering_fields = [
        "id",
        "created_at",
        "updated_at",
        "rank",
        "model_fullref__model_name",
    ]
    ordering = ["-created_at"]


class RawUploadView(APIView):
    """Single-file raw upload for architecture files.

    PUT /.../upload-architecture/{record_id}/{filename}/
    - `record_id` taken from path
    - `filename` taken from path and optional used as description
    - authenticated user must own the record
    - body should contain the file (FileUploadParser expects raw file in `file` key)
    """

    parser_classes = [FileUploadParser]
    permission_classes = [IsAuthenticated]

    def put(self, request, record_id, filename, format=None):
        uploaded_file = request.data.get("file")
        if not uploaded_file:
            return Response(
                {"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            record = MLModelRecord.objects.get(id=record_id)
        except MLModelRecord.DoesNotExist:
            return Response(
                {"error": "MLModelRecord not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if not getattr(request, "user", None) or not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if getattr(record.user_id, "id", None) != getattr(request.user, "id", None):
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        af = MLArchitectureFile.objects.create(
            record=record, file=uploaded_file, description=filename
        )
        af.save()
        return Response(
            MLArchitectureFileSerializer(af).data, status=status.HTTP_201_CREATED
        )


class ArchitectureDeleteView(APIView):
    """Delete a single architecture file for a record.

    DELETE /.../delete-architecture/{record_id}/{file_id}/
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, record_id, file_id, format=None):
        try:
            record = MLModelRecord.objects.get(id=record_id)
        except MLModelRecord.DoesNotExist:
            return Response({"error": "MLModelRecord not found"}, status=status.HTTP_404_NOT_FOUND)

        # ensure user owns the record
        if getattr(record.user_id, "id", None) != getattr(request.user, "id", None):
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        try:
            af = MLArchitectureFile.objects.get(id=file_id, record=record)
        except MLArchitectureFile.DoesNotExist:
            return Response({"error": "Architecture file not found"}, status=status.HTTP_404_NOT_FOUND)

        af.delete()
        return Response({"message": "Architecture file deleted", "id": file_id}, status=status.HTTP_200_OK)
