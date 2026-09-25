/**
 * http.js — 백엔드 공용 axios 인스턴스와 에러 메시지 변환
 * - api(10초)/uploadApi(60초) 생성: 세션 쿠키와 XSRF-TOKEN 헤더를 함께 전송
 * - 401 핸들러 등록, 쓰기 요청 전 /api/auth/csrf 선조회, 응답 장애 시 백엔드 헬스체크
 * - getApiErrorMessage·isSchemaNotReady로 상태코드별 한국어 안내 문구 제공
 */
import axios from 'axios';
import { apiBaseUrl } from '../config/api';
import i18n from '../i18n/index.js';
import { getLocale } from '../i18n/languages';
import { checkBackendOrSorry } from './backendHealth';

/**
 * Spring Boot 백엔드 HTTP 클라이언트
 *
 * - baseURL: VITE_API_BASE_URL (기본값: 현재 사이트와 같은 origin)
 * - 세션 쿠키를 사용하므로 인증 토큰을 localStorage에 두지 않습니다.
 * - 한국관광공사 OpenAPI 키는 백엔드에서만 관리합니다.
 */
export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

export const uploadApi = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60000,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

function attachUnauthorized(client) {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isCancel(error)) return Promise.reject(error);
      const skip = error.config?.skipAuthRedirect;
      if (error.response?.status === 401 && !skip && typeof onUnauthorized === 'function') {
        onUnauthorized(error);
      }
      if (!error.response && !error.config?.skipBackendCheck) {
        void checkBackendOrSorry();
      } else if (
        !error.config?.skipBackendCheck &&
        (error.response?.status === 502 || error.response?.status === 504)
      ) {
        void checkBackendOrSorry();
      }
      return Promise.reject(error);
    },
  );
}

function attachLanguage(client) {
  client.interceptors.request.use((config) => {
    config.headers['Accept-Language'] = getLocale(i18n.resolvedLanguage);
    return config;
  });
}

attachLanguage(api);
attachLanguage(uploadApi);
attachUnauthorized(api);
attachUnauthorized(uploadApi);
attachCsrf(api);
attachCsrf(uploadApi);

function readCookie(name) {
  if (typeof document === 'undefined') return '';
  const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

let csrfInflight = null;

function ensureCsrfCookie() {
  if (readCookie('XSRF-TOKEN')) {
    return Promise.resolve();
  }
  if (!csrfInflight) {
    csrfInflight = api
      .get('/api/auth/csrf', { skipAuthRedirect: true, skipCsrfEnsure: true })
      .catch(() => {})
      .finally(() => {
        csrfInflight = null;
      });
  }
  return csrfInflight;
}

function attachCsrf(client) {
  client.interceptors.request.use(async (config) => {
    const method = String(config.method || 'get').toUpperCase();
    if (!config.skipCsrfEnsure && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      await ensureCsrfCookie();
    }
    return config;
  });
}

export function getApiErrorMessage(error, fallback = '요청을 처리하지 못했습니다.') {
  const status = error?.response?.status;
  const data = error?.response?.data;
  if (data?.message) {
    return data.message;
  }
  if (status === 401) {
    return '로그인이 필요합니다. 세션이 만료되었다면 다시 로그인해 주세요.';
  }
  if (status === 403) {
    return '이 작업을 할 권한이 없습니다.';
  }
  if (status === 413) {
    return '사진 용량이 너무 큽니다. 파일당 5MB 이하로 올려 주세요.';
  }
  if (status === 429) {
    return data?.message || '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (!error?.response) {
    return '네트워크 연결을 확인해 주세요.';
  }
  return fallback;
}

export function isSchemaNotReady(error) {
  return error?.response?.data?.error === 'SCHEMA_NOT_READY';
}
