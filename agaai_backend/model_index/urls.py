from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MLModelRecordViewSet, BenchmarkViewSet, PromptViewSet

router = DefaultRouter()
router.register(r'model-records', MLModelRecordViewSet, basename='mlmodelrecord')
router.register(r'benchmarks', BenchmarkViewSet, basename='benchmark')
router.register(r'prompts', PromptViewSet, basename='prompt')

urlpatterns = [
    path('', include(router.urls)),
]
