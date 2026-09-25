/**
 * visitApi.js — 방문 인증 공개·내 기록·관리자 API
 * - 공개 조회 /api/visits, 내 인증 /api/visit-verifications 등록·수정·재제출·삭제
 * - 임시 사진 업로드·삭제 /api/visit-photos/temp (업로드는 uploadApi 사용)
 * - 관리자 승인·보완요청·반려 /api/admin/visit-verifications/* 와 AI 재심사 요청
 */
import { api, uploadApi } from './http';

export async function fetchPublicVisits(params) {
  const { data } = await api.get('/api/visits', { params });
  return data;
}

export async function fetchPublicVisit(verifyId) {
  const { data } = await api.get(`/api/visits/${verifyId}`);
  return data;
}

export async function fetchMyVisits(params) {
  const { data } = await api.get('/api/visit-verifications/me', { params });
  return data;
}

export async function fetchMyVisit(verifyId) {
  const { data } = await api.get(`/api/visit-verifications/${verifyId}`);
  return data;
}

export async function createVisit(payload) {
  const { data } = await api.post('/api/visit-verifications', payload);
  return data;
}

export async function updateVisit(verifyId, payload) {
  const { data } = await api.patch(`/api/visit-verifications/${verifyId}`, payload);
  return data;
}

export async function resubmitVisit(verifyId, payload) {
  const { data } = await api.post(`/api/visit-verifications/${verifyId}/resubmit`, payload);
  return data;
}

export async function deleteVisit(verifyId) {
  const { data } = await api.delete(`/api/visit-verifications/${verifyId}`);
  return data;
}

export async function uploadTempPhoto(file, altText) {
  const form = new FormData();
  form.append('file', file);
  if (altText) form.append('altText', altText);
  const { data } = await uploadApi.post('/api/visit-photos/temp', form);
  return data;
}

export async function deleteTempPhoto(photoId) {
  const { data } = await api.delete(`/api/visit-photos/temp/${photoId}`);
  return data;
}

export async function fetchAdminVisits(params) {
  const { data } = await api.get('/api/admin/visit-verifications', { params });
  return data;
}

export async function fetchAdminVisit(verifyId) {
  const { data } = await api.get(`/api/admin/visit-verifications/${verifyId}`);
  return data;
}

export async function approveVisit(verifyId, expectedReviewVer) {
  const { data } = await api.post(`/api/admin/visit-verifications/${verifyId}/approve`, {
    expectedReviewVer,
  });
  return data;
}

export async function requestVisitRevision(verifyId, reason, expectedReviewVer) {
  const { data } = await api.post(`/api/admin/visit-verifications/${verifyId}/revision`, {
    reason,
    expectedReviewVer,
  });
  return data;
}

export async function rejectVisit(verifyId, reason, expectedReviewVer) {
  const { data } = await api.post(`/api/admin/visit-verifications/${verifyId}/reject`, {
    reason,
    expectedReviewVer,
  });
  return data;
}

export async function retryVisitAiReview(verifyId) {
  const { data } = await api.post(`/api/visit-verifications/${verifyId}/ai-review`);
  return data;
}
