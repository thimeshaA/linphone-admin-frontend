import { apiFetch } from "./client";
import type { AppNotification } from "@/lib/telephony/types";

interface BackendNotification {
  id: number;
  recipient_id: number;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

interface BackendNotificationList {
  notifications: BackendNotification[];
  pagination: { page: number; limit: number; total: number };
}

function mapNotification(n: BackendNotification): AppNotification {
  return {
    id: String(n.id),
    recipientId: String(n.recipient_id),
    type: n.type,
    title: n.title,
    message: n.message,
    payload: n.payload,
    readAt: n.read_at,
    createdAt: n.created_at,
  };
}

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; unread?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.unread) query.set("unread", "true");
    const qs = query.toString();
    return apiFetch<BackendNotificationList>(
      `/notifications${qs ? `?${qs}` : ""}`,
    ).then((res) => ({
      notifications: res.notifications.map(mapNotification),
      pagination: res.pagination,
    }));
  },
  markRead: (id: string) =>
    apiFetch<BackendNotification>(`/notifications/${id}/read`, {
      method: "PATCH",
    }).then(mapNotification),
  // Route order on the backend matters ("read-all" is registered ahead of
  // the ":id/read" param route) but is irrelevant here — just the path.
  markAllRead: () =>
    apiFetch<{ message: string }>("/notifications/read-all", {
      method: "PATCH",
    }),
};
