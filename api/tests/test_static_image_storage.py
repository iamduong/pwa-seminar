import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from util.image import save_menu_item_image


def upload_file(content: bytes, content_type: str = "image/png") -> UploadFile:
    return UploadFile(
        file=io.BytesIO(content),
        filename="image.png",
        headers=Headers({"content-type": content_type}),
    )


class StaticImageStorageTests(unittest.IsolatedAsyncioTestCase):
    async def test_menu_image_is_saved_under_static_resource_path(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch("util.image.IMAGE_DIRECTORY", Path(directory)):
                url = await save_menu_item_image(upload_file(b"image-content"))

            self.assertTrue(url.startswith("/resource/images/"))
            self.assertEqual(len(list(Path(directory).iterdir())), 1)

    async def test_unsupported_image_type_is_rejected(self):
        with self.assertRaises(HTTPException) as caught:
            await save_menu_item_image(upload_file(b"content", "text/plain"))

        self.assertEqual(caught.exception.status_code, 422)
