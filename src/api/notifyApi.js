/**
 * notifyApi.js — 알림 목록·읽음 처리 API
 * - GET /api/notifications 목록, /api/notifications/unread-count 로 미읽음 개수 조회
 * - POST /api/notifications/read 로 선택한 알림들을 읽음 처리
 */
import { api } from './http';

export async function fetchNotifications(params) {
  const { data } = await api.get('/api/notifications', { params });
  return data;
}

export async function fetchUnreadCount() {
  const { data } = await api.get('/api/notifications/unread-count');
  return data.count ?? 0;
}

export async function markNotificationsRead(ids = []) {
  const { data } = await api.post('/api/notifications/read', { ids });
  return data;
}
