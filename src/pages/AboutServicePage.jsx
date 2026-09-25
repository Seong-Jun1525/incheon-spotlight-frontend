/**
 * AboutServicePage.jsx — 서비스 소개 화면
 * - 라우트: `/about/service` (공개, AboutLayout 하위)
 * - i18n 키로 이용 3단계와 활용 사례를 정리해 보여주는 안내 화면
 * - 하단 CTA 로 지도(`/`)와 인천 소개(`/about`)로 이동
 */
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './AboutIncheonPage.module.scss';

const STEP_NOS = ['1', '2', '3'];
const USE_NOS = ['1', '2', '3'];

export default function AboutServicePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <article className={styles.page}>
      <header className={styles.serviceHero}>
        <div className={styles.serviceHeroInner}>
          <p className={styles.eyebrow}>{t('about.service.eyebrow')}</p>
          <p className={styles.kicker}>{t('about.service.kicker')}</p>
          <h1>{t('about.service.title')}</h1>
          <p className={styles.lead}>{t('about.service.lead')}</p>
        </div>
      </header>

      <section className={styles.block}>
        <header className={styles.blockHead}>
          <h2>{t('about.service.stepsTitle')}</h2>
          <p>{t('about.service.stepsLead')}</p>
        </header>
        <ol className={styles.chapters}>
          {STEP_NOS.map((no) => (
            <li key={no}>
              <span>{no.padStart(2, '0')}</span>
              <h3>{t(`about.service.step.${no}.title`)}</h3>
              <p>{t(`about.service.step.${no}.body`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.block}>
        <header className={styles.blockHead}>
          <h2>{t('about.service.usesTitle')}</h2>
          <p>{t('about.service.usesLead')}</p>
        </header>
        <ul className={styles.uses}>
          {USE_NOS.map((no) => (
            <li key={no}>
              <h3>{t(`about.service.use.${no}.title`)}</h3>
              <p>{t(`about.service.use.${no}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.official}>
        <div>
          <h2>{t('about.service.nextTitle')}</h2>
          <p>{t('about.service.nextLead')}</p>
        </div>
        <div className={styles.heroActions}>
          <button type='button' className={styles.primary} onClick={() => navigate('/')}>
            {t('about.service.ctaMap')}
          </button>
          <button type='button' className={styles.ghost} onClick={() => navigate('/about')}>
            {t('about.service.ctaAbout')}
          </button>
        </div>
      </section>
    </article>
  );
}
