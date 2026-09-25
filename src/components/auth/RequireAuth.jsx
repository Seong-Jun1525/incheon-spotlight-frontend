/**
 * RequireAuth.jsx — 로그인·관리자 권한이 필요한 라우트를 감싸는 가드
 * - RequireAuth: 세션 확인 중 안내, 비로그인이면 현재 경로를 state.from으로 두고 /login으로 이동
 * - RequireAdmin: 인증 후 관리자가 아니면 메인으로 보내고, 맞으면 children 렌더
 */
import { useUiLanguage } from '../../i18n/uiText';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/useAuthStore';
import { safeInternalPath } from '../../utils/safeUrl';
import styles from '../layout/MemberShell.module.scss';

export function RequireAuth({ children }) {
  useUiLanguage();
  const { t } = useTranslation();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return (
      <div className={styles.state} role='status'>{t('auth.checking')}</div>
    );
  }

  if (!user?.authenticated) {
    return (
      <Navigate
        to='/login'
        replace
        state={{ from: safeInternalPath(`${location.pathname}${location.search}`, '/mypage') }}
      />
    );
  }

  return children;
}

export function RequireAdmin({ children }) {
  useUiLanguage();
  const { t } = useTranslation();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return (
      <div className={styles.state} role='status'>{t('auth.checkingAdmin')}</div>
    );
  }

  if (!user?.authenticated) {
    return (
      <Navigate
        to='/login'
        replace
        state={{ from: safeInternalPath(`${location.pathname}${location.search}`, '/mypage') }}
      />
    );
  }

  if (!user.admin) {
    return (
      <main className={styles.state} role='alert'>
        <strong>{t('auth.adminOnly')}</strong>
        <p>{t('auth.adminOnlyHint')}</p>
      </main>
    );
  }

  return children;
}
