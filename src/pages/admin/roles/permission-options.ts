export type PermissionOption = {
  value: string;
  label: string;
  description: string;
};

export type PermissionGroup = {
  title: string;
  description: string;
  permissions: PermissionOption[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: "Địa điểm POI",
    description: "Quản lý dữ liệu địa điểm trên hệ thống.",
    permissions: [
      { value: "poi:read", label: "Xem", description: "Xem danh sách và chi tiết POI" },
      { value: "poi:create", label: "Tạo", description: "Tạo POI mới" },
      { value: "poi:update", label: "Cập nhật", description: "Chỉnh sửa thông tin POI" },
      { value: "poi:delete", label: "Xóa", description: "Xóa POI khỏi hệ thống" },
    ],
  },
  {
    title: "Thực đơn",
    description: "Quản lý món ăn và thực đơn.",
    permissions: [
      { value: "menu:read", label: "Xem", description: "Xem danh sách thực đơn" },
      { value: "menu:create", label: "Tạo", description: "Tạo thực đơn mới" },
      { value: "menu:update", label: "Cập nhật", description: "Chỉnh sửa thực đơn" },
      { value: "menu:delete", label: "Xóa", description: "Xóa thực đơn" },
    ],
  },
  {
    title: "Người dùng",
    description: "Quản lý tài khoản sử dụng hệ thống.",
    permissions: [
      { value: "user:read", label: "Xem", description: "Xem danh sách người dùng" },
      { value: "user:create", label: "Tạo", description: "Tạo tài khoản mới" },
      { value: "user:update", label: "Cập nhật", description: "Chỉnh sửa tài khoản" },
      { value: "user:delete", label: "Xóa", description: "Xóa hoặc vô hiệu hóa tài khoản" },
    ],
  },
  {
    title: "Vai trò và quyền hạn",
    description: "Quản lý vai trò và phạm vi truy cập.",
    permissions: [
      { value: "role:read", label: "Xem", description: "Xem danh sách vai trò" },
      { value: "role:create", label: "Tạo", description: "Tạo vai trò mới" },
      { value: "role:update", label: "Cập nhật", description: "Chỉnh sửa vai trò" },
      { value: "role:delete", label: "Xóa", description: "Xóa vai trò" },
    ],
  },
  {
    title: "Chức năng chủ quán",
    description: "Các thao tác dành cho chủ địa điểm.",
    permissions: [
      { value: "owner:poi_read", label: "Xem POI", description: "Xem POI thuộc quyền quản lý" },
      { value: "owner:poi_submit", label: "Gửi POI", description: "Gửi yêu cầu tạo hoặc sửa POI" },
      { value: "owner:menu_read", label: "Xem thực đơn", description: "Xem thực đơn của chủ quán" },
      { value: "owner:menu_submit", label: "Gửi thực đơn", description: "Gửi yêu cầu cập nhật thực đơn" },
    ],
  },
  {
    title: "Đăng ký chủ quán",
    description: "Gửi, xem và xét duyệt hồ sơ chủ quán.",
    permissions: [
      { value: "owner_registration:register", label: "Đăng ký", description: "Gửi hồ sơ đăng ký chủ quán" },
      { value: "owner_registration:read_self", label: "Xem hồ sơ cá nhân", description: "Xem hồ sơ do chính mình gửi" },
      { value: "owner_registration:resubmit", label: "Gửi lại", description: "Gửi lại hồ sơ bị từ chối" },
      { value: "owner_registration:read", label: "Xem danh sách", description: "Xem tất cả hồ sơ đăng ký" },
      { value: "owner_registration:review", label: "Xét duyệt", description: "Phê duyệt hoặc từ chối hồ sơ" },
    ],
  },
  {
    title: "Đơn đăng ký POI",
    description: "Theo dõi và xét duyệt các yêu cầu POI.",
    permissions: [
      { value: "poi_submission:read", label: "Xem", description: "Xem danh sách yêu cầu POI" },
      { value: "poi_submission:review", label: "Xét duyệt", description: "Phê duyệt hoặc từ chối yêu cầu POI" },
    ],
  },
];

export function getPermissionGroups(availablePermissions: string[]) {
  const available = new Set(availablePermissions);
  const known = new Set(
    PERMISSION_GROUPS.flatMap((group) =>
      group.permissions.map((permission) => permission.value),
    ),
  );

  const groups = PERMISSION_GROUPS.map((group) => ({
    ...group,
    permissions: group.permissions.filter((permission) =>
      available.has(permission.value),
    ),
  })).filter((group) => group.permissions.length > 0);

  const unknownPermissions = availablePermissions.filter(
    (permission) => !known.has(permission),
  );

  if (unknownPermissions.length > 0) {
    groups.push({
      title: "Quyền khác",
      description: "Các quyền mới được cung cấp bởi hệ thống.",
      permissions: unknownPermissions.map((permission) => ({
        value: permission,
        label: permission,
        description: "Quyền hệ thống chưa có mô tả hiển thị.",
      })),
    });
  }

  return groups;
}
