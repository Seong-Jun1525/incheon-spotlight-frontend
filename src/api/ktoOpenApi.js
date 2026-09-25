/**
 * ktoOpenApi.js — 구·군별 KTO 장소 목록 조회
 * - districtId를 법정동 코드 맵으로 ctpvCd·sggCd로 변환 후 GET /api/kto/districts/attractions
 * - contentTypeId 옵션으로 관광지·문화시설 등 콘텐츠 유형 필터
 * - 코드 매핑이 없으면 빈 배열, 응답은 unwrapApiList로 배열화
 */
import { api } from './http';
import { loadDistrictLegalCodeMap } from '../services/districtLegalCodeService';
import { unwrapApiList } from '../utils/apiResponse';

/**
 * KTO(한국관광공사) OpenAPI 프록시 — 구·군별 장소 목록
 *
 * GET /api/kto/districts/attractions?ctpvCd={ctpvCd}&sggCd={sggCd}[&contentTypeId={contentTypeId}]
 * - 백엔드에서 TC_CURATED_LANDMARK 큐레이션 필드가 자동 병합됩니다.
 *   (recommendReason, heroImageUrl, isSceneLandmark, renderType 등)
 * - contentTypeId를 넘기지 않으면 백엔드 기본값(관광지)으로 기존과 동일하게 동작합니다.
 *
 * @param {string} districtId
 * @param {string | null} [contentTypeId] KTO_CONTENT_TYPE 값 (예: '14' 문화시설)
 */
export async function fetchDistrictAttractions(districtId, contentTypeId = null) {
  if (!districtId) return [];

  const districtLegalCodeMap = await loadDistrictLegalCodeMap();
  const code = districtLegalCodeMap[districtId];

  if (!code?.sggCd) return [];

  const params = {
    ctpvCd: code.ctpvCd,
    sggCd: code.sggCd,
  };

  if (contentTypeId) {
    params.contentTypeId = contentTypeId;
  }

  const { data } = await api.get('/api/kto/districts/attractions', { params });

  return unwrapApiList(data);
}
