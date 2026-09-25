/**
 * mapNavigation.js — Cesium 지도 상세 화면으로 넘길 location.state 생성
 * - toMapPageState(place, overrides): 화면마다 다른 좌표 키(mapx·lng·longitude 등)를 mapX=경도, mapY=위도로 통일
 * - 제목·이미지·주소·소개·districtId도 별칭 필드 중 먼저 존재하는 값으로 채운다
 */
import { parseLonLat } from './mapCoords.js';

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

/**
 * Cesium 상세 화면으로 이동할 때 사용하는 공통 location.state.
 * 각 화면의 서로 다른 좌표 키를 mapX=경도, mapY=위도로 정규화합니다.
 */
export function toMapPageState(place, overrides = {}) {
  const coords = parseLonLat(
    firstPresent(place?.mapX, place?.mapx, place?.lng, place?.longitude),
    firstPresent(place?.mapY, place?.mapy, place?.lat, place?.latitude),
  );

  return {
    mapX: coords?.lng ?? null,
    mapY: coords?.lat ?? null,
    title: firstPresent(place?.title, place?.name, place?.placeName) ?? '',
    imageUrl: firstPresent(place?.imageUrl, place?.heroImageUrl) ?? '',
    heroImageFileId: place?.heroImageFileId ?? null,
    address: place?.address ?? '',
    overview:
      firstPresent(place?.overview, place?.shortDescription, place?.intro) ?? '',
    recommendReason: place?.recommendReason ?? '',
    districtId: firstPresent(place?.districtId, place?.regionId) ?? null,
    ...overrides,
  };
}
