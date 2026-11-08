from typing import Annotated, Literal

import jwt
from core.provider.postgres import get_postgres
from core.security import TokenType, decode_token
from fastapi import Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

PostgresDB = Annotated[AsyncSession, Depends(get_postgres)]


class AccessTokenPayload(BaseModel):
    # sub = admin_user_id
    sub: str
    type: Literal["access"]
    role_name: str | None
    permissions: list[str]
    is_poi_owner_verified: bool
    iat: int
    exp: int


async def validate_session(
    request: Request,
) -> AccessTokenPayload:

    token = request.cookies.get("access_token")
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
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập không chính xác",
        )


def require_permission(permission: str):
    # Func to check permission
    async def permission_checker(
        # Check access token
        session: Annotated[AccessTokenPayload, Depends(validate_session)],
    ) -> AccessTokenPayload:
        if not permission:
            return session
        # After dependencies run, check permission
        if permission not in session.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền truy cập",
            )

        return session

    return permission_checker
