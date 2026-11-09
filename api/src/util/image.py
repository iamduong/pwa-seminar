from hashlib import sha256
from pathlib import Path

from fastapi import HTTPException, UploadFile

IMAGE_DIRECTORY = Path(__file__).resolve().parents[2] / "resource" / "images"
MAX_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


async def save_poi_images(files: list[UploadFile]) -> list[str]:
    if not files or len(files) > 10:
        raise HTTPException(422, "Vui lòng chọn từ 1 đến 10 hình ảnh")

    IMAGE_DIRECTORY.mkdir(parents=True, exist_ok=True)
    urls: list[str] = []
    for file in files:
        suffix = ALLOWED_IMAGE_TYPES.get(file.content_type or "")
        if suffix is None:
            raise HTTPException(422, f"Định dạng ảnh không được hỗ trợ: {file.filename}")

        content = await file.read(MAX_IMAGE_SIZE + 1)
        await file.close()
        if len(content) > MAX_IMAGE_SIZE:
            raise HTTPException(422, f"Ảnh vượt quá 5 MB: {file.filename}")

        filename = f"{sha256(content).hexdigest()}{suffix}"
        destination = IMAGE_DIRECTORY / filename
        if not destination.exists():
            destination.write_bytes(content)
        urls.append(f"/resource/images/{filename}")

    return urls
