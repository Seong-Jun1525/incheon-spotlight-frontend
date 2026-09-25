/**
 * 외부 지도 서비스 딥링크 URL 생성 (카카오맵, OpenStreetMap)
 */
function hasCoordinate(value) {
  return value !== undefined && value !== null && value !== '';
}

function createSafeName(name) {
  return encodeURIComponent(name || '인천 명소');
}

export function createKakaoMapDirectionUrl({ name, mapX, mapY }) {
  if (!hasCoordinate(mapX) || !hasCoordinate(mapY)) return null;

  return `https://map.kakao.com/link/to/${createSafeName(name)},${mapY},${mapX}`;
}

export function createKakaoMapPlaceUrl({ name, mapX, mapY }) {
  if (!hasCoordinate(mapX) || !hasCoordinate(mapY)) return null;

  return `https://map.kakao.com/link/map/${createSafeName(name)},${mapY},${mapX}`;
}

export function createOpenStreetMapEmbedUrl({ mapX, mapY, delta = 0.012 }) {
  if (!hasCoordinate(mapX) || !hasCoordinate(mapY)) return null;

  const lng = Number(mapX);
  const lat = Number(mapY);

  if (Number.isNaN(lng) || Number.isNaN(lat)) return null;

  const bbox = [
    lng - delta,
    lat - delta,
    lng + delta,
    lat + delta,
  ].join(',');

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}
