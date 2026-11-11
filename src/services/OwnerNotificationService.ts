import api, { type ApiResponse } from "#lib/api";
import type {
  OwnerNotification,
  OwnerNotificationPagination,
} from "../types/OwnerNotification";

class OwnerNotificationService {
  async list(page = 1, pageSize = 20, signal?: AbortSignal) {
    const response = await api.get<ApiResponse<OwnerNotificationPagination>>(
      "/owner-notifications",
      { params: { page, page_size: pageSize }, signal },
    );
    return response.data;
  }

  async unreadCount(signal?: AbortSignal) {
    const response = await api.get<ApiResponse<{ unread_count: number }>>(
      "/owner-notifications/unread-count",
      { signal },
    );
    return response.data;
  }

  async markRead(id: string) {
    const response = await api.patch<ApiResponse<OwnerNotification>>(
      `/owner-notifications/${id}/read`,
    );
    return response.data;
  }

  async markAllRead() {
    const response = await api.patch<ApiResponse<null>>(
      "/owner-notifications/read-all",
    );
    return response.data;
  }
}

export const ownerNotificationService = new OwnerNotificationService();
