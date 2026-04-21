from rest_framework import serializers
from django.conf import settings

from .models import User    


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', "peers", "social")

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
