/**
 * useAuthStore.js — 로그인 세션 상태 스토어(zustand)
 * - 상태: status(idle·loading·authenticated·anonymous), user, unreadCount, error
 * - bootstrap·login·logout에서 CSRF 발급, 세션 조회, 미읽음 알림 수 갱신
 * - 세션이 바뀔 때 useFavoritesStore.bindSession으로 즐겨찾기 소유자 전환
 */
import { create } from 'zustand';
import { useFavoritesStore } from './useFavoritesStore';
import { fetchCsrf, fetchMe, login as loginRequest, logout as logoutRequest } from '../api/authApi';
import { fetchUnreadCount } from '../api/notifyApi';
import { getApiErrorMessage } from '../api/http';

const anonymous = {
  status: 'idle',
  user: null,
  unreadCount: 0,
  error: null,
};

export const useAuthStore = create((set, get) => ({
  ...anonymous,

  async bootstrap() {
    if (get().status === 'loading') return;
    set({ status: 'loading', error: null });
    try {
      await fetchCsrf();
      const me = await fetchMe();
      if (me?.authenticated) {
        let unreadCount = 0;
        try {
          unreadCount = await fetchUnreadCount();
        } catch {
          // 알림 테이블이 없으면 배지만 0으로 둡니다.
        }
        set({ status: 'authenticated', user: me, unreadCount, error: null });
        void useFavoritesStore.getState().bindSession(me.memberId);
        return;
      }
      set({ status: 'anonymous', user: null, unreadCount: 0, error: null });
      void useFavoritesStore.getState().bindSession(null);
    } catch (error) {
      void useFavoritesStore.getState().bindSession(null);
      set({
        status: 'anonymous',
        user: null,
        unreadCount: 0,
        error: getApiErrorMessage(error, '로그인 상태를 확인하지 못했습니다.'),
      });
    }
  },

  async login(payload) {
    await fetchCsrf();
    const me = await loginRequest(payload);
    let unreadCount = 0;
    try {
      unreadCount = await fetchUnreadCount();
    } catch {
      // 알림 테이블이 없으면 배지만 0으로 둡니다.
    }
    set({ status: 'authenticated', user: me, unreadCount, error: null });
    void useFavoritesStore.getState().bindSession(me.memberId);
    return me;
  },

  async logout() {
    void useFavoritesStore.getState().bindSession(null);
    try {
      await logoutRequest();
    } finally {
      set({ status: 'anonymous', user: null, unreadCount: 0, error: null });
    }
  },

  setUser(user) {
    set({ user, status: user?.authenticated ? 'authenticated' : 'anonymous' });
  },

  setUnreadCount(unreadCount) {
    set({ unreadCount });
  },

  clearSession() {
    void useFavoritesStore.getState().bindSession(null);
    set({ status: 'anonymous', user: null, unreadCount: 0 });
  },
}));
