from django.urls import path

from media_intake.views import UploadView

urlpatterns = [
    path("", UploadView.as_view(), name="upload"),
]