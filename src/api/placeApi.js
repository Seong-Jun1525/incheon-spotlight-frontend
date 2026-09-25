/**
 * placeApi.js — KTO 명소 상세 조회
 * - GET /api/kto/attractions/{contentId} 상세(큐레이션 병합 포함) 조회
 * - fetchDistrictLandmarks는 deprecated, 구·군 목록은 ktoOpenApi 사용
 * - 주변 맛집 fetchNearbyRestaurants는 kto/nearbyApi에서 재export
 */
import { api } from './http';
import { loadDistrictLegalCodeMap } from '../services/districtLegalCodeService';
import { unwrapApiData, unwrapApiList } from '../utils/apiResponse';

/**
 * KTO 명소 상세 API
 *
 * GET /api/kto/attractions/{contentId}
 *   - 백엔드에서 TC_CURATED_LANDMARK 큐레이션(recommendReason, heroImageUrl) 병합
 *
 * 주변 맛집/숙박은 src/api/kto/nearbyApi.js 를 사용하세요.
 */

export { fetchNearbyRestaurants } from './kto/nearbyApi';

export async function fetchPlaceDetail(contentId) {
  if (!contentId) return null;

  const { data } = await api.get(`/api/kto/attractions/${contentId}`);
  return unwrapApiData(data);
}

/** @deprecated fetchDistrictAttractions(ktoOpenApi) 사용 권장 */
export async function fetchDistrictLandmarks(districtId) {
  if (!districtId) return [];

  const districtLegalCodeMap = await loadDistrictLegalCodeMap();
  const code = districtLegalCodeMap[districtId];
  if (!code?.sggCd) return [];

  const { data } = await api.get('/api/kto/districts/attractions', {
    params: {
      ctpvCd: code.ctpvCd,
      sggCd: code.sggCd,
    },
  });

  return unwrapApiList(data);
}

export async function fetchPlaceMapDetail(contentId) {
  return fetchPlaceDetail(contentId);
}
