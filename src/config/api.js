/**
 * api.js — 백엔드 API 기본 URL 설정
 * - VITE_API_BASE_URL 환경변수를 apiBaseUrl로 노출 (미설정 시 현재 origin 사용)
 * - apiUrl(path): 선행 슬래시를 보정해 요청 URL 문자열 생성
 */
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}
