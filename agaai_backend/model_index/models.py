<<<<<<< HEAD
import uuid

=======
>>>>>>> feat/login_completed
from django.conf import settings
from django.db import models


<<<<<<< HEAD
class Model(models.Model):
    """ML Model registry with metadata."""
    model_name = models.CharField(max_length=255, primary_key=True, unique=True)
    author = models.CharField(max_length=255)
=======
class MLModel(models.Model):
    """ML Model registry with metadata."""
    model_name = models.CharField(max_length=200, unique=False)
    author = models.CharField(max_length=255)
    version = models.CharField(max_length=50)
>>>>>>> feat/login_completed
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Model"
        verbose_name_plural = "Models"
<<<<<<< HEAD

    def __str__(self):
        return self.model_name


class ModelRecord(models.Model):
=======
        constraints = [
            models.UniqueConstraint(
                fields=["author", "model_name", "version"],
                name="model_fullref"
            )
        ]

    def __str__(self):
        return f"{self.author}/{self.model_name}:{self.version}"


class MLModelRecord(models.Model):
>>>>>>> feat/login_completed
    """Detailed record of a model version or variant."""
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="model_records"
    )
<<<<<<< HEAD
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
=======
    model_fullref = models.ForeignKey(
        MLModel,
        on_delete=models.CASCADE,
        related_name="records"
    )
    custom_note = models.TextField(null=True, blank=True)
    description = models.TextField(blank=False, default="")
    dependencies = models.JSONField(default=dict, blank=True)
    benchmarks = models.ManyToManyField("Benchmark", through="BenchmarkSet", related_name="model_records")
    profiling = models.JSONField(default=dict, blank=True)
    prompts = models.ManyToManyField("Prompt",
                                     related_name="model_records")

    class Meta:
        verbose_name = "MLModel Record"
        verbose_name_plural = "MLModel Records"

    def __str__(self):
        return f"Record {self.record_id} - {self.model_fullref}"


def architecture_file_upload_path(instance, filename):
    return f"mlmodel_architectures/{instance.record.model_fullref}/{filename}"


class MLArchitectureFile(models.Model):
    """Files associated with a ML model architecture."""
    record = models.ForeignKey(
        MLModelRecord, on_delete=models.CASCADE, related_name="architecture"
    )
    file = models.FileField(upload_to=architecture_file_upload_path)
    description = models.TextField(blank=True)

    def delete(self, *args, **kwargs):
        self.file.delete(save=False)
        super().delete(*args, **kwargs)

    class Meta:
        verbose_name = "Architecture File"
        verbose_name_plural = "Architecture Files"

    def __str__(self):
        return f"Architecture File for {self.record.model_fullref}"


class Benchmark(models.Model):
    """Benchmark definitions for ML model evaluation."""
>>>>>>> feat/login_completed
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
<<<<<<< HEAD
    """Intermediate table linking Benchmarks to Models."""
    model_name = models.ForeignKey(
        Model, on_delete=models.CASCADE, related_name="benchmark_sets", to_field="model_name"
=======
    """Intermediate table linking Benchmarks to MLModels."""
    model_fullref = models.ForeignKey(
        MLModelRecord, on_delete=models.CASCADE, related_name="benchmark_sets"
>>>>>>> feat/login_completed
    )
    benchmark = models.ForeignKey(
        Benchmark, on_delete=models.CASCADE, related_name="model_sets"
    )
<<<<<<< HEAD
    value = models.CharField(max_length=255, blank=True)
=======
    value = models.FloatField(null=False)
>>>>>>> feat/login_completed

    class Meta:
        verbose_name = "Benchmark Set"
        verbose_name_plural = "Benchmark Sets"
<<<<<<< HEAD
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
=======

    def __str__(self):
        return f"{self.model_name} - {self.benchmark.name}: {self.value}"


class UserReview(models.Model):
    """User reviews for ML models - one review per user per model."""
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="model_reviews"
    )
    model_fullref = models.ForeignKey(
        MLModel, on_delete=models.CASCADE, related_name="reviews"
    )
>>>>>>> feat/login_completed
    review_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Review"
        verbose_name_plural = "User Reviews"
<<<<<<< HEAD
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
=======
        unique_together = ("user_id", "model_fullref")

    def __str__(self):
        return f"Review by {self.user_id} for {self.model_fullref}"


class UseCase(models.Model):
    """Use cases for ML models in real-world scenarios."""
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="use_cases"
    )
    model_fullref = models.ForeignKey(
        MLModel, on_delete=models.CASCADE, related_name="use_cases"
    )
    sphere = models.CharField(max_length=255)
    tags = models.JSONField(default=list, blank=True)
>>>>>>> feat/login_completed
    is_raw = models.BooleanField(default=False)
    description = models.TextField()
    datasets = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Use Case"
        verbose_name_plural = "Use Cases"

    def __str__(self):
<<<<<<< HEAD
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
=======
        return f"UseCase: {self.sphere} - {self.model_fullref}"


class Prompt(models.Model):
    """Prompts for ML models in real-world scenarios."""
    prompt_template = models.TextField()

    class Meta:
        verbose_name = "Prompt"
        verbose_name_plural = "Prompts"

    def __str__(self):
        return f"Prompt: {self.sphere} - {self.model_fullref.model_name}"
>>>>>>> feat/login_completed
