/**
 * stampApi.js — 스탬프 퀘스트·여권 API와 응답 정규화
 * - /api/quest/regions, /api/quest/places 조회 후 REGION_ID 등 키 표기를 통일
 * - /api/stamps/me 하위 overview·passport·landmarks·motions 조회
 * - 연출 확인 처리: POST /api/stamps/me/motions/seen, /api/stamps/me/builds/seen
 */
import { api } from './http';
import { unwrapApiList } from '../utils/apiResponse';

function normalizeQuestRegion(region) {
  return {
    ...region,
    regionId: String(region?.regionId ?? region?.REGION_ID ?? '').trim(),
    regionName: String(
      region?.regionName ?? region?.regionNm ?? region?.REGION_NM ?? '',
    ).trim(),
  };
}

function normalizeQuestPlace(place) {
  return {
    ...place,
    placeId: String(place?.placeId ?? place?.PLACE_ID ?? '').trim(),
    regionId: String(place?.regionId ?? place?.REGION_ID ?? '').trim(),
    name: String(place?.name ?? place?.placeName ?? place?.placeNm ?? '').trim(),
    verifyGuide: place?.verifyGuide ?? place?.verifyGuideTxt ?? '',
  };
}

export async function fetchQuestRegions() {
  const { data } = await api.get('/api/quest/regions');
  return unwrapApiList(data)
    .map(normalizeQuestRegion)
    .filter((region) => region.regionId);
}

export async function fetchQuestPlaces({ regionId, contentId } = {}) {
  const { data } = await api.get('/api/quest/places', {
    params: { regionId, contentId },
  });
  return unwrapApiList(data)
    .map(normalizeQuestPlace)
    .filter((place) => place.placeId);
}

export async function fetchStampOverview() {
  const { data } = await api.get('/api/stamps/me/overview');
  return data;
}

export async function fetchPassport() {
  const { data } = await api.get('/api/stamps/me/passport');
  return data;
}

export async function fetchPassportRegion(regionId) {
  const { data } = await api.get(`/api/stamps/me/passport/${encodeURIComponent(regionId)}`);
  return data;
}

export async function fetchLandmarkStates() {
  const { data } = await api.get('/api/stamps/me/landmarks');
  return data;
}

export async function fetchUnseenMotions() {
  const { data } = await api.get('/api/stamps/me/motions');
  return data;
}

export async function markMotionsSeen(stampIds) {
  const { data } = await api.post('/api/stamps/me/motions/seen', { stampIds });
  return data;
}

export async function markBuildSeen(landmarkKeys) {
  const { data } = await api.post('/api/stamps/me/builds/seen', { landmarkKeys });
  return data;
}
