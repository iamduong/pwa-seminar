from datetime import datetime
from decimal import Decimal

from core.dependency import PostgresDB
from model.transaction_log_model import TransactionLogModel
from sqlalchemy import func, or_, select
from sqlalchemy.dialects.postgresql import insert


class TransactionLogRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    async def find_pagination(
        self,
        page: int,
        page_size: int,
        *,
        keyword: str | None,
        date_from: datetime | None,
        date_to_exclusive: datetime | None,
    ) -> tuple[list[TransactionLogModel], int, Decimal]:
        conditions = [TransactionLogModel.deleted_at.is_(None)]
        if keyword:
            pattern = f"%{keyword.strip()}%"
            conditions.append(
                or_(
                    TransactionLogModel.reference_code.ilike(pattern),
                    TransactionLogModel.content.ilike(pattern),
                )
            )
        if date_from is not None:
            conditions.append(TransactionLogModel.transaction_date >= date_from)
        if date_to_exclusive is not None:
            conditions.append(TransactionLogModel.transaction_date < date_to_exclusive)
        items = (
            await self.context.scalars(
                select(TransactionLogModel)
                .where(*conditions)
                .order_by(
                    TransactionLogModel.transaction_date.desc(),
                    TransactionLogModel.id.desc(),
                )
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).all()
        total = await self.context.scalar(
            select(func.count()).select_from(TransactionLogModel).where(*conditions)
        )
        total_amount = await self.context.scalar(
            select(func.coalesce(func.sum(TransactionLogModel.amount), 0)).where(
                *conditions
            )
        )
        return list(items), total or 0, total_amount

    async def insert_once(
        self,
        *,
        transaction_date: datetime,
        content: str,
        amount: Decimal,
        reference_code: str,
    ) -> tuple[TransactionLogModel, bool]:
        inserted_id = await self.context.scalar(
            insert(TransactionLogModel)
            .values(
                transaction_date=transaction_date,
                content=content,
                amount=amount,
                reference_code=reference_code,
            )
            .on_conflict_do_nothing(index_elements=["reference_code"])
            .returning(TransactionLogModel.id)
        )
        model = (
            await self.context.scalars(
                select(TransactionLogModel).where(
                    TransactionLogModel.reference_code == reference_code
                )
            )
        ).one()
        await self.context.commit()
        await self.context.refresh(model)
        return model, inserted_id is not None
