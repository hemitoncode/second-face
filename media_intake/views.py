from django.views.generic import TemplateView


class UploadView(TemplateView):
    template_name = "media_intake/upload.html"