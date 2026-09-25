/**
 * VisitFeedPage.jsx — 공개 방문 인증 갤러리 '여행자들의 한 장'
 * - 라우트: `/visits` (공개)
 * - 지역·관광지·검색어를 URL 쿼리로 관리하며 fetchPublicVisits 로 모자이크 목록을 페이징
 * - fetchQuestRegions·fetchQuestPlaces 결과로 필터 칩을 채우고 VisitCard 로 카드를 렌더링
 */
import { uiText, useUiLanguage } from '../i18n/uiText';
import { Skeleton } from '../components/atoms/Skeleton';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchPublicVisits } from '../api/visitApi';
import { fetchQuestPlaces, fetchQuestRegions } from '../api/stampApi';
import { getApiErrorMessage, isSchemaNotReady } from '../api/http';
import { SiteChrome } from '../components/layout/SiteChrome';
import { VisitCard } from '../components/visit/VisitCard';
import { SchemaNotice } from '../components/stamp/NicknameAvatar';
import { useAuthStore } from '../stores/useAuthStore';
import { districtRegionOptions } from '../data/incheonDistricts';
import styles from './VisitFeed.module.scss';

function tileVariant(index) {
  if (index === 0) return 'featured';
  return 'card';
}

export default function VisitFeedPage() {
  useUiLanguage();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [regions, setRegions] = useState([]);
  const [places, setPlaces] = useState([]);
  const [feed, setFeed] = useState({ key: '', page: null, error: '', schema: false });
  const regionId = searchParams.get('regionId') || '';
  const placeId = searchParams.get('placeId') || '';
  const q = searchParams.get('q') || '';
  const [queryDraft, setQueryDraft] = useState(q);
  const feedKey = `${regionId}|${placeId}|${q}`;
  const page = feed.key === feedKey ? feed.page : null;
  const error = feed.key === feedKey ? feed.error : '';
  const schema = feed.key === feedKey ? feed.schema : false;
  const loading = feed.key !== feedKey;
  const visiblePlaces = regionId ? places : [];

  useEffect(() => {
    setQueryDraft(q);
  }, [q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = queryDraft.trim();
      if (next === q) return;
      updateFilter('q', next);
    }, 400);
    return () => window.clearTimeout(timer);
    // updateFilter는 searchParams를 읽어 최신 값을 유지합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryDraft, q]);

  useEffect(() => {
    let cancelled = false;
    fetchQuestRegions()
      .then((data) => {
        if (!cancelled) setRegions(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setRegions([]);
        if (isSchemaNotReady(err)) {
          setFeed((prev) => ({
            ...prev,
            schema: true,
            error: getApiErrorMessage(err),
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!regionId) {
      setPlaces([]);
      return undefined;
    }
    let cancelled = false;
    fetchQuestPlaces({ regionId })
      .then((data) => {
        if (!cancelled) setPlaces(data);
      })
      .catch(() => {
        if (!cancelled) setPlaces([]);
      });
    return () => {
      cancelled = true;
    };
  }, [regionId]);

  useEffect(() => {
    let cancelled = false;
    fetchPublicVisits({ regionId, placeId, q, pageNo: 1, numOfRows: 13 })
      .then((data) => {
        if (!cancelled) {
          setFeed({ key: feedKey, page: data, error: '', schema: false });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFeed({
            key: feedKey,
            page: null,
            schema: isSchemaNotReady(err),
            error: getApiErrorMessage(err, '여행 기록을 불러오지 못했습니다.'),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [regionId, placeId, q, feedKey]);

  async function loadMore() {
    if (!page?.hasMore) return;
    try {
      const next = await fetchPublicVisits({
        regionId,
        placeId,
        q,
        pageNo: page.pageNo + 1,
        numOfRows: page.numOfRows,
      });
      setFeed((current) => ({
        ...current,
        page: {
          ...next,
          items: [...(current.page?.items || []), ...next.items],
        },
        error: '',
      }));
    } catch (err) {
      setFeed((current) => ({
        ...current,
        error: getApiErrorMessage(err, '더 많은 기록을 불러오지 못했습니다.'),
      }));
    }
  }

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'regionId') next.delete('placeId');
    setSearchParams(next);
  }

  const items = page?.items || [];
  const regionChips = regions.length > 0 ? regions : districtRegionOptions();

  return (
    <SiteChrome activeNavId='visits'>
      <div className={styles.page}>
        <div className={styles.crumbBar}>
          <nav className={styles.breadcrumb} aria-label={t('auth.location')}>
            <Link to='/'>{t('common.home')}</Link>
            <span className={styles.sep} aria-hidden>
              /
            </span>
            <span aria-current='page'>{t('nav.visits')}</span>
          </nav>
        </div>

        <div className={styles.inner}>
          <header className={styles.hero}>
            <div>
              <p className={styles.kicker}>{t('visit.galleryKicker')}</p>
              <h1>{t('nav.visits')}</h1>
              <p className={styles.lead}>{t('visit.galleryLead')}</p>
              <p className={styles.note}>{t('visit.unofficial')}</p>
            </div>
            <Link
              className={styles.cta}
              to={user?.authenticated ? '/visits/new' : '/login'}
              state={user?.authenticated ? undefined : { from: '/visits/new' }}
            >{t('visit.verify')}</Link>
          </header>

          <div className={styles.filters}>
            <form
              className={styles.search}
              onSubmit={(event) => {
                event.preventDefault();
                updateFilter('q', queryDraft.trim());
              }}
              role='search'
            >
              <Search size={18} aria-hidden />
              <label className={styles.visuallyHidden} htmlFor='visit-gallery-q'>{t('visit.searchLabel')}</label>
              <input
                id='visit-gallery-q'
                value={queryDraft}
                onChange={(e) => setQueryDraft(e.target.value)}
                placeholder={t('visit.searchPlaceholder')}
                type='search'
                enterKeyHint='search'
              />
              <button type='submit'>{t('visit.find')}</button>
            </form>
            <p className={styles.count}>
              {loading ? (
                t('visit.collecting')
              ) : (
                <>{t('visit.publicRecords')}<strong>{page?.totalCount ?? 0}</strong>{t('visit.recordUnit')}</>
              )}
            </p>
            <div className={styles.chips} role='group' aria-label={t('visit.region')}>
              <button
                type='button'
                className={regionId ? styles.chip : `${styles.chip} ${styles.chipActive}`}
                aria-pressed={!regionId}
                onClick={() => updateFilter('regionId', '')}
              >{t('visit.all')}</button>
              {regionChips.map((region) => (
                <button
                  key={region.regionId}
                  type='button'
                  className={
                    regionId === region.regionId
                      ? `${styles.chip} ${styles.chipActive}`
                      : styles.chip
                  }
                  aria-pressed={regionId === region.regionId}
                  onClick={() => updateFilter('regionId', region.regionId)}
                >
                  {uiText(region.regionName)}
                </button>
              ))}
            </div>
            {visiblePlaces.length > 0 ? (
              <div className={styles.chips} role='group' aria-label={t('visit.place')}>
                <button
                  type='button'
                  className={placeId ? styles.chip : `${styles.chip} ${styles.chipActive}`}
                  aria-pressed={!placeId}
                  onClick={() => updateFilter('placeId', '')}
                >{t('visit.regionAll')}</button>
                {visiblePlaces.map((place) => (
                  <button
                    key={place.placeId}
                    type='button'
                    className={
                      placeId === place.placeId
                        ? `${styles.chip} ${styles.chipActive}`
                        : styles.chip
                    }
                    aria-pressed={placeId === place.placeId}
                    onClick={() => updateFilter('placeId', place.placeId)}
                  >
                    {uiText(place.name)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {schema ? <SchemaNotice /> : null}
          {error && !schema ? (
            <p className={styles.alert} role='alert'>
              {uiText(error)}
            </p>
          ) : null}

          {loading ? (
            <Skeleton variant='cards' count={4} label={t('visit.loading')} />
          ) : null}

          {!loading && items.length === 0 && !schema && !error ? (
            <div className={styles.empty}>
              <strong>{t('visit.emptyTitle')}</strong>
              <p>{t('visit.emptyLead')}</p>
            </div>
          ) : null}

          {!loading && items.length > 0 ? (
            <div className={styles.mosaic}>
              {items.map((visit, index) => (
                <VisitCard
                  key={visit.verifyId}
                  visit={visit}
                  variant={tileVariant(index)}
                />
              ))}
            </div>
          ) : null}

          {page?.hasMore ? (
            <div className={styles.more}>
              <button type='button' className={styles.moreBtn} onClick={loadMore}>{t('visit.more')}</button>
            </div>
          ) : null}
        </div>
      </div>
    </SiteChrome>
  );
}
