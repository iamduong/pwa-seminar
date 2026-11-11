import type { Pagination } from "./contract/Pagination";

export type AuditLog = {
  id: string;
  actor_user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  result: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AuditLogPagination = Pagination<AuditLog>;
