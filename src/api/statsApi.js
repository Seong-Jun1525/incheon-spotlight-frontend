/**
 * statsApi.js — 사용자 행동 통계 수집·조회 API
 * - POST /api/stats/events 로 이벤트 전송 (4초 타임아웃)
 * - GET /api/stats/realtime-searches 로 구·군별 실시간 인기 검색어 조회
 */
import { api } from './http';
import { unwrapApiData } from '../utils/apiResponse';

export async function postStatEvent(event) {
  await api.post('/api/stats/events', event, { timeout: 4000 });
}

export async function fetchRealtimeSearches({ districtId, limit = 3 } = {}) {
  const { data } = await api.get('/api/stats/realtime-searches', {
    params: {
      districtId: districtId || undefined,
      limit,
    },
  });
  return unwrapApiData(data) ?? data;
}
