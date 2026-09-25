/**
 * nearbyApi.js — 명소 주변 POI(맛집·숙박 등) 조회
 * - GET /api/kto/attractions/{contentId}/nearby (locationBasedList2 프록시, 20초 타임아웃)
 * - 맛집 요청이 404·405면 /nearby-restaurants 경로로 한 번 더 폴백
 * - fetchNearbyLodgings는 contentTypeId=숙박으로 fetchNearbyPois 재사용
 */
import { api } from '../http';
import { unwrapApiList } from '../../utils/apiResponse';
import { KTO_CONTENT_TYPE } from '../../constants/ktoContentTypes';

/**
 * 주변 POI API (locationBasedList2 프록시)
 *
 * - TourAPI 원본: locationBasedList2
 * - 백엔드 경로:
 *   - GET /api/kto/attractions/{contentId}/nearby  (일반)
 *   - GET /api/kto/attractions/{contentId}/nearby-restaurants  (맛집 하위호환)
 * - 조회 실패는 호출자에게 전달하며 실제 빈 결과와 구분합니다.
 *
 * @see docs/03_KTO_API_엔드포인트_명세.md
 */

/**
 * 주변 콘텐츠 조회 (숙박·음식·관광 등)
 *
 * @param {string} contentId
 * @param {{
 *   contentTypeId?: string,
 *   radius?: number,
 *   arrange?: string,
 *   limit?: number,
 *   mapX?: string | number,
 *   mapY?: string | number,
 * }} [options]
 * @returns {Promise<object[]>}
 */
export async function fetchNearbyPois(
  contentId,
  {
    contentTypeId = KTO_CONTENT_TYPE.FOOD,
    radius = 1500,
    arrange = 'E',
    limit = 10,
    mapX,
    mapY,
    signal,
  } = {},
) {
  if (!contentId) return [];

  try {
    const { data } = await api.get(`/api/kto/attractions/${contentId}/nearby`, {
      params: { contentTypeId, radius, arrange, limit, mapX, mapY },
      signal,
      timeout: 20_000,
    });
    return unwrapApiList(data);
  } catch (error) {
    // nearby 미구현 시 맛집 전용 URL로 한 번 더 시도 (contentTypeId=39만)
    if (String(contentTypeId) === KTO_CONTENT_TYPE.FOOD && [404, 405].includes(error?.response?.status)) {
      return fetchNearbyRestaurants(contentId, {
        radius,
        limit,
        arrange,
        mapX,
        mapY,
        signal,
      });
    }
    throw error;
  }
}

/**
 * 주변 맛집 (기존 URL 유지 + 쿼리 파라미터)
 *
 * @param {string} contentId
 * @param {{ radius?: number, limit?: number, arrange?: string, mapX?: string | number, mapY?: string | number }} [options]
 */
export async function fetchNearbyRestaurants(
  contentId,
  { radius = 1500, limit = 10, arrange = 'E', mapX, mapY, signal } = {},
) {
  if (!contentId) return [];

  const { data } = await api.get(
    `/api/kto/attractions/${contentId}/nearby-restaurants`,
    { params: { radius, limit, arrange, mapX, mapY }, signal, timeout: 20_000 },
  );
  return unwrapApiList(data);
}

/**
 * 주변 숙박 (contentTypeId=32)
 *
 * @param {string} contentId
 * @param {{ radius?: number, limit?: number, arrange?: string, mapX?: string | number, mapY?: string | number }} [options]
 */
export async function fetchNearbyLodgings(
  contentId,
  { radius = 2000, limit = 5, arrange = 'E', mapX, mapY, signal } = {},
) {
  return fetchNearbyPois(contentId, {
    contentTypeId: KTO_CONTENT_TYPE.LODGING,
    radius,
    limit,
    arrange,
    mapX,
    mapY,
    signal,
  });
}
