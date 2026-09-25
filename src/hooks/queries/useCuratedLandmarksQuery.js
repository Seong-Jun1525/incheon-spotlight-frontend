/**
 * useCuratedLandmarksQuery.js — 큐레이션 명소(TC_CURATED_LANDMARK) 조회 훅 모음
 * - useCuratedLandmarksQuery: 구·군 전체 큐레이션, useSceneLandmarksQuery: 3D 씬에 세울 명소만
 * - useCuratedLandmarkDetailQuery: contentId 단건(상세 패널의 추천 문구·대표 이미지 보강)
 * - 세 훅 모두 staleTime 10분 / gcTime 30분 / 재시도 1회, 키(districtId·contentId)가 없으면 비활성
 */
import { useQuery } from '@tanstack/react-query';
import {
  fetchCuratedLandmarkByContentId,
  fetchCuratedLandmarks,
  fetchSceneLandmarks,
} from '../../api/curatedLandmarksApi';

/**
 * 구·군별 큐레이션 명소 React Query 훅.
 * TC_CURATED_LANDMARK 테이블 데이터를 조회합니다.
 */
export function useCuratedLandmarksQuery(districtId) {
  return useQuery({
    queryKey: ['curatedLandmarks', districtId],
    queryFn: () => fetchCuratedLandmarks(districtId),
    enabled: Boolean(districtId),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });
}

/**
 * 구·군별 3D 씬 명소 React Query 훅.
 * IS_SCENE_LANDMARK = 'Y' 인 큐레이션만 조회합니다.
 */
export function useSceneLandmarksQuery(districtId) {
  return useQuery({
    queryKey: ['sceneLandmarks', districtId],
    queryFn: () => fetchSceneLandmarks(districtId),
    enabled: Boolean(districtId),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });
}

/**
 * contentId 단건 큐레이션 React Query 훅.
 * 상세 패널에서 추천 문구·대표 이미지 보강에 사용합니다.
 */
export function useCuratedLandmarkDetailQuery(contentId) {
  return useQuery({
    queryKey: ['curatedLandmarkDetail', contentId],
    queryFn: () => fetchCuratedLandmarkByContentId(contentId),
    enabled: Boolean(contentId),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });
}
