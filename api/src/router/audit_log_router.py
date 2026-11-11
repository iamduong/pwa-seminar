from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import require_permission
from core.pagination import Pagination
from fastapi import APIRouter, Depends, Query
from schema.audit_log_schema import FilterAuditLog, ViewAuditLog
from service.audit_log_service import AuditLogService


router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", dependencies=[Depends(require_permission("audit:read"))])
async def filter_audit_logs(
    filters: Annotated[FilterAuditLog, Query()],
    service: Annotated[AuditLogService, Depends()],
) -> ApiResponse[Pagination[ViewAuditLog]]:
    return ApiResponse(
        success=True,
        message="Lấy nhật ký hệ thống thành công",
        data=await service.filter_logs(filters),
    )
