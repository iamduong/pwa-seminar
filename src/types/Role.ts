import type { Pagination } from "./contract/Pagination";

export type Role = {
  id: string;
  name: string;
  permissions: string[];
  is_system: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type RolePagination = Pagination<Role>;

export type CreateRolePayload = {
  name: string;
  permissions: string[];
  priority: number;
};

export type UpdateRolePayload = Partial<CreateRolePayload>;
