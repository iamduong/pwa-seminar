from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import (
    AccessTokenPayload,
    validate_access_token,
)
from fastapi import APIRouter, Depends, Request, Response
from schema.auth_schema import ChangePassword, Login, RegisterPoiOwner
from service.auth_service import AuthService

router = APIRouter(prefix="/admin/auth", tags=["Admin Auth Controller"])


@router.post("/register-owner")
async def register_poi_owner(
    body: RegisterPoiOwner,
    auth_service: Annotated[AuthService, Depends()],
) -> ApiResponse[dict[str, str]]:

    result = await auth_service.register_poi_owner(body)
    return ApiResponse(success=True, message="Đăng ký chủ quán thành công", data=result)


@router.post("/login")
async def login(
    body: Login, auth_service: Annotated[AuthService, Depends()], response: Response
) -> ApiResponse[None]:
    result = await auth_service.login(body)

    response.set_cookie(
        key="access_token",
        value=result["access_token"],
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=30 * 60,
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )

    return ApiResponse(
        success=True,
        message="Đăng nhập thành công",
    )


@router.get("/me")
async def get_current_user(
    state: Annotated[AccessTokenPayload | None, Depends(validate_access_token)],
    auth_service: Annotated[AuthService, Depends()],
):
    if state is None:
        return ApiResponse(
            success=True, message="Chưa đăng nhập", data={"is_login": False}
        )

    result = await auth_service.get_current_profile(state.sub)
    poi_owner = None
    role = None

    if result["poi_owner_registration"] is not None:
        poi_owner = {
            "business_name": result["poi_owner_registration"].business_name,
            "business_address": result["poi_owner_registration"].business_address,
            "admin_note": result["poi_owner_registration"].admin_note,
            "status": result["poi_owner_registration"].status,
        }

    if result["role"] is not None:
        role = {
            "name": result["role"].name,
            "permissions": result["role"].permissions,
        }

    return ApiResponse(
        success=True,
        message="Lấy thông tin thành công",
        data={
            "is_login": True,
            "user_id": str(result["admin_user"].id),
            "full_name": result["admin_user"].full_name,
            "email": result["admin_user"].email,
            "phone": result["admin_user"].phone,
            "is_active": result["admin_user"].is_active,
            "is_poi_owner_verified": result["admin_user"].is_poi_owner_verified,
            "poi_owner": poi_owner,
            "role": role,
        },
    )


@router.post("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    auth_service: Annotated[AuthService, Depends()],
) -> ApiResponse[None]:
    access_token = await auth_service.refresh_access_token(
        request.cookies.get("refresh_token")
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=30 * 60,
        path="/",
    )

    return ApiResponse(
        success=True,
        message="Làm mới phiên đăng nhập thành công",
    )


@router.post("/logout")
async def logout(response: Response) -> ApiResponse[None]:
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")

    return ApiResponse(
        success=True,
        message="Đăng xuất thành công",
    )


@router.post("/change-password")
async def change_password(
    body: ChangePassword,
    state: Annotated[AccessTokenPayload, Depends(validate_access_token)],
    auth_service: Annotated[AuthService, Depends()],
) -> ApiResponse[None]:
    await auth_service.change_password(state.sub, body)

    return ApiResponse(
        success=True,
        message="Đổi mật khẩu thành công",
    )
