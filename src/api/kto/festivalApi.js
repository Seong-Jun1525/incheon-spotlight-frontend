/**
 * festivalApi.js — 인천 축제·행사 목록 조회 (searchFestival2 프록시)
 * - GET /api/kto/festivals (withinDays 기본 30, numOfRows 기본 100, sggCd 선택)
 * - 실패 시 빈 배열을 반환해 축제 UI만 숨기고 나머지 화면은 유지
 */
import { api } from '../http';
import { unwrapApiList } from '../../utils/apiResponse';

/**
 * 인천 축제·행사 조회 API
 *
 * - TourAPI 원본: searchFestival2
 * - 백엔드 경로: GET /api/kto/festivals
 * - 백엔드가 장기 진행 행사와 지정 기한 안에 시작하는 행사를 함께 반환합니다.
 * - 실패 시 빈 배열 → 축제 UI만 숨겨지고 기존 탐색 기능은 그대로 동작합니다.
 */

/**
 * @param {{ sggCd?: string | null, withinDays?: number, numOfRows?: number }} [params]
 * @returns {Promise<object[]>}
 */
export async function fetchIncheonFestivals(params = {}) {
  try {
    const query = {
      withinDays: params.withinDays ?? 30,
      numOfRows: params.numOfRows ?? 100,
    };

    if (params.sggCd) {
      query.sggCd = params.sggCd;
    }

    const { data } = await api.get('/api/kto/festivals', { params: query });
    return unwrapApiList(data);
  } catch {
    return [];
  }
}
