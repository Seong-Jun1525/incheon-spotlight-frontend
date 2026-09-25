/**
 * useDistrictLandmarksQuery.js — 구·군별 명소 목록 조회 훅
 * - districtId를 법정동 시군구코드(sggCd)로 변환한 뒤 fetchDistrictLandmarks 호출
 * - queryKey: ['districtLandmarks', 언어, sggCd], staleTime 10분, 재시도 1회
 * - 법정코드 맵 로딩 전이거나 sggCd를 못 찾으면 비활성
 */
import { useQuery } from '@tanstack/react-query';
import { fetchDistrictLandmarks } from '../../api/placeApi';
import { getDistrictSggCd } from '../../services/districtLegalCodeService';
import { useDistrictLegalCodeMap } from '../useDistrictLegalCodeMap';
import { useAppLanguage } from '../useAppLanguage';

export function useDistrictLandmarksQuery(districtId) {
  const { districtLegalCodeMap, isReady } = useDistrictLegalCodeMap();
  const sggCd = getDistrictSggCd(districtLegalCodeMap, districtId);
  const language = useAppLanguage();

  return useQuery({
    queryKey: ['districtLandmarks', language, sggCd],
    queryFn: () => fetchDistrictLandmarks(districtId),
    enabled: isReady && Boolean(districtId) && Boolean(sggCd),
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}
