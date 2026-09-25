/**
 * backendHealth.js — 백엔드 가용성 점검과 점검 페이지 이동
 * - GET /api/health 를 4초 타임아웃으로 호출해 up/down/unknown 판정
 * - DOWN이 2회 연속 확인되면 /sorry.html 로 이동
 * - 오프라인·타임아웃은 unknown으로 처리해 오탐 이동을 방지
 */
import { apiUrl } from '../config/api';

const HEALTH_TIMEOUT_MS = 4000;
const SERVER_UNAVAILABLE_STATUS = new Set([502, 503, 504]);
const REQUIRED_DOWN_CONFIRMATIONS = 2;

export const BACKEND_HEALTH = Object.freeze({
  UP: 'up',
  DOWN: 'down',
  UNKNOWN: 'unknown',
});

let healthCheckInflight = null;
let consecutiveDownChecks = 0;

export async function fetchBackendHealth({ timeoutMs = HEALTH_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(apiUrl('/api/health'), {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      return SERVER_UNAVAILABLE_STATUS.has(response.status)
        ? BACKEND_HEALTH.DOWN
        : BACKEND_HEALTH.UNKNOWN;
    }
    const body = await response.json().catch(() => null);
    if (body && typeof body.status === 'string') {
      const status = body.status.toUpperCase();
      if (status === 'UP') return BACKEND_HEALTH.UP;
      if (status === 'DOWN') return BACKEND_HEALTH.DOWN;
    }
    return BACKEND_HEALTH.UNKNOWN;
  } catch {
    // 모바일 앱 복귀 직후의 무선망 재연결, 오프라인, DNS 지연, 요청
    // 타임아웃은 서버 장애와 구분할 수 없다. 이 경우 현재 화면을 유지한다.
    return BACKEND_HEALTH.UNKNOWN;
  } finally {
    window.clearTimeout(timer);
  }
}

export function redirectToSorry() {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.endsWith('/sorry.html')) return;
  window.location.replace('/sorry.html');
}

export function checkBackendOrSorry({
  requiredDownConfirmations = REQUIRED_DOWN_CONFIRMATIONS,
} = {}) {
  if (healthCheckInflight) return healthCheckInflight;
  healthCheckInflight = fetchBackendHealth()
    .then((status) => {
      if (status === BACKEND_HEALTH.DOWN) {
        consecutiveDownChecks += 1;
        if (consecutiveDownChecks >= requiredDownConfirmations) {
          redirectToSorry();
        }
      } else {
        consecutiveDownChecks = 0;
      }
      return status;
    })
    .finally(() => {
      healthCheckInflight = null;
    });
  return healthCheckInflight;
}
