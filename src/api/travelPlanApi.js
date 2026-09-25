/**
 * travelPlanApi.js — 여행 계획 템플릿·계획·생성 잡 API
 * - /api/travel-plan-templates, /api/travel-plans, /api/travel-plan-jobs 조회 및 쓰기
 * - 쓰기 요청은 fetchCsrf() 선행 후 180초 타임아웃으로 전송
 * - downloadTravelExcel: xlsx 응답 검증 후 Content-Disposition 파일명으로 다운로드
 */
import { api } from './http';
import { fetchCsrf } from './authApi';

const data = (response) => response.data;
async function write(method, url, payload) {
  await fetchCsrf();
  return api.request({ method, url, data: payload, withXSRFToken: true, timeout: 180000 }).then(data);
}
export const getTravelTemplates = () => api.get('/api/travel-plan-templates').then(data);
export const getTravelPlans = (page = 0, period = 'all') => api.get('/api/travel-plans', { params: { page, period } }).then(data);
export const getTravelPlan = (id, revision) => api.get(`/api/travel-plans/${id}`, { params: { revision } }).then(data);
export const getTravelJobs = () => api.get('/api/travel-plan-jobs').then(data);
export const getTravelJob = (id) => api.get(`/api/travel-plan-jobs/${id}`).then(data);
export const startTravelJob = (input, requestKey) => write('POST', '/api/travel-plan-jobs', { input, requestKey });
export const cancelTravelJob = (id) => write('POST', `/api/travel-plan-jobs/${id}/cancel`);
export const patchTravelPlan = (id, payload) => write('PATCH', `/api/travel-plans/${id}`, payload);
export const changeTravelDates = (id, payload) => write('PATCH', `/api/travel-plans/${id}/dates`, payload);
export const replanTravelPlan = (id, scope, requestKey) => write('POST', `/api/travel-plans/${id}/replan`, { scope, requestKey });
export const deleteTravelPlan = (id, revision) => write('DELETE', `/api/travel-plans/${id}?revision=${revision}`);
export const searchTravelPlaces = (keyword, districtId, mode = 'PLACE', signal) => api.get('/api/travel-plan-places', { params: { keyword, districtId, mode }, signal, timeout: 15000 }).then(data);

export async function downloadTravelExcel(id, revision) {
  let response;
  try {
    response = await api.get(`/api/travel-plans/${id}/excel`, { params: { revision }, responseType: 'blob', timeout: 60000 });
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try { error.response.data = JSON.parse(await error.response.data.text()); } catch { /* Non-JSON errors retain status. */ }
    }
    throw error;
  }
  if (!response.headers['content-type']?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
    throw new Error('엑셀 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.');
  }
  const disposition = response.headers['content-disposition'] || '';
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  let filename = `인천_여행계획_v${revision}.xlsx`;
  if (encoded) { try { filename = decodeURIComponent(encoded); } catch { /* Use safe fallback. */ } }
  filename = filename.replace(/[\\/:*?"<>|\r\n]/g, '_');
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
