/**
 * usePlaceDetailQuery.js — contentId 단건 장소 상세 조회 훅
 * - fetchPlaceDetail(contentId)로 상세 패널에 쓰이는 장소 정보를 가져옴
 * - queryKey: ['placeDetail', 언어, contentId], staleTime 10분, 재시도 1회
 * - contentId가 없으면 비활성
 */
import { useQuery } from '@tanstack/react-query';
import { fetchPlaceDetail } from '../../api/placeApi';
import { useAppLanguage } from '../useAppLanguage';

export function usePlaceDetailQuery(contentId) {
  const language = useAppLanguage();
  return useQuery({
    queryKey: ['placeDetail', language, contentId],
    queryFn: () => fetchPlaceDetail(contentId),
    enabled: Boolean(contentId),
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}
