/**
 * RoutePlanner.jsx — 길찾기 패널(이동수단 선택·출발지 설정·경로 결과)
 * - 도보/자동차/대중교통 모드를 onModeChange로 전환하고, 자동차일 때 출발·도착 시각 예측 옵션을 노출
 * - 현재 위치 버튼으로 onUseCurrentLocation을 호출하고 locationStatus에 따라 로딩·오류 문구를 표시
 * - routeQuery 상태에 맞춰 거리·소요시간·안내 문구·상위 5개 경로 단계를 렌더링
 */
import { routeNotice } from '../../utils/routeNotice';
import { Skeleton } from '../atoms/Skeleton';
import { formatTravelDuration } from '../../utils/formatTravel';
import { useTranslation } from 'react-i18next';
import {
  BusFront,
  CarFront,
  Clock3,
  Footprints,
  LocateFixed,
  Route,
} from 'lucide-react';
import styles from './RoutePlanner.module.scss';

function formatDistance(distanceM) {
  if (!Number.isFinite(Number(distanceM))) return '-';
  const value = Number(distanceM);
  return value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${Math.round(value)}m`;
}


export function RoutePlanner({
  mode,
  onModeChange,
  prediction = { enabled: false, type: 'departure', time: '' },
  onPredictionChange,
  onUseCurrentLocation,
  locationStatus,
  routeEndpoints,
  routeQuery,
  onClear,
}) {
  const { t } = useTranslation();
  const routeData = routeQuery.data;

  return (
    <section className={styles.planner} aria-label={t('directions.title')}>
      <div className={styles.head}>
        <div>
          <span>{t('directions.title')}</span>
          <strong>
            {routeEndpoints
              ? `${routeEndpoints.origin.title || routeEndpoints.origin.name} → ${routeEndpoints.destination.title || routeEndpoints.destination.name}`
              : t('directions.subtitle')}
          </strong>
        </div>
        <Route size={20} aria-hidden />
      </div>

      <div className={styles.modes} role='group' aria-label={t('directions.mode')}>
        <button
          type='button'
          aria-pressed={mode === 'PEDESTRIAN'}
          onClick={() => onModeChange('PEDESTRIAN')}
        >
          <Footprints size={15} />{t('directions.walk')}</button>
        <button
          type='button'
          aria-pressed={mode === 'CAR'}
          onClick={() => onModeChange('CAR')}
        >
          <CarFront size={15} />{t('directions.car')}</button>
        <button
          type='button'
          aria-pressed={mode === 'TRANSIT'}
          onClick={() => onModeChange('TRANSIT')}
        >
          <BusFront size={15} />{t('directions.transit')}</button>
      </div>

      {mode === 'CAR' && (
        <div className={styles.timeMachine}>
          <label className={styles.timeMachineToggle}>
            <input
              type='checkbox'
              checked={prediction.enabled}
              onChange={(event) =>
                onPredictionChange?.({
                  ...prediction,
                  enabled: event.target.checked,
                })
              }
            />
            <span>
              <b><Clock3 size={14} />{t('directions.prediction')}</b>
              <small>{t('directions.predictionHint')}</small>
            </span>
          </label>

          {prediction.enabled && (
            <div className={styles.timeFields}>
              <label>
                <span>{t('directions.timeBasis')}</span>
                <select
                  value={prediction.type}
                  onChange={(event) =>
                    onPredictionChange?.({
                      ...prediction,
                      type: event.target.value,
                    })
                  }
                >
                  <option value='departure'>{t('directions.departure')}</option>
                  <option value='arrival'>{t('directions.arrival')}</option>
                </select>
              </label>
              <label>
                <span>{t('directions.predictionTime')}</span>
                <input
                  type='datetime-local'
                  value={prediction.time}
                  onChange={(event) =>
                    onPredictionChange?.({
                      ...prediction,
                      time: event.target.value,
                    })
                  }
                />
              </label>
            </div>
          )}

          {prediction.enabled && !prediction.time && (
            <p className={styles.hint}>{t('directions.chooseTime')}</p>
          )}
        </div>
      )}

      <button
        type='button'
        className={styles.locationButton}
        onClick={onUseCurrentLocation}
        disabled={locationStatus === 'loading'}
      >
        <LocateFixed size={16} />
        {locationStatus === 'loading' ? t('directions.locating') : t('directions.start')}
      </button>

      {locationStatus === 'error' && (
        <p className={styles.error} role='alert'>{t('directions.locationError')}</p>
      )}

      {routeQuery.isLoading && <Skeleton variant='text' count={1} label={t('directions.loading')} />}
      {routeQuery.isError && (
        <p className={styles.error} role='alert'>{t('directions.error')}</p>
      )}

      {routeData && (
        <div className={styles.result}>
          <div>
            <span>{t('directions.distance')}</span>
            <strong>{formatDistance(routeData.distanceM)}</strong>
          </div>
          <div>
            <span>{t('directions.duration')}</span>
            <strong>{formatTravelDuration(routeData.durationSeconds)}</strong>
          </div>
          {routeNotice(routeData, t) && (<p className={routeData.approximate ? styles.warning : styles.notice}>
            {routeNotice(routeData, t)}
          </p>)}
          {routeData.steps?.length > 0 && (
            <ol>
              {routeData.steps.slice(0, 5).map((step, index) => (
                <li key={`${step.pointIndex}-${index}`}>{step.instruction}</li>
              ))}
            </ol>
          )}
          <button type='button' className={styles.clear} onClick={onClear}>{t('directions.close')}</button>
        </div>
      )}

      <small>{t('directions.privacy')}</small>
    </section>
  );
}
