/**
 * AuthSessionHost.jsx — 앱 전역 로그인 세션과 스탬프 획득 모션을 연결하는 호스트
 * - 마운트 시 CSRF/세션 bootstrap, 401이면 세션 정리, 미확인 스탬프 모션을 조회해 StampMotionModal 표시
 * - DEV에서 ?stampDemo=1 이면 더미 모션만 보여 주며 운영 빌드에서는 동작하지 않음
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { setUnauthorizedHandler } from '../../api/http';
import { fetchUnseenMotions, markMotionsSeen } from '../../api/stampApi';
import { StampMotionModal } from '../stamp/StampMotionModal';
import { useAuthStore } from '../../stores/useAuthStore';
import { useExploreStore } from '../../stores/useExploreStore';
import { useStampRevealStore } from '../../stores/useStampRevealStore';

function isStampDemo() {
  return (
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('stampDemo') === '1'
  );
}

export function AuthSessionHost() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const clearSession = useAuthStore((s) => s.clearSession);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [motions, setMotions] = useState([]);
  const stampDemo = isStampDemo();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
    bootstrap();
  }, [bootstrap, clearSession]);

  useEffect(() => {
    if (stampDemo || !user?.authenticated) {
      if (!stampDemo) useStampRevealStore.getState().setHoldForModal(false);
      return undefined;
    }
    let cancelled = false;
    function refresh() {
      useStampRevealStore.getState().setHoldForModal(true);
      queryClient.invalidateQueries({ queryKey: ['stampLandmarkStates'] });
      fetchUnseenMotions()
        .then((items) => {
          if (cancelled) return;
          const list = Array.isArray(items) ? items : [];
          setMotions(list);
          if (list.length === 0 && !useStampRevealStore.getState().reveal) {
            useStampRevealStore.getState().setHoldForModal(false);
          }
        })
        .catch(() => {
          if (cancelled) return;
          setMotions([]);
          if (!useStampRevealStore.getState().reveal) {
            useStampRevealStore.getState().setHoldForModal(false);
          }
        });
    }
    refresh();
    window.addEventListener('incheon-stamp-refresh', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('incheon-stamp-refresh', refresh);
    };
  }, [queryClient, stampDemo, user?.authenticated, user?.memberId]);

  useEffect(() => {
    if (!stampDemo) return;
    useStampRevealStore.getState().setHoldForModal(true);
    setMotions([
      {
        stampId: -1,
        placeName: '차이나타운',
        regionId: 'jemulpo',
        regionName: '중구',
        landmarkKey: 'lm-chinatown',
        regionCompleted: false,
      },
    ]);
  }, [stampDemo]);

  const closeMotions = useCallback(
    async (options = {}) => {
      const first = motions[0];
      const ids = motions.map((item) => item.stampId).filter((id) => Number(id) > 0);
      setMotions([]);
      if (ids.length) {
        try {
          await markMotionsSeen(ids);
        } catch {
          // 스탬프 자체는 유지됩니다. 다음 접속에서 모션을 다시 안내할 수 있습니다.
        }
      }
      queryClient.invalidateQueries({ queryKey: ['stampLandmarkStates'] });
      if (options.goToMap && first) {
        if (first.landmarkKey) {
          const stampReveal = {
            landmarkKey: first.landmarkKey,
            regionId: first.regionId,
            placeName: first.placeName,
            demo: Number(first.stampId) < 0,
          };
          useStampRevealStore.getState().setReveal(stampReveal);
          if (first.regionId) {
            useExploreStore.getState().focusDistrict(first.regionId);
          }
          useStampRevealStore.getState().setHoldForModal(false);
          navigate(Number(first.stampId) < 0 ? '/?stampDemo=1' : '/', { state: { stampReveal } });
        } else {
          if (first.regionId) {
            useExploreStore.getState().focusDistrict(first.regionId);
          }
          useStampRevealStore.getState().setHoldForModal(false);
          navigate('/', {
            state: first.regionId ? { focusDistrict: first.regionId } : {},
          });
        }
      } else {
        useStampRevealStore.getState().setHoldForModal(false);
      }
    },
    [motions, navigate, queryClient],
  );

  return (
    <StampMotionModal
      items={user?.authenticated || stampDemo ? motions : []}
      onClose={closeMotions}
    />
  );
}
