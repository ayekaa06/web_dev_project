from django.conf import settings
from django.db import models


class MLModel(models.Model):
    """ML Model registry with metadata."""
    model_name = models.CharField(max_length=200, unique=False)
    author = models.CharField(max_length=255)
    version = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    is_quantized = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Model"
        verbose_name_plural = "Models"
        constraints = [
            models.UniqueConstraint(
                fields=["author", "model_name", "version"],
                name="model_fullref"
            )
        ]

    def __str__(self):
        return f"{self.author}/{self.model_name}:{self.version}"


class MLModelRecord(models.Model):
    """Detailed record of a model version or variant."""
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="model_records"
    )
    model_fullref = models.ForeignKey(
        MLModel,
        on_delete=models.CASCADE,
        related_name="records"
    )
    custom_name = models.CharField(max_length=100)
    badges = models.JSONField(default=list, blank=True)
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
    """Intermediate table linking Benchmarks to MLModels."""
    model_fullref = models.ForeignKey(
        MLModelRecord, on_delete=models.CASCADE, related_name="benchmark_sets"
    )
    benchmark = models.ForeignKey(
        Benchmark, on_delete=models.CASCADE, related_name="model_sets"
    )
    value = models.FloatField(null=False)

    class Meta:
        verbose_name = "Benchmark Set"
        verbose_name_plural = "Benchmark Sets"

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
    review_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Review"
        verbose_name_plural = "User Reviews"
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
    is_raw = models.BooleanField(default=False)
    description = models.TextField()
    datasets = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Use Case"
        verbose_name_plural = "Use Cases"

    def __str__(self):
        return f"UseCase: {self.sphere} - {self.model_fullref}"


class Prompt(models.Model):
    """Prompts for ML models in real-world scenarios."""
    name = models.CharField(max_length=255, unique=True)
    prompt_template = models.TextField()

    class Meta:
        verbose_name = "Prompt"
        verbose_name_plural = "Prompts"

    def __str__(self):
        return f"Prompt: {self.sphere} - {self.model_fullref.model_name}"


class Badge(models.Model):
    """Badge entities that can be assigned to MLModelRecord entries."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Badge"
        verbose_name_plural = "Badges"

    def __str__(self):
        return self.name
