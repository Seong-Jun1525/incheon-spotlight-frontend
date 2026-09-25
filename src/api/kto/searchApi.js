/**
 * searchApi.js — 키워드 통합 검색 (searchKeyword2 프록시)
 * - GET /api/kto/search 에 keyword·contentTypeId·ctpvCd·sggCd·페이징 파라미터 전달
 * - 키워드가 비었거나 호출이 실패하면 빈 배열 → 화면은 로컬 연관검색으로 폴백
 */
import { api } from '../http';
import { unwrapApiList } from '../../utils/apiResponse';

/**
 * 키워드 통합 검색 API
 *
 * - TourAPI 원본: searchKeyword2
 * - 백엔드 경로: GET /api/kto/search
 * - 폴백: 호출 실패(404 등) 시 빈 배열 → FE가 로컬 연관검색 사용
 *
 * @see docs/03_KTO_API_엔드포인트_명세.md
 */

/**
 * @param {{
 *   keyword: string,
 *   contentTypeId?: string | null,
 *   ctpvCd?: string | null,
 *   sggCd?: string | null,
 *   pageNo?: number,
 *   numOfRows?: number,
 *   arrange?: string,
 * }} params
 * @returns {Promise<object[]>}
 */
export async function fetchKtoSearch(params) {
  const keyword = params?.keyword?.trim();
  if (!keyword) return [];

  try {
    const query = {
      keyword,
      pageNo: params.pageNo ?? 1,
      numOfRows: params.numOfRows ?? 20,
      arrange: params.arrange ?? 'A',
    };

    if (params.contentTypeId) {
      query.contentTypeId = params.contentTypeId;
    }
    if (params.ctpvCd) {
      query.ctpvCd = params.ctpvCd;
    }
    if (params.sggCd) {
      query.sggCd = params.sggCd;
    }

    const { data } = await api.get('/api/kto/search', { params: query });
    return unwrapApiList(data);
  } catch {
    // 백엔드 미구현·네트워크 오류 → 로컬 폴백이 처리
    return [];
  }
}
