import django_filters
from .models import MLModelRecord


class MLModelRecordFilter(django_filters.FilterSet):
    author = django_filters.CharFilter(
        field_name='model_fullref__author',
        lookup_expr='icontains'
    )
    version = django_filters.CharFilter(
        field_name='model_fullref__version',
        lookup_expr='iexact'
    )
    model_name = django_filters.CharFilter(
        field_name='model_fullref__model_name',
        lookup_expr='icontains'
    )
    benchmark_id = django_filters.NumberFilter(
        field_name='benchmarks__id'
    )
    benchmark_name = django_filters.CharFilter(
        field_name='benchmarks__name',
        lookup_expr='icontains'
    )

    class Meta:
        model = MLModelRecord
        fields = ['author', 'version', 'model_name', 'benchmark_id', 'benchmark_name']