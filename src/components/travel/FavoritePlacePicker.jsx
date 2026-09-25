/**
 * FavoritePlacePicker.jsx — 찜한 장소를 필수 방문지로 추가하는 선택기
 * - 즐겨찾기 스토어 목록을 버튼으로 나열하고 로딩·오류·재동기화를 안내
 * - 이미 담긴 장소나 contentId 없는 항목은 비활성 처리
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { useTranslation } from 'react-i18next';
import { useFavoritesStore } from '../../stores/useFavoritesStore';
import { translatePlaceName } from '../../i18n/placeLabel';
import styles from './TravelPlanner.module.scss';

export function FavoritePlacePicker({ onSelect, excludedIds = [] }) {
  useUiLanguage();
  const { t } = useTranslation();
  const { items, loading, error, retrySync } = useFavoritesStore();
  return <details className={styles.section}>
    <summary>{t('feedback.addFavoritePlace')}</summary>
    {loading ? <p role='status'>{t('feedback.loading')}</p> : null}
    {error ? <p role='alert'>{uiText(error)} <button type='button' onClick={retrySync}>{t('feedback.retry')}</button></p> : null}
    {!loading && !items.length && <p>{t('favorites.empty')}</p>}
    <div className={styles.actions}>{items.map((item) => <button type='button' key={item.contentId || item.id}
      disabled={!item.contentId || excludedIds.includes(String(item.contentId))}
      onClick={() => onSelect({ ...item, contentId: String(item.contentId), name: item.name || item.title })}>
      {translatePlaceName(t, item)} +
    </button>)}</div>
  </details>;
}
