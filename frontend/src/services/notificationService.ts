import api from "../lib/api";
import type { NotificationResponse } from "../types";

export const notificationService = {
  getNotifications: async (): Promise<NotificationResponse[]> => {
    const res = await api.get("/api/v1/notifications");
    return res.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get("/api/v1/notifications/unread-count");
    return res.data.data.count;
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.patch(`/api/v1/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch("/api/v1/notifications/read-all");
  },

  deleteNotification: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/notifications/${id}`);
  },

  deleteAllNotifications: async (): Promise<void> => {
    await api.delete("/api/v1/notifications");
  },
};
