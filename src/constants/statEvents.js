/**
 * statEvents.js — 사용자 행동 통계 수집용 이벤트 타입·유입 경로 상수
 * - STAT_EVENTS: 페이지 조회, 지역 선택, 검색, 즐겨찾기, AI 대화 등 이벤트 코드
 * - STAT_SOURCE: 지도·목록·추천 등 이벤트가 발생한 UI 위치 코드
 */

export const STAT_EVENTS = {
  PAGE_VIEW: 'page_view',
  MENU_VIEW: 'menu_view',
  DISTRICT_SELECT: 'district_select',
  SEARCH_SUBMIT: 'search_submit',
  POI_VIEW: 'poi_view',
  COURSE_OPEN: 'course_open',
  COURSE_MAP: 'course_map',
  THEME_SELECT: 'theme_select',
  PLACE_TYPE_SELECT: 'place_type_select',
  FAVORITE_ADD: 'favorite_add',
  FAVORITE_REMOVE: 'favorite_remove',
  RECOMMENDATION_CLICK: 'recommendation_click',
  FESTIVAL_CLICK: 'festival_click',
  NEARBY_CLICK: 'nearby_click',
  ROUTE_REQUEST: 'route_request',
  AI_OPEN: 'ai_open',
  AI_CHAT: 'ai_chat',
  AI_COURSE_PLAN: 'ai_course_plan',
  KAKAO_MAP_OPEN: 'kakao_map_open',
};

export const STAT_SOURCE = {
  MAP: 'map',
  LIST: 'list',
  SUGGESTION: 'suggestion',
  FORM: 'form',
  REALTIME_RANK: 'realtime_rank',
  PANEL: 'panel',
  RECOMMEND: 'recommend',
  FESTIVAL: 'festival',
};
