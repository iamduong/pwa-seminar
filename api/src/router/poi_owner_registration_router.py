from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import AccessTokenPayload, require_permission
from core.pagination import Pagination
from fastapi import APIRouter, Depends
from schema.poi_owner_registration_schema import (
    FilterPoiOwnerRegistration,
    RegisterPoiOwnerRegistration,
    ReviewPoiPOwnerRegistration,
    ViewPoiOwnerRegistration,
)
from service.poi_owner_registration_service import PoiOwnerRegistrationService

router = APIRouter(
    prefix="/poi-owner-registrations", tags=["Poi Owner Registration Router"]
)


# Get all poi owner registration
@router.get("", dependencies=[])
async def filter_poi_owner_registration(
    params: Annotated[FilterPoiOwnerRegistration, Depends()],
    poi_owner_registration_service: Annotated[PoiOwnerRegistrationService, Depends()],
) -> ApiResponse[Pagination[ViewPoiOwnerRegistration]]:
    result = await poi_owner_registration_service.filter_poi_owner_registration(params)

    return ApiResponse(
        success=True, message="Lấy danh sách đăng ký chủ quán thành công", data=result
    )


# Review poi owner registration
# - Approve -> set owner role, owner accounts can access to portal
# - Reject -> have to note why reject registration
@router.patch(
    "/review-registration/{id}",
    # dependencies=[Depends(require_permission("owner_registration:review"))],
)
async def review_registration(
    id: str,
    body: ReviewPoiPOwnerRegistration,
    poi_owner_registration_service: Annotated[PoiOwnerRegistrationService, Depends()],
) -> ApiResponse[dict]:

    result = await poi_owner_registration_service.review_registration(
        id, body.model_dump()
    )

    return ApiResponse(
        success=True, message="Review đơn đăng ký thành công", data=result
    )


# Register poi owner / Create poi owner registration
@router.post("/register")
async def register_poi_owner(
    principal: Annotated[
        AccessTokenPayload, Depends(require_permission("owner_registration:register"))
    ],
    body: RegisterPoiOwnerRegistration,
    poi_owner_registration_service: Annotated[PoiOwnerRegistrationService, Depends()],
) -> ApiResponse[dict]:

    result = await poi_owner_registration_service.register_poi_owner(
        principal.sub, body.model_dump()
    )

    return ApiResponse(
        success=True, message="Gửi đơn đăng ký chủ quán thành công", data=result
    )


# Update poi owner registration
# Flow update
# - Register new poi owner
# - Admin approve or reject -> approve -> done
# - Admin reject
# - Register again
@router.post("/re-register", dependencies=[])
async def re_register_poi_owner() -> ApiResponse[ViewPoiOwnerRegistration]:
    pass


# Get self poi owner registrations
# When admin reject -> the records are not deleted
# Show all history records and note
@router.get("/self-registration", dependencies=[])
async def self_registration() -> ApiResponse[list[ViewPoiOwnerRegistration]]:
    pass
