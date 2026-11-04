from datetime import UTC, datetime

from bson import ObjectId
from bson.errors import InvalidId
from core.dependency import MongoDB
from fastapi import HTTPException, status
from model.menu_item_submission_model import (
    MenuItemSubmissionModel,
    MenuItemSubmissionStatus,
)
from model.poi_model import PoiModel
from repository.menu_item_submission_repository import MenuItemSubmissionRepository
from schema.menu_item_schema import (
    MenuItemSubmissionCreate,
    MenuItemSubmissionView,
)


class MenuItemService:
    def __init__(self, db: MongoDB):
        self.db = db
        self.repository = MenuItemSubmissionRepository(db)

    async def _owned_poi(self, owner_id: str, poi_id: str) -> PoiModel:
        try:
            object_id = ObjectId(poi_id)
        except InvalidId as error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã địa điểm không hợp lệ",
            ) from error

        document = await self.db["poi"].find_one(
            {"_id": object_id, "owner_id": ObjectId(owner_id), "deleted_at": None}
        )
        if document is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy địa điểm thuộc tài khoản",
            )
        return PoiModel.model_validate(document)

    @staticmethod
    def _view(item: MenuItemSubmissionModel) -> MenuItemSubmissionView:
        return MenuItemSubmissionView(
            id=str(item.id),
            owner_id=str(item.owner_id),
            poi_id=str(item.poi_id),
            name=item.name,
            description=item.description,
            price=item.price,
            image_url=item.image_url,
            status=item.status,
            admin_note=item.admin_note,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )

    async def create_submission(
        self, owner_id: str, body: MenuItemSubmissionCreate
    ) -> MenuItemSubmissionView:
        await self._owned_poi(owner_id, body.poi_id)
        existing = await self.repository.find_one(
            {
                "owner_id": ObjectId(owner_id),
                "poi_id": ObjectId(body.poi_id),
                "name": body.name.strip(),
                "status": MenuItemSubmissionStatus.PENDING,
            }
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Món ăn này đang chờ duyệt",
            )

        item = MenuItemSubmissionModel(
            owner_id=ObjectId(owner_id),
            poi_id=ObjectId(body.poi_id),
            name=body.name.strip(),
            description=body.description.strip() if body.description else None,
            price=body.price,
            image_url=body.image_url.strip() if body.image_url else None,
        )
        result = await self.repository.insert_item(item.to_dump())
        item.id = result.inserted_id
        return self._view(item)

    async def list_self(
        self, owner_id: str, status_filter: MenuItemSubmissionStatus | None
    ) -> list[MenuItemSubmissionView]:
        search: dict = {"owner_id": ObjectId(owner_id), "deleted_at": None}
        if status_filter is not None:
            search["status"] = status_filter
        items = await self.repository.find_many(search)
        return [self._view(item) for item in items]

    async def list_owned_pois(self, owner_id: str) -> list[dict]:
        documents = await self.db["poi"].find(
            {"owner_id": ObjectId(owner_id), "deleted_at": None}
        ).to_list(length=None)
        return [{"id": str(item["_id"]), "name": item["name"]} for item in documents]
