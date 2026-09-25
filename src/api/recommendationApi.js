/**
 * recommendationApi.js — 오늘의 추천 명소 조회
 * - GET /api/recommendations/today 호출 후 unwrapApiData로 본문만 반환
 * - 날씨·계절·큐레이션 점수 기반 TOP 3와 추천 이유는 백엔드가 계산
 */
import { api } from './http';
import { unwrapApiData } from '../utils/apiResponse';

/**
 * 오늘의 인천 Spotlight 추천 API.
 *
 * GET /api/recommendations/today
 * 백엔드가 날씨·계절·큐레이션 점수를 계산해 TOP 3와 추천 이유를 반환합니다.
 */
export async function fetchTodayRecommendations() {
  const { data } = await api.get('/api/recommendations/today');
  return unwrapApiData(data);
}
