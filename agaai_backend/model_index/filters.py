import django_filters
from django.db.models import Q, FloatField
from django.db.models.functions import Cast
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.contrib.postgres.aggregates import StringAgg
from django.db.models import Value
from django.db.models.functions import Coalesce
from django.db.models import Value, TextField

from .models import MLModelRecord


class MLModelRecordFilter(django_filters.FilterSet):
    # Existing filters

    
    author = django_filters.CharFilter(
        field_name="model_fullref__author",
        lookup_expr="icontains",
    )
    version = django_filters.CharFilter(
        field_name="model_fullref__version",
        lookup_expr="iexact",
    )
    model_name = django_filters.CharFilter(
        field_name="model_fullref__model_name",
        lookup_expr="icontains",
    )
    search = django_filters.CharFilter(method="full_text_search")

    # dependencies JSONField
    dependencies_has_key = django_filters.CharFilter(method="filter_dependencies_has_key")
    dependencies_not_has_key = django_filters.CharFilter(method="filter_dependencies_not_has_key")

    # badges
    badge = django_filters.CharFilter(
        field_name="badges__name",
        lookup_expr="iexact",
    )

    # updated_at gt / lt
    updated_after = django_filters.DateTimeFilter(
        field_name="updated_at",
        lookup_expr="gt",
    )
    updated_before = django_filters.DateTimeFilter(
        field_name="updated_at",
        lookup_expr="lt",
    )

    # MLModel fields
    is_quantized = django_filters.BooleanFilter(
        field_name="model_fullref__is_quantized",
    )

    # WARNING: param_count is CharField, so numeric gt/lt is not ideal
    param_count_gt = django_filters.NumberFilter(method="filter_param_count_gt")
    param_count_lt = django_filters.NumberFilter(method="filter_param_count_lt")

    # Benchmarks
    benchmark_id = django_filters.NumberFilter(
        field_name="benchmarks__id",
    )
    benchmark_name = django_filters.CharFilter(
        field_name="benchmarks__name",
        lookup_expr="icontains",
    )

    # Depends on your through model field name, example: BenchmarkSet.score
    benchmark_value_gt = django_filters.NumberFilter(method="filter_benchmark_value_gt")
    benchmark_value_lt = django_filters.NumberFilter(method="filter_benchmark_value_lt")

    class Meta:
        model = MLModelRecord
        fields = [
            "author",
            "version",
            "model_name",
            "dependencies_has_key",
            "dependencies_not_has_key",
            "badge",
            "updated_after",
            "updated_before",
            "is_quantized",
            "param_count_gt",
            "param_count_lt",
            "benchmark_id",
            "benchmark_name",
            "benchmark_value_gt",
            "benchmark_value_lt",
        ]

    def filter_dependencies_has_key(self, queryset, name, value):
        return queryset.filter(dependencies__has_key=value)

    def filter_dependencies_not_has_key(self, queryset, name, value):
        return queryset.exclude(dependencies__has_key=value)

    def filter_param_count_gt(self, queryset, name, value):
        return (
            queryset
            .annotate(param_count_float=Cast("model_fullref__param_count", FloatField()))
            .filter(param_count_float__gt=value)
        )

    def filter_param_count_lt(self, queryset, name, value):
        return (
            queryset
            .annotate(param_count_float=Cast("model_fullref__param_count", FloatField()))
            .filter(param_count_float__lt=value)
        )

    def filter_benchmark_score_gt(self, queryset, name, value):
        return queryset.filter(benchmarkset__value__gt=value)

    def filter_benchmark_score_lt(self, queryset, name, value):
        return queryset.filter(benchmarkset__value__lt=value)

    def full_text_search(self, queryset, name, value):
        queryset = queryset.annotate(
            benchmark_names=Coalesce(
                StringAgg("benchmarks__name", delimiter=" "),
                Value("", output_field=TextField()),
                output_field=TextField(),
            )
        )
        vector = (
            SearchVector("description", weight="A") +
            SearchVector("custom_name", weight="A") +
            SearchVector("custom_note", weight="B") +
            SearchVector("model_fullref__model_name", weight="A") +
            SearchVector("model_fullref__author", weight="C") +
            SearchVector("benchmark_names", weight="C")
        )

        query = SearchQuery(value, search_type="websearch")
        resulting_set = (
            queryset
            .annotate(rank=SearchRank(vector, query))
            .filter(rank__gte=0.05)
            .order_by("-rank")
            .distinct()
        )
        print(resulting_set)
        return resulting_set