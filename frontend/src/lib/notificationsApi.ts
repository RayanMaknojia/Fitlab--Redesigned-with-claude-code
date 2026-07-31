import { request } from "@/lib/request";
import type { Notification } from "@/types/marketplace";

export async function getMyNotifications(): Promise<Notification[]> {
  return request<Notification[]>("/notifications");
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await request<void>(`/notifications/${notificationId}/read`, {
    method: "POST",
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await request<void>("/notifications/read-all", { method: "POST" });
}
