/**
 * useNearbyRestaurantsQuery.js — 명소 주변 맛집 목록 조회 훅
 * - GET /api/kto/attractions/{contentId}/nearby 응답을 정규화한 POI 배열을 limit개까지 반환
 * - queryKey: ['nearbyRestaurants', 언어, contentId, radius, limit, arrange, mapX, mapY], staleTime 10분
 * - radius·limit·arrange(정렬)를 옵션으로 받고, contentId 없으면 비활성 + retryNearby로 1회 재시도
 */
import { useQuery } from '@tanstack/react-query';
import { fetchNearbyRestaurants } from '../../api/kto/nearbyApi';
import {
  NEARBY_RESTAURANT_ARRANGE,
  NEARBY_RESTAURANT_LIMIT,
  NEARBY_RESTAURANT_RADIUS_M,
} from '../../constants/exploreConstants';
import { normalizeNearbyPois } from '../../utils/placeNormalize';
import { useAppLanguage } from '../useAppLanguage';
import { nearbyCoordinates, retryNearby } from '../../utils/nearbyQueryOptions';

async function fetchNearbyRestaurantsFromApi(
  contentId,
  { radius, limit, arrange, mapX, mapY, signal },
) {
  const data = await fetchNearbyRestaurants(contentId, {
    radius,
    limit,
    arrange,
    mapX,
    mapY,
    signal,
  });
  return normalizeNearbyPois(data).slice(0, limit);
}

/**
 * 주변 맛집 훅 — radius / limit / arrange 지원
 *
 * @param {string | null | undefined} contentId
 * @param {{
 *   radius?: number,
 *   limit?: number,
 *   arrange?: string,
 *   enabled?: boolean,
 *   mapX?: string | number,
 *   mapY?: string | number,
 * }} [options]
 */
export function useNearbyRestaurantsQuery(
  contentId,
  {
    radius = NEARBY_RESTAURANT_RADIUS_M,
    limit = NEARBY_RESTAURANT_LIMIT,
    arrange = NEARBY_RESTAURANT_ARRANGE,
    mapX,
    mapY,
    enabled = true,
  } = {},
) {
  const language = useAppLanguage();
  const coords = nearbyCoordinates(mapX, mapY);

  return useQuery({
    queryKey: [
      'nearbyRestaurants',
      language,
      String(contentId ?? ''),
      radius,
      limit,
      arrange,
      coords?.mapX,
      coords?.mapY,
    ],
    queryFn: ({ signal }) =>
      fetchNearbyRestaurantsFromApi(contentId, {
        radius,
        limit,
        arrange,
        ...coords,
        signal,
      }),
    enabled: Boolean(contentId && enabled),
    staleTime: 1000 * 60 * 10,
    retry: retryNearby,
    retryDelay: 500,
  });
}
