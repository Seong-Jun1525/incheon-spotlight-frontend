/**
 * imagesApi.js — 명소 이미지 갤러리 조회 (detailImage2 프록시)
 * - GET /api/kto/attractions/{contentId}/images 로 추가 이미지 목록 조회
 * - contentId 누락이나 호출 실패 시 빈 배열 → 화면은 대표 이미지만 표시
 */
import { api } from '../http';
import { unwrapApiList } from '../../utils/apiResponse';

/**
 * 명소 이미지 갤러리 API
 *
 * - TourAPI 원본: detailImage2
 * - 백엔드 경로: GET /api/kto/attractions/{contentId}/images
 * - 폴백: 실패 시 빈 배열 → FE가 hero imageUrl 단일 표시
 *
 * @see docs/03_KTO_API_엔드포인트_명세.md
 */

/**
 * @param {string} contentId
 * @returns {Promise<object[]>}
 */
export async function fetchAttractionImages(contentId) {
  if (!contentId) return [];

  try {
    const { data } = await api.get(`/api/kto/attractions/${contentId}/images`);
    return unwrapApiList(data);
  } catch {
    return [];
  }
}
