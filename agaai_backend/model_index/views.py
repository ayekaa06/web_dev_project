<<<<<<< HEAD
from rest_framework import viewsets, status, filters
=======
from rest_framework import viewsets, status
>>>>>>> origin/Parser
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import FileUploadParser
from rest_framework.views import APIView

from django_filters.rest_framework import DjangoFilterBackend
from .filters import MLModelRecordFilter

from .models import MLArchitectureFile, MLModelRecord, MLModel, Benchmark, Prompt, Badge
from .serializers import (
    MLModelRecordSerializer,
    BenchmarkSerializer,
    PromptSerializer,
    MLModelRecordPartialUpdateSerializer,
    BadgeSerializer,
)


class MLModelRecordViewSet(viewsets.ModelViewSet):
    queryset = MLModelRecord.objects.all().select_related('user_id', 'model_fullref').prefetch_related(
        'architecture', 'benchmarks', 'prompts'
    ).distinct()
    serializer_class = MLModelRecordSerializer
    permission_classes = [IsAuthenticated]

    filterset_class = MLModelRecordFilter                 
    search_fields = [                                       
        'description',
        'custom_note',
        'model_fullref__model_name',
        'model_fullref__author',
    ]
    ordering_fields = ['id', 'model_fullref__model_name']
    ordering = ['id']

    @action(detail=True, methods=['post'], url_path='add-benchmark')
    def add_benchmark(self, request, pk=None):
        record = self.get_object()
        benchmark_id = request.data.get('benchmark_id')
        benchmark_name = request.data.get('benchmark_name') or request.data.get('name')
        value = request.data.get('value')

        if value is None:
            return Response({'error': 'value is required'}, status=status.HTTP_400_BAD_REQUEST)

        benchmark = None
        if benchmark_id:
            try:
                benchmark = Benchmark.objects.get(id=benchmark_id)
            except Benchmark.DoesNotExist:
                return Response({'error': 'Benchmark not found by id'}, status=status.HTTP_404_NOT_FOUND)
        elif benchmark_name:
            benchmark, _ = Benchmark.objects.get_or_create(
                name=benchmark_name,
                defaults={'description': request.data.get('description', ''), 'source': request.data.get('source', ''), 'formula': request.data.get('formula', '')}
            )
        else:
            return Response({'error': 'benchmark_id or benchmark_name is required'}, status=status.HTTP_400_BAD_REQUEST)

        # ensure numeric value
        try:
            value_num = float(value)
        except Exception:
            return Response({'error': 'value must be numeric'}, status=status.HTTP_400_BAD_REQUEST)

        record.benchmarks.add(benchmark, through_defaults={'value': value_num})
        return Response({'message': 'Benchmark added successfully', 'benchmark': benchmark.name, 'value': value_num})

    @action(detail=True, methods=['post'], url_path='remove-benchmark')
    def remove_benchmark(self, request, pk=None):
        record = self.get_object()
        benchmark_id = request.data.get('benchmark_id')
        benchmark_name = request.data.get('benchmark_name') or request.data.get('name')

        if not benchmark_id and not benchmark_name:
            return Response({'error': 'benchmark_id or benchmark_name is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if benchmark_id:
                benchmark = Benchmark.objects.get(id=benchmark_id)
            else:
                benchmark = Benchmark.objects.get(name=benchmark_name)
        except Benchmark.DoesNotExist:
            return Response({'error': 'Benchmark not found'}, status=status.HTTP_404_NOT_FOUND)

        record.benchmarks.remove(benchmark)
        return Response({'message': 'Benchmark removed successfully', 'benchmark': benchmark.name})

    @action(detail=True, methods=['post'], url_path='add-prompt')
    def add_prompt(self, request, pk=None):
        record = self.get_object()
        prompt_id = request.data.get('prompt_id')
        prompt_template = request.data.get('prompt_template') or request.data.get('prompt') or request.data.get('content') or request.data.get('name')

        if not prompt_id and not prompt_template:
            return Response({'error': 'prompt_id or prompt_template is required'}, status=status.HTTP_400_BAD_REQUEST)

        if prompt_id:
            try:
                prompt = Prompt.objects.get(id=prompt_id)
            except Prompt.DoesNotExist:
                return Response({'error': 'Prompt not found by id'}, status=status.HTTP_404_NOT_FOUND)
        else:
            prompt, _ = Prompt.objects.get_or_create(prompt_template=prompt_template)

        record.prompts.add(prompt)
        return Response({'message': 'Prompt added successfully', 'prompt': prompt.prompt_template})

    @action(detail=True, methods=['post'], url_path='remove-prompt')
    def remove_prompt(self, request, pk=None):
        record = self.get_object()
        prompt_id = request.data.get('prompt_id')
        prompt_template = request.data.get('prompt_template') or request.data.get('prompt') or request.data.get('content') or request.data.get('name')

        if not prompt_id and not prompt_template:
            return Response({'error': 'prompt_id or prompt_template is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if prompt_id:
                prompt = Prompt.objects.get(id=prompt_id)
            else:
                prompt = Prompt.objects.get(prompt_template=prompt_template)
        except Prompt.DoesNotExist:
            return Response({'error': 'Prompt not found'}, status=status.HTTP_404_NOT_FOUND)

        record.prompts.remove(prompt)
        return Response({'message': 'Prompt removed successfully', 'prompt': prompt.prompt_template})

    @action(detail=True, methods=['post'], url_path='add-badge')
    def add_badge(self, request, pk=None):
        record = self.get_object()
        badge_id = request.data.get('badge_id')
        badge_name = request.data.get('badge_name')
        badge = None
        if badge_id:
            try:
                badge = Badge.objects.get(id=badge_id)
            except Badge.DoesNotExist:
                return Response({'error': 'Badge not found'}, status=status.HTTP_404_NOT_FOUND)
        elif badge_name:
            badge, _ = Badge.objects.get_or_create(name=badge_name, defaults={'description': request.data.get('description', '')})
        else:
            return Response({'error': 'badge_id or badge_name is required'}, status=status.HTTP_400_BAD_REQUEST)

        existing = record.badges or []
        if badge.name not in existing:
            existing = existing + [badge.name]
            record.badges = existing
            record.save()

        return Response({'message': 'Badge assigned', 'badges': record.badges})

    @action(detail=True, methods=['post'], url_path='remove-badge')
    def remove_badge(self, request, pk=None):
        record = self.get_object()
        badge_id = request.data.get('badge_id')
        badge_name = request.data.get('badge_name')
        badge = None
        if badge_id:
            try:
                badge = Badge.objects.get(id=badge_id)
            except Badge.DoesNotExist:
                return Response({'error': 'Badge not found'}, status=status.HTTP_404_NOT_FOUND)
        elif badge_name:
            try:
                badge = Badge.objects.get(name=badge_name)
            except Badge.DoesNotExist:
                badge = None
        else:
            return Response({'error': 'badge_id or badge_name is required'}, status=status.HTTP_400_BAD_REQUEST)

        existing = record.badges or []
        if badge and badge.name in existing:
            existing = [b for b in existing if b != badge.name]
            record.badges = existing
            record.save()

        return Response({'message': 'Badge removed', 'badges': record.badges})

    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        if not data.get('model_fullref'):
            author = data.get('author')
            version = data.get('version')

            model_name = data.get('model_name')

            if not (author and version and model_name):
                return Response(
                    {'error': 'Either provide model_fullref or provide model_name, author and version'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            model_obj, created = MLModel.objects.get_or_create(
                model_name=model_name,
                author=author,
                version=version,
            )
            data['model_fullref'] = model_obj.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        # Allow updating model_fullref via author/version/model_name trio as well
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()

        if not data.get('model_fullref') and ('author' in data or 'version' in data or 'model_name' in data or 'custom_name' in data):
            author = data.get('author') or None
            version = data.get('version') or None
            model_name = data.get('model_name') or data.get('custom_name') or None
            if author and version and model_name:
                model_obj, created = MLModel.objects.get_or_create(
                    model_name=model_name,
                    author=author,
                    version=version,
                )
                data['model_fullref'] = model_obj.id

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='update-fields')
    def update_fields(self, request, pk=None):
        record = self.get_object()
        serializer = MLModelRecordPartialUpdateSerializer(record, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='update-dependencies')
    def update_dependencies(self, request, pk=None):
        record = self.get_object()
        dependencies = request.data.get('dependencies')
        if dependencies is None:
            return Response({'error': 'dependencies is required'}, status=status.HTTP_400_BAD_REQUEST)
        record.dependencies = dependencies
        record.save()
        return Response({'message': 'Dependencies updated successfully'})

    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user)


class BenchmarkViewSet(viewsets.ModelViewSet):
    queryset = Benchmark.objects.all()
    serializer_class = BenchmarkSerializer
    permission_classes = [IsAuthenticated]


class PromptViewSet(viewsets.ModelViewSet):
    queryset = Prompt.objects.all()
    serializer_class = PromptSerializer
    permission_classes = [IsAuthenticated]


class BadgeViewSet(viewsets.ModelViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [IsAuthenticated]


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
        uploaded_file = request.data.get('file')
        if not uploaded_file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            record = MLModelRecord.objects.get(id=record_id)
        except MLModelRecord.DoesNotExist:
            return Response({'error': 'MLModelRecord not found'}, status=status.HTTP_404_NOT_FOUND)

        if not getattr(request, 'user', None) or not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        if getattr(record.user_id, 'id', None) != getattr(request.user, 'id', None):
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        af = MLArchitectureFile.objects.create(record=record, file=uploaded_file, description=filename)
        return Response({'id': af.id, 'file': af.file.name}, status=status.HTTP_201_CREATED)
