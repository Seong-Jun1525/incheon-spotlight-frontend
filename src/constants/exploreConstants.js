/**
 * exploreConstants.js — 지역 탐색 화면의 조회·표시 기준값 상수
 * - 3D 맵 랜드마크 핀 최대 개수
 * - 주변 맛집·숙박 조회 반경, 표시 개수, 정렬 기준
 * - KTO 키워드 검색 debounce 시간과 결과 개수 제한
 */

/** MVP: 구·군당 3D 맵에 표시할 최대 랜드마크 핀 개수 */
export const MAX_LANDMARK_PINS_PER_DISTRICT = 3;

/** 주변 맛집 기본 조회 반경 (미터) */
export const NEARBY_RESTAURANT_RADIUS_M = 1500;

/** 주변 맛집 기본 표시 개수 */
export const NEARBY_RESTAURANT_LIMIT = 3;

/** 주변 맛집 정렬 (TourAPI arrange — E=거리순) */
export const NEARBY_RESTAURANT_ARRANGE = 'E';

/** 주변 숙박 기본 조회 반경 (미터) */
export const NEARBY_LODGING_RADIUS_M = 2000;

/** 주변 숙박 기본 표시 개수 */
export const NEARBY_LODGING_LIMIT = 5;

/** KTO 키워드 검색 debounce (ms) */
export const KTO_SEARCH_DEBOUNCE_MS = 300;

/** KTO 검색 결과 최대 표시 수 */
export const KTO_SEARCH_RESULT_LIMIT = 8;
