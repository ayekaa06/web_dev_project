from django.http import JsonResponse
from .services.model_service import ModelInfoService
from django.shortcuts import render
service = ModelInfoService()


def get_model(request, name):
    data = service.get_model(name)
    return JsonResponse(data)