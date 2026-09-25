/**
 * routeNotice.js — 경로 응답에서 사용자에게 보여줄 안내 문구 한 줄을 고른다
 * - routeNotice(route, t): 근사 경로, 입력 순서 유지, TMAP 예측 경로, 대중교통 안내를 i18n 키로 변환
 * - 여행 판단에 영향이 없는 안내는 빈 문자열로 버린다
 */
// Keep information that affects travel decisions; data credits live in the footer.
export function routeNotice(route, t) {
  if (!route) return '';
  if (route.approximate) return t('directions.approximate');
  if (/입력한 순서/.test(route.notice || '')) return t('directions.originalOrder');
  if (route.provider === 'TMAP_PREDICTION') return t('directions.predictedRoute');
  if (route.mode === 'TRANSIT') return (route.notice || '').replace(/^TMAP\s*/, '');
  return '';
}
