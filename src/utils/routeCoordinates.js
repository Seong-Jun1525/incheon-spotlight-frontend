/** TourAPI/백엔드 좌표를 경로 계산에 쓸 수 있는 숫자로만 고릅니다. */
export function finiteCoordinate(...values) {
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue;
    const number = Number(value);
    if (!Number.isFinite(number)) continue;
    if (number === 0) continue;
    return number;
  }
  return null;
}

export function hasRouteCoordinates(place) {
  return (
    finiteCoordinate(place?.mapX, place?.lng, place?.mapx) !== null &&
    finiteCoordinate(place?.mapY, place?.lat, place?.mapy) !== null
  );
}

export function toRouteWaypoint(place, index = 0) {
  const lng = finiteCoordinate(place?.mapX, place?.lng, place?.mapx);
  const lat = finiteCoordinate(place?.mapY, place?.lat, place?.mapy);
  if (lng === null || lat === null) return null;
  return {
    ...place,
    mapX: lng,
    mapY: lat,
    lng,
    lat,
    name: place?.title || place?.name || `${index + 1}번 장소`,
    title: place?.title || place?.name || `${index + 1}번 장소`,
  };
}
