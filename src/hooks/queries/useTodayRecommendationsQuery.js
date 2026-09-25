/**
 * useTodayRecommendationsQuery.js — 오늘의 Spotlight 추천 장소 조회 훅
 * - fetchTodayRecommendations 호출, queryKey: ['recommendations', 'today']
 * - 서버가 날짜 단위로 캐시하므로 staleTime 30분 / gcTime 60분, 재시도 없이 실패를 흘려보냄
 */
import { useQuery } from '@tanstack/react-query';
import { fetchTodayRecommendations } from '../../api/recommendationApi';

/**
 * 오늘의 Spotlight 추천. 실패해도 메인 3D 탐색을 막지 않습니다.
 * 서버가 날짜 단위로 캐시하므로 프론트는 길게 stale 처리합니다.
 */
export function useTodayRecommendationsQuery() {
  return useQuery({
    queryKey: ['recommendations', 'today'],
    queryFn: fetchTodayRecommendations,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 0,
  });
}
