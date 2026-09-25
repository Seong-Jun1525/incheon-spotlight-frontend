/**
 * TravelPlanDetailPage.jsx — 여행계획 상세 편집 화면
 * - 라우트: `/travel-plans/:planId` (로그인 필요)
 * - getTravelPlan 으로 불러온 계획을 일정·예산·예약/준비·엑셀 미리보기 탭에서 고치고 patchTravelPlan 으로 저장
 * - 특정 날짜나 선택 항목만 replanTravelPlan 으로 다시 짜고, 확정본은 downloadTravelExcel 로 내려받음
 */
import { uiText, useUiLanguage } from '../i18n/uiText';
import { Skeleton } from '../components/atoms/Skeleton';
import { getDisplayLocale } from '../utils/formatDate';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, ExternalLink, LockKeyhole, Plus, Save, Trash2, Undo2 } from 'lucide-react';
import { getTravelPlan, patchTravelPlan, replanTravelPlan, downloadTravelExcel, deleteTravelPlan } from '../api/travelPlanApi';
import { getApiErrorMessage } from '../api/http';
import { BUDGET_MODE, CATEGORIES, EVIDENCE, KINDS, TYPES, TRANSPORT, costPlace, money, placeHomepage, toClock, toDateValue, endClock, formatDistanceM, hideTravelVendor, travelSourceLabel } from '../components/travel/travelConfig';
import { TravelShell, TemplatePreview, TravelJobPanel, PlaceInput, HelpTip } from '../components/travel/TravelShared';
import styles from '../components/travel/TravelPlanner.module.scss';
import { TravelDateEditor } from '../components/travel/TravelDateEditor';
import { FavoritePlacePicker } from '../components/travel/FavoritePlacePicker';
import { toMapPageState } from '../utils/mapNavigation';

const number = (v) => v === '' || v == null ? null : Number(v);
function Evidence({ value }) {
  useUiLanguage();
  const status = EVIDENCE[value?.status] || '아직 확인 전';
  const when = value?.retrievedAt ? new Date(value.retrievedAt).toLocaleDateString(getDisplayLocale()) : '';
  const source = travelSourceLabel(value?.source);
  const note = hideTravelVendor(value?.note);
  return <span className={styles.evidence} title={uiText(note || status)}>{uiText(status)}{uiText(source ? ` · ${source}` : '')}{uiText(when ? ` · ${when}` : '')}</span>;
}
function EvidenceFact({ label, value, hint }) {
  useUiLanguage();
  return (
    <span className={styles.evidenceItem}>
      <span className={styles.evidenceLabel}>{uiText(label)}</span>
      <Evidence value={value} />
      <HelpTip label={uiText(label)} text={hint} />
    </span>
  );
}
function PlaceLinks({ place }) {
  useUiLanguage();
  if (!place) return null;
  const homepage = placeHomepage(place.url);
  const mapId = place.contentId && !String(place.contentId).startsWith('tmap:') ? place.contentId : '';
  if (!homepage && !mapId) return null;
  return (
    <p className={styles.placeLinks}>
      {homepage ? <a href={homepage} target='_blank' rel='noopener noreferrer'>{uiText("장소 홈페이지")}<ExternalLink size={13} /></a> : null}
      {mapId ? <Link to={`/map/${mapId}`} state={toMapPageState(place)}>{uiText("지도에서 보기")}</Link> : null}
    </p>
  );
}

export default function TravelPlanDetailPage() {
  useUiLanguage();
  const { planId } = useParams();
  const query = useQuery({ queryKey: ['travel-plan', planId], queryFn: () => getTravelPlan(planId), refetchOnWindowFocus: false });
  if (query.isPending) return <TravelShell current={uiText("계획 상세")}><Skeleton variant='detail' label={uiText("여행계획을 불러오는 중…")} /></TravelShell>;
  if (query.isError) return <TravelShell current={uiText("계획 상세")}><p className={styles.alert} role='alert'>{getApiErrorMessage(query.error)} <button type='button' onClick={() => query.refetch()}>{uiText("다시 시도")}</button></p></TravelShell>;
  return <PlanEditor initial={query.data} onRefresh={query.refetch} />;
}

function PlanEditor({ initial, onRefresh }) {
  useUiLanguage();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(initial);
  const [tab, setTab] = useState('일정');
  const [date, setDate] = useState(toDateValue(initial.input.startDate) || initial.input.startDate);
  const [itemEdits, setItemEdits] = useState({});
  const [costEdits, setCostEdits] = useState({});
  const [taskEdits, setTaskEdits] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [jobId, setJobId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [replanMessage, setReplanMessage] = useState('');
  const [selected, setSelected] = useState([]);
  const [placeEditId, setPlaceEditId] = useState(null);
  const [budget, setBudget] = useState(initial.input.budget);
  const [addedIds, setAddedIds] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);
  const [lastRemoval, setLastRemoval] = useState(null);
  const [newItem, setNewItem] = useState(null);
  const request = useRef(null);
  const dirty = Boolean(addedIds.length || removedIds.length || Object.keys(itemEdits).length || Object.keys(costEdits).length || Object.keys(taskEdits).length || plan.title !== initial.title || JSON.stringify(budget) !== JSON.stringify(initial.input.budget));

  useEffect(() => {
    setPlan(initial);
    setBudget(initial.input.budget);
    setItemEdits({});
    setCostEdits({});
    setTaskEdits({});
    setSelected([]);
    setPlaceEditId(null);
    setDeleting(false);
    setAddedIds([]); setRemovedIds([]); setLastRemoval(null); setNewItem(null);
    setDate((current) => {
      const days = new Set(initial.items.map((item) => toDateValue(item.date) || item.date));
      const cur = toDateValue(current) || current;
      return days.has(cur) ? cur : (toDateValue(initial.input.startDate) || initial.input.startDate);
    });
  }, [initial.id, initial.revision]);

  useEffect(() => {
    if (!dirty) return;
    const prevent = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', prevent);
    return () => window.removeEventListener('beforeunload', prevent);
  }, [dirty]);

  const dates = [];
  for (let d = new Date(`${toDateValue(plan.input.startDate)}T00:00:00Z`); d.toISOString().slice(0, 10) <= toDateValue(plan.input.endDate); d.setUTCDate(d.getUTCDate() + 1)) dates.push(d.toISOString().slice(0, 10));
  const dayItems = plan.items.filter((i) => (toDateValue(i.date) || i.date) === date).sort((a, b) => toClock(a.start).localeCompare(toClock(b.start)));
  const dayPlaces = dayItems.filter((i) => i.place?.name);
  const unlocked = dayItems.filter((i) => !i.locked);
  const canReplan = unlocked.length > 0 && selected.every((id) => unlocked.some((item) => item.id === id));
  const excelReady = !dirty && initial.confirmed && !jobId;
  const typeLabel = TYPES.find((t) => t.id === plan.input.tripType)?.label || plan.input.tripType;
  const budgetLabel = BUDGET_MODE[budget.mode] || BUDGET_MODE[plan.input.budget.mode] || '예산';

  const editItem = (id, changes) => { setItemEdits((s) => ({ ...s, [id]: { ...s[id], id, ...changes } })); setPlan((s) => ({ ...s, items: s.items.map((i) => i.id === id ? { ...i, ...changes } : i) })); };
  const editCost = (id, changes) => { const cost = plan.costs.find((c) => c.id === id); setCostEdits((s) => ({ ...s, [id]: { ...(s[id] || cost), ...changes } })); setPlan((s) => ({ ...s, costs: s.costs.map((c) => c.id === id ? { ...c, ...changes } : c) })); };
  const editTask = (id, changes) => { setTaskEdits((s) => ({ ...s, [id]: { ...s[id], id, ...changes } })); setPlan((s) => ({ ...s, tasks: s.tasks.map((t) => t.id === id ? { ...t, ...changes } : t) })); };
  const removeItem = (item) => {
    if (['ACCESS', 'RETURN'].includes(item.kind)) return;
    setLastRemoval({ item, costs: plan.costs.filter((c) => c.itemId === item.id), tasks: plan.tasks.filter((t) => t.itemId === item.id), wasAdded: addedIds.includes(item.id) });
    setPlan((s) => ({ ...s, items: s.items.filter((i) => i.id !== item.id), costs: s.costs.filter((c) => c.itemId !== item.id), tasks: s.tasks.filter((t) => t.itemId !== item.id), legs: [] }));
    if (addedIds.includes(item.id)) setAddedIds((s) => s.filter((id) => id !== item.id));
    else setRemovedIds((s) => [...s, item.id]);
    setSelected((s) => s.filter((id) => id !== item.id));
    setPlaceEditId(null);
  };
  const undoRemoval = () => {
    const { item, costs, tasks, wasAdded } = lastRemoval;
    setPlan((s) => ({ ...s, items: [...s.items, item], costs: [...s.costs, ...costs], tasks: [...s.tasks, ...tasks], legs: [] }));
    if (wasAdded) setAddedIds((s) => [...s, item.id]);
    else setRemovedIds((s) => s.filter((id) => id !== item.id));
    setLastRemoval(null);
  };
  const addItem = (event) => {
    event.preventDefault();
    if (!newItem.activity.trim() || !newItem.start || !Number.isInteger(Number(newItem.minutes)) || Number(newItem.minutes) < 10 || Number(newItem.minutes) > 600) { setError('할 일·시작 시각·체류 시간(10~600분)을 확인해 주세요.'); return; }
    const id = crypto.randomUUID();
    const place = newItem.place?.name?.trim() ? { ...newItem.place, url: null, existence: { status: newItem.place.contentId ? 'UNKNOWN' : 'USER_PROVIDED' }, operation: { status: 'UNKNOWN' } } : null;
    const item = { id, date, start: newItem.start, minutes: Number(newItem.minutes), kind: newItem.kind, activity: newItem.activity.trim(), notes: '', place, reason: '직접 추가한 일정', locked: false, reservationStatus: '확인 필요', costIds: [] };
    setPlan((s) => ({ ...s, items: [...s.items, item], legs: [] })); setAddedIds((s) => [...s, id]); setNewItem(null); setError('');
  };
  const perform = async (fn) => { setBusy(true); setError(''); setNotice(''); try { await fn(); } catch (e) { setError(e.message && !e.response ? e.message : getApiErrorMessage(e)); } finally { setBusy(false); } };
  const persist = async (confirmed, { silent } = {}) => {
    const payload = {
      revision: initial.revision,
      title: plan.title,
      confirmed,
      budget: { ...budget, amount: budget.mode === 'RECOMMEND' ? null : number(budget.amount) },
      items: Object.values(itemEdits).filter((i) => !addedIds.includes(i.id) && initial.items.some((old) => old.id === i.id)).map(({ id, start, minutes, contentId, userPlace, activity, notes, reservationStatus, locked }) => removedIds.includes(id) ? { id, locked: false } : ({ id, start: toClock(start) || start, minutes, contentId, userPlace, activity, notes, reservationStatus, locked })),
      addedItems: plan.items.filter((i) => addedIds.includes(i.id)).map((i) => ({ id: i.id, date: toDateValue(i.date), start: toClock(i.start), minutes: i.minutes, kind: i.kind, contentId: i.place?.contentId || null, userPlace: i.place?.contentId ? null : i.place?.name || null, activity: i.activity, notes: i.notes })),
      removedItemIds: removedIds,
      costs: Object.values(costEdits).filter((c) => plan.costs.some((cost) => cost.id === c.id)).map((c) => ({
        id: c.id,
        unitPrice: number(c.unitPrice),
        quantity: number(c.quantity) ?? 1,
        occurrences: number(c.occurrences) ?? 1,
        actual: number(c.actual),
        prepaid: number(c.prepaid),
        included: c.included,
        selected: c.selected,
      })),
      tasks: Object.values(taskEdits).filter((t) => plan.tasks.some((task) => task.id === t.id)),
    };
    const saved = await patchTravelPlan(plan.id, payload);
    setPlan(saved);
    setItemEdits({});
    setCostEdits({});
    setTaskEdits({});
    setAddedIds([]); setRemovedIds([]); setLastRemoval(null);
    if (!silent) setNotice(saved.confirmed ? `v${saved.revision} 확정 저장 완료` : confirmed ? `맞출 항목이 남아 v${saved.revision} 초안으로 저장했습니다.` : `v${saved.revision} 초안 저장 완료`);
    await onRefresh();
    return saved;
  };
  const save = (confirmed) => perform(() => persist(confirmed));
  const replan = () => perform(async () => {
    const itemIds = selected.filter((id) => unlocked.some((item) => item.id === id));
    let revision = initial.revision;
    if (dirty) revision = (await persist(false, { silent: true })).revision;
    const scope = { revision, date, itemIds, message: replanMessage };
    const fingerprint = JSON.stringify(scope);
    if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, key: crypto.randomUUID() };
    const job = await replanTravelPlan(plan.id, scope, request.current.key);
    setJobId(job.id);
  });
  const replanHint = busy ? '요청을 처리하는 동안에는 다시 짤 수 없습니다.'
    : jobId ? '이미 다시 짜는 작업이 진행 중입니다.'
    : unlocked.length === 0 ? '이 날짜의 일정이 모두 고정되어 있습니다. ‘이 일정 고정’을 끈 뒤 다시 짜면 됩니다.'
    : !canReplan ? '선택한 항목이 고정되어 있습니다. 고정을 끄거나 다른 항목을 고르세요.'
    : dirty ? '지금 고친 내용(고정·시각·메모)을 저장한 뒤 다시 짭니다. 항목을 체크하지 않으면 이 날짜의 고정하지 않은 일정 전체가 대상입니다.'
    : selected.length ? `선택한 ${selected.length}개 항목만 다시 만듭니다.`
    : '항목을 체크하지 않아도 됩니다. 이 날짜에서 고정하지 않은 일정 전체를 다시 만듭니다.';
  const completed = useCallback(async () => {
    await onRefresh();
    setJobId(null);
    setNotice('다시 짠 일정을 반영했습니다.');
  }, [onRefresh]);
  const totals = plan.totals;
  return <TravelShell current={uiText(plan.title || '계획 상세')} dirty={dirty}>
    <header className={styles.pageHeader}>
      <div>
        <p className={styles.eyebrow}>{uiText(typeLabel)} · {uiText(plan.input.startDate)} ~ {uiText(plan.input.endDate)}</p>
        <label className={styles.titleInput}><span className={styles.srOnly}>{uiText("여행계획 제목")}</span><input value={plan.title} onChange={(e) => setPlan({ ...plan, title: e.target.value })} maxLength={120} disabled={!!jobId} /></label>
        <p>{uiText("저장 버전 v")}{uiText(initial.revision)} · {uiText(initial.confirmed ? '확정' : '검토 초안')} · {uiText(TRANSPORT[plan.input.transport])} · {plan.input.party.adults + plan.input.party.children + plan.input.party.infants}{uiText("명")}</p>
        <p className={styles.routeMeta}>{uiText("출발")}{uiText(plan.input.start?.name || '미입력')}{uiText("→ 도착")}{uiText(plan.input.end?.name || '미입력')}</p>
      </div>
      <Link to='/travel-plans'>{uiText("내 여행계획 →")}</Link>
    </header>
    <TravelDateEditor key={initial.revision} plan={initial} disabled={dirty || busy || !!jobId} onSaved={onRefresh} />
    <div className={styles.toolbar}>
      <span>{uiText(jobId ? '일정을 다시 짜는 동안 아래 내용은 고칠 수 없습니다.' : dirty ? '화면에서만 바뀌었습니다. 초안 저장을 눌러야 서버에 남습니다.' : '저장된 버전입니다. 칸을 고쳐도 저장 버튼을 누르기 전에는 반영되지 않습니다.')}</span>
      <button type='button' disabled={busy || !!jobId} onClick={() => save(false)}><Save size={16} />{uiText("초안 저장")}</button>
      <button className={styles.primary} type='button' disabled={busy || !!jobId} onClick={() => save(true)}>{uiText("확정 저장")}</button>
      <button type='button' disabled={busy || !excelReady} onClick={() => perform(() => downloadTravelExcel(plan.id, initial.revision))}><Download size={16} />{uiText("엑셀 다운로드")}</button>
    </div>
    {!excelReady && <p className={styles.hint}>{uiText(jobId ? '일정을 다시 짜는 동안 엑셀은 받을 수 없습니다.' : dirty ? '저장하지 않은 변경이 있어 엑셀은 지금 받을 수 없습니다.' : '빨간 확인사항을 손본 뒤 확정 저장하면 엑셀을 받을 수 있습니다.')}</p>}
    {error && <div className={styles.alert} role='alert'>{uiText(error)}<p>{uiText("현재 편집 내용은 화면에 유지됩니다. 버전 충돌이면 변경 내용을 옮긴 뒤 새 버전을 확인해 주세요.")}</p></div>}
    {notice && <p className={styles.status} role='status'>{uiText(notice)}</p>}
    {busy && !jobId && <p className={styles.status} role='status'>{uiText("요청을 처리하고 있습니다. 일정 수정 시 이동 구간을 다시 확인합니다.")}</p>}
    <div className={styles.planLockWrap}>
    {jobId && <div className={styles.planLockOverlay} role='dialog' aria-modal='true' aria-label={uiText("일정을 다시 짜는 중")}>
      <div className={styles.planLockCard}><TravelJobPanel id={jobId} onComplete={completed} onRestore={() => { setJobId(null); request.current = null; }} /></div>
    </div>}
    <div className={jobId ? styles.planLocked : undefined} inert={jobId || busy ? true : undefined} aria-hidden={jobId ? true : undefined}>
    <div className={styles.metrics}>
      <div><span>{uiText("알려진 예상 + 예비비")}</span><strong>{money(totals.estimateWithContingency)}</strong><small>{uiText(totals.unknownCount)}{uiText("건 미산정 ·")}{uiText(budgetLabel)}</small></div>
      <div><span>{uiText("전체 예산")}</span><strong>{uiText(totals.budget == null ? '추천받기' : money(totals.budget))}</strong><small>{uiText(totals.overBudget ? '예산 초과 · 조정 필요' : '미산정 비용은 별도 확인')}</small></div>
      <div><span>{uiText("입력된 실제 지출")}</span><strong>{money(totals.actualEntered)}</strong><small>{uiText(totals.actualCount)} / {uiText(totals.selectedCount)}{uiText("건 입력")}</small></div>
    </div>
    {dirty && <p className={styles.hint}>{uiText("저장하면 바꾼 일정과 금액이 요약에 반영돼요. 칸을 고친 것만으로는 저장되지 않습니다.")}</p>}
    {plan.input.message?.trim() ? (
      <section className={styles.promptResult}>
        <p className={styles.eyebrow}>{uiText("요청하신 여행")}</p>
        <blockquote>{plan.input.message.trim()}</blockquote>
        {(plan.assumptions || []).some((a) => String(a).includes('기본 초안'))
          ? <p>{uiText("AI 응답이 지연되거나 일정 형식을 맞추지 못해, 조회한 장소로")}<b>{uiText("기본 초안")}</b>{uiText("을 저장했습니다. 방문 장소·시간을 검토하고 필요에 맞게 수정해 주세요.")}</p>
          : <p>{uiText("입력한 기본 조건에 맞춰 요청한 활동과 제약을 반영했습니다. 이동 시간과 휴식 시간을 점검한 결과를 아래에서 확인해 주세요.")}</p>}
      </section>
    ) : (plan.assumptions || []).some((a) => String(a).includes('기본 초안')) ? (
      <p className={styles.status} role='status'>{uiText("조회한 장소로 만든 기본 초안입니다. 시간·장소를 고치거나 일부만 다시 짜면 됩니다.")}</p>
    ) : null}
    <section className={styles.validation}>
      <details open={plan.validation.conflicts.length > 0}>
        <summary>
          {uiText(plan.validation.conflicts.length > 0
            ? `시간을 맞추면 좋은 항목 ${plan.validation.conflicts.length}건`
            : '일정 점검 결과')}
          {uiText(plan.validation.notices.length > 0 ? ` · 참고 ${plan.validation.notices.length}건` : '')}
        </summary>
        <p className={styles.validationLead}>
          {uiText(plan.input.message?.trim()
            ? '말로 요청해도 이동 시간·쉬는 시간·귀가 일정은 같은 기준으로 점검합니다. 초안이라 빨간 항목이 남을 수 있습니다. 시작 시각을 늦추거나, 아래 일정에서 해당 항목만 다시 짜면 됩니다.'
            : '생성한 초안을 실제 이동 시간과 맞춰 본 결과입니다. 빨간 항목은 시간을 늘리거나 해당 일정만 다시 짜면 됩니다.')}
        </p>
        {plan.validation.conflicts.length > 0 && <>
          <h3>{uiText("시간을 맞추면 좋은 항목")}</h3>
          <ul>{plan.validation.conflicts.map((x) => <li key={x} className={styles.conflict}>{hideTravelVendor(x)}</li>)}</ul>
        </>}
        {plan.validation.notices.length > 0 && <>
          <h3>{uiText("방문 전에 확인하면 좋은 항목")}</h3>
          <ul className={styles.noticeList}>{plan.validation.notices.map((x) => <li key={x}>{hideTravelVendor(x)}</li>)}</ul>
        </>}
      </details>
    </section>
    <nav className={styles.tabs} aria-label={uiText("계획 상세 보기")}>{['일정', '예산', '예약·준비', '엑셀 미리보기'].map((t) => <button type='button' key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>{uiText(t)}</button>)}</nav>
    {tab === '일정' && <>
      <div className={styles.dayTabs}>{dates.map((d, index) => <button type='button' key={d} aria-pressed={date === d} onClick={() => { setDate(d); setSelected([]); setNewItem(null); }}>{uiText(`DAY ${index + 1}`)}<small>{uiText(d)}</small></button>)}</div>
      <div className={styles.toolbar}>
        <span>{uiText("일정을 추가하거나 삭제할 수 있습니다. 삭제하면 연결된 비용·준비 항목도 함께 제거됩니다.")}</span>
        <button type='button' disabled={plan.items.length >= 180} onClick={() => setNewItem({ activity: '', kind: 'VISIT', start: date === toDateValue(plan.input.startDate) ? toClock(plan.input.firstStart) : '09:00', minutes: 60, place: null })}><Plus size={16} />{uiText("일정 추가")}</button>
      </div>
      {lastRemoval && <div className={styles.status} role='status'>‘{lastRemoval.item.activity}{uiText("’ 삭제 예정")}<button type='button' onClick={undoRemoval}><Undo2 size={14} />{uiText("삭제 되돌리기")}</button></div>}
      {newItem && <form className={styles.addItemForm} onSubmit={addItem}>
        <h3>{uiText(date)}{uiText("일정 추가")}</h3>
        <div className={styles.formGrid}>
          <label><span>{uiText("활동 종류")}</span><select value={newItem.kind} onChange={(e) => setNewItem({ ...newItem, kind: e.target.value })}>{Object.entries(KINDS).map(([key, label]) => <option key={key} value={key}>{uiText(label)}</option>)}</select></label>
          <label><span>{uiText("할 일")}</span><input autoFocus required maxLength={500} value={newItem.activity} onChange={(e) => setNewItem({ ...newItem, activity: e.target.value })} placeholder={uiText("일정 이름을 입력하세요")} /></label>
          <label><span>{uiText("시작 시각")}</span><input required type='time' value={newItem.start} onChange={(e) => setNewItem({ ...newItem, start: e.target.value })} /></label>
          <label><span>{uiText("체류 시간 (분)")}</span><input required type='number' min={10} max={600} value={newItem.minutes} onChange={(e) => setNewItem({ ...newItem, minutes: e.target.value })} /></label>
        </div>
        <PlaceInput label={uiText("방문 장소 (선택)")} value={newItem.place} districtId={plan.input.districtId} onChange={(place) => setNewItem({ ...newItem, place })} />
        <FavoritePlacePicker excludedIds={plan.input.excludedIds} onSelect={(place) => setNewItem({ ...newItem, place, activity: place.name })} />
        <p className={styles.hint}>{uiText("저장하면 장소의 홈페이지·요금과 이동 시간을 확인합니다. 휴식·자유시간은 장소 없이 추가할 수 있습니다.")}</p>
        <div className={styles.actions}><button className={styles.primary} type='submit'>{uiText("이 일정 추가")}</button><button type='button' onClick={() => setNewItem(null)}>{uiText("취소")}</button></div>
      </form>}
      <p className={styles.dayRoute}>{dayPlaces.length ? dayPlaces.map((item) => item.place.name).join(' → ') : '이 날짜에 장소가 있는 일정이 없습니다.'}</p>
      <div className={styles.planGuide}>
        <p><b>{uiText("다시 짜기")}</b>{uiText("아래 버튼을 누르면 됩니다. 왼쪽 체크는 특정 항목만 바꿀 때만 켭니다. 체크하지 않으면 이 날짜의 고정하지 않은 일정 전체를 다시 짭니다.")}</p>
        <p><b>{uiText("이 일정 고정")}</b>{uiText("다시 짜기를 해도 시간·장소를 그대로 둡니다. 이미 예약한 일정에 쓰면 됩니다. 고정을 켠 뒤 바로 다시 짜도 됩니다.")}</p>
        <p><b>{uiText("영업시간")}</b>{uiText("장소는 찾았지만, 여행 날짜에 문을 여는지까지는 자동으로 확정하지 않습니다.")}<em>{uiText("아직 확인 전")}</em>{uiText("이면 예약·준비 탭에서 확인해 주세요.")}</p>
      </div>
      <div className={styles.replan}>
        <label><span>{uiText("이 날짜·선택한 항목에 바라는 변경")}</span><input maxLength={1000} value={replanMessage} onChange={(e) => setReplanMessage(e.target.value)} placeholder={uiText("예: 오후는 가까운 실내 장소와 휴식 위주로")} /></label>
        <button className={styles.primary} type='button' disabled={busy || !!jobId || !canReplan} onClick={replan}>{uiText(dirty ? '저장하고 다시 짜기' : selected.length ? `선택한 ${selected.length}개 다시 짜기` : '이 날짜 다시 짜기')}</button>
        <small>{uiText(replanHint)}</small>
      </div>
      {dayItems.length === 0 ? <p className={styles.empty}>{uiText("이 날짜에 표시할 일정이 없습니다.")}</p> : <ol className={styles.timeline}>{dayItems.map((i) => {
        const leg = plan.legs.find((l) => l.toId === i.id);
        const distance = formatDistanceM(leg?.distanceM);
        return <li key={i.id}>
          <div className={styles.timeRail}><strong>{toClock(i.start)}</strong><small>{endClock(i.start, i.minutes)}</small></div>
          <article className={styles.item}>
            <header>
              <div className={styles.itemHeadLeft}>
                <span className={styles.kindBadge}>{uiText(KINDS[i.kind] || i.kind)}</span>
                <label className={styles.inlineCheck}>
                  <input type='checkbox' disabled={i.locked} checked={selected.includes(i.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, i.id] : selected.filter((id) => id !== i.id))} />{uiText("이 항목만")}</label>
                <HelpTip label={uiText("이 항목만")} text='특정 항목만 다시 만들고 싶을 때 선택합니다. 고르지 않아도 아래 ‘다시 짜기’ 버튼은 켜져 있습니다. 고정한 항목은 선택할 수 없습니다.' />
              </div>
              <div className={styles.itemHeadRight}>
                <label className={styles.inlineCheck}>
                  <input type='checkbox' disabled={addedIds.includes(i.id)} checked={i.locked} onChange={(e) => editItem(i.id, { locked: e.target.checked })} />
                  <LockKeyhole size={14} />{uiText("이 일정 고정")}</label>
                <HelpTip label={uiText("이 일정 고정")} text='다시 짜기를 해도 이 항목의 시간·장소는 그대로 둡니다. 이미 예약한 식당이나 바꾸면 안 되는 일정에 켜 주세요.' />
              </div>
            </header>
            <h3>{i.activity}</h3>
            <p>{uiText(i.place?.name || '장소 없는 일반 활동')} {uiText(i.place?.address ? `· ${i.place.address}` : '')}</p>
            <PlaceLinks place={i.place} />
            <p>{uiText(i.reason)}</p>
            <div className={styles.formGrid}>
              <label><span>{uiText("시작 시각")}</span><input type='time' disabled={i.locked} value={toClock(i.start)} onChange={(e) => editItem(i.id, { start: e.target.value })} /></label>
              <label><span>{uiText("체류 시간 (분)")}</span><input type='number' min={10} max={600} disabled={i.locked} value={i.minutes} onChange={(e) => editItem(i.id, { minutes: Number(e.target.value) })} /></label>
            </div>
            <label><span>{uiText("할 일")}</span><input maxLength={500} disabled={i.locked} value={i.activity} onChange={(e) => editItem(i.id, { activity: e.target.value })} /></label>
            <label><span>{uiText("메모")}</span><textarea maxLength={1500} value={i.notes || ''} onChange={(e) => editItem(i.id, { notes: e.target.value })} /></label>
            <div className={styles.actions}>
              <button type='button' disabled={i.locked} onClick={() => setPlaceEditId(placeEditId === i.id ? null : i.id)}>{uiText("장소 교체")}</button>
              <button type='button' data-intent='danger' disabled={i.locked || ['ACCESS', 'RETURN'].includes(i.kind) || plan.items.length <= 1} title={uiText(['ACCESS', 'RETURN'].includes(i.kind) ? '출발·귀가 일정은 필수입니다. 시간과 장소를 수정할 수 있습니다.' : i.locked ? '고정을 해제한 뒤 삭제할 수 있습니다.' : undefined)} onClick={() => removeItem(i)}><Trash2 size={14} />{uiText("일정 삭제")}</button>
            </div>
            {placeEditId === i.id && <PlaceInput label={uiText("교체할 실제 장소 검색")} allowUser={false} value={null} districtId={plan.input.districtId} onChange={(v) => { editItem(i.id, { contentId: String(v.contentId), place: { name: v.name, contentId: String(v.contentId), address: v.address || null, url: null, existence: { status: 'UNKNOWN' }, operation: { status: 'UNKNOWN' } } }); setPlaceEditId(null); }} />}
            {i.place && <div className={styles.evidenceRow}>
              <EvidenceFact label={uiText("장소")} value={i.place.existence} hint={uiText("지도·관광정보에서 이 장소가 실제로 있는지 조회한 결과입니다. 조회 확인이면 장소 정보는 찾은 상태입니다.")} />
              <EvidenceFact label={uiText("영업시간")} value={i.place.operation} hint={uiText("여행 날짜에 문을 여는지, 예약이 필요한지까지는 자동으로 확정하지 않습니다. 아직 확인 전이면 예약·준비 탭의 안내를 보고 직접 확인해 주세요.")} />
            </div>}
            {leg && <div className={styles.leg}><b>{uiText(leg.minutes == null ? '이동 시간 미확인' : `이동·대기 ${leg.minutes}분${distance ? ` · ${distance}` : ''}`)}</b><Evidence value={leg.evidence} />{hideTravelVendor(leg.evidence?.note) ? <p>{hideTravelVendor(leg.evidence.note)}</p> : null}</div>}
            {(i.preparation || i.alternative) && <details><summary>{uiText("준비와 대안")}</summary><p>{uiText(i.preparation)}</p><p>{uiText("선택 대안:")}{uiText(i.alternative || '미정')}</p></details>}
          </article>
        </li>;
      })}</ol>}
    </>}
    {tab === '예산' && <section className={styles.section}>
      <h2>{uiText("예산 기준 수정")}</h2>
      <div className={styles.formGrid}>
        <label><span>{uiText("금액 기준")}</span><select value={budget.mode} onChange={(e) => setBudget({ ...budget, mode: e.target.value })}>{Object.entries(BUDGET_MODE).map(([id, label]) => <option key={id} value={id}>{uiText(label)}</option>)}</select></label>
        {budget.mode !== 'RECOMMEND' && <label><span>{uiText("예산 금액 (원)")}</span><input type='number' min={0} max={1000000000} value={budget.amount ?? ''} onChange={(e) => setBudget({ ...budget, amount: number(e.target.value) })} /></label>}
        <label><span>{uiText("예비비율 (%)")}</span><input type='number' min={0} max={30} value={budget.contingencyPercent} onChange={(e) => setBudget({ ...budget, contingencyPercent: Number(e.target.value) })} /></label>
      </div>
      <p className={styles.hint}>{uiText("저장하면 현재 비용 원장을 기준으로 예산 초과 여부와 예비비를 다시 계산합니다.")}</p>
      <h2>{uiText("예산 및 실제 지출")}</h2>
      <p className={styles.hint}>{uiText("공개 요금이 있으면 해당 금액을, 메뉴 가격이 있으면 표기 금액의 단순 평균을 사용합니다. 정보가 없는 식사·카페는 계획용 추정값이며 실제 업체 평균가격이 아닙니다. 연령·예약 조건이 불명확한 요금은 미산정으로 남깁니다.")}</p>
      {addedIds.length > 0 && <p className={styles.status}>{uiText("추가한 일정")}{uiText(addedIds.length)}{uiText("건의 예상 비용은 초안 저장 후 반영됩니다.")}</p>}
      <p>{uiText("금액이 빈 칸이면 미산정입니다. 예약금은 예상·실제 지출에 더하지 않습니다. 실제 지출에는 해당 항목의 전체 지출을 입력하세요. 항목 이름은 일정 장소 기준입니다.")}</p>
      <div className={styles.tableScroll}><table className={styles.costTable}><thead><tr>{['항목·단위', '단가', '수량', '횟수·박', '예상', '실제 지출', '예약금', '포함·선택'].map((h) => <th key={h}>{uiText(h)}</th>)}</tr></thead>
        <tbody>{plan.costs.map((c) => {
          const related = costPlace(plan, c);
          return <tr key={c.id}>
          <th scope='row'><strong>{uiText(c.name)}</strong><small>{uiText(related.label && !String(c.name).includes(related.label) ? `${related.label} · ` : '')}{uiText(c.date)} · {uiText(CATEGORIES[c.category])}<br />{uiText(c.unit)} · {uiText(c.appliesTo)} · {uiText(c.shared ? '공동' : '개인')}</small><PlaceLinks place={related.place} /><Evidence value={c.evidence} />{c.evidence?.note && <details className={styles.priceNote}><summary>{uiText("산정 근거")}</summary><p>{hideTravelVendor(c.evidence.note)}</p>{c.low != null && c.high != null && c.low !== c.high && <p>{uiText("표기 금액 범위:")}{money(c.low)} ~ {money(c.high)}</p>}</details>}</th>
          {['unitPrice', 'quantity', 'occurrences'].map((key) => <td key={key}><input aria-label={uiText(`${c.name} ${key === 'unitPrice' ? '단가' : key === 'quantity' ? '수량' : '횟수'}`)} type='number' min={0} max={key === 'unitPrice' ? 1000000000 : 10000} value={c[key] ?? ''} onChange={(e) => editCost(c.id, { [key]: e.target.value === '' ? null : Number(e.target.value) })} /></td>)}
          <td>{uiText(c.unitPrice == null || c.quantity == null || c.occurrences == null ? '미산정' : money(Math.round(c.unitPrice * c.quantity * c.occurrences)))}</td>
          {['actual', 'prepaid'].map((key) => <td key={key}><input aria-label={uiText(`${c.name} ${key === 'actual' ? '실제 지출' : '예약금'}`)} type='number' min={0} max={1000000000} value={c[key] ?? ''} onChange={(e) => editCost(c.id, { [key]: e.target.value === '' ? null : Number(e.target.value) })} /></td>)}
          <td><label className={styles.inlineCheck}><input type='checkbox' checked={c.included} onChange={(e) => editCost(c.id, { included: e.target.checked })} />{uiText("예산 포함")}</label><label className={styles.inlineCheck}><input type='checkbox' checked={c.selected} onChange={(e) => editCost(c.id, { selected: e.target.checked })} />{uiText("선택 항목")}</label></td>
        </tr>;
        })}</tbody>
      </table></div>
    </section>}
    {tab === '예약·준비' && <section className={styles.section}>
      <h2>{uiText("장소와 예약 확인")}</h2>
      <p className={styles.hint}>{uiText("영업시간은 공공 관광정보의 원문입니다. 여행 날짜에 문을 여는지, 예약이 필요한지는 아래에서 직접 표시해 주세요.")}</p>
      {plan.items.filter((i) => i.place).length === 0 ? <p className={styles.hint}>{uiText("장소가 연결된 일정이 없습니다.")}</p> : <div className={styles.reservations}>{plan.items.filter((i) => i.place).map((i) => <article key={i.id}><h3>{uiText(i.place.name)}</h3><p>{uiText(i.date)} {toClock(i.start)} · {uiText(i.place.address || '주소 미확인')}</p><PlaceLinks place={i.place} /><p>{uiText("안내 원문:")}{uiText(i.place.usageTime || '아직 확인 전')}<br />{uiText("휴무:")}{uiText(i.place.restDate || '아직 확인 전')}<br />{uiText("연락처:")}{uiText(i.place.tel || '아직 확인 전')}</p><EvidenceFact label={uiText("영업시간")} value={i.place.operation} hint={uiText("원문이 있어도 여행 날짜의 영업·예약 가능 여부는 직접 확인이 필요합니다.")} /><label><span>{uiText("내가 확인한 예약 상태")}</span><select value={i.reservationStatus} onChange={(e) => editItem(i.id, { reservationStatus: e.target.value })}>{['확인 필요', '예약 필요', '예약 중', '예약 완료', '해당 없음'].map((s) => <option value={s} key={s}>{uiText(s)}</option>)}</select></label></article>)}</div>}
      <h2>{uiText("준비 체크리스트")}</h2>
      {plan.tasks.length === 0 ? <p className={styles.hint}>{uiText("준비 항목이 없습니다.")}</p> : <div className={styles.reservations}>{plan.tasks.map((t) => <article key={t.id}><h3>{t.title}</h3><div className={styles.formGrid}><label><span>{uiText("담당 역할")}</span><input maxLength={100} value={t.owner} onChange={(e) => editTask(t.id, { owner: e.target.value })} /></label><label><span>{uiText("마감")}</span><input maxLength={80} value={t.due} onChange={(e) => editTask(t.id, { due: e.target.value })} /></label></div><label><span>{uiText("완료 상태")}</span><select value={t.status} onChange={(e) => editTask(t.id, { status: e.target.value })}>{['미완료', '진행 중', '완료'].map((s) => <option value={s} key={s}>{uiText(s)}</option>)}</select></label><label><span>{uiText("준비 메모")}</span><textarea maxLength={600} value={t.notes} onChange={(e) => editTask(t.id, { notes: e.target.value })} /></label></article>)}</div>}
    </section>}
    {tab === '엑셀 미리보기' && <section className={styles.workbookPreview}>
      <TemplatePreview type={plan.input.tripType} />
      <div>
        <h2>{plan.title}</h2>
        <p>{uiText("현재 v")}{uiText(initial.revision)} · {uiText(initial.confirmed ? '다운로드 가능한 확정본' : '확정 저장 후 다운로드 가능')}</p>
        <dl className={styles.summary}><dt>{uiText("상세 일정")}</dt><dd>{uiText(plan.items.length)}{uiText("개 활동 ·")}{uiText(dates.length)}{uiText("일")}</dd><dt>{uiText("예산 및 지출")}</dt><dd>{uiText(plan.costs.length)}{uiText("개 비용 ·")}{uiText(totals.unknownCount)}{uiText("건 미산정")}</dd><dt>{uiText("준비 및 대안")}</dt><dd>{uiText(plan.tasks.length)}{uiText("개 체크 항목")}</dd><dt>{uiText("전용 시트")}</dt><dd>{uiText(TYPES.find((t) => t.id === plan.input.tripType)?.sheet)}</dd></dl>
        <h3>{uiText("엑셀에 반영되는 내용")}</h3>
        <p>{uiText("저장한 일정과 금액, 메모를 그대로 내려받을 수 있어요.")}</p>
        <p>{uiText("파란 입력칸, 합계 수식, 예약·완료 상태 목록, 필터와 틀 고정, 인쇄 설정을 제공합니다. 긴 일정·예산 시트는 A3 가로 형식입니다.")}</p>
        <details><summary>{uiText("저장된 가정")}</summary><ul>{plan.assumptions.map((a) => <li key={a}>{uiText(a)}</li>)}</ul></details>
      </div>
    </section>}
    <footer className={styles.detailFooter}>{deleting ? <div className={styles.alert}><p>{uiText("이 계획과 모든 저장 버전을 삭제합니다.")}</p><button type='button' data-intent='danger' disabled={busy} onClick={() => perform(async () => { await deleteTravelPlan(plan.id, initial.revision); navigate('/travel-plans', { replace: true }); })}>{uiText("계획 삭제 확인")}</button><button type='button' onClick={() => setDeleting(false)}>{uiText("취소")}</button></div> : <button type='button' data-intent='danger' onClick={() => setDeleting(true)} disabled={busy || !!jobId}>{uiText("계획 삭제")}</button>}</footer>
    </div>
    </div>
  </TravelShell>;
}
