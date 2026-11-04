PERMISSIONS: list[str] = [
    "poi:read",
    "poi:create",
    "poi:update",
    "poi:delete",
    # ---------
    "menu:read",
    "menu:create",
    "menu:update",
    "menu:delete",
    # ---------
    "user:read",
    "user:create",
    "user:update",
    "user:delete",
    # ---------
    "role:read",
    "role:create",
    "role:update",
    "role:delete",
    # ---------
    "owner:poi_read",
    "owner:poi_submit",
    "owner:menu_read",
    "owner:menu_submit",
    # ---------
    "owner_registration:register",
    "owner_registration:read_self",
    "owner_registration:resubmit",
    # ---------
    "owner_registration:read",
    "owner_registration:review",
    # ---------
    "poi_submission:read",
    "poi_submission:review",
    "poi_submission:monitor",
]
