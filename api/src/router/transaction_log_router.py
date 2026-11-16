from hmac import compare_digest
from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import require_permission
from core.setting import get_setting
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from schema.transaction_log_schema import (
    FilterTransactionLog,
    IPNTransactionPayload,
    ViewIPNResult,
    ViewTransactionLogPage,
)
from service.transaction_log_service import TransactionLogService

router = APIRouter(prefix="/transaction-logs", tags=["Transaction Logs"])


def require_ipn_api_key(
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    secret = get_setting().IPN_SECRET
    if not secret:
        raise HTTPException(503, "IPN chưa được cấu hình")
    candidate = None
    if authorization:
        scheme, separator, credential = authorization.partition(" ")
        if separator and scheme.lower() in {"apikey", "bearer"}:
            candidate = credential
    if not candidate or not compare_digest(candidate, secret):
        raise HTTPException(401, "API key IPN không hợp lệ")


@router.get("", dependencies=[Depends(require_permission("transaction:read"))])
async def filter_transaction_logs(
    filters: Annotated[FilterTransactionLog, Query()],
    service: Annotated[TransactionLogService, Depends()],
) -> ApiResponse[ViewTransactionLogPage]:
    return ApiResponse(
        success=True,
        message="Lấy lịch sử giao dịch thành công",
        data=await service.filter_logs(filters),
    )


@router.post("/ipn", dependencies=[Depends(require_ipn_api_key)])
async def receive_ipn(
    body: IPNTransactionPayload,
    service: Annotated[TransactionLogService, Depends()],
) -> ApiResponse[ViewIPNResult]:
    result = await service.receive_ipn(body)
    return ApiResponse(
        success=True,
        message="Đã ghi nhận giao dịch" if result.created else "Giao dịch đã tồn tại",
        data=result,
    )
