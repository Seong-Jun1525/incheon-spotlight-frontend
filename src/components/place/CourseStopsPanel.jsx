/**
 * CourseStopsPanel.jsx — 추천 코스의 개요와 순서별 정류장을 보여주는 패널
 * - 코스 이름·요약·테마·장소 수·소요 시간을 uiText로 번역 처리해 표시
 * - stops를 순번 목록으로 렌더링하고 activeStopId와 일치하면 활성 스타일 적용
 * - 정류장 선택은 onSelectStop, 경로 보기는 onViewRoute로 상위에 위임
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { formatPlaceCount } from '../../utils/aiCourseAdapter';
import { translatePlaceName } from '../../i18n/placeLabel';
import styles from './CourseStopsPanel.module.scss';

/**
 * 추천 코스 상세 패널 — 코스 개요와 순서별 정류장을 표시합니다.
 */
export function CourseStopsPanel({
  course,
  activeStopId,
  onSelectStop,
  onViewRoute,
  onClose,
}) {
  useUiLanguage();
  const { t } = useTranslation();
  if (!course) return null;

  const eyebrow =
    course.origin === 'today' ? t('course.today') : t('course.recommended');

  return (
    <aside className={styles.panel} aria-label={t('course.details')}>
      <div className={styles.head}>
        <div>
          <p className={styles.eyebrow}>{uiText(eyebrow)}</p>
          <h3>{uiText(course.courseName)}</h3>
          <p className={styles.summary}>{uiText(course.summary)}</p>
        </div>
        {onClose && (
          <button
            type='button'
            className={styles.close}
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ×
          </button>
        )}
      </div>

      <div className={styles.meta}>
        <span>{uiText(course.themeLabel)}</span>
        <span>{formatPlaceCount(course.stopCount ?? course.placeCount, t, uiText(course.placeCount))}</span>
        <span>{uiText(course.duration)}</span>
      </div>

      {onViewRoute && (
        <button type='button' className={styles.routeButton} onClick={onViewRoute}>
          {t('course.viewRoute')}
        </button>
      )}

      <ol className={styles.stops}>
        {course.stops.map((stop) => (
          <li key={stop.contentId}>
            <button
              type='button'
              className={clsx(
                styles.stopBtn,
                String(activeStopId) === String(stop.contentId) && styles.active,
              )}
              onClick={() => onSelectStop?.(stop)}
            >
              <span className={styles.order}>{uiText(stop.order)}</span>
              <span className={styles.stopBody}>
                <strong>{translatePlaceName(t, stop, stop.name)}</strong>
                <small>
                  {uiText(stop.stayMinutes
                    ? t('course.stayMinutes', { count: stop.stayMinutes })
                    : t('course.stopN', { order: stop.order }))}
                </small>
                {stop.reason ? <em>{uiText(stop.reason)}</em> : null}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}
