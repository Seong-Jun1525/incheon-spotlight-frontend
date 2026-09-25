/**
 * favoriteApi.js — 로그인 계정 즐겨찾기 API
 * - GET/POST /api/favorites 로 목록 조회와 추가
 * - DELETE /api/favorites/{contentId} 로 삭제 (contentId는 URL 인코딩)
 */
import { api } from './http';

export async function listAccountFavorites() {
  const { data } = await api.get('/api/favorites');
  return data;
}

export async function addAccountFavorite(payload) {
  const { data } = await api.post('/api/favorites', payload);
  return data;
}

export async function removeAccountFavorite(contentId) {
  const { data } = await api.delete(`/api/favorites/${encodeURIComponent(contentId)}`);
  return data;
}
