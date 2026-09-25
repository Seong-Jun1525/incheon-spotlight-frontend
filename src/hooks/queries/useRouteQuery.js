/**
 * useRouteQuery.js — 길찾기 경로 조회 훅 모음
 * - useRouteQuery: 출발지·도착지 2지점 경로를 fetchRoute로 조회(queryKey에 이동수단·좌표·예측시각 포함, staleTime 3분)
 * - useCourseRouteQuery: 경유지 2개 이상인 코스 경로를 fetchCourseRoute로 조회(최적화 옵션 지원, staleTime 10분)
 * - 좌표·이름 기반 키를 만들어 캐싱하고, 좌표가 부족하면 비활성 + 재시도 없음
 */
import { useQuery } from '@tanstack/react-query';
import { fetchCourseRoute, fetchRoute } from '../../api/routeApi';

function coordinateKey(place) {
  if (!place) return null;
  return [place.mapX ?? place.lng, place.mapY ?? place.lat, place.title ?? place.name];
}

export function useRouteQuery({
  origin,
  destination,
  mode = 'PEDESTRIAN',
  predictionType,
  predictionTime,
  enabled = true,
}) {
  return useQuery({
    queryKey: [
      'route',
      mode,
      coordinateKey(origin),
      coordinateKey(destination),
      predictionType || null,
      predictionTime || null,
    ],
    queryFn: () =>
      fetchRoute({
        origin,
        destination,
        mode,
        originName: origin?.title || origin?.name || '출발지',
        destinationName: destination?.title || destination?.name || '도착지',
        predictionType,
        predictionTime,
      }),
    enabled: enabled && Boolean(origin && destination),
    staleTime: 1000 * 60 * 3,
    retry: 0,
  });
}

export function useCourseRouteQuery({
  waypoints,
  mode = 'PEDESTRIAN',
  optimize = false,
  enabled = true,
}) {
  const key = (waypoints ?? []).map(coordinateKey);

  return useQuery({
    queryKey: ['courseRoute', mode, optimize, key],
    queryFn: () => fetchCourseRoute({ waypoints, mode, optimize }),
    enabled: enabled && (waypoints?.length ?? 0) >= 2,
    staleTime: 1000 * 60 * 10,
    retry: 0,
  });
}
