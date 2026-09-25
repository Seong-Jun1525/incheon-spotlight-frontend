/**
 * 메인 맵 월 캘린더 — 한국 달력 기준.
 * 월별 문구를 하드코딩하지 않고, 선택 월과 TourAPI 행사 기간의 겹침만 다룹니다.
 */

const SEOUL = 'Asia/Seoul';
const MONTH_PARAM = 'month';
const MAX_WITHIN_DAYS = 365;
const MIN_WITHIN_DAYS = 30;

function partNumber(parts, type) {
  const value = parts.find((part) => part.type === type)?.value;
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

/** 한국 표준시 기준 오늘(연·월·일) */
export function koreaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SEOUL,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);
  const year = partNumber(parts, 'year');
  const month = partNumber(parts, 'month');
  const day = partNumber(parts, 'day');
  if (!year || !month || !day) {
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
  }
  return { year, month, day };
}

export function koreaTodayDate(now = new Date()) {
  const { year, month, day } = koreaToday(now);
  return new Date(year, month - 1, day);
}

export function isSameYearMonth(a, b) {
  return a?.year === b?.year && a?.month === b?.month;
}

export function addCalendarMonths(base, delta) {
  const index = (base.year * 12 + (base.month - 1) + delta);
  return {
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
  };
}

export function lastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export function formatYearMonth(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function formatMonthLabel(month) {
  return `${month}월`;
}

/**
 * URL `month` — `YYYY-MM` 또는 올해의 `M`/`MM`.
 * 잘못된 값은 null (호출측에서 이번 달로 되돌림).
 */
export function parseMonthParam(raw, today = koreaToday()) {
  const value = String(raw ?? '').trim();
  if (!value) return null;

  const iso = value.match(/^(\d{4})-(\d{1,2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    if (month < 1 || month > 12) return null;
    return { year, month };
  }

  const monthOnly = Number(value);
  if (Number.isInteger(monthOnly) && monthOnly >= 1 && monthOnly <= 12) {
    return { year: today.year, month: monthOnly };
  }
  return null;
}

export function monthKeyFromSearch(search, today = koreaToday()) {
  const params = new URLSearchParams(search || '');
  return parseMonthParam(params.get(MONTH_PARAM), today);
}

/** 오늘부터 선택 월 말일까지. 지난 달이면 기본 30일(필터 결과가 비는 것이 정상). */
export function withinDaysForMonth(year, month, today = koreaToday()) {
  const end = new Date(year, month - 1, lastDayOfMonth(year, month));
  const start = new Date(today.year, today.month - 1, today.day);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (days < 1) return MIN_WITHIN_DAYS;
  return Math.min(MAX_WITHIN_DAYS, Math.max(MIN_WITHIN_DAYS, days));
}

/** 이번 달부터 5개월 (지난 달은 넣지 않음 — 종료된 행사를 가장하지 않기 위함) */
export function upcomingCalendarMonths(today = koreaToday(), count = 5) {
  return Array.from({ length: count }, (_, index) => addCalendarMonths(today, index));
}

export function writeMonthSearch(currentSearch, year, month, today = koreaToday()) {
  const params = new URLSearchParams(currentSearch || '');
  if (isSameYearMonth({ year, month }, today)) {
    params.delete(MONTH_PARAM);
  } else {
    params.set(MONTH_PARAM, formatYearMonth(year, month));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

/**
 * 해당 월 행사가 가장 많은 구의 기존 추천 코스.
 * 월별 카피를 만들지 않고, 실 축제 분포 + 운영 중인 구별 코스를 사용합니다.
 */
export function pickCourseForCalendarMonth({
  festivalsByDistrict = {},
  selectedDistrictId = null,
  getCourseByDistrictId,
}) {
  if (typeof getCourseByDistrictId !== 'function') return null;
  if (selectedDistrictId) {
    const selected = getCourseByDistrictId(selectedDistrictId);
    if (selected) return selected;
  }
  const ranked = Object.entries(festivalsByDistrict)
    .filter(([, items]) => Array.isArray(items) && items.length > 0)
    .sort((a, b) => b[1].length - a[1].length);
  for (const [districtId] of ranked) {
    const course = getCourseByDistrictId(districtId);
    if (course) return course;
  }
  return null;
}

export const MAP_CALENDAR_MONTH_PARAM = MONTH_PARAM;
