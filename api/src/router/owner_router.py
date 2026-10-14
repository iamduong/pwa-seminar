from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import AccessTokenPayload, require_permission
from fastapi import APIRouter, Depends
from service.owner_service import OwnerService

router = APIRouter(prefix="/owner", tags=["Owner Controller"])


@router.get("/registration-status")
async def get_registration_status(
    state: Annotated[AccessTokenPayload, Depends(require_permission("owner:access"))],
    owner_service: Annotated[OwnerService, Depends()],
):
    poi_owner_registration = await owner_service.get_registration_status(state.sub)

    return ApiResponse(
        success=True,
        message="Lấy dữ liệu thành công",
        data={
            "registration_id": str(poi_owner_registration.id),
            "user_id": str(poi_owner_registration.user_id),
            "business_name": poi_owner_registration.business_name,
            "business_address": poi_owner_registration.business_address,
            "status": poi_owner_registration.status,
            "admin_note": poi_owner_registration.admin_note or None,
            "is_poi_owner_verified": state.is_poi_owner_verified,
        },
    )
