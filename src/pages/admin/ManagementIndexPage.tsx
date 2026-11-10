import { Navigate } from "react-router";

import { useAuthorize } from "#hooks/use-authorize";

export default function ManagementIndexPage() {
  const { session } = useAuthorize();
  const permissions = session?.role?.permissions ?? [];

  if (permissions.includes("owner:poi_read")) {
    return <Navigate to="/quan-ly/dashboard" replace />;
  }

  if (
    session?.poiOwner ||
    permissions.some((permission) =>
      [
        "owner_registration:register",
        "owner_registration:read_self",
        "owner_registration:resubmit",
      ].includes(permission),
    )
  ) {
    return <Navigate to="/quan-ly/dang-ky-chu-quan" replace />;
  }

  if (
    permissions.some((permission) =>
      [
        "poi:read",
        "owner_registration:read",
        "poi_submission:read",
        "user:read",
      ].includes(permission),
    )
  ) {
    return <Navigate to="/quan-ly/dashboard" replace />;
  }

  return <Navigate to="/" replace />;
}
