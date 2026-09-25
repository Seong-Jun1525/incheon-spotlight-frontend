/**
 * TravelPlansPage.jsx — 저장한 여행계획 목록 화면
 * - 라우트: `/travel-plans` (로그인 필요)
 * - getTravelPlans 로 기간 탭·페이지 단위 목록을 불러오고 deleteTravelPlan 으로 삭제를 처리
 * - getTravelJobs 를 폴링해 최근 생성 작업의 진행 상태를 함께 안내
 */
import { uiText, useUiLanguage } from '../i18n/uiText';
import { Skeleton } from '../components/atoms/Skeleton';
import { getDisplayLocale } from '../utils/formatDate';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTravelPlans, getTravelJobs, deleteTravelPlan } from '../api/travelPlanApi';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '../api/http';
import { TYPES, stageOf, PLAN_PAGE_SIZE, jobPlanPath, toDateValue } from '../components/travel/travelConfig';
import { TravelShell } from '../components/travel/TravelShared';
import styles from '../components/travel/TravelPlanner.module.scss';

function savedAt(value) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toLocaleString(getDisplayLocale()) : '';
}

export default function TravelPlansPage() {
  useUiLanguage();
  const [page, setPage] = useState(0);
  const { t } = useTranslation();
  const [period, setPeriod] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const plans = useQuery({ queryKey: ['travel-plans', page, period], queryFn: () => getTravelPlans(page, period) });
  async function remove(plan) {
    setBusy(true);setError('');
    try { await deleteTravelPlan(plan.id, plan.revision);setDeleting(null);if(plans.data?.length===1 && page>0)setPage(page-1);else await plans.refetch(); }
    catch(e) { setError(getApiErrorMessage(e)); }
    finally { setBusy(false); }
  }
  const jobs = useQuery({
    queryKey: ['travel-jobs'],
    queryFn: getTravelJobs,
    refetchInterval: (q) => q.state.data?.some((j) => ['RUNNING', 'QUEUED'].includes(j.state)) ? 3000 : false,
  });
  const jobList = jobs.data || [];
  return <TravelShell current={uiText("내 여행계획")}>
    <header className={styles.pageHeader}>
      <div>
        <p className={styles.eyebrow}>MY TRAVEL NOTEBOOK</p>
        <h1>{uiText("내 여행계획")}</h1>
        <p>{uiText("저장한 일정과 예산을 다시 열고, 같은 버전으로 엑셀을 내려받으세요.")}</p>
      </div>
      <Link className={styles.primary} to='/travel-planner/new'>{uiText("새 여행계획 만들기")}</Link>
    </header>
    <nav className={styles.tabs} aria-label={t('feedback.period')}>
      {['all','upcoming','ongoing','past'].map((value) => <button type='button' key={value} aria-pressed={period===value} onClick={() => {setPeriod(value);setPage(0);setDeleting(null);}}>{t(`feedback.${value}`)}</button>)}
    </nav>
    {error && <p role='alert' className={styles.alert}>{uiText(error)}</p>}
    {plans.isPending && <Skeleton variant='cards' count={3} label={uiText("여행계획을 불러오는 중…")} />}
    {plans.isError && <p className={styles.alert} role='alert'>{getApiErrorMessage(plans.error)} <button type='button' onClick={() => plans.refetch()}>{uiText("다시 시도")}</button></p>}
    {plans.data?.length === 0 && <section className={styles.empty}><h2>{uiText("아직 저장한 여행계획이 없습니다.")}</h2><p>{uiText("다가오는 인천 여행부터 준비해 보세요.")}</p><Link to='/travel-planner'>{uiText("여행 유형 살펴보기")}</Link></section>}
    <div className={styles.planGrid}>{plans.data?.map((p) => (
      <article key={p.id} className={styles.planCard}>
        <span>{TYPES.find((t) => t.id === p.tripType)?.label || p.tripType} · v{uiText(p.revision)}</span>
        <h2><Link to={`/travel-plans/${p.id}`}>{p.title}</Link></h2>
        <p>{uiText(p.startDate)} ~ {uiText(p.endDate)} · {t(`feedback.${p.period || 'upcoming'}`)}</p>
        <small>{uiText(savedAt(p.updatedAt) ? `최근 저장 ${savedAt(p.updatedAt)}` : '저장 시각 미확인')}</small>
        <div className={styles.planCardActions}>
          <Link className={styles.planOpen} to={`/travel-plans/${p.id}`}>{uiText("계획 열기 →")}</Link>
          {deleting !== p.id && <button type='button' data-intent='danger' onClick={() => setDeleting(p.id)}>{t('feedback.delete')}</button>}
        </div>
        {deleting === p.id && (
          <div className={styles.planDeleteConfirm} role='alert'>
            <p>{t('feedback.deletePlanConfirm')}</p>
            <div className={styles.planConfirmActions}>
              <button type='button' disabled={busy} onClick={() => setDeleting(null)}>{t('feedback.cancel')}</button>
              <button type='button' data-intent='danger' disabled={busy} onClick={() => remove(p)}>{t('feedback.delete')}</button>
            </div>
          </div>
        )}
      </article>
    ))}</div>
    {(page > 0 || plans.data?.length === PLAN_PAGE_SIZE) && <div className={styles.actions}>
      <button type='button' disabled={page === 0} onClick={() => setPage(page - 1)}>{uiText("이전")}</button>
      <span>{page + 1}{uiText("페이지")}</span>
      <button type='button' disabled={plans.data?.length !== PLAN_PAGE_SIZE} onClick={() => setPage(page + 1)}>{uiText("다음")}</button>
    </div>}
    {(jobs.isPending || jobs.isError || jobList.length > 0) && <section className={styles.section}>
      <h2>{uiText("최근 생성 작업")}</h2>
      {jobs.isPending && <Skeleton count={2} label={uiText("생성 작업을 불러오는 중…")} />}
      {jobs.isError && <p className={styles.alert} role='alert'>{getApiErrorMessage(jobs.error)}</p>}
      {jobList.map((j) => (
        <Link className={styles.jobLink} key={j.id} to={jobPlanPath(j)}>
          <span>{TYPES.find((t) => t.id === j.input?.tripType)?.label || '여행계획'} · {uiText(toDateValue(j.input?.startDate) || j.input?.startDate || '')}</span>
          <strong>{uiText(j.state === 'FAILED' ? (j.errorMessage || '생성 실패') : j.state === 'CANCELLED' ? '취소됨 · 입력 복원 가능' : j.state === 'SUCCEEDED' ? '초안 저장' : (stageOf(j.stage).label || j.stage))}</strong>
          <span>{uiText("열기 →")}</span>
        </Link>
      ))}
    </section>}
  </TravelShell>;
}
