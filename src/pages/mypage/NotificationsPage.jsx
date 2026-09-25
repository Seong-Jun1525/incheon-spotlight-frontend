/**
 * NotificationsPage.jsx — 알림 목록 화면
 * - 라우트: `/mypage/notifications` (로그인 필요)
 * - fetchNotifications 로 최근 알림을 불러오고 fetchUnreadCount 로 미읽음 수를 동기화
 * - 개별 알림 클릭이나 '모두 읽음'에서 markNotificationsRead 를 호출하고 알림의 link 로 이동
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { Skeleton } from '../../components/atoms/Skeleton';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { fetchNotifications, fetchUnreadCount, markNotificationsRead } from '../../api/notifyApi';
import { getApiErrorMessage } from '../../api/http';
import { MypageLayout } from '../../components/layout/SiteChrome';
import { useAuthStore } from '../../stores/useAuthStore';
import { formatDateTime } from '../../utils/formatDate';
import styles from '../../components/layout/MemberShell.module.scss';

export default function NotificationsPage() {
  useUiLanguage();
  const setUnreadCount = useAuthStore((s) => s.setUnreadCount);
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchNotifications({ pageNo: 1, numOfRows: 30 })
      .then(async (data) => {
        if (cancelled) return;
        setPage(data);
        try {
          setUnreadCount(await fetchUnreadCount());
        } catch {
          setUnreadCount(0);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [setUnreadCount]);

  async function reload() {
    const data = await fetchNotifications({ pageNo: 1, numOfRows: 30 });
    setPage(data);
    setUnreadCount(await fetchUnreadCount());
  }

  const items = page?.items || [];
  const unread = items.filter((item) => !item.read).length;

  return (
    <MypageLayout title={uiText("알림")} description={uiText("방문 확인, 보완 요청, 지역 완주 소식을 모았습니다.")}>
      {error ? <p className={styles.alert} role='alert'>{uiText(error)}</p> : null}
      <div className={styles.sectionHead}>
        <p className={styles.countHint}>
          {uiText(page ? `전체 ${items.length}건` : '불러오는 중')}
          {uiText(unread ? ` · 읽지 않음 ${unread}건` : '')}
        </p>
        {unread ? (
          <button
            type='button'
            className={`${styles.secondary} ${styles.rowBtn}`}
            onClick={async () => {
              await markNotificationsRead([]);
              await reload();
            }}
          >{uiText("모두 읽음으로 표시")}</button>
        ) : null}
      </div>
      {!page && !error ? <Skeleton count={4} /> : null}
      {items.length ? (
        <div className={styles.list}>
          {items.map((item) => (
            <Link
              key={item.notifyId}
              className={styles.listItem}
              to={item.link}
              onClick={async () => {
                if (!item.read) {
                  await markNotificationsRead([item.notifyId]);
                  setUnreadCount(await fetchUnreadCount());
                }
              }}
            >
              <div className={styles.grow}>
                <strong>{item.title}</strong>
                {item.body ? <p>{uiText(item.body)}</p> : null}
                <div className={`${styles.meta} ${item.read ? '' : styles.unread}`}>
                  <span>{uiText(item.read ? '읽음' : '새 알림')}</span>
                  {item.createdAt ? <span>{formatDateTime(item.createdAt)}</span> : null}
                </div>
              </div>
              <ChevronRight className={styles.listChevron} size={18} aria-hidden />
            </Link>
          ))}
        </div>
      ) : page ? (
        <p className={styles.empty}>{uiText("아직 받은 알림이 없습니다.")}</p>
      ) : null}
    </MypageLayout>
  );
}
