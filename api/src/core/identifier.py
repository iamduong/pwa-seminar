from uuid import UUID

from fastapi import HTTPException


def parse_uuid(value: str, label: str = "Mã định danh") -> UUID:
    try:
        return UUID(value)
    except (ValueError, TypeError, AttributeError) as error:
        raise HTTPException(status_code=400, detail=f"{label} không hợp lệ") from error
