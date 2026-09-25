/**
 * Logo.jsx — 서비스 브랜드 로고(마크 + 3줄 텍스트) 컴포넌트
 * - BASE_URL 기준 brand 마크 이미지와 i18n의 logo.title/logo.sub 문구를 함께 렌더링
 * - variant='onDark'일 때 어두운 배경용 텍스트 색상 변형을 적용
 */
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import styles from './Logo.module.scss';

const logoMarkUrl = `${
  import.meta.env.BASE_URL
}brand/incheon-spotlight-mark.png`;

export function Logo({ className, variant = 'default' }) {
  const { t } = useTranslation();
  return (
    <div
      className={clsx(
        styles.root,
        variant === 'onDark' && styles.onDark,
        className,
      )}
    >
      <img
        className={styles.mark}
        src={logoMarkUrl}
        alt=''
        aria-hidden='true'
      />
      <div className={styles.texts}>
        <span className={styles.english}>INCHEON SPOTLIGHT</span>
        <span className={styles.title}>{t('logo.title')}</span>
        <span className={styles.sub}>{t('logo.sub')}</span>
      </div>
    </div>
  );
}
