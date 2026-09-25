/**
 * trackStat.js — 대민 이용 통계 이벤트를 백엔드로 전송
 * - trackStat(event): 세션 ID와 현재 경로(pagePath)를 덧붙여 postStatEvent 호출, 실패해도 화면은 막지 않음
 * - 메뉴·구·키워드·콘텐츠 등이 같은 이벤트는 1.5초 안에서 중복 전송을 차단
 */
import { postStatEvent } from '../api/statsApi';
import { getStatSessionId } from './statSession';

const recentKeys = new Map();
const DEDUPE_MS = 1500;

function eventKey(event) {
  return [
    event.eventType,
    event.menuId ?? '',
    event.districtId ?? '',
    event.keyword ?? '',
    event.contentId ?? '',
    event.courseId ?? '',
    event.theme ?? '',
    event.placeTypeId ?? '',
    event.source ?? '',
  ].join('|');
}

/**
 * 대민 사용 통계. 실패해도 화면은 막지 않는다.
 */
export function trackStat(event) {
  if (!event?.eventType || typeof window === 'undefined') return;

  const key = eventKey(event);
  const now = Date.now();
  const previous = recentKeys.get(key) ?? 0;
  if (now - previous < DEDUPE_MS) return;
  recentKeys.set(key, now);

  postStatEvent({
    sessionId: getStatSessionId(),
    pagePath: window.location.pathname,
    ...event,
  }).catch(() => {});
}
