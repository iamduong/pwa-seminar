import { BellIcon, CheckCheckIcon, Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import { Button } from "#components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "#components/ui/popover";
import { ownerNotificationService } from "../../services/OwnerNotificationService";
import type { OwnerNotification } from "../../types/OwnerNotification";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

function notificationTarget(notification: OwnerNotification) {
  if (notification.resource_type === "poi_owner_registration") {
    return "/quan-ly/dang-ky-chu-quan";
  }
  if (notification.resource_type === "poi_submission") {
    return "/quan-ly/chuc-nang-chu-quan/don-dang-ky-poi";
  }
  return "/quan-ly/chuc-nang-chu-quan/poi-cua-toi";
}

export function OwnerNotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<OwnerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadCount = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await ownerNotificationService.unreadCount(signal);
      if (response.success && response.data) setUnreadCount(response.data.unread_count);
    } catch {
      // The full notifications page provides retry and detailed error feedback.
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ownerNotificationService.list(1, 5);
      if (response.success && response.data) setNotifications(response.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadCount(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadCount]);

  async function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) await loadNotifications();
  }

  async function openNotification(notification: OwnerNotification) {
    if (!notification.is_read) {
      await ownerNotificationService.markRead(notification.id);
      setUnreadCount((value) => Math.max(0, value - 1));
    }
    setOpen(false);
    navigate(notificationTarget(notification));
  }

  async function markAllRead() {
    await ownerNotificationService.markAllRead();
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="relative flex size-9 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ""}`}
          />
        }
      >
        <BellIcon className="size-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,24rem)] gap-0 p-0">
        <PopoverHeader className="flex-row items-center justify-between border-b p-3">
          <PopoverTitle>Thông báo</PopoverTitle>
          {unreadCount > 0 && (
            <Button type="button" size="sm" variant="ghost" onClick={() => void markAllRead()}>
              <CheckCheckIcon aria-hidden="true" />
              Đọc tất cả
            </Button>
          )}
        </PopoverHeader>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
              Đang tải...
            </div>
          ) : notifications.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Chưa có thông báo.</p>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={`block w-full border-b p-3 text-left last:border-b-0 hover:bg-muted/60 ${notification.is_read ? "" : "bg-primary/5"}`}
                onClick={() => void openNotification(notification)}
              >
                <span className="flex items-start gap-2">
                  {!notification.is_read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{notification.title}</span>
                    <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">{notification.message}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {dateFormatter.format(new Date(notification.created_at))}
                    </span>
                  </span>
                </span>
              </button>
            ))
          )}
        </div>

        <Link
          className="border-t p-3 text-center text-sm font-medium hover:bg-muted/60"
          to="/quan-ly/thong-bao"
          onClick={() => setOpen(false)}
        >
          Xem tất cả thông báo
        </Link>
      </PopoverContent>
    </Popover>
  );
}
