from rest_framework import serializers

from .models import MLArchitectureFile, MLModelRecord, Benchmark, Prompt
from .models import Badge


class MLArchitectureFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MLArchitectureFile
        fields = [
            'id',
            'file',
            'description',
        ]
        read_only_fields = ['id']



class PromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prompt
        fields = ['id', 'prompt_template']


class BenchmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Benchmark
        fields = ['id', 'name', 'description', 'source', 'formula']


class MLModelRecordSerializer(serializers.ModelSerializer):
    architecture = MLArchitectureFileSerializer(many=True, read_only=True)
    # architecture files are uploaded via a separate endpoint
    # Accept structured input for benchmarks and prompts; create missing objects by name/template
    benchmarks_input = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    prompts_input = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    # Provide read-only detailed representations
    benchmarks = BenchmarkSerializer(many=True, read_only=True)
    prompts = PromptSerializer(many=True, read_only=True)

    class Meta:
        model = MLModelRecord
        fields = [
            'model_fullref',
            'custom_name',
            'custom_note',
            'description',
            'dependencies',
            'benchmarks',
            'benchmarks_input',
            'profiling',
            'prompts',
            'prompts_input',
            'architecture',
        ]
        extra_kwargs = {
            'benchmarks': {'required': False},
            'prompts': {'required': False},
        }

    def validate(self, attrs):
        # architecture upload validation moved to upload endpoint
        return attrs

    def create(self, validated_data):
        benchmarks_input = validated_data.pop('benchmarks_input', None)
        prompts_input = validated_data.pop('prompts_input', None)

        record = MLModelRecord.objects.create(**validated_data)

        # handle benchmarks and prompts after creating the record
        if benchmarks_input is not None:
            self._apply_benchmarks_input(record, benchmarks_input)
        if prompts_input is not None:
            self._apply_prompts_input(record, prompts_input)

        return record

    def update(self, instance, validated_data):
        benchmarks_input = validated_data.pop('benchmarks_input', None)
        prompts_input = validated_data.pop('prompts_input', None)

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

        return instance

    def _apply_prompts_input(self, record, prompts_input):
        for p in prompts_input:
            if 'id' in p:
                try:
                    prompt = Prompt.objects.get(id=p['id'])
                except Prompt.DoesNotExist:
                    continue
            elif 'name' in p:
                prompt, _ = Prompt.objects.get_or_create(name=p['name'], prompt_template=p.get('prompt_template', ''))
            else:
                raise serializers.ValidationError('Each prompt input dict must have either "id" or "name" key.')
            record.prompts.add(prompt)

    def _apply_benchmarks_input(self, record, benchmarks_input):
        from .models import Benchmark

        for b in benchmarks_input:
            # b may be dict with id/name and optional value
            benchmark_obj = None
            value = None
            if isinstance(b, dict):
                value = b.get('value')
                if 'id' in b:
                    try:
                        benchmark_obj = Benchmark.objects.get(id=b['id'])
                    except Benchmark.DoesNotExist:
                        continue
                elif 'name' in b:
                    benchmark_obj, _ = Benchmark.objects.get_or_create(
                        name=b['name'],
                        defaults={
                            'description': b.get('description', ''),
                            'source': b.get('source', ''),
                            'formula': b.get('formula', ''),
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
            record.benchmarks.add(benchmark_obj, through_defaults={'value': value_num})

    # architecture files are created via the separate UploadArchitectureView


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'name', 'description']


class MLModelRecordPartialUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MLModelRecord
        fields = ['description', 'custom_note', 'dependencies']
        extra_kwargs = {
            'description': {'required': False},
            'custom_name': {'required': False},
            'custom_note': {'required': False},
            'dependencies': {'required': False},
        }
