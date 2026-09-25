/**
 * courseStopSource.js — 코스 정류장의 상세 응답이 실제 인천 장소인지 검증
 * - resolveCourseStopSource(stop, detail): 주소·좌표가 인천이면 detail을 채택, 아니면 stop 좌표로 폴백
 * - 재사용된 외부 contentId 때문에 타 지역 장소가 코스에 섞이는 것을 막는다
 */
import { isIncheonAddress } from './incheonAddress.js';
import { isIncheonArea, parseLonLat } from './mapCoords.js';

function incheonCoords(place) {
  const coords = parseLonLat(
    place?.mapX ?? place?.mapx ?? place?.lng,
    place?.mapY ?? place?.mapy ?? place?.lat,
  );
  return coords && isIncheonArea(coords.lng, coords.lat) ? coords : null;
}

/** A reused external ID must not replace an Incheon course stop with another region. */
export function resolveCourseStopSource(stop, detail) {
  const address = [detail?.address, detail?.addr1, detail?.addr2]
    .filter(Boolean).join(' ').trim();
  const apiCoords = incheonCoords(detail);
  const trusted = Boolean(apiCoords && (!address || isIncheonAddress(address)));
  const coords = trusted ? apiCoords : incheonCoords(stop);
  return {
    detail: trusted ? detail : null,
    mapX: coords?.lng ?? null,
    mapY: coords?.lat ?? null,
  };
}
