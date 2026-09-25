/**
 * aiCourseAdapter.js — AI 코스 생성 API 응답을 탐색 화면의 코스 모델로 변환
 * - toExploreCourse(response, courseId): stops의 좌표·체류시간·주변 맛집을 정리하고 2곳 미만이면 null
 * - formatStayMinutes·formatCourseWalk·formatPlaceCount: 체류 시간, 도보 거리·시간, 장소 수를 i18n 문구로 포맷
 */
export const AI_GENERATED_COURSE_ID = 'ai-generated';
export const AI_TODAY_COURSE_ID = 'ai-today';

export function toExploreCourse(response, courseId = AI_GENERATED_COURSE_ID) {
  const snapshot = response?.course;
  if (!snapshot) return null;

  const stops = (snapshot.stops ?? []).map((stop) => ({
    contentId: String(stop.contentId),
    name: stop.title,
    title: stop.title,
    order: stop.visitOrder,
    mapX: stop.mapX,
    mapY: stop.mapY,
    address: stop.address,
    stayMinutes: stop.stayMinutes,
    reason: stop.reason,
    slot: stop.slot || 'place',
    slotLabel: stop.slotLabel || '',
    contentTypeId: stop.contentTypeId || null,
    nearbyFood: Array.isArray(stop.nearbyFood)
      ? stop.nearbyFood
          .map((group) => ({
            cuisine: group.cuisine,
            label: group.label,
            restaurants: Array.isArray(group.restaurants) ? group.restaurants : [],
          }))
          .filter((group) => group.restaurants.length > 0)
      : [],
  }));

  if (stops.length < 2) return null;

  const districtId =
    snapshot.districtId && snapshot.districtId !== 'incheon'
      ? snapshot.districtId
      : null;

  return {
    id: courseId,
    origin: courseId === AI_TODAY_COURSE_ID ? 'today' : 'ai',
    districtId,
    courseName: snapshot.title,
    summary: snapshot.summary,
    theme: snapshot.themeLabel,
    themeLabel: snapshot.themeLabel,
    duration: snapshot.durationLabel,
    stopCount: stops.length,
    placeCount: stops.length,
    routeLabel: snapshot.routeLabel,
    weather: response.weather || null,
    route: response.route || null,
    answer: response.answer || '',
    stops,
  };
}

export function formatStayMinutes(minutes, t) {
  if (!Number.isFinite(Number(minutes))) return '';
  const count = Math.round(Number(minutes));
  return t ? t('course.stayAbout', { count }) : `약 ${count}분`;
}

export function slotLabel(slot, fallback, t) {
  if (fallback && slot && slot !== 'place') return fallback;
  if (!slot || slot === 'place') return '';
  if (t) return t(`slot.${slot}`, { defaultValue: fallback || '' });
  return fallback || '';
}

export function formatCourseWalk(route, t) {
  if (!route) return null;
  const meters = Number(route.distanceM);
  const seconds = Number(route.durationSeconds);
  const distance = Number.isFinite(meters)
    ? meters >= 1000
      ? t
        ? t('course.km', { count: (meters / 1000).toFixed(1) })
        : `${(meters / 1000).toFixed(1)}km`
      : t
        ? t('course.m', { count: Math.round(meters) })
        : `${Math.round(meters)}m`
    : null;
  const duration = Number.isFinite(seconds)
    ? t
      ? t('duration.minutes', { count: Math.max(1, Math.round(seconds / 60)) })
      : `${Math.max(1, Math.round(seconds / 60))}분`
    : null;
  if (!distance && !duration) return null;
  return t && distance && duration
    ? t('course.walk', { distance, duration })
    : [distance, duration].filter(Boolean).join(' · ');
}

export function formatPlaceCount(count, t, fallback = '') {
  const value = Number(count);
  if (Number.isFinite(value)) {
    return t ? t('course.placeCount', { count: value }) : `장소 ${value}곳`;
  }
  return fallback || '';
}
