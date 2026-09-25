/**
 * nearbyQueryOptions.js — 주변 장소 조회 쿼리의 캐시 키와 재시도 규칙
 * - nearbyCoordinates(mapX, mapY): 좌표를 숫자로 정규화하고 인천 범위 밖이면 null (상세·지도 화면이 같은 캐시를 쓰도록 통일)
 * - retryNearby(failureCount, error): 요청 취소는 재시도하지 않고 408·5xx·네트워크 오류만 1회 재시도
 */
import { isIncheonArea, parseLonLat } from './mapCoords.js';

// Detail panels and map pages must share the same cache entry, including when
// one source supplies coordinate strings and the other supplies numbers.
export function nearbyCoordinates(mapX, mapY) {
  const coords = parseLonLat(mapX, mapY);
  if (!coords || !isIncheonArea(coords.lng, coords.lat)) return null;
  return { mapX: coords.lng, mapY: coords.lat };
}

export function retryNearby(failureCount, error) {
  if (error?.code === 'ERR_CANCELED' || failureCount >= 1) return false;
  const status = error?.response?.status;
  return !status || status === 408 || status >= 500;
}
