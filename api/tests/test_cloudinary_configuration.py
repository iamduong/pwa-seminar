import os
import unittest
from unittest.mock import patch

from fastapi import HTTPException

from core.setting import Setting
from service.cloudinary_service import CloudinaryService


class CloudinaryConfigurationTests(unittest.TestCase):
    def settings(self):
        with patch.dict(os.environ, {}, clear=True):
            return Setting(
                _env_file=None,
                APP_NAME="test", MODE="test",
                PII_ENCRYPTION_KEY="test", PII_VERSION="1",
                POSTGRES_ENDPOINT="postgresql+psycopg://localhost/test", POSTGRES_DATABASE="test",
                REDIS_HOST="127.0.0.1", REDIS_PORT=6379, REDIS_DB=0,
                JWT_ACCESS="test", JWT_REFRESH="test", JWT_ALGORITHM="HS256",
            )

    def test_api_settings_load_without_optional_image_credentials(self):
        self.assertEqual(self.settings().APP_NAME, "test")

    def test_upload_requires_all_credentials_before_configuring_provider(self):
        credentials = {"CLOUDINARY_CLOUD_NAME": "test", "CLOUDINARY_API_KEY": "test", "CLOUDINARY_API_SECRET": "test"}
        for missing in credentials:
            setting = self.settings().model_copy(update=credentials | {missing: ""})
            with self.subTest(missing=missing), patch("service.cloudinary_service.get_setting", return_value=setting), patch("service.cloudinary_service.cloudinary.config") as configure:
                with self.assertRaises(HTTPException) as caught:
                    CloudinaryService()
                self.assertEqual(caught.exception.status_code, 503)
                configure.assert_not_called()

    def test_configured_upload_service_still_initializes_provider(self):
        setting = self.settings().model_copy(update={"CLOUDINARY_CLOUD_NAME": "cloud", "CLOUDINARY_API_KEY": "key", "CLOUDINARY_API_SECRET": "secret"})
        with patch("service.cloudinary_service.get_setting", return_value=setting), patch("service.cloudinary_service.cloudinary.config") as configure:
            CloudinaryService()
        configure.assert_called_once_with(cloud_name="cloud", api_key="key", api_secret="secret", secure=True)
