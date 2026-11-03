from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import (
    AccessTokenPayload,
    require_permission,
)
from fastapi import APIRouter, Depends, Request, Response
from schema.contract.authorize_contract import ChangePassword, LoginUser, RegisterUser
from service.authorize_service import AuthorizeService

router = APIRouter(prefix="/authorize", tags=["Authorize Controller"])


# Register new account
# Only register and set role "user"
# If customer want to be a owner, they can register owner
@router.post("/register", status_code=201)
async def register_user(
    body: RegisterUser,
    auth_service: Annotated[AuthorizeService, Depends()],
) -> ApiResponse[dict]:
    result = await auth_service.register_user(body)

    return ApiResponse(
        success=True, message="Đăng ký tài khoản thành công", data=result
    )


# Login
@router.post("/login")
async def login(
    body: LoginUser,
    auth_service: Annotated[AuthorizeService, Depends()],
    response: Response,
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


# Fetch selft infomation
# About:
# - Account: admin_user model
# - Owner: poi_owner_registration model
# - Role: role model
@router.get("/about-me")
async def get_current_profile(
    principal: Annotated[AccessTokenPayload, Depends(require_permission(None))],
    auth_service: Annotated[AuthorizeService, Depends()],
) -> ApiResponse[dict]:
    result = await auth_service.get_current_profile(principal.sub)

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


# Used to fetch new access_token
# Verifing is throught refresh_token
@router.post("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    auth_service: Annotated[AuthorizeService, Depends()],
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


# Used to exit current session
# In the future: add version field to account
@router.post("/logout")
async def logout(response: Response) -> ApiResponse[None]:

    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")

    return ApiResponse(
        success=True,
        message="Đăng xuất thành công",
    )


# Used to change password
# Check new password doesn't same old password
@router.post("/change-password")
async def change_password(
    principal: Annotated[AccessTokenPayload, Depends(require_permission(None))],
    body: ChangePassword,
    auth_service: Annotated[AuthorizeService, Depends()],
) -> ApiResponse[None]:

    await auth_service.change_password(principal.sub, body)

    return ApiResponse(
        success=True,
        message="Đổi mật khẩu thành công",
    )
