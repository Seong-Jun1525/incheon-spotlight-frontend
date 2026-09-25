/**
 * PassportPage.jsx — 여행 여권(지역별 스탬프북) 화면
 * - 라우트: `/mypage/passport` (로그인 필요), PassportRegionPage 는 `/mypage/passport/:regionId`
 * - fetchPassport 로 인천 11개 구·군의 완주·진행 현황을 집계해 진행률 카드 그리드로 표시
 * - 지역 화면은 fetchPassportRegion 결과를 스탬프 상태별로 걸러 인증하기·관광지 정보로 연결
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { Skeleton } from '../../components/atoms/Skeleton';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPassport, fetchPassportRegion } from '../../api/stampApi';
import { getApiErrorMessage, isSchemaNotReady } from '../../api/http';
import { MypageLayout } from '../../components/layout/SiteChrome';
import { SchemaNotice } from '../../components/stamp/NicknameAvatar';
import { DistrictMark } from '../../components/stamp/DistrictMark';
import { StatusBadge } from '../../components/stamp/StatusBadge';
import { resolveAssetUrl } from '../../utils/resolveAssetUrl';
import { progressPercent } from '../../utils/formatDate';
import { toMapPageState } from '../../utils/mapNavigation';
import styles from '../../components/layout/MemberShell.module.scss';

const PLACE_FILTERS = [
  { value: '', label: '전체' },
  { value: 'NONE', label: '미확인' },
  { value: 'PENDING', label: '확인 중' },
  { value: 'NEEDS_REVISION', label: '보완 필요' },
  { value: 'ACQUIRED', label: '확인 완료' },
];

function regionState(region) {
  if (region.completedCurrentVersion) return { label: '완주', tone: styles.pillOn };
  if (region.approvedCount > 0) return { label: '진행 중', tone: styles.pillWait };
  return { label: '미시작', tone: '' };
}

function stampBadge(status) {
  if (status === 'ACQUIRED') return <StatusBadge status='APPROVED' label={uiText("확인 완료")} />;
  if (status === 'NONE') return <StatusBadge status='NONE' label={uiText("미확인")} />;
  return <StatusBadge status={status} />;
}

export default function PassportPage() {
  useUiLanguage();
  const [regions, setRegions] = useState([]);
  const [error, setError] = useState('');
  const [schema, setSchema] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPassport()
      .then((data) => {
        if (!cancelled) setRegions(data || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setSchema(isSchemaNotReady(err));
        setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const completed = regions.filter((region) => region.completedCurrentVersion).length;
    const ongoing = regions.filter((region) => region.approvedCount > 0 && !region.completedCurrentVersion).length;
    const stamps = regions.reduce((sum, region) => sum + (region.approvedCount || 0), 0);
    return { completed, ongoing, stamps, total: regions.length };
  }, [regions]);

  return (
    <MypageLayout
      title={uiText("나의 여행 여권")}
      description={uiText("인천 11개 구·군에서 확인한 관광지를 모읍니다. 한 지역의 대상을 모두 확인하면 완주로 기록됩니다.")}
    >
      {schema ? <SchemaNotice /> : null}
      {error && !schema ? <p className={styles.alert} role='alert'>{uiText(error)}</p> : null}
      {loading ? <Skeleton variant='cards' count={3} /> : null}
      {!loading && regions.length ? (
        <>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>{uiText(summary.completed)}</strong>
              <span>{uiText("완주한 지역")}</span>
            </div>
            <div className={styles.stat}>
              <strong>{uiText(summary.ongoing)}</strong>
              <span>{uiText("진행 중인 지역")}</span>
            </div>
            <div className={styles.stat}>
              <strong>{uiText(summary.stamps)}</strong>
              <span>{uiText("확인한 관광지")}</span>
            </div>
            <div className={styles.stat}>
              <strong>{uiText(summary.total)}</strong>
              <span>{uiText("전체 구·군")}</span>
            </div>
          </div>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{uiText("지역별 스탬프북")}</h2>
          </div>
          <div className={styles.grid}>
            {regions.map((region) => {
              const percent = progressPercent(region.approvedCount, region.totalCount);
              const state = regionState(region);
              return (
                <Link
                  key={region.regionId}
                  className={styles.passportCard}
                  to={`/mypage/passport/${region.regionId}`}
                >
                  <div className={styles.passportTop}>
                    <div className={styles.passportIdentity}>
                      <DistrictMark regionId={region.regionId} name={region.regionName} />
                      <h3 className={styles.passportName}>{uiText(region.regionName)}</h3>
                    </div>
                    <span className={`${styles.pill} ${state.tone}`}>{uiText(state.label)}</span>
                  </div>
                  <div className={styles.passportFoot}>
                    <div
                      className={styles.progress}
                      role='progressbar'
                      aria-valuemin={0}
                      aria-valuemax={region.totalCount || 0}
                      aria-valuenow={region.approvedCount || 0}
                      aria-label={uiText(`${region.regionName} 확인 진행`)}
                    >
                      <span className={styles.progressBar} style={{ width: `${percent}%` }} />
                    </div>
                    <div className={styles.progressMeta}>
                      <span>
                        {uiText(region.approvedCount)} / {uiText(region.totalCount)}{uiText("곳")}</span>
                      <span>{uiText(percent)}%</span>
                    </div>
                    {region.completedAnyVersion && !region.completedCurrentVersion ? (
                      <p className={styles.fieldHint}>{uiText("이전에 완주한 기록이 있습니다.")}</p>
                    ) : null}
                    <p className={styles.passportMore}>{uiText("스탬프북 보기")}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      ) : null}
      {!loading && !error && regions.length === 0 ? (
        <p className={styles.empty}>{uiText("아직 구성된 지역 스탬프북이 없습니다.")}</p>
      ) : null}
    </MypageLayout>
  );
}

export function PassportRegionPage() {
  useUiLanguage();
  const { regionId } = useParams();
  const [region, setRegion] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchPassportRegion(regionId)
      .then(setRegion)
      .catch((err) => setError(getApiErrorMessage(err)));
  }, [regionId]);

  const places = region?.places || [];
  const visible = filter ? places.filter((place) => place.stampStatus === filter) : places;
  const percent = progressPercent(region?.approvedCount, region?.totalCount);

  return (
    <MypageLayout
      title={uiText(region ? `${region.regionName} 스탬프북` : '지역 스탬프북')}
      description={uiText("이 지역에서 확인한 관광지와 아직 남아 있는 곳을 살펴봅니다.")}
    >
      <Link className={styles.backLink} to='/mypage/passport'>{uiText("← 여행 여권으로")}</Link>
      {error ? <p className={styles.alert} role='alert'>{uiText(error)}</p> : null}
      {!region && !error ? <Skeleton variant='cards' count={3} /> : null}
      {region ? (
        <>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>{uiText(region.approvedCount)}</strong>
              <span>{uiText("확인한 관광지")}</span>
            </div>
            <div className={styles.stat}>
              <strong>{uiText(region.totalCount)}</strong>
              <span>{uiText("전체 대상")}</span>
            </div>
            <div className={styles.stat}>
              <strong>{uiText(percent)}%</strong>
              <span>{uiText("진행률")}</span>
            </div>
            <div className={styles.stat}>
              <strong>{Math.max(0, (region.totalCount || 0) - (region.approvedCount || 0))}</strong>
              <span>{uiText("남은 관광지")}</span>
            </div>
          </div>
          {region.completedAnyVersion ? (
            <p className={styles.notice} role='status'>
              {uiText(region.completedCurrentVersion
                ? '이 지역의 현재 대상을 모두 확인했습니다.'
                : '이전에 완주한 기록이 있습니다. 대상이 늘어나도 과거 완주는 유지됩니다.')}
            </p>
          ) : null}
          <div className={styles.toolbarRow}>
            <div className={styles.tabs} role='tablist' aria-label={uiText("관광지 상태")}>
              {PLACE_FILTERS.map((item) => (
                <button
                  key={item.value || 'all'}
                  type='button'
                  role='tab'
                  aria-selected={filter === item.value}
                  className={`${styles.tab} ${filter === item.value ? styles.tabActive : ''}`}
                  onClick={() => setFilter(item.value)}
                >
                  {uiText(item.label)}
                </button>
              ))}
            </div>
          </div>
          <p className={styles.countHint}>
            {uiText(PLACE_FILTERS.find((item) => item.value === filter)?.label)} {uiText(visible.length)}{uiText("곳")}</p>
          {visible.length ? (
            <div className={styles.list}>
              {visible.map((place) => (
                <div key={place.placeId} className={styles.listItem}>
                  {place.heroImageUrl ? (
                    <img
                      className={styles.thumb}
                      src={resolveAssetUrl(place.heroImageUrl)}
                      alt=''
                      width={80}
                      height={60}
                    />
                  ) : (
                    <span className={styles.thumbFallback} aria-hidden>
                      {place.name.slice(0, 1)}
                    </span>
                  )}
                  <div className={styles.grow}>
                    <strong>{uiText(place.name)}</strong>
                    {place.verifyGuide ? <p className={styles.excerpt}>{uiText(place.verifyGuide)}</p> : null}
                  </div>
                  <div className={styles.listTrail}>
                    {stampBadge(place.stampStatus)}
                    <div className={styles.actions}>
                      {place.contentId ? (
                        <Link
                          className={`${styles.secondary} ${styles.rowBtn}`}
                          to={`/map/${place.contentId}`}
                          state={toMapPageState(place)}
                        >{uiText("관광지 정보")}</Link>
                      ) : null}
                      {place.stampStatus === 'NONE' ? (
                        <Link
                          className={`${styles.primary} ${styles.rowBtn}`}
                          to={`/visits/new?placeId=${place.placeId}`}
                        >{uiText("인증하기")}</Link>
                      ) : (
                        <Link className={`${styles.secondary} ${styles.rowBtn}`} to='/mypage/verifications'>{uiText("인증 내역")}</Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>{uiText("이 조건에 해당하는 관광지가 없습니다.")}</p>
          )}
        </>
      ) : null}
    </MypageLayout>
  );
}
