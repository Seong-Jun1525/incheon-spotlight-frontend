/**
 * useRealtimeSearchesQuery.js — 실시간 인기 검색어 상위 3건 조회 훅
 * - fetchRealtimeSearches({ districtId, limit: 3 }) 호출, 구·군 미지정 시 인천 전체 집계
 * - queryKey: ['stats', 'realtime-searches', districtId ?? 'all'], staleTime 30초 + 60초 폴링
 */
import { useQuery } from '@tanstack/react-query';
import { fetchRealtimeSearches } from '../../api/statsApi';

export function useRealtimeSearchesQuery({ districtId = null, enabled = true } = {}) {
  return useQuery({
    queryKey: ['stats', 'realtime-searches', districtId ?? 'all'],
    queryFn: () => fetchRealtimeSearches({ districtId, limit: 3 }),
    enabled,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    retry: 0,
  });
}
