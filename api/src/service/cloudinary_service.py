import asyncio

import cloudinary
import cloudinary.uploader
from cloudinary.exceptions import Error as CloudinaryError
from core.setting import get_setting
from fastapi import HTTPException, UploadFile


MAX_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


class CloudinaryService:
    def __init__(self):
        setting = get_setting()
        cloudinary.config(
            cloud_name=setting.CLOUDINARY_CLOUD_NAME,
            api_key=setting.CLOUDINARY_API_KEY,
            api_secret=setting.CLOUDINARY_API_SECRET,
            secure=True,
        )

    async def upload_image(
        self,
        image: UploadFile,
        folder: str = "pwa-seminar/menu-items",
    ) -> dict[str, str]:
        if image.content_type not in ALLOWED_IMAGE_TYPES:
            await image.close()
            raise HTTPException(422, "Định dạng ảnh không được hỗ trợ")

        content = await image.read(MAX_IMAGE_SIZE + 1)
        await image.close()
        if not content:
            raise HTTPException(422, "Tệp ảnh không được để trống")
        if len(content) > MAX_IMAGE_SIZE:
            raise HTTPException(422, "Ảnh không được vượt quá 5 MB")

        try:
            result = await asyncio.to_thread(
                cloudinary.uploader.upload,
                content,
                folder=folder,
                resource_type="image",
                unique_filename=True,
                overwrite=False,
            )
        except (CloudinaryError, OSError, ValueError) as error:
            raise HTTPException(502, "Không thể tải ảnh lên dịch vụ lưu trữ") from error

        secure_url = result.get("secure_url")
        public_id = result.get("public_id")
        if not isinstance(secure_url, str) or not isinstance(public_id, str):
            raise HTTPException(502, "Dịch vụ lưu trữ không trả về thông tin ảnh hợp lệ")

        return {"url": secure_url, "public_id": public_id}
