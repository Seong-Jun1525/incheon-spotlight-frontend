/**
 * FavoritesPanel.jsx — 즐겨찾기 목록을 보여주는 우측 오버레이 패널
 * - useFavoritesStore의 removeFavorite·clearFavorites와 loading/pending/error 동기화 상태를 사용
 * - items를 썸네일·이름·주소 카드로 렌더링하고 선택은 onSelect로 위임
 * - 비어 있으면 안내 문구, 동기화 실패 시 재시도 버튼을 노출
 */
import { useTranslation } from 'react-i18next';
import { Star, X } from 'lucide-react';
import { resolveAssetUrl } from '../../utils/resolveAssetUrl';
import { useFavoritesStore } from '../../stores/useFavoritesStore';
import { translatePlaceName } from '../../i18n/placeLabel';
import styles from './FavoritesPanel.module.scss';

/**
 * 로컬 즐겨찾기 목록 패널.
 * 백엔드 동기화 전까지 localStorage 기준으로 동작합니다.
 */
export function FavoritesPanel({ items = [], onClose, onSelect }) {
  const { t } = useTranslation();
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const clearFavorites = useFavoritesStore((s) => s.clearFavorites);
  const { loading, pending, error, owner, retrySync } = useFavoritesStore();

  return (
    <>
      <button
        type='button'
        className={styles.backdrop}
        onClick={onClose}
        aria-label={t('favorites.close')}
      />
      <aside className={styles.panel} aria-label={t('nav.favorites')}>
        <header className={styles.head}>
          <div>
            <p className={styles.eyebrow}>{t('favorites.mine')}</p>
            <h2>
              <Star size={18} aria-hidden />{t('nav.favorites')}</h2>
            <p className={styles.hint}>{t(owner == null ? 'feedback.guestFavorites' : 'feedback.accountFavorites')}</p>
          </div>
          <button type='button' className={styles.close} onClick={onClose} aria-label={t('common.close')}>
            <X size={20} />
          </button>
        </header>

        {error && <p role='alert'>{uiText(error)} <button type='button' onClick={retrySync}>{t('feedback.retry')}</button></p>}
        {loading && <p role='status'>{t('feedback.loading')}</p>}
        {items.length === 0 ? (
          <p className={styles.empty}>{t('favorites.empty')}<br />{t('favorites.addHint')}</p>
        ) : (
          <>
            <ul className={styles.list}>
              {items.map((item) => {
                const src = resolveAssetUrl(item.imageUrl || '');
                const name = translatePlaceName(t, item, item.name || item.title);
                return (
                  <li key={item.contentId || item.id}>
                    <button
                      type='button'
                      className={styles.item}
                      onClick={() => onSelect?.(item)}
                    >
                      {src ? (
                        <img src={src} alt='' className={styles.thumb} loading='lazy' />
                      ) : (
                        <span className={styles.thumbFallback} aria-hidden>
                          {(name || '?').slice(0, 1)}
                        </span>
                      )}
                      <span className={styles.body}>
                        <strong>{name}</strong>
                        {item.address ? <small>{item.address}</small> : null}
                      </span>
                    </button>
                    <button
                      type='button'
                      className={styles.remove}
                      data-intent='danger'
                      disabled={pending || loading}
                      aria-label={t('favorites.removeLabel', { name })}
                      onClick={() => removeFavorite(item)}
                    >{t('favorites.remove')}</button>
                  </li>
                );
              })}
            </ul>
            <button type='button' className={styles.clear} data-intent='danger' disabled={pending || loading} onClick={clearFavorites}>{t('favorites.clear')}</button>
          </>
        )}
      </aside>
    </>
  );
}
