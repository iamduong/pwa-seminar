"""Move existing remote POI and menu images into the local static directory.

Run from ``api`` with ``.venv/bin/python script/migrate_static_images.py``.
"""

import asyncio
import sys
from hashlib import sha256
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

import model  # noqa: F401 - register every SQLAlchemy mapper
from core.provider.postgres import SessionFactory, close_postgres
from model.menu_item_model import MenuItemModel
from model.poi_model import PoiModel
from model.poi_submission_model import PoiSubmissionModel
from service.content_dataset_version_service import ContentDatasetVersionService
from sqlalchemy import select
from util.image import (
    ALLOWED_IMAGE_TYPES,
    IMAGE_DIRECTORY,
    MAX_IMAGE_SIZE,
    is_static_image_url,
)


def download_image(url: str) -> str:
    if is_static_image_url(url):
        return url
    if not url.startswith(("http://", "https://")):
        raise ValueError(f"Đường dẫn ảnh không hợp lệ: {url}")

    request = Request(url, headers={"User-Agent": "Quan4-Tourism-Image-Migration/1.0"})
    with urlopen(request, timeout=30) as response:
        content_type = response.headers.get_content_type()
        suffix = ALLOWED_IMAGE_TYPES.get(content_type)
        if suffix is None:
            raise ValueError(f"Định dạng ảnh không được hỗ trợ: {content_type}")
        content = response.read(MAX_IMAGE_SIZE + 1)

    if not content or len(content) > MAX_IMAGE_SIZE:
        raise ValueError(f"Ảnh rỗng hoặc vượt quá 5 MB: {url}")

    IMAGE_DIRECTORY.mkdir(parents=True, exist_ok=True)
    filename = f"{sha256(content).hexdigest()}{suffix}"
    destination = IMAGE_DIRECTORY / filename
    if not destination.exists():
        destination.write_bytes(content)
    return f"/resource/images/{filename}"


async def localize(url: str) -> str:
    return await asyncio.to_thread(download_image, url)


async def migrate_images() -> tuple[int, int, int]:
    menu_count = 0
    poi_count = 0
    submission_count = 0

    async with SessionFactory() as session:
        menu_items = list((await session.scalars(select(MenuItemModel))).all())
        for item in menu_items:
            if item.image_url and not is_static_image_url(item.image_url):
                item.image_url = await localize(item.image_url)
                menu_count += 1

        pois = list((await session.scalars(select(PoiModel))).all())
        for poi in pois:
            localized = [await localize(url) for url in poi.images]
            if localized != poi.images:
                poi.images = localized
                poi_count += 1

        submissions = list((await session.scalars(select(PoiSubmissionModel))).all())
        for submission in submissions:
            localized = [await localize(url) for url in submission.images]
            if localized != submission.images:
                submission.images = localized
                submission_count += 1

        await session.flush()
        versions = ContentDatasetVersionService(session)
        if menu_count:
            await versions.rotate_menu_item_etag()
        if poi_count:
            await versions.rotate_poi_etag()
        if not menu_count and not poi_count:
            await session.commit()

    return menu_count, poi_count, submission_count


async def main() -> None:
    try:
        menu_count, poi_count, submission_count = await migrate_images()
        print(
            "Static image migration completed: "
            f"menu_items={menu_count}, pois={poi_count}, submissions={submission_count}"
        )
    finally:
        await close_postgres()


if __name__ == "__main__":
    asyncio.run(
        main(),
        loop_factory=asyncio.SelectorEventLoop if sys.platform == "win32" else None,
    )
