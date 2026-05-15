import apiClient from './client';
import type { Notification } from '../types';

export async function getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
  const { data } = await apiClient.get<{ success: boolean; notifications: Notification[]; unreadCount: number }>('/notifications');
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post('/notifications/read-all');
}
