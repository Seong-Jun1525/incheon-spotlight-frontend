/**
 * 백엔드 응답 형태가 제각각일 때 배열 데이터만 안전하게 꺼냅니다.
 *
 * 지원 형태 예:
 * - [ ... ]
 * - { data: [ ... ] }
 * - { result: [ ... ] }
 * - { items: [ ... ] }
 */
export function unwrapApiList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

/**
 * 한국관광공사 TourAPI 표준 응답 (response.body.items.item) 파싱
 */
export function unwrapKtoTourApiItems(payload) {
  const root = unwrapApiData(payload) ?? payload;
  const itemsNode =
    root?.response?.body?.items ??
    root?.body?.items ??
    root?.items;

  if (!itemsNode) return [];

  const item = itemsNode.item ?? itemsNode;
  if (Array.isArray(item)) return item;
  return item ? [item] : [];
}

/**
 * 단일 객체 응답을 안전하게 꺼냅니다.
 */
export function unwrapApiData(payload) {
  if (payload && typeof payload === 'object' && 'data' in payload && !Array.isArray(payload)) {
    return payload.data ?? null;
  }
  return payload ?? null;
}

