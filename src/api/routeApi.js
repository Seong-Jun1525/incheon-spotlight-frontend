/**
 * routeApi.js — 길찾기·코스 경로 조회 API
 * - GET /api/routes: 출발·도착 좌표(mapX·mapY 또는 lng·lat)와 이동수단·예측시각 전달
 * - POST /api/routes/course: 경유지를 정규화해 전송, 2곳 미만이면 에러
 * - 좌표가 유효하지 않으면 요청 전에 한국어 메시지로 차단
 */
import { api } from './http';
import { finiteCoordinate } from '../utils/routeCoordinates';

function toFiniteCoordinate(value, label) {
  const number = finiteCoordinate(value);
  if (number === null) {
    throw new Error(`${label} 좌표가 올바르지 않습니다.`);
  }
  return number;
}

export async function fetchRoute({
  origin,
  destination,
  mode = 'PEDESTRIAN',
  originName = '출발지',
  destinationName = '도착지',
  predictionType,
  predictionTime,
}) {
  const { data } = await api.get('/api/routes', {
    params: {
      originX: toFiniteCoordinate(origin?.mapX ?? origin?.lng, '출발지 경도'),
      originY: toFiniteCoordinate(origin?.mapY ?? origin?.lat, '출발지 위도'),
      destinationX: toFiniteCoordinate(
        destination?.mapX ?? destination?.lng,
        '도착지 경도',
      ),
      destinationY: toFiniteCoordinate(
        destination?.mapY ?? destination?.lat,
        '도착지 위도',
      ),
      mode,
      originName,
      destinationName,
      ...(predictionTime ? { predictionType, predictionTime } : {}),
    },
  });
  return data;
}

export async function fetchCourseRoute({
  waypoints,
  mode = 'PEDESTRIAN',
  optimize = false,
}) {
  const normalized = (waypoints ?? [])
    .map((waypoint, index) => {
      const lng = finiteCoordinate(waypoint.mapX, waypoint.lng);
      const lat = finiteCoordinate(waypoint.mapY, waypoint.lat);
      if (lng === null || lat === null) return null;
      return {
        lng,
        lat,
        name: waypoint.title || waypoint.name || `${index + 1}번 장소`,
      };
    })
    .filter(Boolean);

  if (normalized.length < 2) {
    throw new Error('코스 경로에는 장소가 두 곳 이상 필요합니다.');
  }

  const { data } = await api.post('/api/routes/course', {
    mode,
    waypoints: normalized,
    optimize,
  });
  return data;
}
