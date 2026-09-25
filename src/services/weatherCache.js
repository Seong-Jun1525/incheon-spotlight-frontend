/**
 * weatherCache.js — 날씨 응답 sessionStorage 캐시
 * - 'incheon-spotlight:weather:{nx},{ny}' 키에 만료시각과 함께 저장
 * - TTL 6시간, 만료된 항목은 삭제하고 null 반환
 * - sessionStorage를 쓸 수 없는 환경에서는 조용히 무시
 */
const CACHE_KEY_PREFIX = 'incheon-spotlight:weather:';
/** 하루 기준 6시간마다 KMA 재조회 */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function cacheKey(nx, ny) {
  return `${CACHE_KEY_PREFIX}${nx},${ny}`;
}

export function readWeatherCache(nx, ny) {
  try {
    const raw = sessionStorage.getItem(cacheKey(nx, ny));
    if (!raw) {
      return null;
    }
    const { expiresAt, data } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      sessionStorage.removeItem(cacheKey(nx, ny));
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function writeWeatherCache(nx, ny, data) {
  try {
    sessionStorage.setItem(
      cacheKey(nx, ny),
      JSON.stringify({ expiresAt: Date.now() + CACHE_TTL_MS, data }),
    );
  } catch {
    // sessionStorage unavailable
  }
}
