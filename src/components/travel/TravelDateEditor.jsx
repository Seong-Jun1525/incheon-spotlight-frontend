/**
 * TravelDateEditor.jsx — 저장된 여행계획의 여행 날짜 변경 폼
 * - 출발·종료일을 1~7일 범위로 검증한 뒤 changeTravelDates 로 반영
 * - 기간 밖으로 밀려난 일정을 삭제할지 선택하는 옵션 제공
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changeTravelDates } from '../../api/travelPlanApi';
import { getApiErrorMessage } from '../../api/http';
import { toDateValue, tripDays } from './travelConfig';
import styles from './TravelPlanner.module.scss';

export function TravelDateEditor({ plan, disabled, onSaved }) {
  useUiLanguage();
  const { t } = useTranslation();
  const [startDate, setStart] = useState(toDateValue(plan.input.startDate));
  const [endDate, setEnd] = useState(toDateValue(plan.input.endDate));
  const [removeOutside, setRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(event) {
    event.preventDefault();setError('');
    const days = tripDays(startDate, endDate);
    if (!Number.isFinite(days) || days < 1 || days > 7) { setError(t('feedback.dateRange')); return; }
    setBusy(true);
    try { await changeTravelDates(plan.id, { revision: plan.revision, startDate, endDate, removeOutside }); await onSaved(); }
    catch (e) { setError(getApiErrorMessage(e)); }
    finally { setBusy(false); }
  }
  return <details className={styles.section}>
    <summary>{t('feedback.editDates')}</summary>
    <p>{t('feedback.dateChangeHint')}</p>
    {disabled && <p>{t('feedback.saveFirst')}</p>}
    <form onSubmit={save}>
      <fieldset disabled={disabled || busy}>
        <div className={styles.formGrid}>
          <label>{t('feedback.startDate')}<input type='date' required value={startDate} onChange={(e) => setStart(e.target.value)} /></label>
          <label>{t('feedback.endDate')}<input type='date' required min={startDate} value={endDate} onChange={(e) => setEnd(e.target.value)} /></label>
        </div>
        <label className={styles.inlineCheck}><input type='checkbox' checked={removeOutside} onChange={(e) => setRemove(e.target.checked)} />{t('feedback.removeOutside')}</label>
        <button type='submit'>{t(busy ? 'feedback.saving' : 'feedback.applyDates')}</button>
      </fieldset>
      {error && <p role='alert'>{uiText(error)}</p>}
    </form>
  </details>;
}
