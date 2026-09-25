/**
 * MypageOverviewPage.jsx — 마이페이지 첫 화면(내 활동 요약)
 * - 라우트: `/mypage` (로그인 필요)
 * - fetchStampOverview 로 확인한 관광지·완주 지역·확인 중/보완 건수를 지표 카드로 표시
 * - 최근 획득 스탬프와 이어서 채울 지역 진행률을 목록으로 보여주고 스탬프북으로 연결
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { Skeleton } from '../../components/atoms/Skeleton';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchStampOverview } from '../../api/stampApi';
import { getApiErrorMessage, isSchemaNotReady } from '../../api/http';
import { MypageLayout } from '../../components/layout/SiteChrome';
import { SchemaNotice } from '../../components/stamp/NicknameAvatar';
import { DistrictMark } from '../../components/stamp/DistrictMark';
import { districtLabels } from '../../data/incheonDistricts';
import { formatDate, progressPercent } from '../../utils/formatDate';
import styles from '../../components/layout/MemberShell.module.scss';

export default function MypageOverviewPage() {
  useUiLanguage();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [schema, setSchema] = useState(false);

  useEffect(() => {
    fetchStampOverview()
      .then(setData)
      .catch((err) => {
        setSchema(isSchemaNotReady(err));
        setError(getApiErrorMessage(err));
      });
  }, []);

  return (
    <MypageLayout
      title={t('member.overview')}
      description={t('member.overviewLead')}
    >
      <Link className={styles.sectionLink} to='/travel-plans'>{t('member.plansLink')}</Link>
      {schema ? <SchemaNotice /> : null}
      {error && !schema ? <p className={styles.alert} role='alert'>{uiText(error)}</p> : null}
      {!data && !error ? <Skeleton variant='cards' count={3} /> : null}
      {data ? (
        <>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>{data.approvedPlaceCount}</strong>
              <span>{t('member.checkedPlaces')}</span>
            </div>
            <div className={styles.stat}>
              <strong>{data.completedRegionCount}</strong>
              <span>{t('member.completedRegions')}</span>
            </div>
            <div className={styles.stat}>
              <strong>{data.pendingCount}</strong>
              <span>{t('member.pendingReviews')}</span>
            </div>
            <div className={styles.stat}>
              <strong>{data.revisionCount}</strong>
              <span>{t('member.revisionReviews')}</span>
            </div>
          </div>
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{t('member.recentPlaces')}</h2>
              <Link className={styles.sectionLink} to='/mypage/passport'>{t('member.viewPassport')}</Link>
            </div>
            {data.recentStamps?.length ? (
              <div className={styles.list}>
                {data.recentStamps.map((stamp) => (
                  <Link
                    key={stamp.stampId}
                    className={styles.listItem}
                    to={`/mypage/passport/${stamp.regionId}`}
                  >
                    <div className={styles.grow}>
                      <strong>{uiText(stamp.placeName)}</strong>
                      <div className={styles.meta}>
                        <span>{uiText(districtLabels[stamp.regionId] || stamp.regionName)}</span>
                        {stamp.acquiredAt ? <span>{formatDate(stamp.acquiredAt)}</span> : null}
                      </div>
                    </div>
                    <ChevronRight className={styles.listChevron} size={18} aria-hidden />
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <p>{t('member.noCheckedPlaces')}</p>
                <div className={styles.pager}>
                  <Link className={styles.primary} to='/visits/new'>{t('visit.verify')}</Link>
                </div>
              </div>
            )}
          </section>
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{t('member.continueRegions')}</h2>
              <Link className={styles.sectionLink} to='/mypage/passport'>{t('member.viewAll')}</Link>
            </div>
            {data.continueRegions?.length ? (
              <div className={styles.list}>
                {data.continueRegions.map((region) => {
                  const percent = progressPercent(region.approvedCount, region.totalCount);
                  return (
                    <Link
                      key={region.regionId}
                      className={styles.listItem}
                      to={`/mypage/passport/${region.regionId}`}
                    >
                      <DistrictMark regionId={region.regionId} name={region.regionName} size={36} />
                      <div className={styles.grow}>
                        <strong>{uiText(region.regionName)}</strong>
                        <div
                          className={styles.progress}
                          role='progressbar'
                          aria-valuemin={0}
                          aria-valuemax={region.totalCount || 0}
                          aria-valuenow={region.approvedCount || 0}
                          aria-label={t('member.progressLabel', { name: region.regionName })}
                        >
                          <span className={styles.progressBar} style={{ width: `${percent}%` }} />
                        </div>
                        <div className={styles.meta}>
                          {region.approvedCount} / {region.totalCount}{t('member.placeUnit')}{percent}%
                        </div>
                      </div>
                      <ChevronRight className={styles.listChevron} size={18} aria-hidden />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className={styles.empty}>{t('member.allRegionsHint')}</p>
            )}
          </section>
        </>
      ) : null}
    </MypageLayout>
  );
}
