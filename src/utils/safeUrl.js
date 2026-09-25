/**
 * 사용자·외부 HTML에서 앱이 이동하거나 이미지로 쓸 수 있는 값만 남깁니다.
 */

function parseHttpUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    if (parsed.username || parsed.password) return '';
    return parsed.href;
  } catch {
    return '';
  }
}

/** TourAPI homepage HTML 또는 평문 URL에서 http(s) 링크만 추출합니다. */
export function safeHomepageHref(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  const direct = parseHttpUrl(text);
  if (direct) return direct;
  const href = text.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
  const fromHref = parseHttpUrl(href);
  if (fromHref) return fromHref;
  const embedded = text.match(/https?:\/\/[^\s"'<>]+/i)?.[0];
  return parseHttpUrl(embedded);
}

/** 로그인 후 이동 경로는 같은 앱의 상대 경로만 허용합니다. */
export function safeInternalPath(value, fallback = '/mypage') {
  if (typeof value !== 'string') return fallback;
  const path = value.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || path.includes('://')) {
    return fallback;
  }
  return path;
}
