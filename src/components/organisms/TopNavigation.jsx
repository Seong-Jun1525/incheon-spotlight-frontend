/**
 * TopNavigation.jsx — 공지 바·브랜딩·내비게이션으로 구성된 서비스 상단 헤더
 * - 헤더 높이를 ResizeObserver로 측정해 --site-nav-height CSS 변수에 반영
 * - 검색·AI·즐겨찾기·로그인/마이페이지 버튼과 즐겨찾기·알림 카운트 배지를 렌더링
 * - 모바일 레이아웃에서 메뉴 드로어를 열고 Esc 닫기·포커스 이동·본문 스크롤 잠금을 처리
 */
import { useTranslation } from 'react-i18next';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MapPin, LogIn, LogOut, Menu, Search, MessageCircle, Star, UserRound, X } from 'lucide-react';
import { LanguageSelect } from '../atoms/LanguageSelect';
import { Logo } from '../atoms/Logo';
import { Button } from '../atoms/Button';
import { DisplayModeSwitch } from '../atoms/DisplayModeSwitch';
import { IconButton } from '../atoms/IconButton';
import { NavMenu } from '../molecules/NavMenu';
import { NicknameAvatar } from '../stamp/NicknameAvatar';
import { PHONE_LAYOUT_MQ } from '../../constants/breakpoints';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import styles from './TopNavigation.module.scss';

export function TopNavigation({
  navItems,
  activeNavId,
  onNavItem,
  onSearch,
  onFavorites,
  onAiAssistant,
  aiAssistantOpen = false,
  onLogin,
  onSignup,
  onMypage,
  onLogout,
  user,
  unreadCount = 0,
  favoriteCount = 0,
}) {
  const { t } = useTranslation();
  const headerRef = useRef(null);
  const closeBtnRef = useRef(null);
  const isPhoneLayout = useMediaQuery(PHONE_LAYOUT_MQ);
  const [menuOpen, setMenuOpen] = useState(false);
  const authenticated = Boolean(user?.authenticated);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;
    const updateHeight = () => {
      document.documentElement.style.setProperty('--site-nav-height', `${header.getBoundingClientRect().height}px`);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, [menuOpen, isPhoneLayout]);

  useEffect(() => {
    if (!isPhoneLayout) setMenuOpen(false);
  }, [isPhoneLayout]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const runAndClose = (action) => {
    closeMenu();
    action?.();
  };

  return (
    <header ref={headerRef} className={styles.root} data-phone={isPhoneLayout ? 'true' : undefined}>
      <div className={styles.noticeBar}>
        <p>
          <MapPin
            size={13}
            aria-hidden='true'
          />
          <span>{t('nav.service')}</span>
        </p>
        <div className={styles.preferences}><LanguageSelect /><DisplayModeSwitch compact /></div>
      </div>

      <div className={styles.brandingRow}>
        <div className={styles.left}>
          <button type='button' className={styles.logoBtn} onClick={() => onNavItem?.('explore')}>
            <Logo />
          </button>
        </div>
        <div className={styles.right}>
          <Button
            variant='ghost'
            className={`${styles.utilityBtn} ${styles.searchBtn}`}
            type='button'
            aria-label={t('common.search')}
            onClick={onSearch}
          >
            <Search
              size={17}
              aria-hidden='true'
            />
            <span>{t('common.search')}</span>
          </Button>
          {onAiAssistant ? (
            <Button
              variant='ghost'
              className={
                aiAssistantOpen
                  ? `${styles.utilityBtn} ${styles.utilityActive}`
                  : styles.utilityBtn
              }
              type='button'
              aria-label={t('nav.aiLabel')}
              aria-expanded={aiAssistantOpen}
              onClick={onAiAssistant}
            >
              <MessageCircle
                size={17}
                aria-hidden='true'
              />
              <span>{t('nav.ai')}</span>
            </Button>
          ) : null}
          <Button
            variant='ghost'
            className={styles.fav}
            type='button'
            onClick={onFavorites}
          >
            <Star
              size={16}
              className={styles.favIcon}
              fill={favoriteCount > 0 ? 'currentColor' : 'none'}
            />
            <span>{t('nav.favorites')}</span>
            {favoriteCount > 0 ? (
              <span
                className={styles.favCount}
                aria-label={t('common.count', { count: favoriteCount })}
              >
                {favoriteCount > 99 ? '99+' : favoriteCount}
              </span>
            ) : null}
          </Button>
          <IconButton
            aria-label={
              favoriteCount > 0 ? t('nav.favoriteCount', { count: favoriteCount }) : t('nav.favorites')
            }
            className={styles.favMobile}
            onClick={onFavorites}
          >
            <Star
              size={18}
              fill={favoriteCount > 0 ? 'currentColor' : 'none'}
            />
          </IconButton>
          {authenticated ? (
            <>
              <Button
                variant='ghost'
                className={styles.loginBtn}
                type='button'
                onClick={onMypage}
              >
                <NicknameAvatar nickname={user.nickname} size={22} />
                <span>{t('nav.mypage')}</span>
                {unreadCount > 0 ? (
                  <span className={styles.favCount} aria-label={t('nav.notifications', { count: unreadCount })}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : null}
              </Button>
              <Button
                variant='ghost'
                className={styles.utilityBtn}
                type='button'
                onClick={onLogout}
                aria-label={t('nav.logout')}
              >
                <LogOut
                  size={17}
                  aria-hidden='true'
                />
                <span>{t('nav.logout')}</span>
              </Button>
              <IconButton
                aria-label={t('nav.mypage')}
                className={styles.loginMobile}
                onClick={onMypage}
              >
                <UserRound size={18} />
              </IconButton>
            </>
          ) : (
            <>
              <Button
                variant='ghost'
                className={styles.loginBtn}
                type='button'
                onClick={onLogin}
              >
                <LogIn
                  size={17}
                  aria-hidden='true'
                />
                <span>{t('nav.login')}</span>
              </Button>
              <Button
                variant='ghost'
                className={styles.loginBtn}
                type='button'
                onClick={onSignup}
              >
                <span>{t('nav.signup')}</span>
              </Button>
              <IconButton
                aria-label={t('nav.login')}
                className={styles.loginMobile}
                onClick={onLogin}
              >
                <LogIn size={18} />
              </IconButton>
            </>
          )}
          <IconButton
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={menuOpen}
            aria-controls='site-mobile-menu'
            className={styles.menuToggle}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </IconButton>
        </div>
      </div>

      <div className={styles.menuRow}>
        <NavMenu
          items={navItems}
          activeId={activeNavId}
          onItemClick={onNavItem}
          className={styles.nav}
        />
        <span className={styles.menuMeta}>{t('nav.meta')}</span>
      </div>

      {menuOpen ? (
        <div className={styles.menuLayer}>
          <button
            type='button'
            className={styles.menuBackdrop}
            aria-label={t('common.close')}
            onClick={closeMenu}
          />
          <div
            id='site-mobile-menu'
            className={styles.menuDrawer}
            role='dialog'
            aria-modal='true'
            aria-label={t('nav.menu')}
          >
            <div className={styles.menuDrawerHead}>
              <strong>{t('nav.menu')}</strong>
              <IconButton
                ref={closeBtnRef}
                aria-label={t('nav.closeMenu')}
                onClick={closeMenu}
              >
                <X size={18} />
              </IconButton>
            </div>
            <ul className={styles.menuDrawerList}>
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    type='button'
                    className={item.id === activeNavId ? styles.menuDrawerActive : undefined}
                    onClick={() => runAndClose(() => onNavItem?.(item.id))}
                  >
                    {t(`nav.${item.id}`, { defaultValue: item.label })}
                  </button>
                </li>
              ))}
            </ul>
            <div className={styles.menuDrawerActions}>
              <button type='button' onClick={() => runAndClose(onSearch)}>
                {t('common.search')}
              </button>
              {onAiAssistant ? (
                <button type='button' onClick={() => runAndClose(onAiAssistant)}>
                  {t('nav.ai')}
                </button>
              ) : null}
              <button type='button' onClick={() => runAndClose(onFavorites)}>
                {t('nav.favorites')}
                {favoriteCount > 0 ? ` (${favoriteCount > 99 ? '99+' : favoriteCount})` : ''}
              </button>
              {authenticated ? (
                <>
                  <button type='button' onClick={() => runAndClose(onMypage)}>
                    {t('nav.mypage')}
                    {unreadCount > 0 ? ` (${unreadCount > 99 ? '99+' : unreadCount})` : ''}
                  </button>
                  <button type='button' onClick={() => runAndClose(onLogout)}>
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <button type='button' onClick={() => runAndClose(onLogin)}>
                    {t('nav.login')}
                  </button>
                  <button type='button' onClick={() => runAndClose(onSignup)}>
                    {t('nav.signup')}
                  </button>
                </>
              )}
            </div>
            <div className={styles.menuDrawerPrefs}>
              <LanguageSelect />
              <DisplayModeSwitch compact />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
