from rest_framework import serializers

from .models import MLArchitectureFile, MLModelRecord, Benchmark, Prompt


class MLArchitectureFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MLArchitectureFile
        fields = [
            'id',
            'file',
            'description',
        ]
        read_only_fields = ['id']


class MLModelRecordSerializer(serializers.ModelSerializer):
    architecture = MLArchitectureFileSerializer(many=True, read_only=True)
    new_architecture_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        allow_empty=True,
    )
    new_architecture_descriptions = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = MLModelRecord
        fields = [
            'id',
            'user_id',
            'model_fullref',
            'custom_note',
            'description',
            'dependencies',
            'benchmarks',
            'profiling',
            'prompts',
            'architecture',
            'new_architecture_files',
            'new_architecture_descriptions',
        ]
        extra_kwargs = {
            'benchmarks': {'required': False},
            'prompts': {'required': False},
        }

    def validate(self, attrs):
        files = attrs.get('new_architecture_files', [])
        descriptions = attrs.get('new_architecture_descriptions', [])
        if descriptions and len(descriptions) != len(files):
            raise serializers.ValidationError(
                'new_architecture_descriptions length must match new_architecture_files length.'
            )
        return attrs

    def create(self, validated_data):
        files = validated_data.pop('new_architecture_files', [])
        descriptions = validated_data.pop('new_architecture_descriptions', [])
        record = MLModelRecord.objects.create(**validated_data)
        self._create_architecture_files(record, files, descriptions)
        return record

    def update(self, instance, validated_data):
        files = validated_data.pop('new_architecture_files', [])
        descriptions = validated_data.pop('new_architecture_descriptions', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        self._create_architecture_files(instance, files, descriptions)
        return instance

    def _create_architecture_files(self, record, files, descriptions):
        for idx, uploaded_file in enumerate(files):
            description = descriptions[idx] if idx < len(descriptions) else ''
            MLArchitectureFile.objects.create(
                record=record,
                file=uploaded_file,
                description=description,
            )


class BenchmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Benchmark
        fields = ['id', 'name', 'description', 'source', 'formula']


class PromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prompt
        fields = ['id', 'prompt_template']


class MLModelRecordPartialUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MLModelRecord
        fields = ['description', 'custom_note', 'dependencies']
        extra_kwargs = {
            'description': {'required': False},
            'custom_note': {'required': False},
            'dependencies': {'required': False},
        }
