/**
 * statSession.js — 통계 이벤트에 붙일 익명 세션 ID 관리
 * - getStatSessionId(): localStorage에 보관된 ID를 재사용하고, 없거나 길이가 8~64자를 벗어나면 새로 발급
 * - crypto.randomUUID를 우선 쓰고, 미지원·저장 실패 시 타임스탬프+난수 조합으로 대체
 */
const STORAGE_KEY = 'incheon-spotlight-stat-session';

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getStatSessionId() {
  if (typeof window === 'undefined') {
    return createSessionId();
  }
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length >= 8 && existing.length <= 64) {
      return existing;
    }
    const next = createSessionId();
    window.localStorage.setItem(STORAGE_KEY, next);
    return next;
  } catch {
    return createSessionId();
  }
}
