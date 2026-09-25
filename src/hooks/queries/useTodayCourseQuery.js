/**
 * useTodayCourseQuery.js — 메인 하단 '오늘의 추천 코스'(AI 생성) 조회 훅
 * - fetchTodayAiCourse 호출, queryKey: ['ai', 'courses', 'today', 언어]
 * - ready면 staleTime 30분, generating이면 즉시 stale + 4초 간격 폴링
 * - 반환: course 객체(ready일 때만)와 isGenerating 플래그
 */
import { useQuery } from '@tanstack/react-query';
import { fetchTodayAiCourse } from '../../api/aiCourseApi';
import { useAppLanguage } from '../useAppLanguage';

/**
 * 메인 하단 '오늘의 추천 코스'.
 * 생성 중(202)이면 짧게 폴링하고, 홈 첫 페인트는 기다리지 않습니다.
 */
export function useTodayCourseQuery() {
  const language = useAppLanguage();
  const query = useQuery({
    queryKey: ['ai', 'courses', 'today', language],
    queryFn: fetchTodayAiCourse,
    staleTime: (queryState) =>
      queryState.state.data?.status === 'ready' ? 1000 * 60 * 30 : 0,
    gcTime: 1000 * 60 * 60,
    retry: 0,
    refetchInterval: (queryState) =>
      queryState.state.data?.status === 'generating' ? 4000 : false,
  });

  return {
    ...query,
    data: query.data?.status === 'ready' ? query.data.course : null,
    isGenerating: query.data?.status === 'generating',
  };
}
