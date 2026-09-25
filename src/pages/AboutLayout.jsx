/**
 * AboutLayout.jsx — 소개 영역 공통 레이아웃
 * - 라우트: `/about` (공개, 하위 소개 화면의 부모 레이아웃)
 * - SiteChrome 안에 '인천 소개 / 서비스 소개' 서브내비를 두고 Outlet 으로 하위 화면을 그림
 */
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SiteChrome } from '../components/layout/SiteChrome';
import styles from './AboutIncheonPage.module.scss';

const ABOUT_SUBNAV = [
  { to: '/about', labelKey: 'about.nav.incheon', end: true },
  { to: '/about/service', labelKey: 'about.nav.service' },
];

export function AboutLayout() {
  const { t } = useTranslation();

  return (
    <SiteChrome activeNavId='about'>
      <nav className={styles.subnav} aria-label={t('about.nav.aria')}>
        <div className={styles.subnavInner}>
          {ABOUT_SUBNAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? `${styles.subnavLink} ${styles.subnavLinkActive}` : styles.subnavLink
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </div>
      </nav>
      <Outlet />
    </SiteChrome>
  );
}
