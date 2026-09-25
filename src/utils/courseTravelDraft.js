/**
 * courseTravelDraft.js — AI 추천 코스를 여행 일정 생성 폼의 초안으로 변환
 * - createCourseTravelDraft(course, requestMessage): 정류장 중복 제거·순서 정렬 후 2~10곳만 통과
 * - 테마/동행/소요시간을 한국어 라벨과 시작·종료 시각으로 환산해 travelPrompt 메시지 구성
 * - 요청 500자·프롬프트 1500자 제한을 넘기면 단계적 축약, 그래도 초과하면 null
 */
import { fillPromptDraft } from '../components/travel/travelPrompt.js';

const THEME_NAMES = { night: '야경', date: '데이트', family: '가족', history: '역사', nature: '자연', food: '맛집' };
const TRIP_TYPES = { couple: 'COUPLE', family: 'FAMILY', solo: 'SOLO' };
const PARTY_NAMES = { couple: '커플', family: '가족', solo: '혼자', friends: '친구' };
const clean = (value) => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
const shorten = (value, limit) => value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
const clock = (hours) => `${String(hours).padStart(2, '0')}:00`;

/** Use the successful response snapshot, never the currently edited course filters. */
export function createCourseTravelDraft(course, requestMessage = '') {
  const seen = new Set();
  const stops = (Array.isArray(course?.stops) ? course.stops : [])
    .map((stop, index) => ({ ...stop, position: index }))
    .sort((a, b) => (Number(a.visitOrder) || a.position + 1) - (Number(b.visitOrder) || b.position + 1))
    .filter((stop) => {
      const id = stop.contentId == null ? '' : String(stop.contentId).trim();
      if (!id || !clean(stop.title) || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((stop) => ({ ...stop, contentId: String(stop.contentId).trim(), title: clean(stop.title) }));
  if (stops.length < 2 || stops.length > 10) return null;

  const duration = Number(course.durationHours);
  const durationHours = Number.isInteger(duration) && duration >= 2 && duration <= 12 ? duration : 4;
  const startHour = course.theme === 'night' ? Math.min(18, 23 - durationHours) : 9;
  const theme = THEME_NAMES[course.theme] || shorten(clean(course.themeLabel), 40) || '자연';
  const partyLabel = PARTY_NAMES[course.partyType] || '동행 유형 미정';
  const summary = shorten(clean(course.summary), 120);
  const originalMessage = clean(requestMessage);
  // The course API accepts 500 characters. Refuse unexpected oversized input instead of losing constraints.
  if (originalMessage.length > 500) return null;
  const schedule = (limit) => stops.map((stop, index) => {
    const minutes = Number(stop.stayMinutes);
    const stay = Number.isFinite(minutes) && minutes > 0 ? `, 약 ${Math.round(minutes)}분` : '';
    return `${index + 1}. ${shorten(stop.title, limit)}${stay}`;
  }).join(' → ');
  const prompt = (nameLimit, includeSummary) => fillPromptDraft({
    purpose: `${theme}${includeSummary && summary ? ` · ${summary}` : ''}`,
    dates: `아래 기본 조건 기준. 원본 코스 약 ${durationHours}시간`,
    party: `${partyLabel} 동행. 정확한 인원·연령은 아래 기본 조건 기준`,
    endpoints: '아래 기본 조건의 출발지 / 도착지 기준',
    places: `${clean(course.districtName) || '인천'} · 아래 9번 방문지`,
    transport: '아래 기본 조건 기준. 걷기 한도는 미정',
    budget: '아래 기본 조건 기준. 금액 미정이면 추천',
    lodging: '아래 기본 조건의 여행 기간·숙박 상태 기준',
    schedule: `${schedule(nameLimit)}. 원본 장소·순서·체류 시간을 우선 반영하고, 시간 부족 시 조정 이유를 안내`,
    constraints: originalMessage || '별도 요청 없음',
  });
  let message = prompt(32, true);
  if (message.length > 1500) message = prompt(24, false);
  if (message.length > 1500) message = prompt(12, false);
  if (message.length > 1500) return null;

  const endpoint = (stop) => ({ name: shorten(stop.title, 150), contentId: stop.contentId });
  return {
    input: {
      tripType: TRIP_TYPES[course.partyType] || '',
      startDate: '', endDate: '',
      firstStart: clock(startHour), lastEnd: clock(startHour + durationHours),
      districtId: clean(course.districtId) || 'incheon',
      party: { adults: course.partyType === 'solo' ? 1 : 2, children: 0, infants: 0, ageBands: '' },
      start: endpoint(stops[0]), end: endpoint(stops.at(-1)),
      transport: 'TRANSIT', budget: { mode: 'RECOMMEND', amount: null },
      themes: [theme], mustVisitIds: stops.map((stop) => stop.contentId),
      message, sourceCourseId: 'ai-generated',
    },
    labels: Object.fromEntries(stops.map((stop) => [stop.contentId, stop.title])),
    context: {
      title: clean(course.title), durationHours, partyLabel,
      stops: stops.map((stop) => ({ contentId: stop.contentId, name: stop.title, stayMinutes: stop.stayMinutes })),
    },
  };
}
