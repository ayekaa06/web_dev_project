import uuid

from django.conf import settings
from django.db import models


class Model(models.Model):
    """ML Model registry with metadata."""
    model_name = models.CharField(max_length=255, primary_key=True, unique=True)
    author = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Model"
        verbose_name_plural = "Models"

    def __str__(self):
        return self.model_name


class ModelRecord(models.Model):
    """Detailed record of a model version or variant."""
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="model_records"
    )
    model_name = models.ForeignKey(
        Model, on_delete=models.CASCADE, related_name="records", to_field="model_name"
    )
    architecture = models.JSONField(
        default=list,
        blank=True,
        help_text="List of file paths/media for model architecture"
    )
    custom_note = models.TextField(null=True, blank=True)
    description = models.TextField(blank=False, default="")
    dependencies = models.TextField(
        blank=True, help_text="Path to markdown file or simple text"
    )

    class Meta:
        verbose_name = "Model Record"
        verbose_name_plural = "Model Records"

    def __str__(self):
        return f"Record {self.record_id} - {self.model_name}"


class Benchmark(models.Model):
    """Benchmark definitions for model evaluation."""
    name = models.CharField(max_length=255)
    description = models.TextField()
    source = models.TextField(null=True, blank=True)
    formula = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Benchmark"
        verbose_name_plural = "Benchmarks"

    def __str__(self):
        return self.name


class BenchmarkSet(models.Model):
    """Intermediate table linking Benchmarks to Models."""
    model_name = models.ForeignKey(
        Model, on_delete=models.CASCADE, related_name="benchmark_sets", to_field="model_name"
    )
    benchmark = models.ForeignKey(
        Benchmark, on_delete=models.CASCADE, related_name="model_sets"
    )
    value = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = "Benchmark Set"
        verbose_name_plural = "Benchmark Sets"
        unique_together = ("model_name", "benchmark")

    def __str__(self):
        return f"{self.model_name} - {self.benchmark.name}"


class UserReview(models.Model):
    """User reviews for models - one review per user per model."""
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="model_reviews"
    )
    model_name = models.ForeignKey(
        Model, on_delete=models.CASCADE, related_name="reviews", to_field="model_name"
    )
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], null=True, blank=True)
    review_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Review"
        verbose_name_plural = "User Reviews"
        unique_together = ("user_id", "model_name")

    def __str__(self):
        return f"Review by {self.user_id} for {self.model_name}"


class UseCase(models.Model):
    """Use cases for models in real-world scenarios."""
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="use_cases"
    )
    model_name = models.ForeignKey(
        Model, on_delete=models.CASCADE, related_name="use_cases", to_field="model_name"
    )
    sphere = models.CharField(max_length=255)
    technologies = models.JSONField(default=list, blank=True)
    is_raw = models.BooleanField(default=False)
    description = models.TextField()
    datasets = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Use Case"
        verbose_name_plural = "Use Cases"

    def __str__(self):
        return f"UseCase: {self.sphere} - {self.model_name}"


class ProfilingType(models.Model):
    """Types of profiling metrics."""
    name = models.CharField(max_length=255, unique=True)
    value_type = models.CharField(
        max_length=50,
        choices=[("string", "String"), ("number", "Number"), ("json", "JSON")],
        default="string"
    )

    class Meta:
        verbose_name = "Profiling Type"
        verbose_name_plural = "Profiling Types"

    def __str__(self):
        return self.name


class Profiling(models.Model):
    """Performance profiling data for models."""
    model_name = models.ForeignKey(
        Model, on_delete=models.CASCADE, related_name="profiling_data", to_field="model_name"
    )
    type_id = models.ForeignKey(
        ProfilingType, on_delete=models.CASCADE, related_name="profiling_records"
    )
    value = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Profiling"
        verbose_name_plural = "Profiling"

    def __str__(self):
        return f"{self.model_name} - {self.type_id.name}"
