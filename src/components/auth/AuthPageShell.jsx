/**
 * AuthPageShell.jsx — 로그인·회원가입·비밀번호 재설정 화면의 공통 뼈대
 * - SiteChrome 안에 브레드크럼, 제목/설명, 단계 표시, 본문·사이드 안내를 배치
 * - current/title/steps/aside props로 각 인증 페이지가 내용만 채움
 */
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SiteChrome } from '../layout/SiteChrome';
import styles from './AuthPage.module.scss';

export function AuthPageShell({
  current,
  title,
  description,
  disclaimer,
  steps,
  aside,
  children,
}) {
  const { t } = useTranslation();
  return (
    <SiteChrome activeNavId=''>
      <div className={styles.wrap}>
        <div className={styles.crumbBar}>
          <nav className={styles.breadcrumb} aria-label={t('auth.location')}>
            <Link to='/'>{t('common.home')}</Link>
            <span className={styles.sep} aria-hidden='true'>
              /
            </span>
            <span aria-current='page'>{current}</span>
          </nav>
        </div>
        <div className={styles.inner}>
          <header className={styles.titleBand}>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
            {disclaimer ? <p className={styles.disclaimer}>{disclaimer}</p> : null}
          </header>
          {steps ? (
            <ol className={styles.steps} aria-label={t('auth.steps')}>
              {steps.map((step) => (
                <li
                  key={step.n}
                  className={`${styles.step} ${
                    step.state === 'current'
                      ? styles.stepCurrent
                      : step.state === 'done'
                        ? styles.stepDone
                        : ''
                  }`}
                  aria-current={step.state === 'current' ? 'step' : undefined}
                >
                  <span className={styles.stepNum} aria-hidden='true'>
                    {step.n}
                  </span>
                  <span className={styles.stepLabel}>
                    {step.label}
                    {step.caption ? <small>{step.caption}</small> : null}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
          <div className={aside ? styles.layout : styles.layoutSolo}>
            <div className={styles.panel}>{children}</div>
            {aside ? (
              <aside className={styles.aside} aria-label={t('auth.guide')}>
                {aside}
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </SiteChrome>
  );
}
