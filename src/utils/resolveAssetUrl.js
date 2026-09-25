/**
 * API 파일 URL을 브라우저 img/src 에서 사용할 수 있는 절대 URL로 변환합니다.
 *
 * - /api/files/{fileId} → VITE_API_BASE_URL + path
 * - http(s):// 절대 URL은 그대로 반환
 * - javascript:/data:/그 외 스킴은 차단
 */
export function resolveAssetUrl(url) {
  if (!url) return '';
  const value = String(url).trim();
  if (!value) return '';

  const lower = value.toLowerCase();
  if (
    lower.startsWith('javascript:')
    || lower.startsWith('data:')
    || lower.startsWith('vbscript:')
    || lower.startsWith('file:')
  ) {
    return '';
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
      return parsed.href;
    } catch {
      return '';
    }
  }

  const base = import.meta.env?.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
  if (value.startsWith('/') && !value.startsWith('//') && base) {
    return `${base}${value}`;
  }

  if (value.startsWith('/') && !value.startsWith('//')) {
    return value;
  }

  return '';
}
