/**
 * TravelPlannerPage.jsx — 여행계획 만들기 랜딩 화면과 요청 입력 화면
 * - 라우트: `/travel-planner` (공개), TravelPlannerNewPage 는 `/travel-planner/new` (공개이나 생성 시 로그인 필요)
 * - 랜딩은 여행 유형 선택과 빠른 요청 입력을, 입력 화면은 '말로 요청'·'조건 입력' 두 방식을 3단계로 제공
 * - 입력값을 로컬 초안에 저장하고 startTravelJob 으로 생성 작업을 띄운 뒤 TravelJobPanel 로 진행 상황을 추적
 */
import { uiText, useUiLanguage } from '../i18n/uiText';
import { TravelValidationProvider } from '../components/travel/TravelValidation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ClipboardList,
  FileSpreadsheet,
  Heart,
  Leaf,
  MapPin,
  MessageSquareText,
  Route,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { getTravelTemplates, startTravelJob } from '../api/travelPlanApi';
import { fetchPlaceDetail } from '../api/placeApi';
import { getApiErrorMessage } from '../api/http';
import { districtLabels } from '../data/incheonDistricts';
import {
  TYPES,
  TRANSPORT,
  CATEGORIES,
  PLACE_LABELS_KEY,
  MUST_VISIT_LIMIT,
  applyTravelHint,
  defaultInput,
  safeRead,
  safeStore,
  tripDays,
  validateInput,
  validateFixedItem,
  getCurrentDraft,
  setCurrentDraft,
  money,
  placeId,
  toClock,
  toDateValue,
  labelsFromInput,
  normalizeInput,
  BUDGET_MODE,
  PACE,
  LODGING_STATUS,
  placeChipLabel,
  FIELD_GUIDE,
  PREFERENCE_FIELDS,
  PROMPT_EXAMPLES,
  fillPromptDraft,
  applyPromptDefaults,
} from '../components/travel/travelConfig';
import {
  Field,
  FieldHead,
  PlaceInput,
  PlanSummary,
  Select,
  TemplatePreview,
  TextAreaField,
  TravelJobPanel,
  TravelPlaceChips,
  TravelShell,
} from '../components/travel/TravelShared';
import styles from '../components/travel/TravelPlanner.module.scss';

const ICONS = {
  WORKSHOP: BriefcaseBusiness,
  FAMILY: Users,
  COUPLE: Heart,
  SOLO: Leaf,
};

export default function TravelPlannerPage() {
  useUiLanguage();
  const [type, setType] = useState('FAMILY');
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();
  const selected = TYPES.find((item) => item.id === type);
  const hasPromptTemplate = prompt.includes('1. 여행 목적·선호 활동:');
  const addPromptTemplate = () => {
    setPrompt((current) => {
      if (current.includes('1. 여행 목적·선호 활동:')) return current;
      const template = fillPromptDraft();
      if (!current.trim()) return template;
      return `${current.trim()}\n\n${template}`.slice(0, 1500);
    });
  };
  const goPrompt = (event) => {
    event.preventDefault();
    navigate(`/travel-planner/new?type=${type}&mode=prompt`, {
      state: { prompt: prompt.trim() },
    });
  };
  return (
    <TravelShell current={uiText("여행계획 만들기")}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{uiText("인천 여행계획 서비스")}</p>
          <h1>{uiText("여행의 모든 준비를,")}<br />
            <em>{uiText("한 장의 계획으로.")}</em>
          </h1>
          <p>{uiText("원하는 활동과 기본 조건을 요청 양식에 적거나, 날짜·인원·예산을 하나씩 입력하면 됩니다.")}<br />{uiText("일정·동선·예산·준비사항을 한 문서로 만들어 드립니다.")}</p>
          <form
            className={styles.heroPrompt}
            onSubmit={goPrompt}
          >
            <div className={styles.heroPromptHead}>
              <label htmlFor='landing-prompt'>{uiText("빠른 여행 요청")}</label>
              <button
                className={styles.promptTemplateButton}
                type='button'
                onClick={addPromptTemplate}
              >
                <ClipboardList size={15} />
                {uiText(hasPromptTemplate ? "요청 양식이 들어갔습니다" : "공통 요청 양식 넣기")}
              </button>
            </div>
            <p className={styles.heroPromptHint} id='landing-prompt-hint'>
              {uiText("자유롭게 적거나 공통 요청 양식을 불러와 빈칸을 채워 주세요. 다음 화면에서 날짜·인원 등 기본 조건을 확인합니다.")}
            </p>
            <textarea
              id='landing-prompt'
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={1500}
              rows={hasPromptTemplate ? 16 : 4}
              aria-describedby='landing-prompt-hint'
              placeholder={uiText("예: 이번 주말 아이와 당일치기. 공원과 맛집 위주로, 많이 걷지 않게.")}
            />
            <div className={styles.heroPromptActions}>
              <button
                className={styles.primary}
                type='submit'
              >
                {uiText(prompt.trim() ? "입력 내용 이어서 확인" : "요청 입력 화면 열기")}
                <Sparkles size={16} />
              </button>
              <Link
                className={styles.secondaryLink}
                to={`/travel-planner/new?type=${type}`}
              >{uiText("조건을 하나씩 입력")}</Link>
            </div>
          </form>
          <div className={styles.heroActions}>
            <Link
              className={styles.secondaryLink}
              to='/travel-plans'
            >{uiText("저장한 계획 보기")}</Link>
          </div>
          <div className={styles.heroMeta}>
            <span>
              <MapPin size={15} />{uiText("인천 여행")}</span>
            <span>
              <CalendarDays size={15} />{uiText("당일·숙박 여행")}</span>
            <span>
              <FileSpreadsheet size={15} />{uiText("편집 가능한 엑셀")}</span>
          </div>
        </div>
        <div className={styles.heroDocument}>
          <TemplatePreview type={type} />
          <div className={styles.documentCaption}>
            <Check size={16} />{uiText("일정 · 예산 · 예약 · 준비물, 하나의 문서로")}</div>
        </div>
      </header>
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>{uiText("01 여행 유형 선택")}</p>
            <h2>{uiText("누구와 함께 떠나시나요?")}</h2>
          </div>
          <p>{uiText("유형을 고르면 맞춤 양식이 적용됩니다. 나중에 바꿔도 됩니다.")}</p>
        </div>
        <div className={styles.typeGrid}>
          {TYPES.map((item) => {
            const Icon = ICONS[item.id];
            return (
              <button
                type='button'
                key={item.id}
                className={
                  type === item.id ? styles.typeSelected : styles.typeCard
                }
                aria-pressed={type === item.id}
                onClick={() => setType(item.id)}
              >
                <div className={styles.typeTop}>
                  <span className={styles.typeIcon}>
                    <Icon size={23} />
                  </span>
                  <span className={styles.typeRadio}>
                    {type === item.id && <Check size={13} />}
                  </span>
                </div>
                <h3>{uiText(item.label)}</h3>
                <strong>{uiText(item.tagline)}</strong>
                <p>{uiText(item.description)}</p>
              </button>
            );
          })}
        </div>
        <div className={styles.typeContinue}>
          <span>
            <b>{uiText(selected?.label)}</b>{uiText("유형으로 계획을 시작합니다.")}</span>
          <div className={styles.typeContinueActions}>
            <Link
              className={styles.primary}
              to={`/travel-planner/new?type=${type}&mode=prompt`}
            >{uiText("요청 양식으로 시작")}<MessageSquareText size={17} />
            </Link>
            <Link
              className={styles.ghost}
              to={`/travel-planner/new?type=${type}`}
            >{uiText("조건 맞춰 만들기")}<ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
      <section className={styles.explainer}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>{uiText("이용 방법")}</p>
            <h2>{uiText("두 가지 방법으로 계획을 만들 수 있습니다")}</h2>
          </div>
          <span>{uiText("말로 요청하거나, 조건을 입력")}</span>
        </div>
        <div className={styles.guideGrid}>
          <article>
            <MessageSquareText size={24} />
            <b>
              <span>01</span>{uiText("말로 요청")}</b>
            <p>{uiText("하고 싶은 여행을 문장으로 적으면, 비어 있는 날짜·출발지는 기본값으로 채워 일정을 만듭니다.")}</p>
          </article>
          <article>
            <CalendarDays size={24} />
            <b>
              <span>02</span>{uiText("조건 입력")}</b>
            <p>{uiText("날짜, 인원, 출발지와 예산을 정하고 원하는 장소를 추가합니다. 각 항목의 ? 아이콘으로 입력 예를 볼 수 있습니다.")}</p>
          </article>
          <article>
            <ClipboardList size={24} />
            <b>
              <span>03</span>{uiText("검토와 저장")}</b>
            <p>{uiText("생성한 일정의 시간·장소·비용을 수정하고, 편집 가능한 엑셀로 내려받습니다.")}</p>
          </article>
        </div>
        <p className={styles.guideNote}>{uiText("계획 생성·저장은 로그인 후 이용할 수 있습니다. 예상 비용과 확인이 필요한 정보는 구분하여 안내합니다.")}</p>
      </section>
    </TravelShell>
  );
}

export function TravelPlannerNewPage() {
  useUiLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const templates = useQuery({
    queryKey: ['travel-templates'],
    queryFn: getTravelTemplates,
    retry: 1,
  });
  const params = new URLSearchParams(location.search);
  const [courseContext] = useState(() => location.state?.courseDraft?.context || getCurrentDraft()?.courseContext || null);
  const [mode, setMode] = useState(() => {
    if (location.state?.courseDraft) return 'prompt';
    const fromUrl = params.get('mode');
    if (fromUrl === 'prompt' || fromUrl === 'guided') return fromUrl;
    const saved = getCurrentDraft()?.mode;
    return saved === 'prompt' ? 'prompt' : 'guided';
  });
  const [input, setInput] = useState(() => {
    if (location.state?.courseDraft) return normalizeInput(location.state.courseDraft.input);
    const saved = getCurrentDraft()?.input;
    const draft = normalizeInput(saved || safeRead('travel-input-draft') || {});
    if (TYPES.some((t) => t.id === params.get('type')))
      draft.tripType = params.get('type');
    const hinted = applyTravelHint(draft, location.state?.travelHint).draft;
    if (!courseContext && (params.get('mode') === 'prompt' || getCurrentDraft()?.mode === 'prompt'))
      return applyPromptDefaults(hinted);
    return hinted;
  });
  const [placeLabels, setPlaceLabels] = useState(() => location.state?.courseDraft?.labels || ({
    ...(safeRead(PLACE_LABELS_KEY) || {}),
    ...(getCurrentDraft()?.labels || {}),
    ...applyTravelHint(defaultInput(), location.state?.travelHint).labels,
  }));
  const [step, setStep] = useState(() => {
    if (location.state?.courseDraft) return 0;
    if (params.get('type') || params.get('mode') === 'prompt') return 0;
    const saved = getCurrentDraft()?.step;
    return saved === 1 || saved === 2 ? saved : 0;
  });
  const [errors, setErrors] = useState([]);
  const [pending, setPending] = useState(false);
  const errorRef = useRef(null);
  const [jobId, setJobId] = useState(() => params.get('job'));
  const [fixed, setFixed] = useState({
    date: '',
    start: '10:00',
    minutes: 60,
    title: '',
    kind: 'SESSION',
    contentId: null,
    location: '',
  });
  const request = useRef(null);
  const appliedPrompt = useRef('');
  const days = tripDays(input.startDate, input.endDate);
  const type = TYPES.find((t) => t.id === input.tripType) || TYPES[1];
  const tripTypeOptions = { '': '여행 유형을 선택해 주세요.', ...Object.fromEntries(TYPES.map((t) => [t.id, t.label])) };
  const preparePromptInput = (value) => courseContext ? normalizeInput(value) : applyPromptDefaults(value);
  const update = (key, value) => setInput((s) => ({ ...s, [key]: value }));
  const nested = (key, field, value) =>
    setInput((s) => ({ ...s, [key]: { ...s[key], [field]: value } }));
  const dates = (key, value) =>
    setInput((s) => {
      const v = { ...s, [key]: value };
      if (key === 'startDate' && (!v.endDate || v.endDate < value))
        v.endDate = value;
      const n = tripDays(v.startDate, v.endDate);
      v.lodging = {
        ...s.lodging,
        status:
          n <= 1
            ? 'NONE'
            : s.lodging.status === 'NONE'
              ? 'UNDECIDED'
              : s.lodging.status,
      };
      return v;
    });

  useEffect(() => {
    // Consume the handoff once so later navigation cannot reapply the original input over edits.
    if (!location.state?.courseDraft) return;
    const state = { ...location.state };
    delete state.courseDraft;
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state });
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    const text =
      typeof location.state?.prompt === 'string'
        ? location.state.prompt.trim()
        : '';
    if (!text || appliedPrompt.current === text) return;
    appliedPrompt.current = text;
    setInput((s) => applyPromptDefaults({ ...s, message: text }));
    const fromUrl = new URLSearchParams(location.search).get('mode');
    if (fromUrl !== 'guided') setMode('prompt');
  }, [location.state]);

  useEffect(() => {
    const fromUrl = new URLSearchParams(location.search).get('mode');
    if (fromUrl === 'prompt' || fromUrl === 'guided') setMode(fromUrl);
  }, [location.search]);

  useEffect(() => {
    const {
      tripType,
      startDate,
      endDate,
      firstStart,
      lastEnd,
      districtId,
      transport,
      budget,
      pace,
      themes,
      mustVisitIds,
      excludedIds,
      sourceCourseId,
    } = input;
    const publicIds = (ids) =>
      ids.filter((id) => !String(id).startsWith('tmap:'));
    safeStore('travel-input-draft', {
      tripType,
      startDate,
      endDate,
      firstStart,
      lastEnd,
      districtId,
      transport,
      budget,
      pace,
      themes,
      mustVisitIds: publicIds(mustVisitIds),
      excludedIds: publicIds(excludedIds),
      sourceCourseId,
      party: { ...input.party, ageBands: '' },
      lodging: {
        status: input.lodging.status,
        rooms: input.lodging.rooms,
        capacity: input.lodging.capacity,
        name: '',
        contentId: null,
        conditions: '',
      },
    });
    safeStore(
      PLACE_LABELS_KEY,
      Object.fromEntries(
        Object.entries(placeLabels).filter(([id]) => !id.startsWith('tmap:')),
      ),
    );
    setCurrentDraft({ input, labels: placeLabels, step, mode, courseContext });
  }, [input, placeLabels, step, mode, courseContext]);

  const rememberPlace = (contentId, name) => {
    if (!contentId) return;
    setPlaceLabels((current) =>
      name ? { ...current, [contentId]: name } : current,
    );
  };
  const unlabeledPlaceIds = [
    ...(input.mustVisitIds || []),
    ...(input.excludedIds || []),
  ]
    .map(placeId)
    .filter((id) => id && !placeLabels[id] && !id.startsWith('tmap:'))
    .sort()
    .join('|');
  useEffect(() => {
    if (!unlabeledPlaceIds) return undefined;
    let active = true;
    Promise.all(
      unlabeledPlaceIds
        .split('|')
        .slice(0, MUST_VISIT_LIMIT)
        .map(async (id) => {
          try {
            const place = await fetchPlaceDetail(id);
            const name = place?.title || place?.name;
            return name ? [id, name] : null;
          } catch {
            return null;
          }
        }),
    ).then((rows) => {
      if (!active) return;
      const found = Object.fromEntries(rows.filter(Boolean));
      if (Object.keys(found).length)
        setPlaceLabels((current) => ({ ...found, ...current }));
    });
    return () => {
      active = false;
    };
  }, [unlabeledPlaceIds]);

  const complete = useCallback(
    (job) => {
      setCurrentDraft(null);
      if (!job?.planId) return;
      navigate(`/travel-plans/${job.planId}`, { replace: true });
    },
    [navigate],
  );
  const restore = (v) => {
    setInput(normalizeInput(v));
    setPlaceLabels((current) => labelsFromInput(v, current));
    setJobId(null);
    setStep(0);
    request.current = null;
    navigate('/travel-planner/new', { replace: true });
  };
  const showErrors = (issues) => {
    const normalized = issues.map(issue => typeof issue === 'string' ? { message: issue, fields: [] } : issue);
    setErrors(normalized);
    if (issues.length)
      requestAnimationFrame(() => {
        const field = normalized.flatMap(issue => issue.fields)[0];
        const target = field && document.querySelector(`[data-field="${field}"] input, [data-field="${field}"] select, [data-field="${field}"] textarea`);
        for (let parent = target?.parentElement; parent; parent = parent.parentElement) {
          if (parent.tagName === 'DETAILS') parent.open = true;
        }
        (target || errorRef.current)?.focus();
        (target || errorRef.current)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
  };
  const openStep = (next) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goStep = (next) => {
    const issues =
      next > step
        ? validateInput(input, templates.data, next === 1 ? 'basic' : 'all')
        : [];
    showErrors(issues);
    if (!issues.length) openStep(next);
  };
  const review = (event) => {
    event.preventDefault();
    if (step < 2) goStep(step + 1);
  };
  const addFixed = () => {
    const entry = {
      ...fixed,
      date: fixed.date || input.startDate,
      start: toClock(fixed.start) || fixed.start,
      minutes: Number(fixed.minutes),
    };
    const issues = validateFixedItem(entry, input);
    showErrors(issues);
    if (!issues.length) {
      update('fixedItems', [...input.fixedItems, entry]);
      setFixed({
        ...fixed,
        title: '',
        location: '',
        contentId: null,
        address: '',
      });
    }
  };
  const addPlace = (key, otherKey, limit, v) => {
    const id = placeId(v?.contentId);
    if (!id) return;
    if (input[key].map(placeId).includes(id)) return;
    if (input[key].length >= limit) {
      showErrors([`장소는 최대 ${limit}개까지 추가할 수 있습니다.`]);
      return;
    }
    rememberPlace(id, v.name);
    setInput((s) => ({
      ...s,
      [key]: [...s[key].map(placeId), id],
      [otherKey]: s[otherKey].map(placeId).filter((x) => x !== id),
    }));
  };
  const switchMode = (next) => {
    setMode(next);
    setErrors([]);
    setStep(0);
    if (next === 'prompt') setInput((s) => preparePromptInput(s));
    const search = new URLSearchParams(location.search);
    search.set('mode', next);
    search.delete('job');
    navigate(
      { pathname: '/travel-planner/new', search: search.toString() },
      { replace: true },
    );
  };
  const buildPayload = (source) => ({
    ...source,
    startDate: toDateValue(source.startDate) || source.startDate,
    endDate: toDateValue(source.endDate) || source.endDate,
    firstStart: toClock(source.firstStart) || source.firstStart,
    lastEnd: toClock(source.lastEnd) || source.lastEnd,
    start: {
      ...source.start,
      contentId: source.start?.contentId
        ? placeId(source.start.contentId)
        : null,
    },
    end: {
      ...source.end,
      contentId: source.end?.contentId ? placeId(source.end.contentId) : null,
    },
    lodging: {
      ...source.lodging,
      contentId: source.lodging?.contentId
        ? placeId(source.lodging.contentId)
        : null,
    },
    mustVisitIds: (source.mustVisitIds || [])
      .map(placeId)
      .filter(Boolean)
      .slice(0, MUST_VISIT_LIMIT),
    excludedIds: (source.excludedIds || [])
      .map(placeId)
      .filter(Boolean)
      .slice(0, 20),
    fixedItems: (source.fixedItems || []).map((item) => ({
      ...item,
      date: toDateValue(item.date) || item.date,
      start: toClock(item.start) || item.start,
      contentId: item.contentId ? placeId(item.contentId) : null,
    })),
    budget: {
      ...source.budget,
      amount:
        source.budget.mode === 'RECOMMEND'
          ? null
          : Number(source.budget.amount),
    },
  });
  const generate = async (source = input, section = 'all') => {
    const issues = validateInput(source, templates.data, section);
    showErrors(issues);
    if (issues.length) return;
    if (!user?.authenticated) {
      navigate('/login', { state: { from: '/travel-planner/new' } });
      return;
    }
    if (pending) return;
    setPending(true);
    setErrors([]);
    const payload = buildPayload(source);
    const fingerprint = JSON.stringify(payload);
    if (request.current?.fingerprint !== fingerprint)
      request.current = { fingerprint, key: crypto.randomUUID() };
    try {
      const job = await startTravelJob(payload, request.current.key);
      setJobId(job.id);
      navigate(`/travel-planner/new?job=${job.id}`, { replace: true });
    } catch (e) {
      showErrors([getApiErrorMessage(e)]);
    } finally {
      setPending(false);
    }
  };
  const generateFromPrompt = (event) => {
    event.preventDefault();
    const next = preparePromptInput(input);
    setInput(next);
    generate(next, 'prompt');
  };

  return (
    <TravelShell current={uiText("여행계획 만들기")}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>{uiText("나에게 맞는 인천 여행")}</p>
          <h1>{uiText("여행계획 만들기")}</h1>
          <p>
            {uiText(mode === 'prompt'
              ? '하고 싶은 여행을 말하고, 날짜와 출발지만 확인하면 일정을 만들어 드립니다.'
              : '여행의 기본 조건을 입력하고, 나만의 일정과 계획서를 완성하세요. 각 항목의 ?에 마우스를 올리면 입력 예가 나옵니다.')}
          </p>
        </div>
        <span className={styles.headerBadge}>
          <CalendarDays size={16} />
          {uiText(templates.data
            ? `최대 ${templates.data.maxDays}일 · ${templates.data.maxPeople}명`
            : templates.isError
              ? '최대 7일 · 100명'
              : '이용 조건 확인 중')}
        </span>
      </header>
      {jobId ? (
        <TravelJobPanel
          id={jobId}
          onComplete={complete}
          onRestore={restore}
        />
      ) : (
        <>
          {courseContext && (
            <section className={styles.courseImport} aria-label={uiText('course.planImportedTitle')}>
              <div className={styles.courseImportHead}>
                <ClipboardList size={22} aria-hidden />
                <div><strong>{uiText('course.planImportedTitle')}</strong><h2>{courseContext.title}</h2></div>
              </div>
              <p>{uiText('course.planImportedDescription')}</p>
              <ol>{courseContext.stops.map((stop) => (
                <li key={stop.contentId}><span>{stop.name}</span>
                  {Number(stop.stayMinutes) > 0 && <small>{Number(stop.stayMinutes)}{uiText('분')}</small>}
                </li>
              ))}</ol>
              <p className={styles.courseImportDefaults}>{uiText('course.planDefaults')}</p>
              {!input.tripType && <p>{uiText('course.planFriends')}</p>}
            </section>
          )}
          <div
            className={styles.modeSwitch}
            role='tablist'
            aria-label={uiText("계획 만들기 방법")}
          >
            <button
              type='button'
              role='tab'
              aria-selected={mode === 'prompt'}
              onClick={() => switchMode('prompt')}
            >
              <MessageSquareText size={16} />{uiText("말로 요청하기")}</button>
            <button
              type='button'
              role='tab'
              aria-selected={mode === 'guided'}
              onClick={() => switchMode('guided')}
            >
              <ClipboardList size={16} />{uiText("조건 입력하기")}</button>
          </div>
          {mode === 'guided' && (
            <ol className={styles.steps}>
              {[
                ['기본 조건', '날짜 · 인원 · 이동 · 예산'],
                ['맞춤 일정', '관심사 · 장소 · 고정 일정'],
                ['최종 확인', '입력 검토 · 계획 생성'],
              ].map(([label, detail], i) => (
                <li
                  key={label}
                  data-complete={step > i}
                  aria-current={step === i ? 'step' : undefined}
                >
                  <button
                    type='button'
                    onClick={() => goStep(i)}
                  >
                    <b>{step > i ? <Check size={18} /> : `0${i + 1}`}</b>
                    <span>
                      {uiText(label)}
                      <small>{uiText(detail)}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
          {templates.isError && (
            <p
              className={styles.alert}
              role='alert'
            >
              {getApiErrorMessage(templates.error)}{uiText(' ')}
              <button
                type='button'
                onClick={() => templates.refetch()}
              >{uiText("다시 불러오기")}</button>
            </p>
          )}
          {errors.length > 0 && (
            <div
              ref={errorRef}
              tabIndex={-1}
              className={styles.alert}
              role='alert'
            >
              <strong>{uiText("입력 내용을 확인해 주세요.")}</strong>
              <ul>
                {errors.map((e) => (
                  <li key={e.message}>{uiText(e.message)}</li>
                ))}
              </ul>
            </div>
          )}
          <TravelValidationProvider value={errors}><div className={styles.formLayout}>
            {mode === 'prompt' ? (
              <form
                onSubmit={generateFromPrompt}
                noValidate
                className={styles.form}
              >
                <section className={styles.promptSection}>
                  <h2>{uiText("어떤 여행을 만들고 싶나요?")}</h2>
                  <div className={styles.guideNote}>
                    {courseContext ? <p>{uiText('course.planEditHint')}</p> : <>
                    <p><b>{uiText("기본 조건과 원하는 활동")}</b>{uiText("을 알려 주시면 이동 가능한 순서로 일정을 구성합니다. 아래 양식의 빈칸을 짧고 구체적으로 채워 주세요.")}</p>
                    <p>{uiText("시간이 정해진 일정은 활동·시각·소요 시간을 함께 적으세요. 선택 조건은")}<b>{uiText("추천")}</b>{uiText(", 해당 없는 항목은")}<b>{uiText("없음")}</b>{uiText("으로 작성할 수 있습니다.")}</p>
                    <p>{uiText("날짜·인원·출발/도착·교통·예산은 아래 기본 조건과 일치시켜 주세요. 기본 조건을 기준으로 일정과 비용을 계산합니다.")}</p>
                    </>}
                  </div>
                  {!courseContext && <div className={styles.promptDraft}>
                    <p><b>{uiText("공통 요청 양식")}</b>{uiText("[]를 직접 채워 주세요. 지역·장소·거주지를 미리 가정하지 않습니다.")}</p>
                    <pre>{fillPromptDraft()}</pre>
                    <button
                      type='button'
                      onClick={() => setInput((s) => {
                        const next = applyPromptDefaults(s);
                        return { ...next, message: fillPromptDraft() };
                      })}
                    >
                      <ClipboardList size={16} />{uiText("요청 양식 넣기")}</button>
                  </div>}
                  <TextAreaField fieldKey='message'
                    label={uiText("여행 요청")}
                    hint={uiText(FIELD_GUIDE.prompt.hint)}
                    value={input.message}
                    onChange={(v) => update('message', v)}
                    required
                    maxLength={1500}
                    rows={18}
                    placeholder={uiText(FIELD_GUIDE.prompt.placeholder)}
                  />
                  {!courseContext && <div
                    className={styles.exampleChips}
                    aria-label={uiText("요청 예시")}
                  >
                    {PROMPT_EXAMPLES.map((example) => (
                      <button
                        type='button'
                        key={example.label}
                        onClick={() =>
                          setInput((s) =>
                            applyPromptDefaults({
                              ...s,
                              message: example.text,
                            }),
                          )
                        }
                      >
                        {uiText(example.label)}
                      </button>
                    ))}
                  </div>}
                </section>
                <section>
                  <h2>{uiText("일정 계산에 사용할 기본 조건")}</h2>
                  <p>{uiText("날짜·인원·출발/도착지·이동 수단은 꼭 확인해 주세요. 예산은 추천받기를 선택해도 됩니다.")}</p>
                  <Select fieldKey='tripType'
                    label={uiText("여행 유형")}
                    hint={uiText(FIELD_GUIDE.tripType.hint)}
                    value={input.tripType}
                    options={tripTypeOptions}
                    onChange={(v) => update('tripType', v)}
                    required
                  />
                  <div className={styles.formGrid}>
                    <Field fieldKey='startDate'
                      label={uiText("출발일")}
                      hint={uiText(FIELD_GUIDE.startDate.hint)}
                      type='date'
                      value={input.startDate}
                      onChange={(v) => dates('startDate', v)}
                      required
                    />
                    <Field fieldKey='endDate'
                      label={uiText("종료일")}
                      hint={uiText(FIELD_GUIDE.endDate.hint)}
                      type='date'
                      value={input.endDate}
                      onChange={(v) => dates('endDate', v)}
                      required
                      min={input.startDate}
                    />
                    <Field fieldKey='party.adults'
                      label={uiText("성인 인원")}
                      hint={uiText(FIELD_GUIDE.adults.hint)}
                      placeholder={uiText(FIELD_GUIDE.adults.placeholder)}
                      type='number'
                      min={1}
                      max={templates.data?.maxPeople || 100}
                      value={input.party.adults}
                      onChange={(v) => nested('party', 'adults', v)}
                      required
                    />
                    <Select fieldKey='districtId'
                      label={uiText("목적지 (인천)")}
                      hint={uiText(FIELD_GUIDE.districtId.hint)}
                      value={input.districtId}
                      options={{ incheon: '인천 전체', ...districtLabels }}
                      onChange={(v) => update('districtId', v)}
                      required
                    />
                  </div>
                  <div className={styles.formGrid}>
                    <Field fieldKey='firstStart' label={uiText("첫날 시작 시각")} type='time' value={input.firstStart} onChange={(v) => update('firstStart', v)} required />
                    <Field fieldKey='lastEnd' label={uiText("마지막 날 종료 시각")} type='time' value={input.lastEnd} onChange={(v) => update('lastEnd', v)} required />
                    <Field fieldKey='party.children' label={uiText("아동 인원")} type='number' min={0} max={99} value={input.party.children} onChange={(v) => nested('party', 'children', v)} />
                    <Field fieldKey='party.infants' label={uiText("유아 인원")} type='number' min={0} max={99} value={input.party.infants} onChange={(v) => nested('party', 'infants', v)} />
                    <Field fieldKey='party.ageBands' label={uiText("동행 연령대")} value={input.party.ageBands} onChange={(v) => nested('party', 'ageBands', v)} placeholder={uiText("아동·유아 동행 시 나이를 적어 주세요")} />
                    <Select fieldKey='pace' label={uiText("일정 여유")} value={input.pace} options={PACE} onChange={(v) => update('pace', v)} />
                  </div>
                  {input.tripType === 'WORKSHOP' && (
                    <Field fieldKey='typeDetails.meetingMinutes'
                      label={uiText("회의 시간 (분)")}
                      hint={uiText(TYPES[0].fields.find((f) => f.key === 'meetingMinutes')?.hint)}
                      type='number'
                      min={30}
                      max={480}
                      value={input.typeDetails.meetingMinutes || ''}
                      onChange={(v) => nested('typeDetails', 'meetingMinutes', v === '' ? '' : String(v))}
                      placeholder={uiText("예: 120")}
                      optional
                    />
                  )}
                  <p className={styles.hint}>
                    {uiText(days > 0
                      ? days === 1
                        ? '당일 여행 · 숙박 제외'
                        : `${days - 1}박 ${days}일 여행`
                      : '여행 날짜를 선택해 주세요.')}
                  </p>
                  <PlaceInput fieldKey='start'
                    label={uiText("출발지")}
                    hint={uiText(FIELD_GUIDE.start.hint)}
                    value={input.start}
                    onChange={(v) => update('start', v)}
                    districtId='incheon'
                    required
                  />
                  <div className={styles.copyEndpoint}>
                    <button
                      type='button'
                      disabled={!input.start.name}
                      onClick={() => update('end', { ...input.start })}
                    >{uiText("도착지를 출발지와 동일하게 설정")}</button>
                  </div>
                  <PlaceInput fieldKey='end'
                    label={uiText("도착지")}
                    hint={uiText(FIELD_GUIDE.end.hint)}
                    value={input.end}
                    onChange={(v) => update('end', v)}
                    districtId='incheon'
                    required
                  />
                  <div className={styles.formGrid}>
                    <Select fieldKey='transport'
                      label={uiText("교통수단")}
                      hint={uiText(FIELD_GUIDE.transport.hint)}
                      value={input.transport}
                      options={TRANSPORT}
                      onChange={(v) => update('transport', v)}
                      required
                    />
                    <Select fieldKey='budget.mode'
                      label={uiText("예산 기준")}
                      hint={uiText(FIELD_GUIDE.budgetMode.hint)}
                      value={input.budget.mode}
                      options={BUDGET_MODE}
                      onChange={(v) => nested('budget', 'mode', v)}
                      required
                    />
                  </div>
                  {input.budget.mode !== 'RECOMMEND' && <Field fieldKey='budget.amount' label={uiText("예산 금액 (원)")} type='number' min={0} max={1000000000} value={input.budget.amount ?? ''} onChange={(v) => nested('budget', 'amount', v)} required />}
                  {days > 1 && (
                    <Select fieldKey='lodging.status'
                      label={uiText("숙박 상태")}
                      hint={uiText(FIELD_GUIDE.lodgingStatus.hint)}
                      value={input.lodging.status}
                      options={{
                        UNDECIDED: LODGING_STATUS.UNDECIDED,
                        RECOMMEND: LODGING_STATUS.RECOMMEND,
                        BOOKED: LODGING_STATUS.BOOKED,
                      }}
                      onChange={(v) => nested('lodging', 'status', v)}
                      required
                    />
                  )}
                  {days > 1 && input.lodging.status === 'BOOKED' && <PlaceInput fieldKey='lodging' label={uiText("예약한 숙소")} value={input.lodging} districtId={input.districtId} onChange={(v) => update('lodging', { ...input.lodging, ...v })} required />}
                  {days > 1 && <div className={styles.formGrid}>
                    <Field fieldKey='lodging.rooms' label={uiText("객실 수")} type='number' min={1} max={100} value={input.lodging.rooms} onChange={(v) => nested('lodging', 'rooms', v)} required />
                    <Field fieldKey='lodging.capacity' label={uiText("객실당 정원")} type='number' min={1} max={20} value={input.lodging.capacity} onChange={(v) => nested('lodging', 'capacity', v)} required />
                  </div>}
                </section>
                <div className={styles.formActions}>
                  <span>{uiText("보통 1~3분이 걸립니다. 생성 중에도 이 화면을 닫아도 됩니다.")}</span>
                  <button
                    className={styles.primary}
                    type='submit'
                    disabled={pending}
                  >
                    <Sparkles size={16} />
                    {uiText(pending
                      ? '생성 요청 중'
                      : user?.authenticated
                        ? '이 요청으로 일정 만들기'
                        : '로그인하고 생성하기')}
                  </button>
                </div>
                {!user?.authenticated && (
                  <p className={styles.hint}>{uiText("로그인 후 이 화면으로 돌아옵니다. 같은 탭에서 입력한 내용이 유지됩니다.")}</p>
                )}
              </form>
            ) : (
              <form
                onSubmit={review}
                noValidate
                className={styles.form}
              >
                {step === 0 && (
                  <>
                    <section>
                      <h2>{uiText("여행의 기본 조건")}</h2>
                      <p>{uiText("별표(*) 항목만 필수입니다. 나머지는 모르면 비워 두세요.")}</p>
                      <Select fieldKey='tripType'
                        label={uiText("여행 유형")}
                        hint={uiText(FIELD_GUIDE.tripType.hint)}
                        value={input.tripType}
                        options={tripTypeOptions}
                        onChange={(v) => update('tripType', v)}
                        required
                      />
                      <div className={styles.formGrid}>
                        <Field fieldKey='startDate'
                          label={uiText("출발일")}
                          hint={uiText(FIELD_GUIDE.startDate.hint)}
                          type='date'
                          value={input.startDate}
                          onChange={(v) => dates('startDate', v)}
                          required
                        />
                        <Field fieldKey='endDate'
                          label={uiText("종료일")}
                          hint={uiText(FIELD_GUIDE.endDate.hint)}
                          type='date'
                          value={input.endDate}
                          onChange={(v) => dates('endDate', v)}
                          required
                          min={input.startDate}
                        />
                        <Field fieldKey='firstStart'
                          label={uiText("첫날 시작 시각")}
                          hint={uiText(FIELD_GUIDE.firstStart.hint)}
                          type='time'
                          value={input.firstStart}
                          onChange={(v) => update('firstStart', v)}
                          required
                          min='06:00'
                          max='20:00'
                        />
                        <Field fieldKey='lastEnd'
                          label={uiText("마지막 날 종료 시각")}
                          hint={uiText(FIELD_GUIDE.lastEnd.hint)}
                          type='time'
                          value={input.lastEnd}
                          onChange={(v) => update('lastEnd', v)}
                          required
                          min='08:00'
                          max='23:00'
                        />
                      </div>
                      <p className={styles.hint}>
                        {uiText(days > 0
                          ? days === 1
                            ? '당일 여행 · 숙박 제외'
                            : `${days - 1}박 ${days}일 여행`
                          : '여행 날짜를 선택해 주세요.')}
                      </p>
                      <Select fieldKey='districtId'
                        label={uiText("목적지 (인천)")}
                        hint={uiText(FIELD_GUIDE.districtId.hint)}
                        value={input.districtId}
                        options={{ incheon: '인천 전체', ...districtLabels }}
                        onChange={(v) => update('districtId', v)}
                        required
                      />
                      <div className={styles.formGrid}>
                        {[
                          ['adults', '성인', true],
                          ['children', '아동', false],
                          ['infants', '유아', false],
                        ].map(([key, label, required]) => (
                          <Field fieldKey={'party.' + key}
                            key={key}
                            label={uiText(`${label} 인원`)}
                            hint={uiText(FIELD_GUIDE[key].hint)}
                            placeholder={uiText(FIELD_GUIDE[key].placeholder)}
                            type='number'
                            min={key === 'adults' ? 1 : 0}
                            max={templates.data?.maxPeople || 100}
                            value={input.party[key]}
                            onChange={(v) => nested('party', key, v)}
                            required={required}
                            optional={!required}
                          />
                        ))}
                        <Field fieldKey='party.ageBands'
                          label={uiText("아동·유아 연령 구간")}
                          hint={uiText(FIELD_GUIDE.ageBands.hint)}
                          value={input.party.ageBands}
                          onChange={(v) => nested('party', 'ageBands', v)}
                          placeholder={uiText(FIELD_GUIDE.ageBands.placeholder)}
                          maxLength={150}
                          optional
                        />
                      </div>
                    </section>
                    <section>
                      <h2>{uiText("이동과 예산")}</h2>
                      <PlaceInput fieldKey='start'
                        label={uiText("출발지")}
                        hint={uiText(FIELD_GUIDE.start.hint)}
                        value={input.start}
                        onChange={(v) => update('start', v)}
                        districtId='incheon'
                        required
                      />
                      <div className={styles.copyEndpoint}>
                        <button
                          type='button'
                          disabled={!input.start.name}
                          onClick={() => update('end', { ...input.start })}
                        >{uiText("도착지를 출발지와 동일하게 설정")}</button>
                      </div>
                      <PlaceInput fieldKey='end'
                        label={uiText("도착지")}
                        hint={uiText(FIELD_GUIDE.end.hint)}
                        value={input.end}
                        onChange={(v) => update('end', v)}
                        districtId='incheon'
                        required
                      />
                      <p className={styles.hint}>{uiText("역이나 공공장소를 지정해도 됩니다. 검색 결과를 선택하면 조회한 좌표를 이동 계산에 사용합니다.")}</p>
                      <div className={styles.formGrid}>
                        <Select fieldKey='transport'
                          label={uiText("교통수단")}
                          hint={uiText(FIELD_GUIDE.transport.hint)}
                          value={input.transport}
                          options={TRANSPORT}
                          onChange={(v) => update('transport', v)}
                          required
                        />
                        <Select fieldKey='pace'
                          label={uiText("여행 속도")}
                          hint={uiText(FIELD_GUIDE.pace.hint)}
                          value={input.pace}
                          options={PACE}
                          onChange={(v) => update('pace', v)}
                          required
                        />
                        <Select fieldKey='budget.mode'
                          label={uiText("예산 기준")}
                          hint={uiText(FIELD_GUIDE.budgetMode.hint)}
                          value={input.budget.mode}
                          options={BUDGET_MODE}
                          onChange={(v) => nested('budget', 'mode', v)}
                          required
                        />
                        {input.budget.mode !== 'RECOMMEND' && (
                          <Field fieldKey='budget.amount'
                            label={uiText("예산 금액 (원)")}
                            hint={uiText(FIELD_GUIDE.budgetAmount.hint)}
                            placeholder={uiText(FIELD_GUIDE.budgetAmount.placeholder)}
                            type='number'
                            min={0}
                            max={1000000000}
                            step={1}
                            value={input.budget.amount}
                            onChange={(v) => nested('budget', 'amount', v)}
                            required
                          />
                        )}
                        <Field fieldKey='budget.contingencyPercent'
                          label={uiText("예비비율 (%)")}
                          hint={uiText(FIELD_GUIDE.contingencyPercent.hint)}
                          placeholder={
                            uiText(FIELD_GUIDE.contingencyPercent.placeholder)
                          }
                          type='number'
                          min={0}
                          max={30}
                          value={input.budget.contingencyPercent}
                          onChange={(v) =>
                            nested('budget', 'contingencyPercent', v)
                          }
                          required
                        />
                      </div>
                      <p className={styles.hint}>{uiText("실제 경로 지원 상태는 생성 후 표시됩니다. 대절 차량은 자동차 경로를 참고하며 버스 전용 경로는 별도 확인합니다.")}</p>
                      <fieldset>
                        <legend>
                          <FieldHead
                            label={uiText("예산에 포함할 항목")}
                            hint={uiText(FIELD_GUIDE.included.hint)}
                          />
                        </legend>
                        <div className={styles.checks}>
                          {Object.entries(CATEGORIES)
                            .filter(([id]) => id !== 'CONTINGENCY')
                            .map(([id, label]) => (
                              <label key={id}>
                                <input
                                  type='checkbox'
                                  checked={(
                                    input.budget.included || []
                                  ).includes(id)}
                                  onChange={(e) =>
                                    nested(
                                      'budget',
                                      'included',
                                      e.target.checked
                                        ? [...input.budget.included, id]
                                        : input.budget.included.filter(
                                            (v) => v !== id,
                                          ),
                                    )
                                  }
                                />
                                {uiText(label)}
                              </label>
                            ))}
                        </div>
                      </fieldset>
                    </section>
                    {days > 1 && (
                      <section>
                        <h2>{uiText("숙박 조건")}</h2>
                        <Select fieldKey='lodging.status'
                          label={uiText("숙박 상태")}
                          hint={uiText(FIELD_GUIDE.lodgingStatus.hint)}
                          value={input.lodging.status}
                          options={{
                            UNDECIDED: LODGING_STATUS.UNDECIDED,
                            RECOMMEND: LODGING_STATUS.RECOMMEND,
                            BOOKED: LODGING_STATUS.BOOKED,
                          }}
                          onChange={(v) => nested('lodging', 'status', v)}
                          required
                        />
                        <PlaceInput fieldKey='lodging'
                          label={uiText("숙소 (예약했다면 입력)")}
                          hint={uiText(FIELD_GUIDE.lodging.hint)}
                          value={input.lodging}
                          onChange={(v) =>
                            update('lodging', { ...input.lodging, ...v })
                          }
                          districtId={input.districtId}
                          required={input.lodging.status === 'BOOKED'}
                        />
                        <div className={styles.formGrid}>
                          <Field fieldKey='lodging.rooms'
                            label={uiText("객실 수")}
                            hint={uiText(FIELD_GUIDE.rooms.hint)}
                            placeholder={uiText(FIELD_GUIDE.rooms.placeholder)}
                            type='number'
                            min={1}
                            max={100}
                            value={input.lodging.rooms}
                            onChange={(v) => nested('lodging', 'rooms', v)}
                            required
                          />
                          <Field fieldKey='lodging.capacity'
                            label={uiText("객실당 정원")}
                            hint={uiText(FIELD_GUIDE.capacity.hint)}
                            placeholder={uiText(FIELD_GUIDE.capacity.placeholder)}
                            type='number'
                            min={1}
                            max={20}
                            value={input.lodging.capacity}
                            onChange={(v) => nested('lodging', 'capacity', v)}
                            required
                          />
                        </div>
                        <Field fieldKey='lodging.conditions'
                          label={uiText("지역·등급·체크인/아웃 조건")}
                          hint={uiText(FIELD_GUIDE.conditions.hint)}
                          placeholder={uiText(FIELD_GUIDE.conditions.placeholder)}
                          value={input.lodging.conditions}
                          onChange={(v) => nested('lodging', 'conditions', v)}
                          maxLength={500}
                          optional
                        />
                      </section>
                    )}
                    <div className={styles.formActions}>
                      <span>{uiText("다음 단계에서 관심 장소와 고정 일정을 추가합니다. 건너뛰어도 됩니다.")}</span>
                      <button
                        className={styles.primary}
                        type='submit'
                      >{uiText("다음: 맞춤 일정")}<ArrowRight size={16} />
                      </button>
                    </div>
                  </>
                )}
                {step === 1 && (
                  <>
                    <section>
                      <h2>{uiText(type.label)}{uiText("에 맞게")}</h2>
                      <p>{uiText("모르는 조건은 미정으로 두어도 됩니다. 필요한 이용 조건만 입력해 주세요.")}</p>
                      <div className={styles.formGrid}>
                        {type.fields.map((field) => (
                          <Field fieldKey={'typeDetails.' + field.key}
                            key={field.key}
                            label={uiText(field.label)}
                            hint={uiText(field.hint)}
                            placeholder={uiText(field.placeholder)}
                            type={field.type || 'text'}
                            value={input.typeDetails[field.key] || ''}
                            onChange={(v) =>
                              nested('typeDetails', field.key, String(v))
                            }
                            maxLength={600}
                            min={
                              field.type === 'number'
                                ? field.key === 'meetingMinutes'
                                  ? 30
                                  : 0
                                : undefined
                            }
                            max={field.type === 'number' ? 480 : undefined}
                            required={field.required}
                            optional={!field.required}
                          />
                        ))}
                      </div>
                    </section>
                    <section>
                      <h2>{uiText("관심사와 선택 조건")}</h2>
                      <fieldset>
                        <legend>
                          <FieldHead
                            label={uiText("관심 테마")}
                            hint={uiText(FIELD_GUIDE.themes.hint)}
                          />
                        </legend>
                        <div className={styles.checks}>
                          {[
                            '자연',
                            '바다',
                            '역사',
                            '전시',
                            '맛집',
                            '카페',
                            '야경',
                            '체험',
                          ].map((t) => (
                            <label key={t}>
                              <input
                                type='checkbox'
                                checked={input.themes.includes(t)}
                                onChange={(e) =>
                                  update(
                                    'themes',
                                    e.target.checked
                                      ? [...input.themes, t]
                                      : input.themes.filter((v) => v !== t),
                                  )
                                }
                              />
                              {uiText(t)}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <div className={styles.formGrid}>
                        {PREFERENCE_FIELDS.map((field) => (
                          <Field fieldKey={'preferences.' + field.key}
                            key={field.key}
                            label={uiText(field.label)}
                            hint={uiText(field.hint)}
                            placeholder={uiText(field.placeholder)}
                            value={input.preferences[field.key] || ''}
                            onChange={(v) =>
                              nested('preferences', field.key, v)
                            }
                            maxLength={600}
                            optional
                          />
                        ))}
                      </div>
                      <PlaceInput
                        label={uiText(`꼭 방문할 장소 (${input.mustVisitIds.length}/${MUST_VISIT_LIMIT})`)}
                        hint={uiText(FIELD_GUIDE.mustVisit.hint)}
                        value={null}
                        allowUser={false}
                        districtId={input.districtId}
                        onChange={(v) =>
                          addPlace(
                            'mustVisitIds',
                            'excludedIds',
                            MUST_VISIT_LIMIT,
                            v,
                          )
                        }
                      />
                      <TravelPlaceChips
                        ids={input.mustVisitIds}
                        labels={placeLabels}
                        prefix='필수'
                        onRemove={(id) =>
                          update(
                            'mustVisitIds',
                            input.mustVisitIds.filter(
                              (x) => placeId(x) !== placeId(id),
                            ),
                          )
                        }
                      />
                      <PlaceInput
                        label={uiText(`제외할 장소 (${input.excludedIds.length}/20)`)}
                        hint={uiText(FIELD_GUIDE.excluded.hint)}
                        value={null}
                        allowUser={false}
                        districtId={input.districtId}
                        onChange={(v) =>
                          addPlace('excludedIds', 'mustVisitIds', 20, v)
                        }
                      />
                      <TravelPlaceChips
                        ids={input.excludedIds}
                        labels={placeLabels}
                        prefix='제외'
                        onRemove={(id) =>
                          update(
                            'excludedIds',
                            input.excludedIds.filter(
                              (x) => placeId(x) !== placeId(id),
                            ),
                          )
                        }
                      />
                      <TextAreaField fieldKey='message'
                        label={uiText("기타 요청·제외할 활동")}
                        hint={uiText(FIELD_GUIDE.message.hint)}
                        placeholder={uiText(FIELD_GUIDE.message.placeholder)}
                        maxLength={1500}
                        value={input.message}
                        onChange={(v) => update('message', v)}
                        optional
                      />
                    </section>
                    <section>
                      <h2>{uiText("이미 정해진 일정")}</h2>
                      <p>{uiText("회의나 예약한 식사처럼 움직일 수 없는 시간은 잠금 일정으로 넣습니다. 없으면 건너뛰세요.")}</p>
                      {input.fixedItems.map((f, index) => (
                        <div
                          className={styles.fixedRow}
                          key={`${index}-${f.title}`}
                        >
                          <span>
                            {uiText(toDateValue(f.date) || f.date)}{uiText(' ')}
                            {uiText(toClock(f.start) || f.start)} · {f.title} ·{uiText(' ')}
                            {uiText(f.minutes)}{uiText("분")}</span>
                          <button
                            type='button'
                            data-intent='danger'
                            onClick={() =>
                              update(
                                'fixedItems',
                                input.fixedItems.filter((_, i) => i !== index),
                              )
                            }
                          >{uiText("삭제")}</button>
                        </div>
                      ))}
                      <div className={styles.formGrid}>
                        <Field
                          label={uiText("고정 일정 날짜")}
                          hint={uiText(FIELD_GUIDE.fixedDate.hint)}
                          type='date'
                          value={fixed.date || input.startDate}
                          onChange={(v) => setFixed({ ...fixed, date: v })}
                          min={input.startDate}
                          max={input.endDate}
                          optional
                        />
                        <Field
                          label={uiText("고정 시작 시각")}
                          hint={uiText(FIELD_GUIDE.fixedStart.hint)}
                          type='time'
                          value={fixed.start}
                          onChange={(v) => setFixed({ ...fixed, start: v })}
                          optional
                        />
                        <Field
                          label={uiText("소요 시간 (분)")}
                          hint={uiText(FIELD_GUIDE.fixedMinutes.hint)}
                          placeholder={uiText(FIELD_GUIDE.fixedMinutes.placeholder)}
                          type='number'
                          min={10}
                          max={480}
                          value={fixed.minutes}
                          onChange={(v) => setFixed({ ...fixed, minutes: v })}
                          optional
                        />
                        <Field
                          label={uiText("일정 이름")}
                          hint={uiText(FIELD_GUIDE.fixedTitle.hint)}
                          placeholder={uiText(FIELD_GUIDE.fixedTitle.placeholder)}
                          value={fixed.title}
                          onChange={(v) => setFixed({ ...fixed, title: v })}
                          maxLength={150}
                          optional
                        />
                        <Select
                          label={uiText("활동 유형")}
                          hint={uiText(FIELD_GUIDE.fixedKind.hint)}
                          value={fixed.kind}
                          onChange={(v) => setFixed({ ...fixed, kind: v })}
                          options={{
                            SESSION: '회의·교육',
                            TEAM: '팀 활동',
                            MEAL: '식사',
                            REST: '휴식',
                            FREE: '자유시간',
                          }}
                          optional
                        />
                      </div>
                      <PlaceInput
                        label={uiText("고정 일정 장소·주소 검색")}
                        hint={uiText(FIELD_GUIDE.fixedPlace.hint)}
                        value={{
                          name: fixed.location,
                          contentId: fixed.contentId,
                          address: fixed.address,
                        }}
                        onChange={(v) =>
                          setFixed({
                            ...fixed,
                            location: v.name,
                            contentId: v.contentId,
                            address: v.address,
                          })
                        }
                        districtId={input.districtId}
                      />
                      <button
                        type='button'
                        disabled={input.fixedItems.length >= 20}
                        onClick={addFixed}
                      >{uiText("+ 고정 일정 추가")}</button>
                    </section>
                    <div className={styles.actions}>
                      <button
                        type='button'
                        onClick={() => openStep(0)}
                      >{uiText("이전")}</button>
                      <button
                        className={styles.primary}
                        type='submit'
                      >{uiText("입력 조건 확인")}</button>
                    </div>
                  </>
                )}
                {step === 2 && (
                  <section>
                    <h2>{uiText("이 조건으로 여행을 준비합니다")}</h2>
                    <dl className={styles.summary}>
                      <dt>{uiText("여행")}</dt>
                      <dd>
                        {uiText(type.label)} · {uiText(days)}{uiText("일 ·")}{uiText(' ')}
                        {uiText(districtLabels[input.districtId] || '인천 전체')}
                      </dd>
                      <dt>{uiText("기간")}</dt>
                      <dd>
                        {uiText(toDateValue(input.startDate) || input.startDate)}{uiText(' ')}
                        {uiText(toClock(input.firstStart) || input.firstStart)} →{uiText(' ')}
                        {uiText(toDateValue(input.endDate) || input.endDate)}{uiText(' ')}
                        {uiText(toClock(input.lastEnd) || input.lastEnd)}
                      </dd>
                      <dt>{uiText("동행")}</dt>
                      <dd>{uiText("성인")}{uiText(input.party.adults)}{uiText("· 아동")}{uiText(input.party.children)}{uiText(' ')}{uiText("· 유아")}{uiText(input.party.infants)}
                      </dd>
                      <dt>{uiText("이동")}</dt>
                      <dd>
                        {uiText(input.start.name)} → {uiText(input.end.name)} ·{uiText(' ')}
                        {uiText(TRANSPORT[input.transport])}
                      </dd>
                      <dt>{uiText("예산")}</dt>
                      <dd>
                        {uiText(input.budget.mode === 'RECOMMEND'
                          ? '추천받기 (확정 예산 없음)'
                          : `${
                              input.budget.mode === 'TOTAL' ? '전체' : '1인당'
                            } ${money(input.budget.amount)}`)}{uiText(' ')}{uiText("· 예비비")}{uiText(input.budget.contingencyPercent)}%
                      </dd>
                      <dt>{uiText("포함 범위")}</dt>
                      <dd>
                        {input.budget.included
                          .map((v) => CATEGORIES[v])
                          .join(', ')}
                      </dd>
                      <dt>{uiText("관심사")}</dt>
                      <dd>{uiText(input.themes.join(', ') || '미정')}</dd>
                      <dt>{uiText("꼭 방문")}</dt>
                      <dd>
                        {input.mustVisitIds.length
                          ? input.mustVisitIds
                              .map((id) => placeChipLabel(id, placeLabels))
                              .join(', ')
                          : '없음'}
                      </dd>
                      <dt>{uiText("숙박")}</dt>
                      <dd>
                        {uiText(days === 1
                          ? '제외'
                          : `${input.lodging.rooms}객실 · ${
                              input.lodging.name || '숙소 미정'
                            }`)}
                      </dd>
                      <dt>{uiText("고정 일정")}</dt>
                      <dd>{uiText(input.fixedItems.length)}{uiText("개")}</dd>
                    </dl>
                    <h3>{uiText("적용할 기본값·확인할 사항")}</h3>
                    <ul>
                      <li>{uiText("중간 날짜는 08~21시, 이동마다 대기·주차 여유 15분을 적용합니다.")}</li>
                      <li>{uiText("공개 요금은 산정 근거와 함께 반영합니다. 정보가 없는 식사·카페는 계획용 추정값이며, 그 외 미산정 비용은 견적이 필요할 수 있습니다.")}</li>
                      <li>{uiText("운영·예약·접근성·배편·여행 날짜 날씨는 확인 필요로 남을 수 있습니다.")}</li>
                      <li>{uiText("별도 선택 조건을 입력하지 않은 항목은 미정으로 보존합니다.")}</li>
                      <li>{uiText("일정 생성에는 보통 1~3분이 걸립니다. 화면을 닫아도 생성이 이어집니다.")}</li>
                    </ul>
                    <div className={styles.actions}>
                      <button
                        type='button'
                        onClick={() => openStep(1)}
                        disabled={pending}
                      >{uiText("조건 수정")}</button>
                      <button
                        type='button'
                        className={styles.primary}
                        onClick={() => generate(input, 'all')}
                        disabled={pending}
                      >
                        <Route size={17} />
                        {uiText(pending
                          ? '생성 요청 중'
                          : user?.authenticated
                            ? '여행계획 생성'
                            : '로그인하고 생성하기')}
                      </button>
                    </div>
                    {!user?.authenticated && (
                      <p className={styles.hint}>{uiText("로그인 후 이 화면으로 돌아옵니다. 같은 탭에서 입력한 여행 조건과 장소가 유지됩니다.")}</p>
                    )}
                  </section>
                )}
              </form>
            )}
            <aside>
              <PlanSummary input={input} />
              <TemplatePreview type={input.tripType} />
            </aside>
          </div></TravelValidationProvider>
        </>
      )}
    </TravelShell>
  );
}
