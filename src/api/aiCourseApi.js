/**
 * aiCourseApi.js — AI 추천 코스 생성·조회 API
 * - postAiCourse: runAiJob('courses')로 코스 생성 잡 실행
 * - fetchTodayAiCourse: GET /api/ai/courses/today 를 ready/generating/empty 상태로 변환
 * - getAiCourseErrorMessage: AI_COURSE_NO_PLACES 처리 후 채팅 에러 매핑에 위임
 */
import { api } from './http';
import { runAiJob } from './aiJobApi';
import { getAiChatErrorMessage } from './aiChatApi';
import i18n from '../i18n';

const TODAY_COURSE_TIMEOUT_MS = 15_000;

export async function postAiCourse(body, { signal } = {}) {
  return runAiJob('courses', body, { signal });
}

export async function fetchTodayAiCourse({ signal } = {}) {
  const { data, status } = await api.get('/api/ai/courses/today', {
    timeout: TODAY_COURSE_TIMEOUT_MS,
    signal,
    validateStatus: (value) => value === 200 || value === 202 || value === 204,
  });
  if (status === 202) {
    return { status: 'generating' };
  }
  if (status === 204 || data == null || data === '') {
    return { status: 'empty' };
  }
  return { status: 'ready', course: data };
}

export function getAiCourseErrorMessage(error) {
  const status = error?.response?.status;
  const payload = error?.response?.data;
  const code =
    typeof payload?.error === 'string' ? payload.error.trim() : String(error?.message || '').trim();

  if (status === 422 || code === 'AI_COURSE_NO_PLACES') {
    return i18n.t('ai.error.noPlaces');
  }
  return getAiChatErrorMessage(error);
}
