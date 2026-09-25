/**
 * useNearbyLodgingsQuery.js — 명소 주변 숙박(TourAPI contentTypeId=32) 목록 조회 훅
 * - GET /api/kto/attractions/{contentId}/nearby 응답을 normalizeNearbyPois로 정규화해 limit개까지 반환
 * - queryKey: ['nearbyLodgings', 언어, contentId, radius, limit, mapX, mapY], staleTime 10분
 * - contentId·enabled가 없으면 비활성, 일시 실패는 retryNearby로 한 번만 재시도
 */
import { useQuery } from '@tanstack/react-query';
import { fetchNearbyLodgings } from '../../api/kto/nearbyApi';
import {
  NEARBY_LODGING_LIMIT,
  NEARBY_LODGING_RADIUS_M,
} from '../../constants/exploreConstants';
import { normalizeNearbyPois } from '../../utils/placeNormalize';
import { useAppLanguage } from '../useAppLanguage';
import { nearbyCoordinates, retryNearby } from '../../utils/nearbyQueryOptions';

/**
 * 주변 숙박 (contentTypeId=32, locationBasedList2)
 *
 * GET /api/kto/attractions/{contentId}/nearby?contentTypeId=32
 * 일시적인 조회 실패는 한 번 재시도하고 오류 상태로 표시합니다.
 *
 * @param {string | null | undefined} contentId
 * @param {{ radius?: number, limit?: number, mapX?: string | number, mapY?: string | number }} [options]
 */
export function useNearbyLodgingsQuery(
  contentId,
  {
    radius = NEARBY_LODGING_RADIUS_M,
    limit = NEARBY_LODGING_LIMIT,
    mapX,
    mapY,
    enabled = true,
  } = {},
) {
  const language = useAppLanguage();
  const coords = nearbyCoordinates(mapX, mapY);
  return useQuery({
    queryKey: [
      'nearbyLodgings',
      language,
      String(contentId ?? ''),
      radius,
      limit,
      coords?.mapX,
      coords?.mapY,
    ],
    queryFn: async ({ signal }) => {
      const raw = await fetchNearbyLodgings(contentId, {
        radius,
        limit,
        ...coords,
        signal,
      });
      return normalizeNearbyPois(raw).slice(0, limit);
    },
    enabled: Boolean(contentId && enabled),
    staleTime: 1000 * 60 * 10,
    retry: retryNearby,
    retryDelay: 500,
  });
}
