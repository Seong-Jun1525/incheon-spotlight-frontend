/**
 * tourApi.js — 구·군 장소 조회의 하위호환 래퍼 (deprecated)
 * - fetchDistrictPlaces(districtId)를 ktoOpenApi의 fetchDistrictAttractions로 위임
 * - 기존 import 경로 유지 목적이며 신규 코드는 ktoOpenApi를 직접 사용
 */
import { fetchDistrictAttractions } from './ktoOpenApi';

// @deprecated KTO OpenAPI 백엔드 연동은 ktoOpenApi.js의 fetchDistrictAttractions를 사용합니다.
// 기존 import 호환만 유지하며, 새 코드는 이 파일을 사용하지 않습니다.
export async function fetchDistrictPlaces(districtId) {
  return fetchDistrictAttractions(districtId);
}
