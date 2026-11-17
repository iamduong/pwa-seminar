from resource.config import MY_MEMORY_LANGUAGES

from core.dependency import PostgresDB
from core.identifier import parse_uuid
from core.pagination import Pagination
from fastapi import HTTPException
from model.menu_item_model import MenuItemModel
from repository.menu_item_repository import MenuItemRepository
from repository.poi_repository import PoiRepository
from schema.menu_item_schema import (
    MenuItemCreate,
    MenuItemFilter,
    MenuItemSave,
    MenuItemView,
    MenuTranslationFilter,
    MenuTranslationTaskView,
    MenuTranslationView,
)
from service.content_dataset_version_service import ContentDatasetVersionService


class MenuItemService:
    def __init__(self, db: PostgresDB):
        self.repository = MenuItemRepository(db)
        self.pois = PoiRepository(db)
        self.dataset_versions = ContentDatasetVersionService(db)

    @staticmethod
    def _view(item, localization=None):
        return MenuItemView(
            id=str(item.id),
            poi_id=str(item.poi_id),
            name=localization.name if localization else item.name,
            description=localization.description if localization else item.description,
            # image_url=f"https://livable-elsewhere-elyse.ngrok-free.dev{item.image_url}",
            image_url=item.image_url,
            is_active=item.is_active,
            is_available=item.is_available,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )

    async def _poi(self, poi_id: str, active: bool | None = None):
        poi = await self.pois.find_by_id(parse_uuid(poi_id, "Mã POI"), active=active)
        if poi is None:
            raise HTTPException(404, "Không tìm thấy địa điểm")
        return poi

    async def _owned_poi(self, owner_id: str, poi_id: str):
        values = await self.pois.find_owned(
            parse_uuid(owner_id, "Mã chủ quán"), parse_uuid(poi_id, "Mã địa điểm")
        )
        if not values:
            raise HTTPException(404, "Không tìm thấy địa điểm thuộc tài khoản")
        return values[0]

    async def create(self, owner_id: str, body: MenuItemSave):
        poi = await self._owned_poi(owner_id, body.poi_id)
        if await self.repository.find_pending_duplicate(poi.id, body.name):
            raise HTTPException(409, "Món ăn này đang chờ duyệt")
        item = await self.repository.insert(
            MenuItemModel(
                poi_id=poi.id,
                name=body.name,
                description=body.description,
                image_url=body.image_url,
                is_active=False,
                is_available=False,
            )
        )
        await self.dataset_versions.rotate_menu_item_etag()
        return self._view(item)

    async def get_owned(self, owner_id: str, item_id: str):
        item = await self.repository.find_by_id(parse_uuid(item_id, "Mã món ăn"))
        if item is None:
            raise HTTPException(404, "Không tìm thấy món ăn")
        await self._owned_poi(owner_id, str(item.poi_id))
        return self._view(item)

    async def update(self, owner_id: str, item_id: str, body: MenuItemSave):
        item = await self.repository.find_by_id(
            parse_uuid(item_id, "Mã món ăn"), for_update=True
        )
        if item is None:
            raise HTTPException(404, "Không tìm thấy món ăn")
        await self._owned_poi(owner_id, str(item.poi_id))
        destination = await self._owned_poi(owner_id, body.poi_id)
        item.poi_id, item.name, item.description, item.image_url = (
            destination.id,
            body.name,
            body.description,
            body.image_url,
        )
        item.is_active = item.is_available = False
        await self.repository.clear_localizations(item.id)
        saved = await self.repository.save(item)
        await self.dataset_versions.rotate_menu_item_etag()
        return self._view(saved)

    async def list_owned_pois(self, owner_id: str):
        items = await self.pois.find_owned(parse_uuid(owner_id, "Mã chủ quán"))
        return [{"id": str(x.id), "name": x.name} for x in items]

    async def list_self(self, owner_id: str):
        pois = await self.pois.find_owned(parse_uuid(owner_id, "Mã chủ quán"))
        if not pois:
            return []
        return [
            self._view(x)
            for x in await self.repository.find_many(poi_ids=[x.id for x in pois])
        ]

    async def list_public(self, poi_id: str, lang: str = "vi-VN"):
        if lang not in MY_MEMORY_LANGUAGES:
            raise HTTPException(422, "Ngôn ngữ không được hỗ trợ")
        poi = await self._poi(poi_id, active=True)
        return [
            self._view(item, localization)
            for item, localization in await self.repository.find_public(poi.id, lang)
        ]

    async def list_all_public(self, lang: str = "vi-VN"):
        if lang not in MY_MEMORY_LANGUAGES:
            raise HTTPException(422, "Ngôn ngữ không được hỗ trợ")
        return [
            self._view(item, localization)
            for item, localization in await self.repository.find_all_public(lang)
        ]

    async def list_by_poi(self, poi_id: str, filters: MenuItemFilter):
        poi = await self._poi(poi_id)
        total = await self.repository.count(
            poi_id=poi.id, is_active=filters.is_active, keyword=filters.q
        )
        items = await self.repository.find_many(
            poi_id=poi.id,
            is_active=filters.is_active,
            keyword=filters.q,
            offset=(filters.page - 1) * filters.page_size,
            limit=filters.page_size,
        )
        return Pagination[MenuItemView](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total,
            total_page=(total + filters.page_size - 1) // filters.page_size,
            data=[self._view(x) for x in items],
        )

    async def create_direct(self, poi_id: str, body: MenuItemCreate):
        poi = await self._poi(poi_id)
        item = MenuItemModel(
            poi_id=poi.id, is_active=True, is_available=False, **body.model_dump()
        )
        self.repository.context.add(item)
        await self.repository.context.flush()
        await self.repository.queue_translations(item, MY_MEMORY_LANGUAGES)
        saved = await self.repository.save(item)
        await self.dataset_versions.rotate_menu_item_etag()
        return self._view(saved)

    async def list_admin_pois(self, filters: MenuItemFilter):
        items, total = await self.pois.list_admin(
            filters.page, filters.page_size, filters.q
        )
        return Pagination[dict[str, str]](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total,
            total_page=(total + filters.page_size - 1) // filters.page_size,
            data=[
                {"id": str(x.id), "name": x.name, "address": x.address} for x in items
            ],
        )

    async def get_poi_summary(self, poi_id: str):
        poi = await self._poi(poi_id)
        return {"id": str(poi.id), "name": poi.name, "address": poi.address}

    async def approve_item(self, poi_id: str, item_id: str):
        poi = await self._poi(poi_id)
        item = await self.repository.find_by_id(
            parse_uuid(item_id, "Mã món ăn"), for_update=True
        )
        if item is None or item.poi_id != poi.id:
            raise HTTPException(404, "Không tìm thấy món ăn tại địa điểm này")
        if item.is_active:
            return self._view(item)
        item.is_active, item.is_available = True, False
        await self.repository.queue_translations(item, MY_MEMORY_LANGUAGES)
        saved = await self.repository.save(item)
        await self.dataset_versions.rotate_menu_item_etag()
        return self._view(saved)

    @staticmethod
    def _translation_view(item, localizations):
        localizations = [x for x in localizations if x.deleted_at is None]
        statuses = {x.translation_status for x in localizations}
        status = (
            "running"
            if "processing" in statuses
            else "queued"
            if "pending" in statuses
            else "failed"
            if "failed" in statuses
            else "done"
        )
        return MenuTranslationTaskView(
            id=str(item.id),
            poi_id=str(item.poi_id),
            name=item.name,
            status=status,
            progress_percent=sum(x.translation_status == "ready" for x in localizations)
            * 100
            // max(len(localizations), 1),
            is_available=item.is_available,
            localizations=[
                MenuTranslationView(
                    id=str(x.id),
                    lang=x.lang,
                    name=x.name,
                    description=x.description,
                    translation_status=x.translation_status,
                    error_message=x.error_message,
                    updated_at=x.updated_at,
                )
                for x in sorted(localizations, key=lambda x: x.lang)
            ],
        )

    async def list_translation_tasks(self, filters: MenuTranslationFilter):
        items, total = await self.repository.find_translation_tasks(
            filters.page, filters.page_size, filters.status
        )
        return Pagination[MenuTranslationTaskView](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total,
            total_page=(total + filters.page_size - 1) // filters.page_size,
            data=[self._translation_view(item, item.localizations) for item in items],
        )

    async def retry_translations(self, item_id: str):
        item = await self.repository.find_by_id(
            parse_uuid(item_id, "Mã món ăn"), for_update=True
        )
        if item is None:
            raise HTTPException(404, "Không tìm thấy món ăn")
        if not item.is_active:
            raise HTTPException(409, "Món ăn cần được duyệt lại trước khi dịch")
        localizations = await self.repository.find_localizations(item.id)
        failed = [x for x in localizations if x.translation_status == "failed"]
        if not failed:
            raise HTTPException(409, "Không có bản dịch thất bại để thử lại")
        for localization in failed:
            localization.translation_status, localization.error_message = (
                "pending",
                None,
            )
        item.is_available = False
        await self.repository.save(item)
        await self.dataset_versions.rotate_menu_item_etag()
        return self._translation_view(item, localizations)
