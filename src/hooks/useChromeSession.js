/**
 * useChromeSession.js — 헤더·내비게이션에 필요한 로그인 상태와 이동 동작을 묶는 훅
 * - 인증 스토어의 사용자 정보와 알림 미읽음 수를 노출
 * - 로그인·회원가입·마이페이지·로그아웃 핸들러를 만들어 전달 (로그인 시 현재 경로를 복귀 지점으로 저장)
 * - 상단 메뉴 id에 맞는 경로 이동 처리
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

export function useChromeSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const unreadCount = useAuthStore((s) => s.unreadCount);

  const from = `${location.pathname}${location.search}`;

  return {
    user,
    unreadCount,
    navAuthProps: {
      user,
      unreadCount,
      onLogin: () => navigate('/login', { state: { from } }),
      onSignup: () => navigate('/signup'),
      onMypage: () => navigate('/mypage'),
      onLogout: async () => {
        await logout();
        navigate('/');
      },
    },
    goMemberNav: (navId) => {
      if (navId === 'travel') {
        navigate('/travel-planner');
        return true;
      }
      if (navId === 'visits') {
        navigate('/visits');
        return true;
      }
      if (navId === 'about') {
        navigate('/about');
        return true;
      }
      return false;
    },
  };
}
