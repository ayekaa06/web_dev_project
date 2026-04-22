from rest_framework import serializers
from django.conf import settings

from .models import User    


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    peers = serializers.JSONField(required=False, default=list, allow_null=False)
    social = serializers.JSONField(required=False, default=list, allow_null=False)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', "peers", "social")
        # extra_kwargs = {
        #     "peers": {"required": False,
        #               "default": list,
        #               "allow_null": False
        #               },
        #     "social": {"required": False,
        #                "default": list,
        #                "allow_null": False
        #                }
        # }

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
