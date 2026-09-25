/**
 * AdminReviewPage.jsx — 방문 인증 예외 처리(관리자) 목록과 상세
 * - 라우트: `/admin/reviews` (RequireAdmin 보호), AdminReviewDetailPage 는 `/admin/reviews/:verifyId`
 * - fetchAdminVisits 로 상태·지역 필터를 적용한 인증 카드를 나열하고 상세로 연결
 * - 상세에서 approveVisit·requestVisitRevision·rejectVisit 으로 AI 자동 확인 결과를 수동 재처리
 */
import { useEffect, useId, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  approveVisit,
  fetchAdminVisit,
  fetchAdminVisits,
  rejectVisit,
  requestVisitRevision,
} from '../../api/visitApi';
import { fetchQuestRegions } from '../../api/stampApi';
import { getApiErrorMessage } from '../../api/http';
import { SiteChrome } from '../../components/layout/SiteChrome';
import { StatusBadge } from '../../components/stamp/StatusBadge';
import { resolveAssetUrl } from '../../utils/resolveAssetUrl';
import styles from '../../components/layout/MemberShell.module.scss';

export default function AdminReviewPage() {
  const [status, setStatus] = useState('PENDING');
  const [regionId, setRegionId] = useState('');
  const [regions, setRegions] = useState([]);
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuestRegions().then(setRegions).catch(() => setRegions([]));
  }, []);

  useEffect(() => {
    fetchAdminVisits({ status, regionId, pageNo: 1, numOfRows: 20 })
      .then(setPage)
      .catch((err) => setError(getApiErrorMessage(err)));
  }, [status, regionId]);

  return (
    <SiteChrome activeNavId=''>
      <div className={styles.main}>
        <p className={styles.eyebrow}>관리자</p>
        <h1>방문 인증 예외 처리</h1>
        <p className={styles.notice}>
          방문 인증은 기본적으로 사진으로 자동 확인됩니다. 이 화면은 결과가 잘못됐을 때만 다시 처리합니다.
        </p>
        {error ? <p className={styles.alert}>{error}</p> : null}
        <div className={styles.toolbar}>
          <div className={styles.field}>
            <label htmlFor='admin-status'>상태</label>
            <select id='admin-status' value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value='PENDING'>확인 중</option>
              <option value='NEEDS_REVISION'>보완</option>
              <option value='APPROVED'>확인 완료</option>
              <option value='REJECTED'>인증 불가</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor='admin-region'>지역</label>
            <select id='admin-region' value={regionId} onChange={(e) => setRegionId(e.target.value)}>
              <option value=''>전체</option>
              {regions.map((region) => (
                <option key={region.regionId} value={region.regionId}>
                  {region.regionName}
                </option>
              ))}
            </select>
          </div>
        </div>
        {page && page.items.length === 0 ? <p>이 조건의 대상이 없습니다.</p> : null}
        <div className={styles.grid}>
          {(page?.items || []).map((item) => {
            const cover = item.photos?.[0];
            return (
              <Link key={item.verifyId} className={styles.card} to={`/admin/reviews/${item.verifyId}`}>
                {cover ? (
                  <img
                    className={styles.cardImage}
                    src={resolveAssetUrl(cover.thumbUrl || cover.imageUrl)}
                    alt={`${item.placeName} 인증 사진`}
                  />
                ) : (
                  <div className={styles.cardFallback}>{(item.placeName || '?').slice(0, 1)}</div>
                )}
                <div className={styles.cardBody}>
                  <StatusBadge status={item.status} />
                  <h3>{item.placeName}</h3>
                  <p>{item.nickname} · {item.visitDate}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </SiteChrome>
  );
}

export function AdminReviewDetailPage() {
  const { verifyId } = useParams();
  const [visit, setVisit] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const reasonId = useId();

  useEffect(() => {
    fetchAdminVisit(verifyId)
      .then(setVisit)
      .catch((err) => setError(getApiErrorMessage(err)));
  }, [verifyId]);

  async function run(action) {
    setPending(true);
    setError('');
    try {
      const next = await action();
      setVisit(next);
    } catch (err) {
      setError(getApiErrorMessage(err, '처리하지 못했습니다. 화면을 새로고침해 주세요.'));
    } finally {
      setPending(false);
    }
  }

  if (!visit && error) {
    return (
      <SiteChrome>
        <div className={styles.main}><p className={styles.alert}>{error}</p></div>
      </SiteChrome>
    );
  }
  if (!visit) {
    return (
      <SiteChrome>
        <div className={styles.main}><p role='status'>불러오는 중입니다.</p></div>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome>
      <div className={styles.main}>
        <div className={styles.split}>
        <div>
          <p className={styles.eyebrow}>예외 처리</p>
          <h1>{visit.placeName}</h1>
          <StatusBadge status={visit.status} />
          {(visit.photos || []).map((photo) => (
            <p key={photo.photoId}>
              <img
                src={resolveAssetUrl(photo.imageUrl)}
                alt={photo.altText || `${visit.placeName} 인증 사진`}
                style={{ width: '100%', borderRadius: 8 }}
              />
            </p>
          ))}
        </div>
        <div>
          <p>작성자 {visit.nickname}</p>
          <p>방문일 {visit.visitDate}</p>
          <p>{visit.review}</p>
          {error ? <p className={styles.alert} role='alert'>{error}</p> : null}
          <div className={styles.field}>
            <label htmlFor={reasonId}>보완·인증 불가 사유</label>
            <textarea id={reasonId} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className={styles.actions}>
            <button
              className={styles.primary}
              type='button'
              disabled={pending}
              onClick={() => run(() => approveVisit(verifyId, visit.reviewVer))}
            >
              확인
            </button>
            <button
              className={styles.secondary}
              type='button'
              disabled={pending}
              onClick={() => run(() => requestVisitRevision(verifyId, reason, visit.reviewVer))}
            >
              보완 요청
            </button>
            <button
              className={styles.danger}
              type='button'
              disabled={pending}
              onClick={() => run(() => rejectVisit(verifyId, reason, visit.reviewVer))}
            >
              인증 불가
            </button>
          </div>
          <h2>처리 이력</h2>
          <ul>
            {(visit.history || []).map((item, index) => (
              <li key={`${item.processedAt}-${index}`}>
                {item.fromStatus || '없음'} → {item.toStatus}
                {item.adminNickname
                  ? ` · ${item.adminNickname}`
                  : item.toStatus === 'APPROVED'
                      || item.toStatus === 'NEEDS_REVISION'
                      || item.toStatus === 'REJECTED'
                    ? ' · 자동 확인'
                    : ''}
                {item.reason ? ` · ${item.reason}` : ''}
              </li>
            ))}
          </ul>
        </div>
        </div>
      </div>
    </SiteChrome>
  );
}
