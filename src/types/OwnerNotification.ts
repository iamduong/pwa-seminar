import type { Pagination } from "./contract/Pagination";

export type OwnerNotification = {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  resource_type: string;
  resource_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type OwnerNotificationPagination = Pagination<OwnerNotification>;
