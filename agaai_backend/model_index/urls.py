from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MLModelRecordViewSet, BenchmarkViewSet, PromptViewSet, BadgeViewSet

router = DefaultRouter()
router.register(r'model-records', MLModelRecordViewSet, basename='mlmodelrecord')
router.register(r'benchmarks', BenchmarkViewSet, basename='benchmark')
router.register(r'prompts', PromptViewSet, basename='prompt')
router.register(r'badges', BadgeViewSet, basename='badge')

urlpatterns = [
    path('', include(router.urls)),
]
