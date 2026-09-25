/**
 * TourAPI / 프론트 공통: mapX=경도(lng), mapY=위도(lat)
 * 인천·도서부 대략 범위로 유효성 검사합니다.
 */

const INCHEON_BOUNDS = {
  minLng: 124.0,
  maxLng: 127.5,
  minLat: 36.5,
  maxLat: 38.6,
};

export function hasCoordinate(value) {
  return (
    value !== undefined &&
    value !== null &&
    value !== '' &&
    Number.isFinite(Number(value))
  );
}

function isLikelyLatitude(value) {
  return value >= 33 && value <= 43;
}

function isLikelyLongitude(value) {
  return value >= 124 && value <= 132;
}

/**
 * @returns {{ lng: number, lat: number } | null}
 */
export function parseLonLat(mapX, mapY) {
  if (!hasCoordinate(mapX) || !hasCoordinate(mapY)) return null;

  let lng = Number(mapX);
  let lat = Number(mapY);
  if (Number.isNaN(lng) || Number.isNaN(lat)) return null;

  // 위·경도가 뒤바뀌어 들어온 경우 보정
  if (isLikelyLatitude(lng) && isLikelyLongitude(lat)) {
    const swappedLng = lat;
    const swappedLat = lng;
    lng = swappedLng;
    lat = swappedLat;
  }

  return { lng, lat };
}

export function isIncheonArea(lng, lat) {
  return (
    lng >= INCHEON_BOUNDS.minLng &&
    lng <= INCHEON_BOUNDS.maxLng &&
    lat >= INCHEON_BOUNDS.minLat &&
    lat <= INCHEON_BOUNDS.maxLat
  );
}

/**
 * 상세 API 좌표 vs 목록/진입 state 좌표 중 신뢰할 값을 고릅니다.
 * - 인천 범위 안 좌표 우선
 * - API가 비거나 범위 밖이면 state(목록) 좌표 사용
 * - 둘 다 비정상이면 검증된 큐레이션 좌표 사용
 */
export function resolveBestMapCoords({
  apiMapX,
  apiMapY,
  stateMapX,
  stateMapY,
  fallbackMapX,
  fallbackMapY,
}) {
  const api = parseLonLat(apiMapX, apiMapY);
  const state = parseLonLat(stateMapX, stateMapY);
  const fallback = parseLonLat(fallbackMapX, fallbackMapY);

  const apiOk = api && isIncheonArea(api.lng, api.lat);
  const stateOk = state && isIncheonArea(state.lng, state.lat);
  const fallbackOk = fallback && isIncheonArea(fallback.lng, fallback.lat);

  if (apiOk) {
    return { mapX: api.lng, mapY: api.lat, source: 'api' };
  }
  if (stateOk) {
    return { mapX: state.lng, mapY: state.lat, source: 'state' };
  }
  if (fallbackOk) {
    return { mapX: fallback.lng, mapY: fallback.lat, source: 'curated-fallback' };
  }
  if (api) {
    return { mapX: api.lng, mapY: api.lat, source: 'api-unchecked' };
  }
  if (state) {
    return { mapX: state.lng, mapY: state.lat, source: 'state-unchecked' };
  }
  if (fallback) {
    return {
      mapX: fallback.lng,
      mapY: fallback.lat,
      source: 'curated-fallback-unchecked',
    };
  }

  return { mapX: null, mapY: null, source: 'none' };
}
