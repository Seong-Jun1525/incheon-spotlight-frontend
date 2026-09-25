/** Opt in only for our file API; external images and full-size detail views stay unchanged. */
export function cardImageUrl(resolvedUrl, apiBase = import.meta.env?.VITE_API_BASE_URL || '') {
  if (!resolvedUrl) return '';
  const localOrigin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  try {
    const parsed = new URL(resolvedUrl, localOrigin);
    const allowedOrigin = new URL(apiBase || localOrigin, localOrigin).origin;
    if (parsed.origin !== allowedOrigin || !/^\/api\/files\/\d+$/.test(parsed.pathname)) {
      return resolvedUrl;
    }
    parsed.searchParams.set('variant', 'card');
    return resolvedUrl.startsWith('/')
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : parsed.href;
  } catch {
    return resolvedUrl;
  }
}
