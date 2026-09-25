/**
 * MyVerificationsPage.jsx — 내가 제출한 방문 인증 목록
 * - 라우트: `/mypage/verifications` (로그인 필요), MyVerificationManagePage 는 `/mypage/verifications/:verifyId`
 * - fetchMyVisits 로 상태 탭별 목록을 더 보기 방식으로 불러와 썸네일·상태 배지와 함께 표시
 * - 상세 관리 화면은 MypageLayout 안에서 MyVisitDetailPage 를 그대로 재사용
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { Skeleton } from '../../components/atoms/Skeleton';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { fetchMyVisits } from '../../api/visitApi';
import { getApiErrorMessage } from '../../api/http';
import { MypageLayout } from '../../components/layout/SiteChrome';
import { StatusBadge } from '../../components/stamp/StatusBadge';
import { MyVisitDetailPage } from '../VisitDetailPage';
import { districtLabels } from '../../data/incheonDistricts';
import { resolveAssetUrl } from '../../utils/resolveAssetUrl';
import styles from '../../components/layout/MemberShell.module.scss';

const STATUS_FILTERS = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: '확인 중' },
  { value: 'NEEDS_REVISION', label: '보완 필요' },
  { value: 'APPROVED', label: '확인 완료' },
  { value: 'REJECTED', label: '인증 불가' },
];

function coverOf(visit) {
  return visit.photos?.find((photo) => photo.sortNo === visit.coverSortNo) || visit.photos?.[0];
}

function emptyMessage(status) {
  switch (status) {
    case 'PENDING':
      return 'AI가 확인하고 있는 인증이 없습니다.';
    case 'NEEDS_REVISION':
      return '보완이 필요한 인증이 없습니다.';
    case 'APPROVED':
      return '확인이 끝난 인증이 없습니다.';
    case 'REJECTED':
      return '인증 불가 처리된 기록이 없습니다.';
    default:
      return '작성한 방문 인증이 없습니다. 관광지를 방문한 뒤 현장 사진을 남겨 보세요.';
  }
}

export default function MyVerificationsPage() {
  useUiLanguage();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setPage(null);
    setItems([]);
    fetchMyVisits({ status, pageNo: 1, numOfRows: 12 })
      .then((data) => {
        if (cancelled) return;
        setPage(data);
        setItems(data.items || []);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  async function loadMore() {
    if (!page?.hasMore || loadingMore) return;
    setLoadingMore(true);
    setError('');
    try {
      const next = await fetchMyVisits({
        status,
        pageNo: page.pageNo + 1,
        numOfRows: page.numOfRows,
      });
      setPage(next);
      setItems((prev) => [...prev, ...(next.items || [])]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <MypageLayout
      title={uiText("내 방문 인증")}
      description={uiText("현장 사진은 AI가 관광지와 맞는지 확인합니다. 보완이 필요하거나 인증 불가이면 사진을 바꿔 다시 제출할 수 있습니다.")}
      actions={
        <Link className={styles.primary} to='/visits/new'>
          <Sparkles size={16} aria-hidden />{uiText("방문 인증하기")}</Link>
      }
    >
      {error ? <p className={styles.alert} role='alert'>{uiText(error)}</p> : null}
      <div className={styles.aiHint}>
        <Sparkles size={16} aria-hidden />
        <p>{uiText("제출하면 AI가 사진을 바로 살펴봅니다. 관리자가 매번 보지 않으며, 끝나면 이 목록의 상태가 바뀝니다.")}</p>
      </div>
      <div className={styles.toolbarRow}>
        <div className={styles.tabs} role='tablist' aria-label={uiText("인증 상태")}>
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value || 'all'}
              type='button'
              role='tab'
              aria-selected={status === filter.value}
              className={`${styles.tab} ${status === filter.value ? styles.tabActive : ''}`}
              onClick={() => setStatus(filter.value)}
            >
              {uiText(filter.label)}
            </button>
          ))}
        </div>
      </div>
      {!loading && page ? (
        <p className={styles.countHint}>
          {STATUS_FILTERS.find((filter) => filter.value === status)?.label || '전체'} {uiText(page.totalCount)}{uiText("건")}</p>
      ) : null}
      {loading ? <Skeleton variant='list' count={3} /> : null}
      {!loading && items.length ? (
        <div className={styles.list}>
          {items.map((item) => {
            const cover = coverOf(item);
            const src = resolveAssetUrl(cover?.thumbUrl || cover?.imageUrl || item.heroImageUrl || '');
            const region = districtLabels[item.regionId] || item.regionName;
            return (
              <Link
                key={item.verifyId}
                className={styles.listItem}
                to={`/mypage/verifications/${item.verifyId}`}
                aria-label={uiText(`${item.placeName} 방문 인증 상세`)}
              >
                {src ? (
                  <img className={styles.thumb} src={src} alt='' width={80} height={60} />
                ) : (
                  <div className={styles.thumbFallback} aria-hidden>
                    {(item.placeName || '?').slice(0, 1)}
                  </div>
                )}
                <div className={styles.grow}>
                  <strong>{uiText(item.placeName)}</strong>
                  <div className={styles.meta}>
                    {region ? <span>{uiText(region)}</span> : null}
                    {item.visitDate ? <span>{uiText(item.visitDate)}</span> : null}
                    <span className={`${styles.pill} ${item.publicVisible ? styles.pillOn : ''}`}>
                      {uiText(item.publicVisible ? '공개' : '비공개')}
                    </span>
                    {item.status === 'PENDING' ? <span>{uiText("사진 확인 중")}</span> : null}
                  </div>
                </div>
                <div className={styles.listTrail}>
                  <StatusBadge status={item.status} />
                  <ChevronRight className={styles.listChevron} size={18} aria-hidden />
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
      {!loading && page && items.length === 0 ? (
        <div className={styles.empty}>
          <p>{emptyMessage(status)}</p>
          {status === '' ? (
            <div className={styles.pager}>
              <Link className={styles.primary} to='/visits/new'>
                <Sparkles size={16} aria-hidden />{uiText("방문 인증하기")}</Link>
            </div>
          ) : null}
        </div>
      ) : null}
      {page?.hasMore ? (
        <div className={styles.pager}>
          <button
            type='button'
            className={styles.secondary}
            onClick={loadMore}
            disabled={loadingMore}
          >
            {uiText(loadingMore ? '불러오는 중' : '더 보기')}
          </button>
        </div>
      ) : null}
    </MypageLayout>
  );
}

export function MyVerificationManagePage() {
  useUiLanguage();
  return (
    <MypageLayout
      title={uiText("방문 인증 상세")}
      description={uiText("방문 확인 결과를 보고, 필요한 경우 사진을 보완하거나 다시 제출할 수 있습니다.")}
    >
      <MyVisitDetailPage />
    </MypageLayout>
  );
}
