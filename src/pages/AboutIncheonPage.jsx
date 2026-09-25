/**
 * AboutIncheonPage.jsx — 인천 소개 화면
 * - 라우트: `/about` 의 index (공개, AboutLayout 하위)
 * - i18n 키를 바탕으로 핵심 지표·챕터·연표를 에디토리얼 형태로 구성
 * - mockDistricts 의 구·군 카드를 누르면 focusDistrict 상태와 함께 `/` 로 이동
 */
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mockDistricts } from '../data/mockDistricts';
import { translateDistrictBlurb } from '../i18n/placeLabel';
import styles from './AboutIncheonPage.module.scss';

const FACT_IDS = ['districts', 'area', 'gateway', 'scenes'];
const CHAPTER_NOS = ['1', '2', '3'];
const TIMELINE_YEARS = ['1883', '2001', '2003'];

export default function AboutIncheonPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  function openDistrict(districtId) {
    navigate('/', { state: { focusDistrict: districtId } });
  }

  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{t('about.incheon.eyebrow')}</p>
            <p className={styles.kicker}>{t('about.incheon.kicker')}</p>
            <h1>
              <span>{t('about.incheon.title1')}</span>
              <span>{t('about.incheon.title2')}</span>
            </h1>
            <p className={styles.lead}>{t('about.incheon.lead')}</p>
            <div className={styles.heroActions}>
              <button type='button' className={styles.primary} onClick={() => navigate('/')}>
                {t('about.incheon.ctaMap')}
              </button>
              <button type='button' className={styles.ghost} onClick={() => navigate('/about/service')}>
                {t('about.incheon.ctaService')}
              </button>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <img
              src='/images/about-incheon-hero.png'
              alt={t('about.incheon.heroAlt')}
              width={1280}
              height={720}
            />
          </div>
        </div>
      </header>

      <section className={styles.facts} aria-label={t('about.incheon.factsAria')}>
        {FACT_IDS.map((id) => (
          <div key={id} className={styles.fact}>
            <span>{t(`about.incheon.fact.${id}.label`)}</span>
            <strong>{t(`about.incheon.fact.${id}.value`)}</strong>
            <em>{t(`about.incheon.fact.${id}.note`)}</em>
          </div>
        ))}
      </section>

      <section className={styles.block}>
        <header className={styles.blockHead}>
          <h2>{t('about.incheon.chaptersTitle')}</h2>
          <p>{t('about.incheon.chaptersLead')}</p>
        </header>
        <ol className={styles.chapters}>
          {CHAPTER_NOS.map((no) => (
            <li key={no}>
              <span>{no.padStart(2, '0')}</span>
              <h3>{t(`about.incheon.chapter.${no}.title`)}</h3>
              <p>{t(`about.incheon.chapter.${no}.body`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.block}>
        <header className={styles.blockHead}>
          <h2>{t('about.incheon.timelineTitle')}</h2>
          <p>{t('about.incheon.timelineLead')}</p>
        </header>
        <ol className={styles.timeline}>
          {TIMELINE_YEARS.map((year) => (
            <li key={year}>
              <time>{year}</time>
              <div>
                <h3>{t(`about.incheon.timeline.${year}.title`)}</h3>
                <p>{t(`about.incheon.timeline.${year}.body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.block}>
        <header className={styles.blockHead}>
          <h2>{t('about.incheon.districtsTitle')}</h2>
          <p>{t('about.incheon.districtsLead')}</p>
        </header>
        <ul className={styles.districts}>
          {mockDistricts.map((district) => (
            <li key={district.id}>
              <button type='button' onClick={() => openDistrict(district.id)}>
                <strong>{t(`district.${district.id}`, { defaultValue: district.name })}</strong>
                <span>
                  {district.themeTags
                    ?.map((tag) => t(`theme.${tag}`, { defaultValue: tag }))
                    .join(' · ')}
                </span>
                <p>{translateDistrictBlurb(t, district)}</p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.official}>
        <div>
          <h2>{t('about.incheon.nextTitle')}</h2>
          <p>{t('about.incheon.nextLead')}</p>
        </div>
        <button type='button' className={styles.primary} onClick={() => navigate('/')}>
          {t('about.incheon.ctaBrowse')}
        </button>
      </section>
    </article>
  );
}
