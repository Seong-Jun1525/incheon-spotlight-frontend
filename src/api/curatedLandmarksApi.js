/**
 * curatedLandmarksApi.js — 큐레이션 명소(TC_CURATED_LANDMARK) 조회
 * - GET /api/curated-landmarks?districtId= 구·군별 전체 목록
 * - GET /api/curated-landmarks/scene 3D 씬에 표시할 명소만 조회
 * - GET /api/curated-landmarks/{contentId} 단건 조회, 404는 null로 처리
 */
import { api } from './http';
import { unwrapApiData, unwrapApiList } from '../utils/apiResponse';

/**
 * TC_CURATED_LANDMARK 큐레이션 API 클라이언트.
 *
 * TourAPI 위에 얹는 대표 명소 메타·3D 설정·대표 이미지를 조회합니다.
 *
 * GET /api/curated-landmarks?districtId={districtId}
 * GET /api/curated-landmarks/scene?districtId={districtId}
 * GET /api/curated-landmarks/{contentId}
 */

/** 구·군별 큐레이션 명소 전체 목록 */
export async function fetchCuratedLandmarks(districtId) {
  if (!districtId) return [];

  const { data } = await api.get('/api/curated-landmarks', {
    params: { districtId },
  });

  return unwrapApiList(data);
}

/** 구·군별 3D 씬 표시 명소만 조회 */
export async function fetchSceneLandmarks(districtId) {
  if (!districtId) return [];

  const { data } = await api.get('/api/curated-landmarks/scene', {
    params: { districtId },
  });

  return unwrapApiList(data);
}

/** contentId 단건 큐레이션 조회 */
export async function fetchCuratedLandmarkByContentId(contentId) {
  if (!contentId) return null;

  try {
    const { data } = await api.get(`/api/curated-landmarks/${contentId}`);
    return unwrapApiData(data);
  } catch (error) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}
