/**
 * Skeleton.jsx — 데이터 로딩 중 보여주는 뼈대 UI
 * - variant(list/detail/text/media/map/page)에 따라 이미지·줄·지도 형태를 바꿈
 * - role='status'와 스크린리더 전용 로딩 문구를 넣어 접근성을 맞춤
 */
import { useTranslation } from 'react-i18next';
import styles from './Skeleton.module.scss';

export function Skeleton({ variant = 'list', count = 3, label, className = '' }) {
  const { t } = useTranslation();
  const isMap = variant === 'map' || variant === 'page';
  return (
    <div className={`${styles.root} ${styles[variant] || ''} ${className}`} role='status' aria-busy='true'>
      <span className={styles.srOnly}>{label || t('common.loading')}</span>
      <div className={styles.shapes} aria-hidden='true'>
        {variant !== 'map' && variant !== 'media' && (
          <div className={styles.items}>
            {Array.from({ length: variant === 'detail' || variant === 'page' ? 1 : count }, (_, index) => (
              <div className={styles.item} key={index}>
                {variant !== 'text' && <span className={`${styles.bone} ${styles.image}`} />}
                <div className={styles.lines}>
                  <span className={`${styles.bone} ${styles.title}`} />
                  <span className={styles.bone} />
                  <span className={`${styles.bone} ${styles.short}`} />
                </div>
              </div>
            ))}
          </div>
        )}
        {variant === 'media' && <div className={`${styles.bone} ${styles.mediaShape}`} />}
        {isMap && <div className={`${styles.bone} ${styles.mapShape}`} />}
      </div>
    </div>
  );
}
