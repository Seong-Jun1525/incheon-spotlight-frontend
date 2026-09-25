/**
 * RestaurantCard.jsx — 상세 패널의 주변 맛집 카드 한 장
 * - 썸네일·이름·거리·주소를 표시하고 인천e음 가맹이면 배지와 안내 문구를 노출
 * - 길찾기 클릭 시 onDirections가 있으면 내부 지도로, 없으면 카카오맵 링크를 새 창으로 열며 통계 전송
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { Badge } from '../atoms/Badge';
import { createKakaoMapDirectionUrl } from '../../utils/mapLinks';
import { formatNearbyDistanceM } from '../../utils/formatNearbyDistance';
import { STAT_EVENTS } from '../../constants/statEvents';
import { trackStat } from '../../utils/trackStat';
import styles from './LandmarkDetailPanel.module.scss';

/**
 * LandmarkDetailPanel 내 "주변 맛집" 카드 한 장.
 */
export function RestaurantCard({ restaurant, onDirections, onSelect }) {
  useUiLanguage();
  const directionUrl = createKakaoMapDirectionUrl({
    name: restaurant.title,
    mapX: restaurant.mapX,
    mapY: restaurant.mapY,
  });
  const distanceLabel = formatNearbyDistanceM(restaurant.dist);

  return (
    <article className={styles.restaurantCard}>
      {restaurant.imageUrl ? (
        <img
          src={restaurant.imageUrl}
          alt=''
        />
      ) : (
        <div className={styles.restaurantPlaceholder}>FOOD</div>
      )}
      <div>
        <h3>
          {onSelect ? (
            <button
              type='button'
              className={styles.cardTitleButton}
              onClick={() => onSelect(restaurant)}
            >
              {uiText(restaurant.title || '이름 미상 음식점')}
            </button>
          ) : (
            restaurant.title || '이름 미상 음식점'
          )}
        </h3>
        {distanceLabel ? <span>{uiText(distanceLabel)}</span> : null}
        {restaurant.localCurrency?.available && (
          <div className={styles.badgeRow}>
            <Badge tone='accent'>
              {uiText(restaurant.localCurrency.badgeText ?? '인천e음 사용 가능')}
            </Badge>
            <Badge tone='muted'>{uiText("캐시백 혜택 확인 필요")}</Badge>
          </div>
        )}
        <p>{uiText(restaurant.address || '주소 정보 준비 중')}</p>
        {restaurant.localCurrency?.notice && (
          <p className={styles.currencyNotice}>
            {uiText(restaurant.localCurrency.notice)}
          </p>
        )}
        <button
          type='button'
          disabled={!onDirections && !directionUrl}
          onClick={() => {
            if (onDirections) {
              onDirections(restaurant);
              return;
            }
            trackStat({
              eventType: STAT_EVENTS.KAKAO_MAP_OPEN,
              contentId:
                restaurant.contentId != null
                  ? String(restaurant.contentId)
                  : null,
              source: 'restaurant',
            });
            window.open(directionUrl, '_blank', 'noopener');
          }}
        >{uiText("길찾기")}</button>
      </div>
    </article>
  );
}
