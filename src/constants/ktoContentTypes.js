/**
 * 한국관광공사(TourAPI) contentTypeId 상수.
 *
 * 검색 칩·주변 POI·정규화 라벨에서 공통으로 사용합니다.
 * @see https://www.data.go.kr 한국관광공사 TourAPI contentTypeId 가이드
 */

/** @typedef {'12'|'14'|'15'|'25'|'28'|'32'|'38'|'39'} KtoContentTypeId */

export const KTO_CONTENT_TYPE = {
  TOUR: '12',
  CULTURE: '14',
  FESTIVAL: '15',
  COURSE: '25',
  LEPORTS: '28',
  LODGING: '32',
  SHOPPING: '38',
  FOOD: '39',
};

/**
 * UI 장소 유형 칩 (전체 = null)
 *
 * 전체(null)는 contentTypeId를 전송하지 않아 기존 동작을 그대로 유지합니다.
 * (구·군 목록 = 백엔드 기본 관광지, 검색 = TourAPI 전 타입)
 */
export const KTO_PLACE_TYPE_CHIPS = [
  { id: null, label: '전체', contentTypeId: null },
  { id: 'tour', label: '관광지', contentTypeId: KTO_CONTENT_TYPE.TOUR },
  { id: 'culture', label: '문화시설', contentTypeId: KTO_CONTENT_TYPE.CULTURE },
  { id: 'lodging', label: '숙박', contentTypeId: KTO_CONTENT_TYPE.LODGING },
  { id: 'food', label: '음식', contentTypeId: KTO_CONTENT_TYPE.FOOD },
];

/** @deprecated KTO_PLACE_TYPE_CHIPS 사용 */
export const KTO_SEARCH_TYPE_CHIPS = KTO_PLACE_TYPE_CHIPS;

const LABEL_BY_ID = {
  [KTO_CONTENT_TYPE.TOUR]: '관광지',
  [KTO_CONTENT_TYPE.CULTURE]: '문화시설',
  [KTO_CONTENT_TYPE.FESTIVAL]: '축제/공연',
  [KTO_CONTENT_TYPE.COURSE]: '여행코스',
  [KTO_CONTENT_TYPE.LEPORTS]: '레포츠',
  [KTO_CONTENT_TYPE.LODGING]: '숙박',
  [KTO_CONTENT_TYPE.SHOPPING]: '쇼핑',
  [KTO_CONTENT_TYPE.FOOD]: '음식점',
};

/**
 * @param {string | null | undefined} contentTypeId
 * @returns {string}
 */
export function getKtoContentTypeLabel(contentTypeId) {
  if (!contentTypeId) return '관광정보';
  return LABEL_BY_ID[String(contentTypeId)] ?? '관광정보';
}

/**
 * 장소 유형 칩 라벨. 전체(null)는 빈 문자열을 반환합니다.
 *
 * @param {string | null | undefined} contentTypeId
 * @returns {string}
 */
export function getKtoPlaceTypeLabel(contentTypeId) {
  if (!contentTypeId) return '';
  const chip = KTO_PLACE_TYPE_CHIPS.find(
    (item) => item.contentTypeId === String(contentTypeId),
  );
  return chip?.label ?? getKtoContentTypeLabel(contentTypeId);
}
