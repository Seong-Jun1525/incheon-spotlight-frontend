/**
 * festival.js — TourAPI 축제·행사 데이터의 진행 상태와 표시 문구 계산
 * - getFestivalSchedule·getFestivalBadge: 'YYYYMMDD' 기간을 ongoing/upcoming/ended로 판정하고 D-day 배지 생성
 * - resolveFestivalDistrictId: 행사 주소를 2026 인천 행정구역 ID(영종·제물포·검단·서해 등)로 매핑
 * - festivalsForMapCalendar·groupFestivalsByDistrict: 월 캘린더용 정렬 목록과 구·군별 인덱스 구성
 */
import { resolveDistrictId } from '../data/incheonDistricts';

/**
 * ─────────────────────────────────────────────
 * 축제·행사 표시 유틸 (순수 함수)
 * ─────────────────────────────────────────────
 *
 * TourAPI 행사 일자는 'YYYYMMDD' 문자열입니다.
 * 진행 상태와 D-day는 화면을 그리는 시점의 로컬 날짜를 기준으로 계산합니다.
 */

const DATE_PATTERN = /^\d{8}$/;

const YEONGJONG_ADDRESS_HINTS = [
  '영종구',
  '영종',
  '운서동',
  '중산동',
  '운남동',
  '운북동',
  '용유동',
  '을왕동',
  '왕산동',
  '공항로',
];

const GEOMDAN_ADDRESS_HINTS = [
  '검단구',
  '검단',
  '오류동',
  '왕길동',
  '마전동',
  '당하동',
  '원당동',
  '불로동',
  '대곡동',
  '금곡동',
];

function includesAny(value, hints) {
  return hints.some((hint) => value.includes(hint));
}

/** KTO 주소를 2026 인천 행정구역 ID로 변환합니다. */
function districtIdFromFestivalAddress(address) {
  const compact = String(address ?? '').replace(/\s+/g, '');
  if (!compact || !compact.includes('인천')) return null;

  if (includesAny(compact, YEONGJONG_ADDRESS_HINTS)) return 'yeongjong';
  if (compact.includes('제물포구')) return 'jemulpo';
  if (includesAny(compact, GEOMDAN_ADDRESS_HINTS)) return 'geomdan';
  if (compact.includes('서해구')) return 'seohae';
  if (compact.includes('남동구')) return 'namdong';
  if (compact.includes('연수구')) return 'yeonsu';
  if (compact.includes('미추홀구') || compact.includes('남구')) return 'michuhol';
  if (compact.includes('부평구')) return 'bupyeong';
  if (compact.includes('계양구')) return 'gyeyang';
  if (compact.includes('강화군') || compact.includes('강화도')) return 'ganghwa';
  if (compact.includes('옹진군')) return 'ongjin';
  if (compact.includes('서구')) return 'seohae';
  if (compact.includes('중구') || compact.includes('동구')) return 'jemulpo';

  return null;
}

/** KTO의 신규 주소·구 행정구역 코드를 현재 3D 지도의 2026 ID로 통일합니다. */
export function resolveFestivalDistrictId(festival) {
  if (!festival) return null;
  return (
    districtIdFromFestivalAddress(festival.address) ||
    resolveDistrictId(festival.districtId)
  );
}

export function normalizeFestivalDistrict(festival) {
  if (!festival) return festival;
  const districtId = resolveFestivalDistrictId(festival);
  if (!districtId || districtId === festival.districtId) return festival;
  return { ...festival, districtId };
}

/** 'YYYYMMDD' → Date(로컬 자정). 형식이 어긋나면 null */
export function parseEventDate(value) {
  const raw = String(value ?? '').trim();
  if (!DATE_PATTERN.test(raw)) return null;

  const year = Number(raw.slice(0, 4));
  const month = Number(raw.slice(4, 6));
  const day = Number(raw.slice(6, 8));
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/** 시각 성분을 제거한 오늘 날짜 */
export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function diffInDays(from, to) {
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

/**
 * 행사 진행 상태.
 *
 * ongoing  진행 중 (오늘이 기간 안)
 * upcoming 예정 (아직 시작 전)
 * ended    종료
 * unknown  일자 정보 없음
 *
 * @returns {{
 *   status: 'ongoing'|'upcoming'|'ended'|'unknown',
 *   dday: number|null,
 *   daysLeft: number|null,
 *   startDate: Date|null,
 *   endDate: Date|null,
 * }}
 */
export function getFestivalSchedule(festival, today = startOfToday()) {
  const startDate = parseEventDate(festival?.eventStartDate);
  const endDate = parseEventDate(festival?.eventEndDate);

  if (!startDate && !endDate) {
    return { status: 'unknown', dday: null, daysLeft: null, startDate, endDate };
  }

  if (endDate && diffInDays(today, endDate) < 0) {
    return { status: 'ended', dday: null, daysLeft: null, startDate, endDate };
  }

  const dday = startDate ? diffInDays(today, startDate) : null;

  if (dday !== null && dday > 0) {
    return { status: 'upcoming', dday, daysLeft: null, startDate, endDate };
  }

  return {
    status: 'ongoing',
    dday: null,
    daysLeft: endDate ? diffInDays(today, endDate) : null,
    startDate,
    endDate,
  };
}

/**
 * 목록 카드에 붙일 짧은 상태 배지 문구.
 * 급한 것일수록 강조되도록 문구를 다르게 씁니다.
 */
export function getFestivalBadge(festival, today = startOfToday()) {
  const { status, dday, daysLeft } = getFestivalSchedule(festival, today);

  if (status === 'ongoing') {
    if (daysLeft === 0) return { label: '오늘 마지막', tone: 'urgent' };
    if (daysLeft !== null && daysLeft <= 2) {
      return { label: `${daysLeft}일 남음`, tone: 'urgent' };
    }
    return { label: '진행 중', tone: 'ongoing' };
  }

  if (status === 'upcoming') {
    if (dday === 1) return { label: '내일 개막', tone: 'urgent' };
    return { label: `D-${dday}`, tone: 'upcoming' };
  }

  if (status === 'ended') return { label: '종료', tone: 'muted' };

  return { label: '기간 미정', tone: 'muted' };
}

/** TourAPI 시작·종료일 그대로 '2026.1.5 ~ 2026.12.31' */
function formatEventDate(date) {
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}

export function formatFestivalPeriod(festival) {
  const { startDate, endDate } = getFestivalSchedule(festival);

  if (!startDate && !endDate) return '';
  if (!endDate) return `${formatEventDate(startDate)} 시작`;
  if (!startDate) return `${formatEventDate(endDate)}까지`;

  if (startDate.getTime() === endDate.getTime()) {
    return formatEventDate(startDate);
  }

  return `${formatEventDate(startDate)} ~ ${formatEventDate(endDate)}`;
}

/** 종료된 행사를 걸러낸 목록 (백엔드 필터에 대한 클라이언트 방어) */
export function excludeEndedFestivals(festivals = [], today = startOfToday()) {
  return festivals.filter(
    (festival) => getFestivalSchedule(festival, today).status !== 'ended',
  );
}

/**
 * 행사 기간이 해당 연·월과 하루라도 겹치면 true.
 * 오늘 진행 여부와 무관하게 eventStartDate ~ eventEndDate만 본다.
 */
export function festivalOverlapsYearMonth(festival, year, month) {
  if (!year || !month) return true;
  const startDate = parseEventDate(festival?.eventStartDate);
  const endDate = parseEventDate(festival?.eventEndDate);
  const start = startDate || endDate;
  const end = endDate || startDate;
  if (!start || !end) return false;
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  return start.getTime() <= monthEnd.getTime() && end.getTime() >= monthStart.getTime();
}

export function festivalsOverlappingMonth(festivals = [], year, month) {
  return festivals.filter((festival) => festivalOverlapsYearMonth(festival, year, month));
}

/**
 * 맵 월 캘린더 목록.
 * 선택한 연·월과 시작일~종료일이 겹치는 행사만 넣는다.
 */
export function festivalsForMapCalendar(
  festivals = [],
  year,
  month,
  today = startOfToday(),
) {
  const overlapping = festivalsOverlappingMonth(festivals, year, month);

  return [...overlapping].sort((a, b) => {
    const scheduleA = getFestivalSchedule(a, today);
    const scheduleB = getFestivalSchedule(b, today);
    if (scheduleA.status === 'ongoing' && scheduleB.status !== 'ongoing') return -1;
    if (scheduleB.status === 'ongoing' && scheduleA.status !== 'ongoing') return 1;
    const startA = scheduleA.startDate?.getTime() ?? 0;
    const startB = scheduleB.startDate?.getTime() ?? 0;
    return startA - startB;
  });
}

/**
 * districtId → 축제 배열.
 * 지도 배지·툴팁에서 구·군별 개수를 즉시 조회하기 위한 인덱스입니다.
 */
export function groupFestivalsByDistrict(festivals = []) {
  const byDistrict = {};

  for (const festival of festivals) {
    const normalizedFestival = normalizeFestivalDistrict(festival);
    const districtId = normalizedFestival?.districtId;
    if (!districtId) continue;

    if (!byDistrict[districtId]) {
      byDistrict[districtId] = [];
    }
    byDistrict[districtId].push(normalizedFestival);
  }

  return byDistrict;
}

/** 행사 항목을 기존 장소 선택/상세 흐름이 이해하는 형태로 변환 */
export function toFestivalPlace(festival) {
  if (!festival) return null;
  const normalizedFestival = normalizeFestivalDistrict(festival);

  return {
    ...normalizedFestival,
    id: normalizedFestival.id || (normalizedFestival.contentId ? `place-${normalizedFestival.contentId}` : ''),
    contentId: normalizedFestival.contentId ? String(normalizedFestival.contentId) : '',
    name: normalizedFestival.name || normalizedFestival.title || '',
    shortDescription: formatFestivalPeriod(normalizedFestival),
  };
}
