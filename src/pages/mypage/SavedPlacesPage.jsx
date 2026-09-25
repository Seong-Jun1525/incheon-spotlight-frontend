/**
 * SavedPlacesPage.jsx — 저장한 관광지(즐겨찾기) 목록
 * - 라우트: `/mypage/favorites` (로그인 필요)
 * - useFavoritesStore 의 항목을 썸네일 목록으로 보여주고 상세 이동·삭제·동기화 재시도를 처리
 * - 비로그인 상태에서 담아 둔 guestItems 가 남아 있으면 동기화 안내를 함께 표시
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useFavoritesStore } from '../../stores/useFavoritesStore';
import { MypageLayout } from '../../components/layout/SiteChrome';
import { resolveAssetUrl } from '../../utils/resolveAssetUrl';
import { translatePlaceName } from '../../i18n/placeLabel';
import { toMapPageState } from '../../utils/mapNavigation';
import styles from '../../components/layout/MemberShell.module.scss';

export default function SavedPlacesPage() {
  useUiLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, guestItems, loading, pending, error, removeFavorite, retrySync } = useFavoritesStore();
  return <MypageLayout title={t('member.favorites')} description={t('feedback.accountFavorites')}>
    {loading && <p role='status'>{t('feedback.loading')}</p>}
    {error && <p className={styles.alert} role='alert'>{uiText(error)} <button type='button' onClick={retrySync}>{t('feedback.retry')}</button></p>}
    {!loading && guestItems.length > 0 && <p role='status'>{t('feedback.pendingFavorites', { count: guestItems.length })} <button type='button' disabled={pending} onClick={retrySync}>{t('feedback.retry')}</button></p>}
    {!loading && !items.length && <p className={styles.empty}>{t('favorites.empty')}</p>}
    <div className={styles.list}>{items.map(item => <div className={styles.listItem} key={item.contentId || item.id}>
      {item.imageUrl && <img className={styles.thumb} src={resolveAssetUrl(item.imageUrl)} alt='' width={80} height={60} />}
      <div className={styles.grow}><strong>{translatePlaceName(t, item)}</strong><div className={styles.meta}>{uiText(item.address)}</div></div>
      <div className={styles.actions}>
        <button type='button' onClick={() => navigate('/map/' + item.contentId, { state: toMapPageState(item) })}>{t('detail.details')}</button>
        <button type='button' data-intent='danger' disabled={pending || loading} onClick={() => removeFavorite(item)}>{t('favorites.remove')}</button>
      </div>
    </div>)}</div>
  </MypageLayout>;
}

