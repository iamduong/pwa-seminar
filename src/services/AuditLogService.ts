import api, { type ApiResponse } from "#lib/api";
import type { AuditLogPagination } from "../types/AuditLog";

export type AuditLogQuery = {
  page?: number;
  pageSize?: number;
  actorUserId?: string;
  action?: string;
  resourceType?: string;
};

class AuditLogService {
  async list(query: AuditLogQuery = {}, signal?: AbortSignal) {
    const response = await api.get<ApiResponse<AuditLogPagination>>(
      "/audit-logs",
      {
        params: {
          page: query.page ?? 1,
          page_size: query.pageSize ?? 20,
          actor_user_id: query.actorUserId?.trim() || undefined,
          action: query.action?.trim() || undefined,
          resource_type: query.resourceType?.trim() || undefined,
        },
        signal,
      },
    );
    return response.data;
  }
}

export const auditLogService = new AuditLogService();
