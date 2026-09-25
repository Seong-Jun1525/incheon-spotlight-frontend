/**
 * TravelShared.jsx — 여행계획 화면에서 공용으로 쓰는 UI 조각 모음
 * - 도움말 툴팁과 오류 표시가 붙은 입력·선택·textarea 필드, 공통 레이아웃 셸
 * - 입력 조건 요약 카드와 다운로드 문서 구성 미리보기
 * - 생성 작업 진행 패널(단계 표시·경과 시간·취소)과 장소/주소/관광지 검색 입력
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { useFieldError } from './TravelValidation';
import { Skeleton } from '../atoms/Skeleton';
import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronRight, FileSpreadsheet, Home, MapPin, Search, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SiteChrome } from '../layout/SiteChrome';
import { getTravelJob, cancelTravelJob, searchTravelPlaces, getTravelTemplates } from '../../api/travelPlanApi';
import { getApiErrorMessage } from '../../api/http';
import { useAppLanguage } from '../../hooks/useAppLanguage';
import { COMMON_SHEETS, TYPES, STAGES, stageOf, TRANSPORT, money, tripDays, placeChipLabel, toClock, toDateValue } from './travelConfig';
import styles from './TravelPlanner.module.scss';

const SEARCH_MODES = { PLACE: '장소명', ADDRESS: '도로명·지번주소', TOUR: '인천 관광지' };

export function HelpTip({ text, label }) {
  useUiLanguage();
  if (!text) return null;
  return (
    <button type='button' className={styles.helpTip} aria-label={uiText(`${label || '이 항목'} 도움말`)}>
      <span aria-hidden='true'>?</span>
      <span className={styles.helpBubble} role='tooltip'>{uiText(text)}</span>
    </button>
  );
}

export function FieldHead({ label, hint, required, htmlFor }) {
  useUiLanguage();
  const mark = required
    ? <em className={styles.required} aria-hidden='true'>*</em>
    : <small className={styles.optional}>{uiText("선택")}</small>;
  return (
    <div className={styles.fieldHead}>
      {htmlFor
        ? <label htmlFor={htmlFor}>{uiText(label)}{uiText(mark)}</label>
        : <span>{uiText(label)}{uiText(mark)}</span>}
      <HelpTip label={uiText(label)} text={hint} />
    </div>
  );
}

export function Field({ label, hint, value, onChange, type = 'text', optional, fieldKey, ...props }) {
  useUiLanguage();
  const id = useId();
  const fieldError = useFieldError(fieldKey);
  const shown = type === 'time' ? toClock(value) : type === 'date' ? toDateValue(value) : (value ?? '');
  return (
    <div data-field={fieldKey} className={styles.field}>
      <FieldHead label={uiText(label)} hint={uiText(hint)} required={props.required} optional={optional} htmlFor={id} />
      <input id={id} aria-invalid={!!fieldError} aria-describedby={fieldError ? id + "-error" : undefined} type={type} value={shown} onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} {...props} />
      {fieldError && <p id={id + "-error"} className={styles.inlineError}>{uiText(fieldError)}</p>}
    </div>
  );
}

export function Select({ label, hint, value, onChange, options, optional, fieldKey, ...props }) {
  useUiLanguage();
  const id = useId();
  const fieldError = useFieldError(fieldKey);
  return (
    <div data-field={fieldKey} className={styles.field}>
      <FieldHead label={uiText(label)} hint={uiText(hint)} required={props.required} optional={optional} htmlFor={id} />
      <select id={id} aria-invalid={!!fieldError} aria-describedby={fieldError ? id + "-error" : undefined} value={value} onChange={(e) => onChange(e.target.value)} {...props}>{Object.entries(options).map(([key, text]) => <option key={key} value={key}>{uiText(text)}</option>)}</select>
      {fieldError && <p id={id + "-error"} className={styles.inlineError}>{uiText(fieldError)}</p>}
    </div>
  );
}

export function TextAreaField({ label, hint, value, onChange, optional, fieldKey, ...props }) {
  useUiLanguage();
  const id = useId();
  const fieldError = useFieldError(fieldKey);
  return (
    <div data-field={fieldKey} className={`${styles.field} ${styles.wideField}`}>
      <FieldHead label={uiText(label)} hint={uiText(hint)} required={props.required} optional={optional} htmlFor={id} />
      <textarea id={id} aria-invalid={!!fieldError} aria-describedby={fieldError ? id + "-error" : undefined} value={value} onChange={(e) => onChange(e.target.value)} {...props} />
      {fieldError && <p id={id + "-error"} className={styles.inlineError}>{uiText(fieldError)}</p>}
    </div>
  );
}

export function TravelShell({ children, current, dirty = false }) {
  useUiLanguage();
  const location = useLocation();
  const creating = location.pathname.startsWith('/travel-planner');
  const heading = current || (creating ? '여행계획 만들기' : '내 여행계획');
  const leave = (event) => {
    if (dirty && !window.confirm('저장하지 않은 변경사항이 있습니다. 이 페이지를 나가시겠어요?')) event.preventDefault();
  };
  return <SiteChrome activeNavId='travel'><main className={styles.page}>
    <nav className={styles.breadcrumb} aria-label={uiText("현재 위치")}>
      <Link to='/' aria-label={uiText("홈")} onClick={leave}><Home size={14} /></Link>
      <ChevronRight size={13} />
      <Link to='/travel-planner' onClick={leave}>{uiText("여행계획")}</Link>
      <ChevronRight size={13} />
      <span>{uiText(heading)}</span>
    </nav>
    <nav className={styles.topTabs} aria-label={uiText("여행계획 메뉴")}>
      <NavLink to='/travel-planner' onClick={leave}>{uiText("여행계획 만들기")}</NavLink>
      <NavLink to='/travel-plans' onClick={leave}>{uiText("내 여행계획")}</NavLink>
    </nav>{uiText(children)}
  </main></SiteChrome>;
}
export function TemplatePreview({ type }) {
  useUiLanguage();
  const template = TYPES.find((t) => t.id === type) || TYPES[1];
  return <section className={styles.preview} aria-label={uiText("엑셀 시트 구성 예시")}>
    <div className={styles.previewHeading}><FileSpreadsheet size={24} /><span>{uiText("다운로드 문서 구성")}</span><b>XLSX</b></div><h3>{uiText(template.label)}{uiText("계획서")}</h3><p>{uiText(template.description)}</p>
    <ol>{[...COMMON_SHEETS, template.sheet].map((sheet, i) => <li key={sheet}><span>{String(i + 1).padStart(2, '0')}</span>{uiText(sheet)}</li>)}</ol>
    <small>{uiText("유형별 양식 예시입니다. 생성 후 실제 일정·비용·확인사항으로 채워집니다.")}</small>
  </section>;
}
export function PlanSummary({ input }) {
  useUiLanguage();
  const days = tripDays(input.startDate, input.endDate);
  const type = TYPES.find((t) => t.id === input.tripType);
  return <section className={styles.liveSummary} aria-label={uiText("입력한 여행 조건")}>
    <p className={styles.eyebrow}>{uiText("나의 여행 조건")}</p><h3>{uiText(type?.label || '여행계획')}</h3>
    <dl><dt>{uiText("여행 기간")}</dt><dd>{uiText(days > 0 ? days === 1 ? '당일 여행' : `${days - 1}박 ${days}일` : '날짜 선택 전')}<small>{uiText(toDateValue(input.startDate) || input.startDate)}{uiText(input.endDate && ` — ${toDateValue(input.endDate) || input.endDate}`)}</small></dd>
      <dt>{uiText("여행 인원")}</dt><dd>{Number(input.party.adults) + Number(input.party.children) + Number(input.party.infants)}{uiText("명")}</dd>
      <dt>{uiText("교통수단")}</dt><dd>{uiText(TRANSPORT[input.transport])}</dd><dt>{uiText("여행 예산")}</dt><dd>{uiText(input.budget.mode === 'RECOMMEND' ? '추천받기' : input.budget.amount === '' ? '입력 전' : `${input.budget.mode === 'PER_PERSON' ? '1인당 ' : ''}${money(input.budget.amount)}`)}</dd></dl>
    <div className={styles.summaryRoute}><MapPin size={17} /><div><b>{uiText(input.start.name || '출발지 선택 전')}</b><span>↓</span><b>{uiText(input.end.name || '도착지 선택 전')}</b></div></div>
    <p className={styles.hint}>{uiText(input.message?.trim() ? '요청하신 내용을 우선해 일정을 만들고, 생성 후 시간과 비용을 수정할 수 있습니다.' : '입력한 조건으로 일정을 만들고, 생성 후 시간과 비용을 수정할 수 있습니다.')}</p>
  </section>;
}
export function TravelJobPanel({ id, onComplete, onRestore }) {
  useUiLanguage();
  const seen = useRef('');
  const [, setTick] = useState(0);
  const query = useQuery({ queryKey: ['travel-job', id], queryFn: () => getTravelJob(id), enabled: Boolean(id), refetchInterval: (q) => ['QUEUED', 'RUNNING'].includes(q.state.data?.state) ? 2000 : false, retry: 1 });
  const cancel = useMutation({ mutationFn: () => cancelTravelJob(id), onSuccess: () => query.refetch() });
  const job = query.data;
  const running = ['QUEUED', 'RUNNING'].includes(job?.state);
  useEffect(() => {
    if (job?.state !== 'SUCCEEDED' || !job.planId || seen.current === job.id) return;
    seen.current = job.id;
    onComplete?.(job);
  }, [job, onComplete]);
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [running, id]);
  if (!id) return null;
  const wait = elapsedParts(job?.createdAt);
  const stage = stageOf(job?.stage);
  const keys = Object.keys(STAGES);
  const heading = job?.state === 'SUCCEEDED' ? '검토용 초안을 저장했습니다' : job?.state === 'FAILED' ? '이번 생성은 끝내지 못했습니다' : job?.state === 'CANCELLED' ? '생성을 취소했습니다' : '여행계획을 만들고 있습니다';
  return <section className={styles.job} aria-live='polite'>
    <p className={styles.eyebrow}>{uiText("여행계획 생성")}</p>
    <h2>{uiText(heading)}</h2>
    {running && <div className={styles.jobSpinner} aria-hidden='true' />}
    {running && <p className={styles.jobWait}>{uiText("장소를 찾고 하루 일정을 짜는 데 보통 1~2분이 걸립니다. 이 화면을 닫아도 생성이 이어지며, 내 여행계획에서 다시 확인할 수 있습니다.")}</p>}
    {running && wait.label ? <p className={styles.jobElapsed}>{uiText("경과")}{uiText(wait.label)}</p> : null}
    {job && <ol className={styles.jobStages}>{keys.map((key, index) => {
      const copy = stageOf(key);
      const done = keys.indexOf(job.stage) > index || job.state === 'SUCCEEDED';
      const current = job.stage === key;
      return <li key={key} data-done={done} aria-current={current ? 'step' : undefined}><span>{done ? <Check size={14} /> : index + 1}</span><b>{uiText(copy.label)}</b></li>;
    })}</ol>}
    {query.isError ? <p role='alert'>{getApiErrorMessage(query.error)} <button type='button' onClick={() => query.refetch()}>{uiText("상태 다시 확인")}</button></p> : null}
    {job && running && <div className={styles.jobNow}>
      <p className={styles.eyebrow}>{uiText(job.state === 'QUEUED' ? '대기 중' : '지금 하는 일')}</p>
      <h3>{stage.title}{uiText(job.state === 'QUEUED' ? ' · 앞선 작업을 기다리는 중입니다' : '')}</h3>
      <p>{uiText(stage.detail)}</p>
      {wait.seconds > 180 && job.stage === 'AI' ? <p>{uiText("이 단계는 조금 더 걸릴 수 있습니다. 실패하면 이 화면에 안내가 나타납니다.")}</p> : null}
    </div>}
    {job && <>
      {job.errorMessage ? <p className={styles.jobError} role='alert'>{uiText(job.errorMessage)}</p> : null}
      {running ? <button type='button' disabled={cancel.isPending} onClick={() => cancel.mutate()}>{uiText("생성 취소")}</button>
        : job.state === 'SUCCEEDED' && job.planId ? <Link className={styles.primary} to={`/travel-plans/${job.planId}`}>{uiText("저장한 계획 열기")}</Link>
        : onRestore && job.state !== 'SUCCEEDED' ? <button type='button' onClick={() => onRestore(job.input)}>{uiText(job.planId ? '이어서 수정하기' : '입력을 복원하고 수정하기')}</button>
        : job.planId ? <Link className={styles.primary} to={`/travel-plans/${job.planId}`}>{uiText("저장한 계획 열기")}</Link>
        : job.state === 'SUCCEEDED' ? <p role='status'>{uiText("저장한 계획 번호가 아직 연결되지 않았습니다. 내 여행계획에서 확인해 주세요.")}</p>
        : null}
    </>}
    {cancel.isError && <p role='alert'>{getApiErrorMessage(cancel.error)}</p>}
  </section>;
}

function elapsedParts(createdAt) {
  const started = Date.parse(createdAt);
  if (!Number.isFinite(started)) return { seconds: 0, label: '' };
  const seconds = Math.max(0, Math.floor((Date.now() - started) / 1000));
  if (seconds < 60) return { seconds, label: `${seconds}초` };
  if (seconds < 3600) return { seconds, label: `${Math.floor(seconds / 60)}분 ${seconds % 60}초` };
  return { seconds, label: `${Math.floor(seconds / 3600)}시간 ${Math.floor((seconds % 3600) / 60)}분` };
}
export function TravelPlaceChips({ ids = [], labels = {}, prefix, onRemove }) {
  useUiLanguage();
  if (!ids.length) return null;
  return (
    <div className={styles.chips}>
      {ids.map((id) => (
        <button type='button' data-intent='danger' key={id} aria-label={uiText(`${placeChipLabel(id, labels)} ${prefix}에서 삭제`)} onClick={() => onRemove(id)}>
          {uiText(prefix)} {placeChipLabel(id, labels)} <X size={13} />
        </button>
      ))}
    </div>
  );
}

export function PlaceInput({ label, hint, value, onChange, districtId = 'incheon', allowUser = true, disabled = false, required = false, fieldKey }) {
  useUiLanguage();
  const id = useId();
  const fieldError = useFieldError(fieldKey);
  const language = useAppLanguage();
  const [keyword, setKeyword] = useState('');
  const [mode, setMode] = useState('PLACE');
  const [search, setSearch] = useState(null);
  const [error, setError] = useState('');
  const templates = useQuery({ queryKey: ['travel-templates'], queryFn: getTravelTemplates, staleTime: 5 * 60 * 1000, retry: 1 });
  const poiSearchOn = templates.data?.placeSearchEnabled !== false;
  const q = useQuery({ queryKey: ['travel-place-search', language, search?.keyword, search?.mode, districtId], queryFn: ({ signal }) => searchTravelPlaces(search.keyword, districtId, search.mode, signal), enabled: Boolean(search), retry: false, gcTime: 0, refetchOnWindowFocus: false });
  const inputValue = allowUser ? value?.name || '' : keyword;
  useEffect(() => {
    if (poiSearchOn || mode === 'TOUR') return;
    setMode('TOUR');
    setSearch(null);
  }, [poiSearchOn, mode]);
  const submit = () => {
    const text = inputValue.trim();
    if (text.length < 2) {setError('검색어를 2글자 이상 입력해 주세요.');return;}
    setError('');
    if (search?.keyword === text && search?.mode === mode) q.refetch();
    else setSearch({ keyword: text, mode });
  };
  return <div className={styles.placeSearch} data-field={fieldKey}>
    <FieldHead label={uiText(label)} hint={uiText(hint)} htmlFor={id} required={required} />
    <div className={styles.searchModes} role='group' aria-label={uiText(`${label} 검색 방식`)}>
      {Object.entries(SEARCH_MODES).map(([key, text]) => {
        const blocked = key !== 'TOUR' && !poiSearchOn;
        return <button type='button' key={key} disabled={disabled || blocked} aria-pressed={mode === key} onClick={() => {setMode(key);setSearch(null);setError('');}}>{uiText(text)}</button>;
      })}
    </div>
    <div className={styles.searchBox}><Search size={18} aria-hidden='true' /><input id={id} disabled={disabled} value={inputValue} onChange={(e) => {setKeyword(e.target.value);setSearch(null);setError('');if (allowUser) onChange({ name: e.target.value, contentId: null });}} onKeyDown={(e) => {if (e.key === 'Enter' && !e.nativeEvent.isComposing) {e.preventDefault();submit();} if (e.key === 'Escape') setSearch(null);}} aria-describedby={`${id}-help ${id}-error`} aria-invalid={Boolean(error || fieldError)} aria-required={required || undefined} maxLength={150} placeholder={uiText(mode === 'ADDRESS' ? '예: 인천 연수구 컨벤시아대로 160' : mode === 'TOUR' ? '예: 월미도, 센트럴파크' : '역·숙소·식당·건물명을 입력하세요')} /><button type='button' className={styles.primary} disabled={disabled || q.isFetching} onClick={submit}>{uiText(q.isFetching ? '검색 중' : '검색')}</button></div>
    <p id={`${id}-help`} className={styles.searchHelp}>{uiText(!poiSearchOn ? '장소명·주소 검색이 잠시 꺼져 있습니다. 인천 관광지 검색을 이용해 주세요.' : mode === 'ADDRESS' ? '도로명+건물번호 또는 동·리+지번으로 검색합니다.' : mode === 'TOUR' ? '선택한 인천 구·군의 관광정보를 검색합니다.' : '전국 검색이 가능합니다. 지역명을 함께 입력하면 더 정확합니다.')}</p>
    {value?.contentId && <div className={styles.selectedPlace}><Check size={17} /><div><strong>{uiText(value.name)}</strong><small>{uiText(value.address || '검색한 장소가 선택되었습니다.')}</small></div><button type='button' aria-label={uiText(`${label} 선택 해제`)} disabled={disabled} onClick={() => {onChange({ name: '', contentId: null });setKeyword('');setSearch(null);}}><X size={17} /></button></div>}
    {allowUser && inputValue.trim() && !value?.contentId && !search && <small className={styles.searchHelp}>{uiText("직접 입력 상태입니다. 검색 결과를 선택하면 주소·좌표가 일정에 반영됩니다.")}</small>}
    {(error || fieldError) && <p id={id + '-error'} className={styles.inlineError} role='alert'>{uiText(error || fieldError)}</p>}
    {search && <div className={styles.searchResults} aria-label={uiText(`${label} 검색 결과`)} aria-busy={q.isFetching}>
      {q.isFetching ? <Skeleton count={2} /> : q.isError ? <div className={styles.searchEmpty} role='alert'><p>{getApiErrorMessage(q.error)}</p><button type='button' onClick={() => q.refetch()}>{uiText("다시 검색")}</button></div> : q.data && <>
        <div className={styles.resultsHeader}><span role='status'>{uiText("검색 결과")}<b>{uiText(q.data.length)}</b>{uiText("건")}</span><button type='button' onClick={() => setSearch(null)} aria-label={uiText("검색 결과 닫기")}><X size={16} /></button></div>
        {q.data.length ? <ul>{q.data.map((p, index) => <li key={`${p.contentId}-${index}`}><button type='button' onClick={() => {onChange({ name: p.title, contentId: String(p.contentId), address: p.address, roadAddress: p.roadAddress, jibunAddress: p.jibunAddress, mapX: p.mapX, mapY: p.mapY, source: p.source });setSearch(null);setKeyword('');}}><MapPin size={18} /><div><strong>{p.title}</strong>{p.roadAddress && <small><em>{uiText("도로명")}</em>{uiText(p.roadAddress)}</small>}{p.jibunAddress && <small><em>{uiText("지번")}</em>{uiText(p.jibunAddress)}</small>}{!p.roadAddress && !p.jibunAddress && <small>{uiText(p.address || '주소 정보 없음')}</small>}</div><span className={styles.resultSelect}>{uiText("선택")}<ChevronRight size={15} /></span></button></li>)}</ul> : <div className={styles.searchEmpty}><Search size={24} /><p>{uiText("검색 결과가 없습니다.")}</p><small>{uiText("지역명과 건물번호를 확인하거나 다른 검색 방식을 선택해 주세요.")}</small></div>}
      </>}
    </div>}
  </div>;
}
