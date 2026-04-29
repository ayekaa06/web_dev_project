from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    MLModelViewSet,
    MLModelRecordViewSet,
    BenchmarkViewSet,
    PromptViewSet,
    BadgeViewSet,
    UseCaseViewSet,
    UserReviewViewSet,
    RawUploadView,
    ArchitectureDeleteView,
)

router = DefaultRouter()
router.register(r'models', MLModelViewSet, basename='mlmodel')
router.register(r'model-records', MLModelRecordViewSet, basename='mlmodelrecord')
router.register(r'benchmarks', BenchmarkViewSet, basename='benchmark')
router.register(r'prompts', PromptViewSet, basename='prompt')
router.register(r'badges', BadgeViewSet, basename='badge')
router.register(r'use-cases', UseCaseViewSet, basename='usecase')
router.register(r'user-reviews', UserReviewViewSet, basename='userreview')

urlpatterns = [
    path('', include(router.urls)),
    path('upload-architecture/<int:record_id>/<str:filename>/', RawUploadView.as_view(), name='upload_architecture'),
    path('delete-architecture/<int:record_id>/<int:file_id>/', ArchitectureDeleteView.as_view(), name='delete_architecture'),
]
