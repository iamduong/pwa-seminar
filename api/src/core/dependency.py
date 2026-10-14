from typing import Annotated, Literal

import jwt
from core.provider.mongo import get_mongo
from core.security import TokenType, decode_token
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from pymongo.asynchronous.database import AsyncDatabase

MongoDB = Annotated[AsyncDatabase, Depends(get_mongo)]


class AccessTokenPayload(BaseModel):
    sub: str
    type: Literal["access"]
    role_name: str | None
    permissions: list[str]
    is_poi_owner_verified: bool
    iat: int
    exp: int


bearer_schema = HTTPBearer(auto_error=False)


async def get_current_profile(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_schema)],
) -> AccessTokenPayload | None:

    token = (
        credentials.credentials
        if credentials is not None
        else request.cookies.get("access_token")
    )

    if token is None:
        return None

    try:
        payload = decode_token(token, TokenType.ACCESS)
        return AccessTokenPayload.model_validate(payload)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập đã hết hạn",
        )
    except jwt.InvalidTokenError, ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập không chính xác",
        )


async def validate_access_token(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_schema)],
) -> AccessTokenPayload:

    token = (
        credentials.credentials
        if credentials is not None
        else request.cookies.get("access_token")
    )

    print(token)

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Chưa đăng nhập hệ thống"
        )

    try:
        payload = decode_token(token, TokenType.ACCESS)
        return AccessTokenPayload.model_validate(payload)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập đã hết hạn",
        )
    except jwt.InvalidTokenError, ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập không chính xác",
        )


def require_permission(permission: str):
    # Func to check permission
    async def permission_checker(
        # Check access token
        state: Annotated[AccessTokenPayload, Depends(validate_access_token)],
    ) -> AccessTokenPayload:
        # After dependencies run, check permission
        if permission not in state.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền truy cập",
            )

        return state

    return permission_checker
