/**
 * useDistrictKtoQuery.js — 선택한 구·군의 TourAPI 장소 목록을 조회하는 React Query 훅
 * - 법정동 코드 맵 로딩과 sggCd 매핑이 끝난 뒤에만 요청하도록 제어
 * - 언어·구·군·장소 유형을 쿼리 키로 삼아 결과를 캐싱
 */

import { useQuery } from '@tanstack/react-query';
import { fetchDistrictAttractions } from '../api/ktoOpenApi';
import { getDistrictSggCd } from '../services/districtLegalCodeService';
import { useDistrictLegalCodeMap } from './useDistrictLegalCodeMap';
import { useAppLanguage } from './useAppLanguage';

/**
 * 구·군 선택 시 KTO 장소 목록을 조회하는 공통 React Query 훅.
 *
 * 선행 조건:
 * 1. App.jsx의 CommonCodePrefetch가 법정동 코드 맵을 로드
 * 2. districtId → sggCd 매핑이 완료되어야 enabled=true
 *
 * 실패 시 MainPage에서 mockLandmarks로 폴백합니다.
 *
 * @param {string | null} selectedDistrictId
 * @param {string | null} [contentTypeId] 장소 유형. null이면 백엔드 기본(관광지) 동작
 */
export function useDistrictKtoQuery(selectedDistrictId, contentTypeId = null) {
  const { districtLegalCodeMap, isReady } = useDistrictLegalCodeMap();
  const sggCd = getDistrictSggCd(districtLegalCodeMap, selectedDistrictId);
  const language = useAppLanguage();

  return useQuery({
    queryKey: [
      'ktoDistrictAttractions',
      language,
      selectedDistrictId,
      sggCd,
      contentTypeId ?? 'default',
    ],
    queryFn: () => fetchDistrictAttractions(selectedDistrictId, contentTypeId),
    enabled: isReady && Boolean(selectedDistrictId) && Boolean(sggCd),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });
}
