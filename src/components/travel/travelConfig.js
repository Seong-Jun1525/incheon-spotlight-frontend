/**
 * travelConfig.js — 여행계획 화면의 상수·검증·변환 모음
 * - 여행 유형(워크숍·가족·커플·혼자)별 추가 입력 필드와 항목별 안내 문구, 생성 단계 라벨
 * - 입력값 정규화·기본값 보정과 날짜·인원·예산·고정 일정 유효성 검사
 * - 시각/날짜/거리 포맷, 경로 제공사명 숨김, 맵 AI 코스 힌트를 초안에 합치는 유틸
 */
import { formatWon } from '../../utils/formatTravel.js';
import { fillPromptDraft } from './travelPrompt.js';
export { fillPromptDraft } from './travelPrompt.js';
export const TYPES = [
  {
    id: 'WORKSHOP', label: '워크숍', tagline: '함께 일하고, 함께 쉬는 시간', sheet: '행사 운영표', icon: '01',
    description: '회의·팀 활동, 역할과 조 편성, 객실·차량 배정을 한 문서로.',
    fields: [
      { key: 'eventName', label: '행사명', placeholder: '예: 2026 상반기 팀 워크숍', hint: '계획서 제목에 쓰입니다. 아직 정해지지 않았다면 비워 두세요.' },
      { key: 'purpose', label: '행사 목적', placeholder: '예: 팀 단합, 분기 리뷰', hint: '회의와 휴식의 비중을 맞출 때 참고합니다.' },
      { key: 'meetingMinutes', label: '회의 시간 (분)', type: 'number', placeholder: '예: 120', hint: '프롬프트에 회의를 적었거나, 여기 숫자를 넣은 경우에만 일정에 회의 칸이 생깁니다. 회의가 아니면 비워 두세요.', required: false },
      { key: 'groups', label: '조 편성·조별 인원', placeholder: '예: 4개 조, 각 5명', hint: '조별 활동이 있으면 적어 주세요. 없으면 비워 두세요.' },
      { key: 'teamActivity', label: '팀 활동 선호', placeholder: '예: 실내 보드게임, 해변 산책', hint: '회의 외에 하고 싶은 팀 활동을 적습니다.' },
      { key: 'equipment', label: '대관·장비 조건', placeholder: '예: 프로젝터, 화이트보드', hint: '회의실이나 장비가 필요하면 적어 주세요.' },
      { key: 'roles', label: '운영 담당 역할', placeholder: '예: 진행 1명, 안전 1명', hint: '역할이 정해지지 않았다면 비워 두어도 됩니다.' },
      { key: 'vehicles', label: '차량 수·종류', placeholder: '예: 45인승 버스 1대', hint: '대절 차량이 있을 때만 입력합니다.' },
      { key: 'mealConditions', label: '단체 식사 조건', placeholder: '예: 한식, 알러지 없음', hint: '단체 메뉴 제한이나 선호를 적습니다.' },
    ],
  },
  {
    id: 'FAMILY', label: '가족여행', tagline: '모두의 속도에 맞춘 하루', sheet: '가족 일정', icon: '02',
    description: '아이 연령, 낮잠과 휴식, 편의시설 확인을 일정에 함께.',
    fields: [
      { key: 'elderly', label: '어르신 동행·필요한 도움', placeholder: '예: 짧은 동선, 엘리베이터 필요', hint: '보행이 불편한 동행이 있으면 필요한 도움을 적습니다. 없으면 비워 두세요.' },
      { key: 'accessibility', label: '유모차·계단 회피 등 조건', placeholder: '예: 유모차 이동, 경사로 필요', hint: '유모차나 휠체어를 쓰는 동선이면 적어 주세요.' },
      { key: 'napTime', label: '낮잠·휴식 시각', placeholder: '예: 14:00~15:30', hint: '아이가 쉬는 시간이 있으면 그 시각을 비워 둘 수 있습니다.' },
      { key: 'mealTime', label: '식사 시각', placeholder: '예: 점심 12시, 저녁 18시', hint: '선호하는 식사 시간이 있을 때만 입력합니다.' },
      { key: 'experience', label: '선호하는 가족 체험', placeholder: '예: 수족관, 공원 피크닉', hint: '꼭 해보고 싶은 체험이 있으면 적어 주세요.' },
    ],
  },
  {
    id: 'COUPLE', label: '커플여행', tagline: '둘이 오래 기억할 장면', sheet: '데이트 예약표', icon: '03',
    description: '식사·체험 예약부터 사진, 산책, 둘만의 여유시간까지.',
    fields: [
      { key: 'mood', label: '원하는 분위기', placeholder: '예: 한적한 바다, 야경 카페', hint: '데이트 분위기를 맞출 때 쓰입니다. 모르면 비워 두세요.' },
      { key: 'anniversary', label: '기념일 여부·준비', placeholder: '예: 100일, 케이크 예약', hint: '기념일이면 알려 주세요. 일반 데이트면 비워 두어도 됩니다.' },
      { key: 'activities', label: '선호 활동', placeholder: '예: 산책, 전시, 맛집', hint: '둘이 하고 싶은 활동을 적어 주세요.' },
      { key: 'diningGrade', label: '식사·숙소 등급', placeholder: '예: 특별한 저녁 1끼', hint: '예산을 나눌 때 참고합니다. 없으면 추천으로 맞춥니다.' },
      { key: 'photoTime', label: '사진·야경 선호', placeholder: '예: 노을, 야경 스팟', hint: '사진 찍을 시간대를 남기고 싶으면 적어 주세요.' },
      { key: 'reservationTime', label: '선호 예약 시각', placeholder: '예: 저녁 19:00', hint: '식당 예약 희망 시각이 있을 때만 입력합니다.' },
    ],
  },
  {
    id: 'SOLO', label: '혼자 힐링여행', tagline: '비워 두어 더 좋은 여행', sheet: '여유 일정과 기록', icon: '04',
    description: '산책·독서·휴식 사이에 여백을 두고 나만의 기록을 남겨요.',
    fields: [
      { key: 'purpose', label: '힐링 목적', placeholder: '예: 혼자만의 시간, 독서', hint: '이번 여행에서 가장 하고 싶은 것을 한 줄로 적어 주세요.' },
      { key: 'soloDining', label: '혼자 식사·체험 선호', placeholder: '예: 카운터석, 혼밥 편한 곳', hint: '혼자 이용하기 편한 장소를 선호하면 적어 주세요.' },
      { key: 'walkingLevel', label: '걷기 수준', placeholder: '예: 하루 4km 이하', hint: '많이 걷고 싶지 않다면 대략적인 거리를 적습니다.' },
      { key: 'lateTravel', label: '늦은 시간 이동 선호', placeholder: '예: 21시 이후 이동 싫음', hint: '밤 이동이 싫으면 알려 주세요. 없으면 비워 두세요.' },
      { key: 'quiet', label: '조용함·독서 공간 선호', placeholder: '예: 한적한 카페, 해변', hint: '붐비는 곳을 피하고 싶으면 적어 주세요.' },
    ],
  },
];

export const PROMPT_EXAMPLES = [
  { label: '자연·휴식', text: fillPromptDraft().replace('여행 목적·선호 활동: []', '여행 목적·선호 활동: 자연을 감상하고 산책·카페·휴식 위주로 구성') },
  { label: '전시·체험', text: fillPromptDraft().replace('여행 목적·선호 활동: []', '여행 목적·선호 활동: 전시 관람과 실내 체험 위주로 구성') },
  { label: '미식·야경', text: fillPromptDraft().replace('여행 목적·선호 활동: []', '여행 목적·선호 활동: 맛집과 야경 감상 위주로 구성') },
];

export const PREFERENCE_FIELDS = [
  { key: 'regions', label: '방문 희망 지역', placeholder: '예: 송도, 월미도', hint: '꼭 가고 싶은 동네가 있으면 적어 주세요. 비우면 인천 전체에서 고릅니다.' },
  { key: 'walking', label: '하루 최대 도보', placeholder: '예: 하루 5km, 2시간', hint: '많이 걷기 어렵다면 대략적인 한계를 적습니다. 모르면 비워 두세요.' },
  { key: 'rest', label: '휴식 빈도', placeholder: '예: 2시간마다 휴식', hint: '아이나 어르신이 있으면 쉬는 간격을 적어 주세요.' },
  { key: 'food', label: '음식 선호·제외', placeholder: '예: 해산물 제외, 한식 선호', hint: '알러지나 못 먹는 음식이 있으면 꼭 적어 주세요.' },
  { key: 'accessibility', label: '필요한 접근성 조건', placeholder: '예: 엘리베이터, 경사로', hint: '유모차·휠체어 동선이 필요하면 입력합니다.' },
  { key: 'rain', label: '우천 시 선호', placeholder: '예: 실내 전시, 카페', hint: '비 올 때 가고 싶은 대안이 있으면 적어 주세요.' },
  { key: 'parking', label: '차량 수·주차 조건', placeholder: '예: 승용차 1대, 유료 주차 가능', hint: '자가용이나 대절이면 주차 조건을 적습니다.' },
  { key: 'freeTime', label: '쇼핑·자유시간', placeholder: '예: 오후 1시간 자유시간', hint: '쇼핑이나 빈 시간이 필요하면 적어 주세요.' },
];

export const FIELD_GUIDE = {
  tripType: { hint: '함께하는 사람에 맞춰 일정 양식이 달라집니다.' },
  startDate: { hint: '여행을 시작하는 날짜입니다. 당일도 선택할 수 있습니다.' },
  endDate: { hint: '여행을 마치는 날짜입니다. 출발일과 같으면 당일 여행입니다.' },
  firstStart: { hint: '첫날 일정이 시작되는 시각입니다. 보통 09:00이면 충분합니다.', placeholder: '09:00' },
  lastEnd: { hint: '마지막 날 귀가하는 시각입니다. 당일이면 이 시각에 맞춰 일정이 끝납니다.', placeholder: '18:00' },
  districtId: { hint: '주로 머물 인천 구·군입니다. 출발 장소가 아니라, 관광·식당 후보를 고르는 범위입니다. 여러 곳을 돌면 인천 전체를 고르세요.' },
  adults: { placeholder: '예: 2', hint: '만 13세 이상 인원입니다. 최소 1명이 필요합니다.' },
  children: { placeholder: '예: 1', hint: '초등·청소년 인원입니다. 없으면 0으로 두세요.' },
  infants: { placeholder: '예: 0', hint: '유아 인원입니다. 없으면 0으로 두세요.' },
  ageBands: { placeholder: '예: 5세, 8~10세', hint: '아이 나이를 알려 주면 일정 속도와 체험을 맞춥니다. 없으면 비워 두세요.' },
  start: { placeholder: '출발할 역·숙소·주소', hint: '거주 지역과 관계없이 실제 출발 장소를 입력하세요. 검색 결과를 선택하면 좌표와 이동 경로를 반영합니다.' },
  end: { placeholder: '예: 인천역', hint: '여행이 끝나는 장소입니다. 왕복이면 출발지와 같게 두면 됩니다.' },
  transport: { hint: '주로 이용할 이동 수단입니다. 대절은 자동차 경로를 참고합니다.' },
  pace: { hint: '여유롭게는 쉬는 시간을 늘리고, 알차게는 장소를 더 넣습니다.' },
  budgetMode: { hint: '전체 합계, 1인당, 또는 금액 없이 추천만 받을 수 있습니다.' },
  budgetAmount: { placeholder: '예: 250000', hint: '원 단위 숫자만 입력합니다. 모르면 예산 기준을 ‘추천받기’로 바꾸세요.' },
  contingencyPercent: { placeholder: '예: 10', hint: '예상치 못한 지출을 위해 남겨 둘 비율입니다. 보통 10이면 충분합니다.' },
  included: { hint: '일정 예산에 넣을 항목입니다. 숙박이 없으면 숙박을 빼도 됩니다.' },
  lodgingStatus: { hint: '이미 예약했는지, 추천이 필요한지 알려 주세요.' },
  lodging: { placeholder: '예: 송도 호텔', hint: '예약한 숙소가 있으면 검색해 선택하세요. 아직이면 비워 두어도 됩니다.' },
  rooms: { placeholder: '예: 1', hint: '필요한 객실 수입니다.' },
  capacity: { placeholder: '예: 2', hint: '한 객실에 몇 명이 묵는지입니다.' },
  conditions: { placeholder: '예: 체크인 17시, 오션뷰', hint: '지역·등급·체크인 시각처럼 참고할 조건만 적습니다.' },
  themes: { hint: '일정에 담고 싶은 분위기입니다. 여행 유형과 별도로 고를 수 있습니다.' },
  mustVisit: { hint: '꼭 가고 싶은 관광지를 검색해 추가합니다. 없어도 됩니다.' },
  excluded: { hint: '가기 싫은 장소가 있으면 제외합니다. 없어도 됩니다.' },
  message: { placeholder: '예: 배편이 필요한 곳은 제외하고, 실내 대안도 준비해 주세요.', hint: '위에 없는 부탁을 자유롭게 적어 주세요. AI가 일정을 만들 때 가장 먼저 봅니다.' },
  prompt: { placeholder: '위의 요청 양식을 넣고 []를 채워 주세요. 정하지 않은 선택 조건은 ‘추천’, 해당 없는 항목은 ‘없음’으로 적으세요.', hint: '선호 활동과 제약을 구체적으로 적고, 날짜·인원·출발/도착지·교통·예산은 아래 기본 조건과 맞춰 주세요. 기본 조건을 일정 계산에 사용합니다.' },
  fixedDate: { hint: '움직일 수 없는 일정이 있는 날짜입니다. 여행 기간 안에서 고르세요.' },
  fixedStart: { hint: '고정 일정이 시작되는 시각입니다.' },
  fixedMinutes: { placeholder: '예: 60', hint: '그 자리에 머무를 시간입니다. 10~480분.' },
  fixedTitle: { placeholder: '예: 예약된 점심, 팀 회의', hint: '일정표에 그대로 표시될 이름입니다.' },
  fixedKind: { hint: '회의, 식사, 휴식처럼 활동 종류를 고릅니다.' },
  fixedPlace: { placeholder: '예: 송도컨벤시아', hint: '고정 일정이 있는 장소를 검색해 고르면 이동 동선에 반영됩니다.' },
};
export const COMMON_SHEETS = ['여행 개요', '상세 일정', '예산 및 지출', '장소 및 예약', '준비 및 대안', '출처 및 가정'];
export const CATEGORIES = { TRANSPORT: '교통', LODGING: '숙박', MEAL: '식사', CAFE: '카페·간식', ADMISSION: '입장', EXPERIENCE: '체험', VENUE: '대관', EQUIPMENT: '장비', OTHER: '기타', CONTINGENCY: '예비비' };
export const TRANSPORT = { PEDESTRIAN: '도보', TRANSIT: '대중교통', CAR: '자가용', CHARTER: '차량 대절' };
export const EVIDENCE = { VERIFIED: '조회 확인', USER_PROVIDED: '직접 입력', ESTIMATED: '추정값', UNKNOWN: '아직 확인 전' };
export const STAGES = {
  VALIDATING_INPUT: {
    label: '요청 확인',
    title: '요청을 확인하고 있습니다',
    detail: '날짜·인원·출발지를 맞춰 생성 준비를 합니다.',
  },
  PLACES: {
    label: '장소 찾기',
    title: '방문할 장소를 찾고 있습니다',
    detail: '인천 관광지와 식당·숙소 후보를 모으고 있습니다.',
  },
  AI: {
    label: '하루 일정 짜기',
    title: '하루 일정을 짜고 있습니다',
    detail: '찾은 장소를 시간 순서로 배치합니다. 형식이 맞지 않으면 조회한 장소로 기본 초안을 저장합니다. 보통 1~2분 걸립니다.',
  },
  VALIDATING: {
    label: '이동 시간 점검',
    title: '이동 시간과 비용을 맞추고 있습니다',
    detail: '장소 사이 이동에 필요한 시간과 쉬는 시간, 대략 비용을 확인하고 있습니다.',
  },
  SAVED: {
    label: '초안 저장',
    title: '검토용 초안을 저장했습니다',
    detail: '이동 시간이 모자라면 빨간 확인사항이 남을 수 있습니다. 시간을 고치거나 일부만 다시 짜면 됩니다.',
  },
};
export function stageOf(key) {
  return STAGES[key] || { label: key || '', title: key || '', detail: '' };
}
export const money = formatWon;
export function placeHomepage(url) {
  const raw = String(url || '').trim();
  if (!/^https?:\/\//i.test(raw)) return '';
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.href;
  } catch {
    return '';
  }
}
export function costPlace(plan, cost) {
  const item = plan?.items?.find((entry) => entry.id === cost.itemId);
  if (!item) return { item: null, place: null, label: '' };
  const place = item.place || null;
  return { item, place, label: place?.name || item.activity || '' };
}
export const tripDays = (start, end) => {
  const from = toDateValue(start);
  const to = toDateValue(end);
  if (!from || !to) return 0;
  return Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
};
export const PLACE_LABELS_KEY = 'travel-place-labels';
export const MUST_VISIT_LIMIT = 10;
export const PLAN_PAGE_SIZE = 30;
export const KINDS = { VISIT: '관광·방문', MEAL: '식사', CAFE: '카페', REST: '휴식', FREE: '자유시간', SESSION: '회의·교육', TEAM: '팀 활동', LODGING: '숙박', ACCESS: '출발', RETURN: '귀가' };
export const BUDGET_MODE = { TOTAL: '전체 인원 합계', PER_PERSON: '1인당 예산', RECOMMEND: '예산 추천받기' };
export const PACE = { RELAXED: '여유롭게', NORMAL: '보통', FULL: '알차게' };
export const LODGING_STATUS = { NONE: '숙박 제외', UNDECIDED: '직접 결정 중', RECOMMEND: '추천 필요', BOOKED: '예약 완료' };
// Keep free text and addresses through SPA login without writing them to browser storage.
let currentDraft = null;
export const getCurrentDraft = () => currentDraft;
export const setCurrentDraft = (value) => { currentDraft = value; };
export const safeRead = (key) => { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } };
export const safeStore = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Form stays usable without browser storage. */ } };

function rememberPlace(ids, labels, id, name) {
  const contentId = id == null || id === '' ? '' : String(id);
  if (!contentId) return;
  if (!ids.includes(contentId)) ids.push(contentId);
  const label = typeof name === 'string' ? name.trim() : '';
  if (label) labels[contentId] = label;
}

/**
 * 맵 AI 코스에서 넘어온 힌트를 계획서 초안에 합칩니다.
 * 백엔드 계약(mustVisitIds)은 유지하고, 화면용 장소명은 따로 돌려줍니다.
 */
export function applyTravelHint(draft, hint) {
  if (!hint) return { draft, labels: {} };
  const ids = [];
  const labels = {};
  for (const stop of Array.isArray(hint.stops) ? hint.stops : []) {
    rememberPlace(ids, labels, stop?.contentId, stop?.name || stop?.title);
  }
  rememberPlace(ids, labels, hint.contentId, hint.placeTitle);
  const next = { ...draft };
  if (hint.districtId) next.districtId = hint.districtId;
  if (hint.placeTitle || hint.contentId) {
    next.start = {
      name: hint.placeTitle || draft.start?.name || '',
      contentId: hint.contentId || null,
    };
  }
  if (hint.theme) next.themes = [hint.theme];
  if (hint.courseId) next.sourceCourseId = String(hint.courseId);
  if (ids.length) next.mustVisitIds = ids.slice(0, MUST_VISIT_LIMIT);
  const order = (Array.isArray(hint.stops) ? hint.stops : [])
    .map((stop) => stop?.name || stop?.title)
    .filter(Boolean)
    .join(' → ');
  if (order && !(draft.message || '').trim()) {
    next.message = `맵에서 만든 코스 순서를 우선 반영해 주세요: ${order}`;
  }
  return { draft: next, labels };
}

export function placeId(id) {
  return id == null || id === '' ? '' : String(id);
}

export function toClock(value) {
  const match = String(value || '').match(/^(\d{2}:\d{2})/);
  return match ? match[1] : '';
}

export function toDateValue(value) {
  const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

export function endClock(start, minutes) {
  const [hour, minute] = toClock(start).split(':').map(Number);
  const duration = Number(minutes);
  if (![hour, minute, duration].every(Number.isFinite)) return '';
  const total = ((hour * 60 + minute + duration) % 1440 + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function formatDistanceM(meters) {
  const value = Number(meters);
  if (!Number.isFinite(value) || value < 0) return '';
  return value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${Math.round(value)}m`;
}

/** 일정 화면에는 경로 제공사 이름을 보여 주지 않습니다. */
export function hideTravelVendor(text) {
  if (text == null || text === '') return '';
  return String(text)
    .replace(/TMAP\s*경로 데이터를 사용했습니다\.?/gi, '')
    .replace(/TMAP\s*대중교통/gi, '대중교통')
    .replace(/TMAP\s*타임머신\s*/gi, '')
    .replace(/TMAP\s*경유지 최적화 순서:?\s*/gi, '')
    .replace(/\bTMAP(?:_[A-Z0-9]+)?\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*·\s*(?=·)/g, '')
    .replace(/^\s*·\s*|\s*·\s*$/g, '')
    .replace(/\s+\./g, '.')
    .replace(/\.\s*\./g, '.')
    .trim();
}

export function travelSourceLabel(source) {
  if (!source || source === 'NONE') return '';
  if (/^TMAP/i.test(source)) return '';
  if (source === 'TOUR_API_PRICE') return '관광정보 공개 요금';
  if (source === 'PLANNING_ASSUMPTION_V1') return '계획용 단가';
  if (source === 'USER') return '사용자 입력';
  return source;
}

export function placeChipLabel(id, labels = {}) {
  const key = placeId(id);
  if (labels[key]) return labels[key];
  if (key.startsWith('tmap:addr:')) return '선택한 주소';
  if (key.startsWith('tmap:poi:')) return '선택한 장소';
  return key;
}

export function labelsFromInput(input, extra = {}) {
  const labels = { ...extra };
  const remember = (id, name) => {
    const key = placeId(id);
    const label = typeof name === 'string' ? name.trim() : '';
    if (key && label) labels[key] = label;
  };
  remember(input?.start?.contentId, input?.start?.name);
  remember(input?.end?.contentId, input?.end?.name);
  remember(input?.lodging?.contentId, input?.lodging?.name);
  for (const item of input?.fixedItems || []) remember(item?.contentId, item?.location || item?.title);
  return labels;
}

export function jobPlanPath(job) {
  return job?.state === 'SUCCEEDED' && job?.planId ? `/travel-plans/${job.planId}` : `/travel-planner/new?job=${job?.id || ''}`;
}

export function normalizeInput(raw = {}) {
  const base = defaultInput();
  const next = { ...base, ...raw };
  next.startDate = toDateValue(next.startDate);
  next.endDate = toDateValue(next.endDate);
  next.firstStart = toClock(next.firstStart) || base.firstStart;
  next.lastEnd = toClock(next.lastEnd) || base.lastEnd;
  next.party = { ...base.party, ...(raw.party || {}) };
  next.start = { ...base.start, ...(raw.start || {}) };
  next.end = { ...base.end, ...(raw.end || {}) };
  next.budget = {
    ...base.budget,
    ...(raw.budget || {}),
    included: Array.isArray(raw.budget?.included) ? raw.budget.included : base.budget.included,
  };
  next.lodging = { ...base.lodging, ...(raw.lodging || {}) };
  next.preferences = { ...base.preferences, ...(raw.preferences || {}) };
  next.typeDetails = { ...base.typeDetails, ...(raw.typeDetails || {}) };
  next.themes = Array.isArray(raw.themes) ? raw.themes : base.themes;
  next.fixedItems = Array.isArray(raw.fixedItems)
    ? raw.fixedItems.map((item) => ({
      ...item,
      date: toDateValue(item.date) || item.date,
      start: toClock(item.start) || item.start,
      contentId: item.contentId ? placeId(item.contentId) : null,
    }))
    : [];
  next.mustVisitIds = [...new Set((raw.mustVisitIds || []).map(placeId).filter(Boolean))];
  next.excludedIds = [...new Set((raw.excludedIds || []).map(placeId).filter(Boolean))];
  return next;
}

export const defaultInput = () => ({
  tripType: 'FAMILY', startDate: '', endDate: '', firstStart: '09:00', lastEnd: '18:00', districtId: 'incheon',
  party: { adults: 2, children: 0, infants: 0, ageBands: '' }, start: { name: '', contentId: null }, end: { name: '', contentId: null },
  transport: 'TRANSIT', budget: { mode: 'TOTAL', amount: '', included: Object.keys(CATEGORIES).filter((x) => !['VENUE', 'EQUIPMENT', 'CONTINGENCY'].includes(x)), contingencyPercent: 10 }, pace: 'NORMAL',
  lodging: { status: 'NONE', name: '', contentId: null, rooms: 1, capacity: 2, conditions: '' }, themes: ['자연'], preferences: {}, typeDetails: {}, fixedItems: [], mustVisitIds: [], excludedIds: [], message: '', sourceCourseId: null,
});

export function localIsoDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function nextTripDates() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  const iso = localIsoDate(start);
  return { startDate: iso, endDate: iso };
}

/** 말로 요청하기에서 비운 필수값만 채웁니다. 이미 입력한 값은 유지합니다. */
export function applyPromptDefaults(raw = {}) {
  const next = normalizeInput(raw);
  const dates = nextTripDates();
  if (!next.startDate) next.startDate = dates.startDate;
  if (!next.endDate) next.endDate = next.startDate;
  if (next.budget.mode !== 'RECOMMEND' && (next.budget.amount === '' || next.budget.amount == null)) {
    next.budget = { ...next.budget, mode: 'RECOMMEND', amount: null };
  }
  const days = tripDays(next.startDate, next.endDate);
  if (days > 1 && next.lodging.status === 'NONE') next.lodging = { ...next.lodging, status: 'UNDECIDED' };
  return next;
}
const minutes = (time) => {
  const clock = toClock(time);
  return /^\d{2}:\d{2}$/.test(clock) ? Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5)) : NaN;
};
export function validateFixedItem(f, input) {
  const errors = [];
  const add = (fields, message) => errors.push({ fields, message });
  const date = toDateValue(f.date), startDate = toDateValue(input.startDate), endDate = toDateValue(input.endDate);
  if (!date || !startDate || !endDate || date < startDate || date > endDate) add(['fixedDate'], '고정 일정 날짜는 여행 기간 안에서 선택해 주세요.');
  if (!f.title?.trim()) add(['fixedTitle'], '고정 일정 이름을 입력해 주세요.');
  if (!Number.isInteger(f.minutes) || f.minutes < 10 || f.minutes > 480) add(['fixedMinutes'], '고정 일정 소요 시간은 10~480분으로 입력해 주세요.');
  const start = minutes(f.start), lower = date === startDate ? minutes(input.firstStart) : 360, upper = date === endDate ? minutes(input.lastEnd) : 1380;
  if (!Number.isFinite(start) || start < lower || start + f.minutes > upper) add(['fixedStart'], '고정 일정은 해당 날짜의 여행 시작·종료 시각 안에 배치해 주세요.');
  if ((input.fixedItems || []).some((x) => x !== f && toDateValue(x.date) === date && start < minutes(x.start) + x.minutes && start + f.minutes > minutes(x.start))) add(['fixedStart'], '이미 추가한 고정 일정과 시간이 겹칩니다.');
  return errors;
}
export function validateInput(v, limits = {}, section = 'all') {
  const maxDays = limits?.maxDays || 7, maxPeople = limits?.maxPeople || 100;
  const errors = [];
  const add = (fields, message) => errors.push({ fields, message });
  if (!TYPES.some((type) => type.id === v.tripType)) add(['tripType'], '여행 유형을 선택해 주세요.');
  const days = tripDays(v.startDate, v.endDate);
  if (!Number.isFinite(days) || days < 1 || days > maxDays) add(["startDate","endDate"], `출발일·종료일은 1~${maxDays}일 범위로 입력해 주세요.`);
  const count = v.party.adults + v.party.children + v.party.infants;
  if (![v.party.adults, v.party.children, v.party.infants].every((n) => Number.isInteger(n) && n >= 0)) add(["party.adults","party.children","party.infants"], '성인·아동·유아 인원을 0 이상의 정수로 입력해 주세요.');
  if (v.party.adults < 1 || count > maxPeople) add(["party.adults","party.children","party.infants"], `성인 1명 이상, 전체 ${maxPeople}명 이내로 입력해 주세요.`);
  if (!v.start?.name?.trim() || !v.end?.name?.trim()) add(["start","end"], '시작·종료 지점을 입력해 주세요. 역이나 공공장소로 지정해도 됩니다.');
  if (v.budget.mode !== 'RECOMMEND' && (v.budget.amount === '' || v.budget.amount == null || !Number.isFinite(Number(v.budget.amount)) || Number(v.budget.amount) < 0 || Number(v.budget.amount) > 1000000000)) add(["budget.amount"], '예산은 0~10억 원 범위로 입력하거나 예산 추천받기를 선택해 주세요.');
  if (!Number.isInteger(v.budget.contingencyPercent) || v.budget.contingencyPercent < 0 || v.budget.contingencyPercent > 30) add(["budget.contingencyPercent"], '예비비율은 0~30%의 정수로 입력해 주세요.');
  if (!Number.isFinite(minutes(v.firstStart)) || minutes(v.firstStart) < 360 || minutes(v.firstStart) > 1200 || !Number.isFinite(minutes(v.lastEnd)) || minutes(v.lastEnd) < 480 || minutes(v.lastEnd) > 1380) add(["firstStart","lastEnd"], '첫날 시작은 06~20시, 마지막 날 종료는 08~23시로 지정해 주세요.');
  if (days === 1 && minutes(v.lastEnd) - minutes(v.firstStart) < 120) add(["firstStart","lastEnd"], '당일 여행은 시작부터 종료까지 최소 2시간이 필요합니다.');
  if (days > 1 && v.lodging.status === 'NONE') add(["lodging.status"], '숙박 상태를 선택해 주세요.');
  if (days > 1 && v.lodging.status === 'BOOKED' && !v.lodging?.name?.trim() && !placeId(v.lodging?.contentId)) add(["lodging"], '예약한 숙소를 입력해 주세요.');
  if (days > 1 && (!Number.isInteger(v.lodging.rooms) || v.lodging.rooms < 1 || !Number.isInteger(v.lodging.capacity) || v.lodging.capacity < 1 || v.lodging.capacity > 20)) add(["lodging.rooms","lodging.capacity"], '객실 수와 객실당 정원을 확인해 주세요.');
  if (section === 'basic') return errors;
  if (section === 'prompt' || section === 'all') {
    if (section === 'prompt' && (!v.message || String(v.message).trim().length < 8)) add(["message"], '원하는 활동과 여행 조건을 구체적으로 적어 주세요.');
    if (section === 'prompt' && /\[\s*\]/.test(v.message || '')) add(["message"], '요청 양식의 []를 채워 주세요. 선택 조건은 ‘추천’ 또는 ‘없음’으로 적어도 됩니다.');
    if (section === 'prompt') return [...new Set(errors)];
  }
  const meetingRaw = String(v.typeDetails?.meetingMinutes || '').trim();
  const meeting = Number(meetingRaw);
  if (meetingRaw && (!Number.isInteger(meeting) || meeting < 30 || meeting > 480)) add(["typeDetails.meetingMinutes"], '회의 시간을 적을 때는 30~480분으로 입력해 주세요.');
  const must = (v.mustVisitIds || []).map(placeId);
  const excluded = (v.excludedIds || []).map(placeId);
  if (must.some((id) => id && excluded.includes(id))) add(["mustVisitIds","excludedIds"], '같은 장소를 필수 방문과 제외 장소로 지정할 수 없습니다.');
  for (const f of v.fixedItems || []) errors.push(...validateFixedItem(f, v));
  return [...new Set(errors)];
}
