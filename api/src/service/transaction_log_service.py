from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from core.dependency import PostgresDB
from fastapi import HTTPException
from repository.transaction_log_repository import TransactionLogRepository
from schema.transaction_log_schema import (
    FilterTransactionLog,
    IPNTransactionPayload,
    ViewIPNResult,
    ViewTransactionLog,
    ViewTransactionLogPage,
)


VIETNAM_TIMEZONE = ZoneInfo("Asia/Ho_Chi_Minh")


class TransactionLogService:
    def __init__(self, db: PostgresDB):
        self.repository = TransactionLogRepository(db)

    async def filter_logs(
        self,
        filters: FilterTransactionLog,
    ) -> ViewTransactionLogPage:
        date_from = (
            datetime.combine(filters.date_from, time.min, VIETNAM_TIMEZONE)
            if filters.date_from
            else None
        )
        date_to_exclusive = (
            datetime.combine(
                filters.date_to + timedelta(days=1),
                time.min,
                VIETNAM_TIMEZONE,
            )
            if filters.date_to
            else None
        )
        items, total, total_amount = await self.repository.find_pagination(
            filters.page,
            filters.page_size,
            keyword=filters.q,
            date_from=date_from,
            date_to_exclusive=date_to_exclusive,
        )
        return ViewTransactionLogPage(
            page=filters.page,
            page_size=filters.page_size,
            total_item=total,
            total_page=(total + filters.page_size - 1) // filters.page_size,
            total_amount=total_amount,
            data=[
                self._view(item)
                for item in items
            ],
        )

    async def receive_ipn(self, payload: IPNTransactionPayload) -> ViewIPNResult:
        if payload.transfer_type != "in":
            raise HTTPException(422, "IPN chỉ chấp nhận giao dịch tiền vào")

        transaction_date = payload.transaction_date
        if transaction_date.tzinfo is None:
            transaction_date = transaction_date.replace(tzinfo=VIETNAM_TIMEZONE)
        content = payload.content.strip()
        model, created = await self.repository.insert_once(
            transaction_date=transaction_date,
            content=content,
            amount=payload.transfer_amount,
            reference_code=payload.reference_code.strip(),
        )
        return ViewIPNResult(created=created, transaction=self._view(model))

    @staticmethod
    def _view(item) -> ViewTransactionLog:
        return ViewTransactionLog(
            id=str(item.id),
            transaction_date=item.transaction_date,
            content=item.content,
            amount=item.amount,
            reference_code=item.reference_code,
            created_at=item.created_at,
        )
