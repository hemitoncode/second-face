from django.test import SimpleTestCase, Client


class UploadPageTests(SimpleTestCase):
    def setUp(self):
        self.client = Client()

    def test_upload_page_renders(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)

    def test_upload_page_includes_consent_and_api_target(self):
        response = self.client.get("/")
        html = response.content.decode()
        self.assertIn("Magic Hour", html)
        self.assertIn('action="/api/videos/"', html)
        self.assertIn('name="video"', html)

    def test_upload_page_includes_concealment_options(self):
        response = self.client.get("/")
        html = response.content.decode()
        conceal_fields = [
            ("conceal_voice", "Voice"),
            ("conceal_tattoos", "Tattoos"),
            ("conceal_background", "Background"),
            ("conceal_clothing", "Clothing"),
            ("conceal_name_tags", "Name tags"),
            ("conceal_reflections", "Reflections"),
        ]
        for field_name, label in conceal_fields:
            with self.subTest(field=field_name):
                self.assertIn(f'name="{field_name}"', html)
                self.assertIn(label, html)

    def test_upload_page_does_not_claim_anonymous(self):
        response = self.client.get("/")
        html = response.content.decode().lower()
        self.assertNotIn("anonymous", html)