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
    MenuItemCreate,
    MenuItemFilter,
    MenuItemView,
)
import re

from core.pagination import Pagination
from model.menu_item_model import MenuItemModel
from repository.menu_item_repository import MenuItemRepository
from pymongo import ReturnDocument
from schema.menu_item_schema import MenuItemReviewFilter



class MenuItemService:
    def __init__(self, db: MongoDB):
        self.db = db
        self.repository = MenuItemSubmissionRepository(db)
        self.menu_repository = MenuItemRepository(db)

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

    @staticmethod
    def _object_id(value: str, label: str) -> ObjectId:
        try:
            return ObjectId(value)
        except (InvalidId, TypeError) as exc:
            raise HTTPException(
                status_code=400,
                detail=f"{label} không hợp lệ",
            ) from exc


    async def _require_poi(self, poi_id: str) -> dict:
        object_id = self._object_id(poi_id, "Mã POI")

        document = await self.db["poi"].find_one(
            {
                "_id": object_id,
                "deleted_at": None,
            }
        )

        if document is None:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy địa điểm",
            )

        return document


    @staticmethod
    def _menu_view(item: MenuItemModel) -> MenuItemView:
        return MenuItemView(
            id=str(item.id),
            poi_id=str(item.poi_id),
            name=item.name,
            description=item.description,
            price=item.price,
            image_url=item.image_url,
            is_available=item.is_available,
            is_active=item.is_active,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )


    async def list_by_poi(
        self,
        poi_id: str,
        filters: MenuItemFilter,
    ) -> Pagination[MenuItemView]:
        poi = await self._require_poi(poi_id)

        search = {
            "poi_id": poi["_id"],
            "deleted_at": None,
        }

        if filters.is_active is False:
            search["is_active"] = {"$ne": True}
        elif filters.is_active is True:
            search["is_active"] = True

        query = (filters.q or "").strip()
        if query:
            search["name"] = {
                "$regex": re.escape(query),
                "$options": "i",
            }

        total = await self.menu_repository.count(search)
        items = await self.menu_repository.find_many(
            search,
            skip=(filters.page - 1) * filters.page_size,
            limit=filters.page_size,
        )

        return Pagination[MenuItemView](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total,
            total_page=(total + filters.page_size - 1) // filters.page_size,
            data=[self._menu_view(item) for item in items],
        )


    async def create_direct(
        self,
        poi_id: str,
        body: MenuItemCreate,
    ) -> MenuItemView:
        poi = await self._require_poi(poi_id)

        item = MenuItemModel(
            poi_id=poi["_id"],
            is_active=True,
            **body.model_dump(),
        )

        await self.menu_repository.insert_item(item)
        return self._menu_view(item)


    async def list_admin_pois(
        self,
        filters: MenuItemFilter,
    ) -> Pagination[dict[str, str]]:
        search = {"deleted_at": None}

        query = (filters.q or "").strip()
        if query:
            search["name"] = {
                "$regex": re.escape(query),
                "$options": "i",
            }

        collection = self.db["poi"]
        total = await collection.count_documents(search)

        documents = await (
            collection.find(search)
            .sort([("created_at", -1), ("_id", -1)])
            .skip((filters.page - 1) * filters.page_size)
            .limit(filters.page_size)
            .to_list(length=filters.page_size)
        )

        return Pagination[dict[str, str]](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total,
            total_page=(total + filters.page_size - 1) // filters.page_size,
            data=[
                {
                    "id": str(document["_id"]),
                    "name": document["name"],
                    "address": document.get("address", ""),
                }
                for document in documents
            ],
        )


    async def get_poi_summary(self, poi_id: str) -> dict[str, str]:
        document = await self._require_poi(poi_id)

        return {
            "id": str(document["_id"]),
            "name": document["name"],
            "address": document.get("address", ""),
        }
    async def list_requests(
    self,
    poi_id: str,
    filters: MenuItemReviewFilter,
    ) -> Pagination[MenuItemSubmissionView]:
        poi = await self._require_poi(poi_id)

        search = {
            "poi_id": poi["_id"],
            "deleted_at": None,
        }

        if filters.status is not None:
            search["status"] = filters.status.value

        query = (filters.q or "").strip()
        if query:
            search["name"] = {
                "$regex": re.escape(query),
                "$options": "i",
            }

        collection = self.db["menu_item_submission"]
        total = await collection.count_documents(search)

        documents = await (
            collection.find(search)
            .sort([("created_at", -1), ("_id", -1)])
            .skip((filters.page - 1) * filters.page_size)
            .limit(filters.page_size)
            .to_list(length=filters.page_size)
        )

        return Pagination[MenuItemSubmissionView](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total,
            total_page=(total + filters.page_size - 1) // filters.page_size,
            data=[
                self._view(MenuItemSubmissionModel.model_validate(document))
                for document in documents
            ],
        )


    async def approve_request(
        self,
        request_id: str,
        reviewer_id: str,
    ) -> MenuItemSubmissionView:
        object_id = self._object_id(request_id, "Mã yêu cầu")
        reviewer = self._object_id(reviewer_id, "Mã người duyệt")
        collection = self.db["menu_item_submission"]

        document = await collection.find_one(
            {"_id": object_id, "deleted_at": None}
        )

        if document is None:
            raise HTTPException(404, "Không tìm thấy yêu cầu")

        if document["status"] == "approved":
            return self._view(
                MenuItemSubmissionModel.model_validate(document)
            )

        if document["status"] == "rejected":
            raise HTTPException(409, "Yêu cầu đã bị từ chối")

        poi = await self._require_poi(str(document["poi_id"]))
        if poi.get("owner_id") != document["owner_id"]:
            raise HTTPException(
                409,
                "Người gửi không còn là chủ của địa điểm",
            )

        if document["status"] == "pending":
            claimed = await collection.find_one_and_update(
                {
                    "_id": object_id,
                    "status": "pending",
                    "deleted_at": None,
                },
                {
                    "$set": {
                        "status": "processing",
                        "menu_item_id": ObjectId(),
                        "reviewed_by": reviewer,
                        "updated_at": datetime.now(UTC),
                    }
                },
                return_document=ReturnDocument.AFTER,
            )

            if claimed is None:
                raise HTTPException(
                    409,
                    "Yêu cầu vừa được xử lý, hãy tải lại danh sách",
                )

            document = claimed

        if document["status"] != "processing":
            raise HTTPException(409, "Trạng thái yêu cầu không hợp lệ")

        # Cả lần đầu và lần tiếp tục đều dùng cùng một ID.
        item_id = document.get("menu_item_id")
        if item_id is None:
            raise HTTPException(
                409,
                "Yêu cầu đang xử lý nhưng thiếu mã món ăn",
            )

        item = MenuItemModel(
            id=item_id,
            poi_id=document["poi_id"],
            name=document["name"],
            description=document.get("description"),
            price=document.get("price"),
            image_url=document.get("image_url"),
            is_available=True,
        )

        await self.menu_repository.upsert_from_submission(item)

        await collection.update_one(
            {
                "_id": object_id,
                "status": "processing",
                "menu_item_id": item_id,
            },
            {
                "$set": {
                    "status": "approved",
                    "reviewed_at": datetime.now(UTC),
                    "updated_at": datetime.now(UTC),
                    "admin_note": None,
                }
            },
        )

        result = await collection.find_one({"_id": object_id})
        return self._view(MenuItemSubmissionModel.model_validate(result))


    async def reject_request(
        self,
        request_id: str,
        reviewer_id: str,
        note: str,
    ) -> MenuItemSubmissionView:
        object_id = self._object_id(request_id, "Mã yêu cầu")
        collection = self.db["menu_item_submission"]

        result = await collection.find_one_and_update(
            {
                "_id": object_id,
                "status": "pending",
                "deleted_at": None,
            },
            {
                "$set": {
                    "status": "rejected",
                    "admin_note": note,
                    "reviewed_by": self._object_id(
                        reviewer_id, "Mã người duyệt"
                    ),
                    "reviewed_at": datetime.now(UTC),
                    "updated_at": datetime.now(UTC),
                }
            },
            return_document=ReturnDocument.AFTER,
        )

        if result is None:
            existing = await collection.find_one(
                {"_id": object_id, "deleted_at": None}
            )
            if existing is None:
                raise HTTPException(404, "Không tìm thấy yêu cầu")
            raise HTTPException(
                409,
                "Chỉ có thể từ chối yêu cầu đang chờ duyệt",
            )

        return self._view(MenuItemSubmissionModel.model_validate(result))

    async def approve_item(
        self,
        poi_id: str,
        item_id: str,
    ) -> MenuItemView:
        poi = await self._require_poi(poi_id)
        object_id = self._object_id(item_id, "Mã món ăn")

        item = await self.menu_repository.approve(
            poi_id=poi["_id"],
            item_id=object_id,
        )

        if item is None:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy món ăn tại địa điểm này",
            )

        return self._menu_view(item)