/**
 * BackendHealthWatcher.jsx — 실행 중 백엔드 장애를 주기적으로 감지하는 감시 컴포넌트
 * - 5초마다, 탭이 다시 보이거나 온라인이 되면 checkBackendOrSorry로 /api/health를 확인
 * - 모바일 복귀 직후 네트워크 지연을 장애로 오인하지 않도록 1.5초 유예 후 재검사
 */
import { useEffect } from 'react';
import { checkBackendOrSorry } from '../../api/backendHealth';

const POLL_MS = 5_000;
const RESUME_GRACE_MS = 1_500;

/** 앱이 열린 뒤 백엔드가 내려가면 Sorry 페이지로 보낸다. */
export function BackendHealthWatcher() {
  useEffect(() => {
    let resumeTimer = null;
    const run = () => {
      if (document.visibilityState !== 'visible') return;
      void checkBackendOrSorry();
    };
    const timer = window.setInterval(run, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      window.clearTimeout(resumeTimer);
      // 모바일 브라우저가 백그라운드에서 돌아온 직후에는 네트워크가 아직
      // 준비되지 않을 수 있으므로 짧은 유예 뒤 확인한다.
      resumeTimer = window.setTimeout(run, RESUME_GRACE_MS);
    };
    const onOnline = () => onVisible();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(resumeTimer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  return null;
}
