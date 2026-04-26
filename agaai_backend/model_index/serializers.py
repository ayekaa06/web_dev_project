from rest_framework import serializers

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


class MLArchitectureFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MLArchitectureFile
        fields = [
            "id",
            "file",
            "description",
        ]
        read_only_fields = ["id"]


class PromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prompt
        fields = ["id", "prompt_template"]


class BenchmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Benchmark
        fields = ["id", "name", "description", "source", "formula"]


class MLModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = MLModel
        fields = [
            "id",
            "author",
            "version",
            "model_name",
            "param_count",
            "is_quantized",
        ]


class MLModelRecordListSerializer(serializers.ModelSerializer):
    record_id = serializers.IntegerField(source="id", read_only=True)

    class Meta:
        model = MLModelRecord
        fields = ["record_id", "model_fullref", "custom_name", "description", "badges"]
        read_only_fields = ["id", "created_at"]


class MLModelRecordSerializer(serializers.ModelSerializer):
    architecture = MLArchitectureFileSerializer(many=True, read_only=True)
    model_fullref = MLModelSerializer(read_only=True)
    model_id = serializers.PrimaryKeyRelatedField(
        source="model_fullref", queryset=MLModel.objects.all(), write_only=True
    )
    record_id = serializers.IntegerField(source="id", required=False)

    benchmarks_input = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False
    )
    prompts_input = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False
    )
    badges_input = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False
    )

    benchmarks = BenchmarkSerializer(many=True, read_only=True)
    prompts = PromptSerializer(many=True, read_only=True)

    class Meta:
        model = MLModelRecord
        fields = [
            "record_id",
            "model_fullref",
            "custom_name",
            "custom_note",
            "description",
            "dependencies",
            "benchmarks",
            "benchmarks_input",
            "profiling",
            "prompts",
            "badges",
            "badges_input",
            "model_id",
            "prompts_input",
            "architecture",
        ]
        extra_kwargs = {
            "benchmarks": {"required": False},
            "prompts": {"required": False},
            "model_fullref": {"write_only": True},
        }

    def validate(self, attrs):
        # architecture upload validation moved to upload endpoint
        return attrs

    def create(self, validated_data):
        benchmarks_input = validated_data.pop("benchmarks_input", None)
        prompts_input = validated_data.pop("prompts_input", None)
        badges_input = validated_data.pop("badges_input", None)

        record = MLModelRecord.objects.create(**validated_data)

        # handle benchmarks and prompts after creating the record
        if benchmarks_input is not None:
            self._apply_benchmarks_input(record, benchmarks_input)
        if prompts_input is not None:
            self._apply_prompts_input(record, prompts_input)
        if badges_input is not None:
            self._apply_badges_input(record, badges_input)

        return record

    def update(self, instance, validated_data):
        benchmarks_input = validated_data.pop("benchmarks_input", None)
        prompts_input = validated_data.pop("prompts_input", None)
        badges_input = validated_data.pop("badges_input", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # replace benchmarks/prompts if provided
        if benchmarks_input is not None:
            # clear existing benchmark sets
            instance.benchmark_sets.all().delete()
            self._apply_benchmarks_input(instance, benchmarks_input)
        if prompts_input is not None:
            instance.prompts.clear()
            self._apply_prompts_input(instance, prompts_input)
        if badges_input is not None:
            instance.badges.clear()
            self._apply_badges_input(instance, badges_input)

        return instance

    def _apply_prompts_input(self, record, prompts_input):
        for p in prompts_input:
            if "id" in p:
                try:
                    prompt = Prompt.objects.get(id=p["id"])
                except Prompt.DoesNotExist:
                    continue
            elif "name" in p:
                prompt, _ = Prompt.objects.get_or_create(
                    name=p["name"], prompt_template=p.get("prompt_template", "")
                )
            else:
                raise serializers.ValidationError(
                    'Each prompt input dict must have either "id" or "name" key.'
                )
            record.prompts.add(prompt)

    def _apply_badges_input(self, record, badges_input):
        from .models import Badge

        for b in badges_input:
            # b may be dict with id or name
            if isinstance(b, dict):
                if "id" in b:
                    try:
                        badge = Badge.objects.get(id=b["id"])
                    except Badge.DoesNotExist:
                        continue
                elif "name" in b:
                    badge, _ = Badge.objects.get_or_create(
                        name=b["name"],
                        defaults={"description": b.get("description", "")},
                    )
                else:
                    continue
            else:
                continue

            record.badges.add(badge)

    def _apply_benchmarks_input(self, record, benchmarks_input):
        from .models import Benchmark

        for b in benchmarks_input:
            # b may be dict with id/name and optional value
            benchmark_obj = None
            value = None
            if isinstance(b, dict):
                value = b.get("value")
                if "id" in b:
                    try:
                        benchmark_obj = Benchmark.objects.get(id=b["id"])
                    except Benchmark.DoesNotExist:
                        continue
                elif "name" in b:
                    benchmark_obj, _ = Benchmark.objects.get_or_create(
                        name=b["name"],
                        defaults={
                            "description": b.get("description", ""),
                            "source": b.get("source", ""),
                            "formula": b.get("formula", ""),
                        },
                    )
                else:
                    continue
            else:
                continue

            try:
                value_num = float(value) if value is not None else 0.0
            except Exception:
                value_num = 0.0

            # add via through model with value
            record.benchmarks.add(benchmark_obj, through_defaults={"value": value_num})


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ["name", "description"]


class MLModelRecordPartialUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MLModelRecord
        fields = ["description", "custom_note", "dependencies"]
        extra_kwargs = {
            "description": {"required": False},
            "custom_name": {"required": False},
            "custom_note": {"required": False},
            "dependencies": {"required": False},
        }


class UseCaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = UseCase
        fields = [
            "id",
            "sphere",
            "tags",
            "is_raw",
            "description",
            "datasets",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class UserReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserReview
        fields = [
            "id",
            "review_text",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
