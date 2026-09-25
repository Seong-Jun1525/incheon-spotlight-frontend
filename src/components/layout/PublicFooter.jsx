/**
 * PublicFooter.jsx — 서비스 공통 하단 푸터
 * - 로고·서비스 소개와 서비스 소개/이용약관/개인정보 라우터 링크를 배치
 * - TourAPI·기상청·TMAP 출처 표기와 데이터 이용 안내 문구, 저작권 표시를 노출
 */
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Logo } from '../atoms/Logo';
import styles from './PublicFooter.module.scss';

export function PublicFooter() {
  const { t } = useTranslation();
  return (
    <footer className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}><Logo variant='onDark' /><p>{t('footer.description')}</p></div>
          <nav className={styles.links} aria-label={t('footer.links')}>
            <Link to='/about/service'>{t('footer.about')}</Link>
            <Link to='/terms'>{t('footer.terms')}</Link>
            <Link to='/privacy'>{t('footer.privacy')}</Link>
          </nav>
        </div>
        <div className={styles.bottom}>
          <div>
            <p className={styles.sources}>
              <span>{t('footer.data')}</span>
              <a href='https://api.visitkorea.or.kr/' target='_blank' rel='noreferrer'>{t('footer.tourSource')}</a>
              <span aria-hidden='true'>·</span>
              <a href='https://www.weather.go.kr/' target='_blank' rel='noreferrer'>{t('footer.weatherSource')}</a>
              <span aria-hidden='true'>·</span>
              <a href='https://www.tmapmobility.com/' target='_blank' rel='noreferrer'>TMAP</a>
            </p>
            <p className={styles.notice}>{t('footer.notice')}</p>
          </div>
          <small>© 2026 INCHEON SPOTLIGHT</small>
        </div>
      </div>
    </footer>
  );
}
