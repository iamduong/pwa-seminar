from core.permission import PERMISSIONS


def init_permissions() -> list[str]:
    permissions = list(dict.fromkeys(PERMISSIONS))
    invalid = [value for value in permissions if value.count(":") != 1]
    if invalid:
        raise ValueError(f"Permission không đúng định dạng resource:action: {invalid}")

    print(f"permissions: {len(permissions)} definitions ready")
    return permissions
