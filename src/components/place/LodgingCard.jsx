/**
 * LodgingCard.jsx — 상세 패널의 주변 숙박(contentTypeId=32) 카드 한 장
 * - 썸네일·이름·거리·주소·전화번호를 표시하고 이미지가 없으면 STAY 플레이스홀더 사용
 * - 길찾기 클릭 시 onDirections가 있으면 내부 지도로, 없으면 카카오맵 링크를 새 창으로 열며 통계 전송
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { createKakaoMapDirectionUrl } from '../../utils/mapLinks';
import { formatNearbyDistanceM } from '../../utils/formatNearbyDistance';
import { STAT_EVENTS } from '../../constants/statEvents';
import { trackStat } from '../../utils/trackStat';
import styles from './LandmarkDetailPanel.module.scss';

/**
 * 주변 숙박 카드 (contentTypeId=32)
 */
export function LodgingCard({ lodging, onDirections, onSelect }) {
  useUiLanguage();
  const directionUrl = createKakaoMapDirectionUrl({
    name: lodging.title,
    mapX: lodging.mapX,
    mapY: lodging.mapY,
  });
  const distanceLabel = formatNearbyDistanceM(lodging.dist);

  return (
    <article className={styles.restaurantCard}>
      {lodging.imageUrl ? (
        <img src={lodging.imageUrl} alt='' />
      ) : (
        <div className={styles.restaurantPlaceholder}>STAY</div>
      )}
      <div>
        <h4>
          {onSelect ? (
            <button
              type='button'
              className={styles.cardTitleButton}
              onClick={() => onSelect(lodging)}
            >
              {uiText(lodging.title || '이름 미상 숙박')}
            </button>
          ) : (
            lodging.title || '이름 미상 숙박'
          )}
        </h4>
        {distanceLabel ? <span>{uiText(distanceLabel)}</span> : null}
        <p>{uiText(lodging.address || '주소 정보 준비 중')}</p>
        {lodging.tel ? <p className={styles.currencyNotice}>{uiText(lodging.tel)}</p> : null}
        <button
          type='button'
          disabled={!onDirections && !directionUrl}
          onClick={() => {
            if (onDirections) {
              onDirections(lodging);
              return;
            }
            trackStat({
              eventType: STAT_EVENTS.KAKAO_MAP_OPEN,
              contentId:
                lodging.contentId != null ? String(lodging.contentId) : null,
              source: 'lodging',
            });
            window.open(directionUrl, '_blank', 'noopener');
          }}
        >{uiText("길찾기")}</button>
      </div>
    </article>
  );
}
