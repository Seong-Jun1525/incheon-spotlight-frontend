/**
 * 주변 장소 거리 표시 — m 단위, 소수점 없음.
 * TourAPI dist 값이 실수로 올 수 있어 카드마다 따로 자르지 않고 여기서만 맞춥니다.
 */
export function formatNearbyDistanceM(dist) {
  if (dist === null || dist === undefined || dist === '') return null;
  const value = Number(dist);
  if (!Number.isFinite(value) || value < 0) return null;
  return `${Math.round(value)}m`;
}
