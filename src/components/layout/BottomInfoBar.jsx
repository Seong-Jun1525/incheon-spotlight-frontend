/**
 * BottomInfoBar.jsx — 지도 하단의 오늘의 추천 코스 요약 바
 * - 코스명·경로·소요시간·테마·장소 수를 한 줄 버튼으로 보여주고 onExpand로 상세를 펼침
 * - loading이면 Skeleton, unavailable이면 코스 생성 유도 문구로 상태를 전환
 * - aria-busy·aria-label로 로딩/빈 상태를 스크린리더에 전달
 */
import { Skeleton } from '../atoms/Skeleton';
import { useTranslation } from 'react-i18next';
import styles from './BottomInfoBar.module.scss';

/**
 * 하단 미니 바 — 오늘의 추천 코스
 */
export function BottomInfoBar({
  title: suppliedTitle,
  courseName = '',
  routeLabel = '',
  duration = '',
  themeLabel = '',
  placeCount = '',
  loading = false,
  unavailable = false,
  onExpand,
}) {
  const { t } = useTranslation();
  const title = suppliedTitle && suppliedTitle !== '오늘의 추천 코스' ? suppliedTitle : t('course.today');
  const waiting = loading && !courseName;
  const empty = unavailable && !courseName && !waiting;
  const disabled = waiting || (empty && !onExpand);
  const label = waiting
    ? t('course.loadingLabel', { title })
    : empty
      ? t('course.emptyLabel', { title })
      : `${title}: ${courseName}. ${routeLabel}. ${duration}`;

  if (waiting) return <div className={styles.bar}><span className={styles.badge}>{title}</span><Skeleton variant='text' count={1} label={label} /></div>;
  return (
    <button
      type='button'
      className={`${styles.bar} ${waiting || empty ? styles.loading : ''}`}
      onClick={onExpand}
      disabled={disabled}
      aria-busy={waiting}
      aria-label={label}
    >
      <span className={styles.badge}>{title}</span>
      <span className={styles.course}>
        <strong>
          {waiting
            ? t('course.loading')
            : empty
              ? t('course.empty')
              : courseName}
        </strong>
        <small>
          {waiting
            ? t('course.factors')
            : empty
              ? t('course.createHint')
              : routeLabel}
        </small>
        {waiting || empty ? null : (
          <span className={styles.meta}>
            {themeLabel} · {placeCount}
          </span>
        )}
      </span>
      <span className={styles.duration}>
        <span>{waiting || empty ? t('course.halfDay') : duration}</span>
        <em>
          {waiting
            ? t('course.wait')
            : empty
              ? t('course.create')
              : t('course.details')}
        </em>
      </span>
    </button>
  );
}
