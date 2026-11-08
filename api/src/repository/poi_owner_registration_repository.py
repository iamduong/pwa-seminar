from datetime import UTC, datetime
from uuid import UUID

from core.dependency import PostgresDB
from model.poi_owner_registration_model import (
    PoiOwnerRegistrationModel,
    PoiOwnerRegistrationStatus,
)
from sqlalchemy import func, or_, select, update


class PoiOwnerRegistrationRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    async def find_by_id(
        self, registration_id: UUID
    ) -> PoiOwnerRegistrationModel | None:
        statement = select(PoiOwnerRegistrationModel).where(
            PoiOwnerRegistrationModel.id == registration_id,
            PoiOwnerRegistrationModel.deleted_at.is_(None),
        )
        result = await self.context.scalars(statement)

        return result.one_or_none()

    async def find_by_user(self, user_id: UUID) -> list[PoiOwnerRegistrationModel]:
        result = await self.context.scalars(
            select(PoiOwnerRegistrationModel).where(
                PoiOwnerRegistrationModel.user_id == user_id,
                PoiOwnerRegistrationModel.deleted_at.is_(None),
            ).order_by(PoiOwnerRegistrationModel.created_at.desc())
        )
        return list(result.all())

    async def find_pagination(
        self,
        page: int = 1,
        page_size: int = 20,
        *,
        status: PoiOwnerRegistrationStatus | str | None = None,
        keyword: str | None = None,
    ) -> tuple[list[PoiOwnerRegistrationModel], int]:
        if page < 1:
            raise ValueError("page must be greater than or equal to 1")
        if page_size < 1:
            raise ValueError("page_size must be greater than or equal to 1")

        conditions = [PoiOwnerRegistrationModel.deleted_at.is_(None)]

        if status is not None:
            status_value = (
                status.value
                if isinstance(status, PoiOwnerRegistrationStatus)
                else status
            )
            conditions.append(PoiOwnerRegistrationModel.status == status_value)

        if keyword and (normalized_keyword := keyword.strip()):
            pattern = f"%{normalized_keyword}%"
            conditions.append(
                or_(
                    PoiOwnerRegistrationModel.business_name.ilike(pattern),
                    PoiOwnerRegistrationModel.business_address.ilike(pattern),
                )
            )

        statement = (
            select(PoiOwnerRegistrationModel)
            .where(*conditions)
            .order_by(PoiOwnerRegistrationModel.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        count_statement = (
            select(func.count())
            .select_from(PoiOwnerRegistrationModel)
            .where(*conditions)
        )

        result = await self.context.scalars(statement)
        total = await self.context.scalar(count_statement)

        return list(result.all()), total or 0

    async def update(
        self, model: PoiOwnerRegistrationModel
    ) -> PoiOwnerRegistrationModel:
        managed_model = await self.context.merge(model)
        await self.context.commit()
        await self.context.refresh(managed_model)

        return managed_model

    udpate = update

    async def insert(
        self, model: PoiOwnerRegistrationModel
    ) -> PoiOwnerRegistrationModel:
        self.context.add(model)
        await self.context.commit()
        await self.context.refresh(model)

        return model

    async def soft_delete(
        self, registration_id: UUID
    ) -> PoiOwnerRegistrationModel | None:
        statement = (
            update(PoiOwnerRegistrationModel)
            .where(
                PoiOwnerRegistrationModel.id == registration_id,
                PoiOwnerRegistrationModel.deleted_at.is_(None),
            )
            .values(deleted_at=datetime.now(UTC))
            .returning(PoiOwnerRegistrationModel)
        )
        result = await self.context.scalars(statement)
        deleted_model = result.one_or_none()

        await self.context.commit()
        return deleted_model
