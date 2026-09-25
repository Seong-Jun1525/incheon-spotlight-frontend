/**
 * useLandmarkStatesQuery.js — 로그인 사용자의 랜드마크 건설·스탬프 상태 조회 훅
 * - fetchLandmarkStates 호출, queryKey: ['stampLandmarkStates', memberId]
 * - 인증된 회원만 활성화되며 staleTime 15초 + 20초 폴링·창 포커스 재조회로 거의 실시간 유지
 */
import { useQuery } from '@tanstack/react-query';
import { fetchLandmarkStates } from '../../api/stampApi';
import { useAuthStore } from '../../stores/useAuthStore';

export function useLandmarkStatesQuery() {
  const authenticated = useAuthStore((state) => state.user?.authenticated);
  const memberId = useAuthStore((state) => state.user?.memberId);

  return useQuery({
    queryKey: ['stampLandmarkStates', memberId],
    queryFn: fetchLandmarkStates,
    enabled: Boolean(authenticated && memberId),
    staleTime: 1000 * 15,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 20,
    retry: 1,
  });
}
