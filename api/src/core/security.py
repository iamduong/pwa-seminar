from datetime import UTC, datetime, timedelta
from enum import Enum

import bcrypt
import jwt
from core.setting import get_setting
from cryptography.fernet import Fernet

setting = get_setting()
fernet = Fernet(setting.PII_ENCRYPTION_KEY.encode("utf-8"))


class TokenType(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"


# Password utils
def hash_password(password: str) -> str:
    byte_password = password.encode("utf-8")
    hashed = bcrypt.hashpw(byte_password, bcrypt.gensalt())

    return hashed.decode("utf-8")


def compare_password(password: str, password_hash: str) -> bool:
    byte_password = password.encode("utf-8")
    byte_password_hash = password_hash.encode("utf-8")

    return bcrypt.checkpw(byte_password, byte_password_hash)


# JWT utils
def generate_access_token(
    id: str,
    role_name: str | None = None,
    permissions: list[str] | None = None,
    is_poi_owner_verified: bool = False,
) -> str:
    if permissions is None:
        permissions = []

    now = datetime.now(UTC)
    payload = {
        "sub": id,
        "type": TokenType.ACCESS.value,
        "role_name": role_name,
        "permissions": permissions,
        "is_poi_owner_verified": is_poi_owner_verified,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=30)).timestamp()),
    }

    return jwt.encode(payload, setting.JWT_ACCESS, algorithm=setting.JWT_ALGORITHM)


def generate_refresh_token(id: str) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": id,
        "type": TokenType.REFRESH.value,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=7)).timestamp()),
    }

    return jwt.encode(payload, setting.JWT_REFRESH, algorithm=setting.JWT_ALGORITHM)


def decode_token(token: str, token_type: TokenType) -> dict:
    secret = (
        setting.JWT_ACCESS if token_type == TokenType.ACCESS else setting.JWT_REFRESH
    )

    payload = jwt.decode(
        token,
        secret,
        algorithms=[setting.JWT_ALGORITHM],
        options={
            "require": ["sub", "type", "iat", "exp"],
            "verify_exp": True,
        },
    )

    if payload.get("type") != token_type.value:
        raise jwt.InvalidTokenError("Token không hợp lệ")

    return payload


# PII utils
def encrypt_pii(value: str) -> str:
    if not value:
        raise ValueError("PII value must not be empty")

    encrypted = fernet.encrypt(value.encode("utf-8")).decode("utf-8")

    return f"{setting.PII_VERSION}:{encrypted}"


def decrypt_pii(value: str | None) -> str | None:
    if not value:
        return None

    version, encrypted = value.split(":", maxsplit=1)

    if version != setting.PII_VERSION:
        return None

    return fernet.decrypt(encrypted.encode("utf-8")).decode("utf-8")
