from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import AccessTokenPayload, MongoDB, require_permission
from fastapi import APIRouter
from fastapi import Depends

router = APIRouter(prefix="/categories", tags=["Category Controller"])


@router.get("")
async def get_all_poi_categories(
    _state: Annotated[AccessTokenPayload, Depends(require_permission("poi:read"))],
    db: MongoDB,
):
    cursor = db["poi_category"].find(
        {"is_active": True, "deleted_at": None},
        {"code": 1, "name": 1},
    ).sort("name", 1)
    documents = await cursor.to_list(length=None)
    categories = [
        {"id": str(document["_id"]), "code": document["code"], "name": document["name"]}
        for document in documents
    ]
    return ApiResponse(
        success=True,
        message="Lấy danh mục địa điểm thành công",
        data=categories,
    )
