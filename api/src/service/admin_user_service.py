import re

from core.pagination import Pagination
from model.admin_user_model import AdminUserModel
from repository.admin_user_repository import AdminUserRepository
from schema.admin_user_schema import FilterAdminUser, ViewAdminUser
from pymongo.asynchronous.database import AsyncDatabase


class AdminUserService:
    def __init__(self, db: AsyncDatabase):
        self.admin_user_repository = AdminUserRepository(db)

    def _to_view(self, model: AdminUserModel) -> ViewAdminUser:
        return ViewAdminUser(
            id=str(model.id),
            full_name=model.full_name,
            email=model.email,
            phone=model.phone,
            is_active=model.is_active,
            is_poi_owner_verified=model.is_poi_owner_verified,
        )

    async def filter_admin_user(
        self, filters: FilterAdminUser
    ) -> Pagination[ViewAdminUser]:

        search: dict = {}

        if filters.q is not None and filters.q.strip():
            keyword = re.escape(filters.q.strip())

            search["$or"] = [
                {"full_name": {"$regex": keyword, "$options": "i"}},
                {"email": {"$regex": keyword, "$options": "i"}},
                {"phone": {"$regex": keyword, "$options": "i"}},
            ]

        if filters.is_active is not None:
            search["is_active"] = filters.is_active

        if filters.is_poi_owner_verified is not None:
            search["is_poi_owner_verified"] = (
                filters.is_poi_owner_verified
            )

        total_item = await self.admin_user_repository.count_search(search)

        users = await self.admin_user_repository.find_pagination(
            page=filters.page,
            page_size=filters.page_size,
            search=search,
            sort_by="full_name",
            sort_order="asc",
        )

        total_page = (
            total_item + filters.page_size - 1
        ) // filters.page_size

        return Pagination[ViewAdminUser](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total_item,
            total_page=total_page,
            data=[self._to_view(user) for user in users],
        )