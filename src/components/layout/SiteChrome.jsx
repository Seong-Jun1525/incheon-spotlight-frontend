/**
 * SiteChrome.jsx — 상단 내비게이션 + 푸터로 페이지를 감싸는 공통 레이아웃 셸
 * - SiteChrome: TopNavigation에 useChromeSession 인증 props와 즐겨찾기 수를 연결하고 검색·즐겨찾기 이동을 처리
 * - MypageLayout: SiteChrome 위에 마이페이지 히어로와 MY_MENUS 사이드 내비(모바일은 select)를 추가
 */
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { TopNavigation } from '../organisms/TopNavigation';
import { PublicFooter } from './PublicFooter';
import { NicknameAvatar } from '../stamp/NicknameAvatar';
import { navLinks } from '../../data/mainMockData';
import { useChromeSession } from '../../hooks/useChromeSession';
import { useFavoritesStore } from '../../stores/useFavoritesStore';
import styles from './MemberShell.module.scss';

const MY_MENUS = [
  { to: '/mypage', labelKey: 'member.overview', end: true },
  { to: '/mypage/passport', labelKey: 'member.passport' },
  { to: '/mypage/verifications', labelKey: 'member.verifications' },
  { to: '/mypage/favorites', labelKey: 'member.favorites' },
  { to: '/travel-plans', labelKey: 'member.plans' },
  { to: '/mypage/profile', labelKey: 'member.profile' },
  { to: '/mypage/notifications', labelKey: 'member.notifications' },
];

export function SiteChrome({ children, activeNavId = 'visits' }) {
  const navigate = useNavigate();
  const { navAuthProps, goMemberNav } = useChromeSession();
  const favoriteCount = useFavoritesStore((s) => s.items.length);

  return (
    <div className={styles.page}>
      <TopNavigation
        navItems={navLinks}
        activeNavId={activeNavId}
        onNavItem={(id) => {
          if (goMemberNav(id)) return;
          navigate('/', { state: { navId: id } });
        }}
        onSearch={() => navigate('/', { state: { focusSearch: true } })}
        onFavorites={() => navigate('/mypage/favorites')}
        favoriteCount={favoriteCount}
        {...navAuthProps}
      />
      <div id='main-content' tabIndex='-1' className={styles.content}>
        {children}
      </div>
      <PublicFooter />
    </div>
  );
}

export function MypageLayout({ title, eyebrow, description, actions, children }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useChromeSession();

  return (
    <SiteChrome activeNavId=''>
      <div className={styles.main}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>{eyebrow || t('nav.mypage')}</p>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className={styles.heroActions}>{actions}</div> : null}
        </header>
        <div className={styles.mypage}>
          <aside className={styles.side}>
            <div className={styles.identity}>
              <NicknameAvatar nickname={user?.nickname} size={40} />
              <div>
                <p className={styles.identityName}>{user?.nickname || t('member.member')}</p>
                <p className={styles.identityHint}>{user?.email || t('member.service')}</p>
              </div>
            </div>
            <nav className={styles.sideNav} aria-label={t('member.menu')}>
              {MY_MENUS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    isActive ? styles.sideNavActive : undefined
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              ))}
              {user?.admin ? (
                <NavLink to='/admin/reviews'>{t('member.admin')}</NavLink>
              ) : null}
            </nav>
            <label>
              <span className={styles.visuallyHidden}>{t('member.menu')}</span>
              <select
                className={styles.mobileNav}
                value={
                  MY_MENUS.some((item) => item.to === location.pathname)
                    ? location.pathname
                    : location.pathname.startsWith('/mypage/passport')
                      ? '/mypage/passport'
                      : location.pathname.startsWith('/mypage/verifications')
                        ? '/mypage/verifications'
                        : '/mypage'
                }
                onChange={(e) => navigate(e.target.value)}
                aria-label={t('member.menu')}
              >
                {MY_MENUS.map((item) => (
                  <option key={item.to} value={item.to}>
                    {t(item.labelKey)}
                  </option>
                ))}
                {user?.admin ? (
                  <option value='/admin/reviews'>{t('member.admin')}</option>
                ) : null}
              </select>
            </label>
          </aside>
          <div className={styles.mypageMain}>{children}</div>
        </div>
      </div>
    </SiteChrome>
  );
}
