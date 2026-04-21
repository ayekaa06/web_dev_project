<<<<<<< HEAD
from django.shortcuts import render

# Create your views here.
=======
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django_filters.rest_framework import DjangoFilterBacken
from .filters import MLModelRecordFilter

from .models import MLModelRecord, Benchmark, Prompt
from .serializers import MLModelRecordSerializer, BenchmarkSerializer, PromptSerializer, MLModelRecordPartialUpdateSerializer


class MLModelRecordViewSet(viewsets.ModelViewSet):
    queryset = MLModelRecord.objects.all().select_related('user_id', 'model_fullref').prefetch_related(
        'architecture', 'benchmarks', 'prompts'
    ).distinct()
    serializer_class = MLModelRecordSerializer
    permission_classes = [IsAuthenticated]

    filterset_class = MLModelRecordFilter                      # ← добавь
    search_fields = [                                          # ← добавь
        'description',
        'custom_note',
        'model_fullref__model_name',
        'model_fullref__author',
    ]
    ordering_fields = ['id', 'model_fullref__model_name']      # ← добавь
    ordering = ['id']

    @action(detail=True, methods=['post'], url_path='add-benchmark')
    def add_benchmark(self, request, pk=None):
        record = self.get_object()
        benchmark_id = request.data.get('benchmark_id')
        value = request.data.get('value')
        if not benchmark_id or value is None:
            return Response({'error': 'benchmark_id and value are required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            benchmark = Benchmark.objects.get(id=benchmark_id)
        except Benchmark.DoesNotExist:
            return Response({'error': 'Benchmark not found'}, status=status.HTTP_404_NOT_FOUND)
        record.benchmarks.add(benchmark, through_defaults={'value': value})
        return Response({'message': 'Benchmark added successfully'})

    @action(detail=True, methods=['post'], url_path='remove-benchmark')
    def remove_benchmark(self, request, pk=None):
        record = self.get_object()
        benchmark_id = request.data.get('benchmark_id')
        if not benchmark_id:
            return Response({'error': 'benchmark_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            benchmark = Benchmark.objects.get(id=benchmark_id)
        except Benchmark.DoesNotExist:
            return Response({'error': 'Benchmark not found'}, status=status.HTTP_404_NOT_FOUND)
        record.benchmarks.remove(benchmark)
        return Response({'message': 'Benchmark removed successfully'})

    @action(detail=True, methods=['post'], url_path='add-prompt')
    def add_prompt(self, request, pk=None):
        record = self.get_object()
        prompt_id = request.data.get('prompt_id')
        if not prompt_id:
            return Response({'error': 'prompt_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            prompt = Prompt.objects.get(id=prompt_id)
        except Prompt.DoesNotExist:
            return Response({'error': 'Prompt not found'}, status=status.HTTP_404_NOT_FOUND)
        record.prompts.add(prompt)
        return Response({'message': 'Prompt added successfully'})

    @action(detail=True, methods=['post'], url_path='remove-prompt')
    def remove_prompt(self, request, pk=None):
        record = self.get_object()
        prompt_id = request.data.get('prompt_id')
        if not prompt_id:
            return Response({'error': 'prompt_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            prompt = Prompt.objects.get(id=prompt_id)
        except Prompt.DoesNotExist:
            return Response({'error': 'Prompt not found'}, status=status.HTTP_404_NOT_FOUND)
        record.prompts.remove(prompt)
        return Response({'message': 'Prompt removed successfully'})

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


class BenchmarkViewSet(viewsets.ModelViewSet):
    queryset = Benchmark.objects.all()
    serializer_class = BenchmarkSerializer
    permission_classes = [IsAuthenticated]


class PromptViewSet(viewsets.ModelViewSet):
    queryset = Prompt.objects.all()
    serializer_class = PromptSerializer
    permission_classes = [IsAuthenticated]
>>>>>>> feat/login_completed
