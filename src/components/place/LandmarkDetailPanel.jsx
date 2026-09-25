/**
 * LandmarkDetailPanel.jsx — 랜드마크 상세 정보를 포털로 띄우는 전체 슬라이드 패널
 * - usePlaceDetailQuery·useAttractionImagesQuery와 주변 맛집/숙박 쿼리로 TourAPI 데이터를 모아 표시
 * - 즐겨찾기 토글, 섹션 앵커 이동, 방문 인증(QuestPlaceActions) UI를 제공
 * - 길찾기·지도 버튼으로 /map/:contentId 라우트에 이동 상태를 넘기고 통계를 전송
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import i18n from '../../i18n';
import { Skeleton } from '../atoms/Skeleton';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ChevronRight, Star, X } from 'lucide-react';
import {
  NEARBY_LODGING_LIMIT,
  NEARBY_LODGING_RADIUS_M,
  NEARBY_RESTAURANT_ARRANGE,
  NEARBY_RESTAURANT_LIMIT,
  NEARBY_RESTAURANT_RADIUS_M,
} from '../../constants/exploreConstants';
import { useAttractionImagesQuery } from '../../hooks/queries/useAttractionImagesQuery';
import { useNearbyLodgingsQuery } from '../../hooks/queries/useNearbyLodgingsQuery';
import { useNearbyRestaurantsQuery } from '../../hooks/queries/useNearbyRestaurantsQuery';
import { usePlaceDetailQuery } from '../../hooks/queries/usePlaceDetailQuery';
import { useFavoritesStore } from '../../stores/useFavoritesStore';
import { QuestPlaceActions } from '../stamp/QuestPlaceActions';
import { STAT_EVENTS } from '../../constants/statEvents';
import { trackStat } from '../../utils/trackStat';
import { toMapPageState } from '../../utils/mapNavigation';
import { isIncheonAddress } from '../../utils/incheonAddress';
import { normalizePlaceDetail } from '../../utils/placeNormalize';
import { translatePlaceName } from '../../i18n/placeLabel';
import { toOperationRows } from './landmarkDetailHelpers';
import { LodgingCard } from './LodgingCard';
import { PlaceImageGallery } from './PlaceImageGallery';
import { RestaurantCard } from './RestaurantCard';
import { safeHomepageHref } from '../../utils/safeUrl';
import styles from './LandmarkDetailPanel.module.scss';
import { nearbyCoordinates } from '../../utils/nearbyQueryOptions';
import { preloadCesiumViewer } from '../map/loadCesiumViewer';

/**
 * 랜드마크 상세 슬라이드 패널.
 *
 * 데이터 소스:
 * 1. TourAPI 상세 / detailImage2 / locationBasedList2 (백엔드 프록시)
 * P0: 이미지 갤러리 + 주변 숙박(32) + 맛집 radius/arrange 실데이터
 */
export function LandmarkDetailPanel({ landmark, onClose }) {
  useUiLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const contentId = landmark?.contentId;
  useEffect(() => {
    if (contentId) preloadCesiumViewer();
  }, [contentId]);
  const isFavorite = useFavoritesStore((s) => s.isFavorite(landmark));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const favoriteBusy = useFavoritesStore((s) => s.loading || s.pending);
  const favoriteError = useFavoritesStore((s) => s.error);
  const [highlight, setHighlight] = useState('');
  const highlightTimer = useRef(null);
  const contentRef = useRef(null);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);
  useEffect(() => () => clearTimeout(highlightTimer.current), []);
  const jump = (event, id) => {
    event.preventDefault();
    const target = contentRef.current?.querySelector(`[id='${id}']`);
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    target?.focus({ preventScroll: true });
    setHighlight(id);
    clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlight(''), 1800);
  };

  const placeQuery = usePlaceDetailQuery(contentId);
  const detailAddress = [
    placeQuery.data?.address,
    placeQuery.data?.addr1,
    placeQuery.data?.addr2,
  ]
    .filter(Boolean)
    .join(' ');
  const trustApiDetail =
    detailAddress.trim() === '' || isIncheonAddress(detailAddress);
  const place = normalizePlaceDetail(
    trustApiDetail ? placeQuery.data : null,
    landmark,
  );

  const imagesQuery = useAttractionImagesQuery(contentId, {
    fallbackHeroUrl: place.imageUrl || landmark?.imageUrl || '',
    embeddedImages: place.images,
  });

  const searchFromPlace =
    !String(place.address || '').trim() || isIncheonAddress(place.address);
  const searchMapX = searchFromPlace ? place.mapX : undefined;
  const searchMapY = searchFromPlace ? place.mapY : undefined;
  const nearbyEnabled = Boolean(nearbyCoordinates(searchMapX, searchMapY)) || !placeQuery.isPending;

  const nearbyQuery = useNearbyRestaurantsQuery(contentId, {
    radius: NEARBY_RESTAURANT_RADIUS_M,
    limit: NEARBY_RESTAURANT_LIMIT,
    arrange: NEARBY_RESTAURANT_ARRANGE,
    enabled: nearbyEnabled,
    mapX: searchMapX,
    mapY: searchMapY,
  });

  const lodgingQuery = useNearbyLodgingsQuery(contentId, {
    enabled: nearbyEnabled,
    radius: NEARBY_LODGING_RADIUS_M,
    limit: NEARBY_LODGING_LIMIT,
    mapX: searchMapX,
    mapY: searchMapY,
  });

  const restaurants = useMemo(() => nearbyQuery.data ?? [], [nearbyQuery.data]);

  const lodgings = lodgingQuery.data ?? [];
  const missingPlace = !landmark;
  const operationRows = toOperationRows(place.operationInfo);
  const displayTitle = translatePlaceName(
    t,
    { ...landmark, name: place.title || landmark?.name, title: place.title },
    place.title || landmark?.name || (placeQuery.isLoading ? t('feedback.loading') : t('feedback.detailMissing')),
  );
  const showOriginalNotice =
    i18n.resolvedLanguage &&
    i18n.resolvedLanguage !== 'ko' &&
    /[가-힣]/.test(String(place.overview || place.recommendReason || ''));
  const radiusKm = (NEARBY_RESTAURANT_RADIUS_M / 1000).toFixed(1);
  const lodgingRadiusKm = (NEARBY_LODGING_RADIUS_M / 1000).toFixed(1);
  const homepageHref = safeHomepageHref(place.homepage);
  if (!landmark) {
    return createPortal(
      <>
        <button type='button' className={styles.backdrop} onClick={onClose} aria-label={t('common.close')} />
        <aside
          className={styles.panel}
          role='dialog'
          aria-modal='true'
          aria-labelledby='landmark-detail-title'
        >
          <div className={styles.panelHeader}>
            <div>
              <span>{t('explore.info')}</span>
              <strong>{t('detail.title')}</strong>
            </div>
            <button type='button' onClick={onClose} aria-label={t('detail.close')}>
              <X size={18} aria-hidden='true' />
            </button>
          </div>
          <div className={styles.content}>
            <p role='alert'>{t('feedback.detailMissing')}</p>
          </div>
        </aside>
      </>, document.body
    );
  }
  const mapState = toMapPageState(
    {
      ...landmark,
      ...place,
      mapX: place.mapX ?? landmark.mapX,
      mapY: place.mapY ?? landmark.mapY,
    },
    { title: displayTitle },
  );
  const openInternalMap = (routeDestination = null) => {
    if (routeDestination) {
      trackStat({
        eventType: STAT_EVENTS.NEARBY_CLICK,
        contentId:
          routeDestination.contentId != null
            ? String(routeDestination.contentId)
            : null,
        source: routeDestination.contentTypeId === '32' ? 'lodging' : 'restaurant',
      });
    }
    navigate(`/map/${place.contentId ?? landmark.contentId ?? landmark.id}`, {
      state: { ...mapState, routeDestination },
    });
  };

  return createPortal(
    <>
      <button type='button' className={styles.backdrop} onClick={onClose} aria-label={t('common.close')} />
      <aside
        className={styles.panel}
        role='dialog'
        aria-modal='true'
        aria-labelledby='landmark-detail-title'
      >
        <div className={styles.panelHeader}>
          <div>
            <span>{t('explore.info')}</span>
            <strong>{t('detail.title')}</strong>
          </div>
          <button type='button' onClick={onClose} aria-label={t('detail.close')}>
            <X size={18} aria-hidden='true' />
          </button>
        </div>
        <div className={styles.content} ref={contentRef}>
        <PlaceImageGallery
          slides={imagesQuery.data ?? []}
          isLoading={imagesQuery.isLoading}
          alt={uiText(displayTitle)}
          placeholderChar={displayTitle?.[0] || 'I'}
        />

          <nav className={styles.breadcrumb} aria-label={t('detail.location')}>
            <span>{t('common.home')}</span>
            <ChevronRight size={12} aria-hidden='true' />
            <span>{t('detail.explore')}</span>
            <ChevronRight size={12} aria-hidden='true' />
            <strong>{t('detail.details')}</strong>
          </nav>
          <div className={styles.titleRow}>
            <div>
              <span className={styles.categoryBadge}>{t('type.tour')}</span>
              <h2 id='landmark-detail-title'>{uiText(displayTitle)}</h2>
            </div>
            <button
              type='button'
              className={styles.favBtn}
              disabled={favoriteBusy}
              aria-pressed={isFavorite}
              aria-label={uiText(isFavorite ? t('detail.removeFavorite') : t('detail.addFavorite'))}
              onClick={() =>
                toggleFavorite({
                  ...landmark,
                  ...place,
                  name: displayTitle,
                  title: displayTitle,
                })
              }
            >
              <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
          {favoriteError && <p role='alert'>{uiText(favoriteError)}</p>}
          {missingPlace && <p role='alert'>{t('feedback.detailMissing')}</p>}
          {placeQuery.isError && <p role='alert'>{t('feedback.detailError')} <button type='button' onClick={() => placeQuery.refetch()}>{t('feedback.retry')}</button></p>}
          {placeQuery.isLoading ? <Skeleton variant='text' count={1} /> : <p className={styles.summary}>{uiText(place.overview)}</p>}
          {showOriginalNotice && <p className={styles.notice}>{t('feedback.originalContent')}</p>}

          <nav className={styles.sectionNav} aria-label={t('detail.sections')}>
            <strong>{t('detail.contents')}</strong>
            <a href='#detail-basic' onClick={(e) => jump(e, 'detail-basic')}>{t('detail.basic')}</a>
            <a href='#detail-nearby' onClick={(e) => jump(e, 'detail-nearby')}>{t('detail.nearby')}</a>
            <a href='#detail-stamp' onClick={(e) => jump(e, 'detail-stamp')}>{t('detail.visit')}</a>
          </nav>

          {place.recommendReason && <div className={styles.block}>
            <strong>{t('detail.reason')}</strong>
            <p>{uiText(place.recommendReason)}</p>
          </div>}

          <div id='detail-basic' tabIndex={-1} className={`${styles.block} ${highlight === 'detail-basic' ? styles.arrived : ''}`}>
            <strong>{t('detail.address')}</strong>
            <p>{uiText(place.address || t('detail.addressPending'))}</p>
          </div>

          {place.tel && (
            <div className={styles.block}>
              <strong>{t('detail.phone')}</strong>
              <p>{uiText(place.tel)}</p>
            </div>
          )}

          {homepageHref && (
            <div className={styles.block}>
              <strong>{t('detail.website')}</strong>
              <p>
                <a href={homepageHref} target='_blank' rel='noopener noreferrer'>
                  {uiText(homepageHref)}
                </a>
              </p>
            </div>
          )}

          {operationRows.length > 0 && (
            <div className={styles.block}>
              <strong>{t('detail.hours')}</strong>
              <dl className={styles.metaList}>
                {operationRows.map(({ label, value }) => (
                  <div key={label}>
                    <dt>{uiText(label)}</dt>
                    <dd>{uiText(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div id='detail-nearby' tabIndex={-1} className={`${styles.block} ${highlight === 'detail-nearby' ? styles.arrived : ''}`}>
            <strong>{t('detail.food')}{uiText(radiusKm)}km</strong>
            {nearbyQuery.isPending ? (
              <Skeleton count={2} label={t('detail.foodLoading')} />
            ) : nearbyQuery.isError ? (
              <p role='alert'>{t('detail.foodError')} <button type='button' disabled={nearbyQuery.isFetching} onClick={() => nearbyQuery.refetch()}>{t('feedback.retry')}</button></p>
            ) : restaurants.length > 0 ? (
              <>
                <div className={styles.restaurantGrid}>
                  {restaurants.slice(0, NEARBY_RESTAURANT_LIMIT).map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.contentId ?? restaurant.title}
                      restaurant={restaurant}
                      onDirections={openInternalMap}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p>{t('detail.noFood')}</p>
            )}
          </div>

          <div className={styles.block}>
            <strong>{t('detail.stays')}{uiText(lodgingRadiusKm)}km</strong>
            {lodgingQuery.isPending ? (
              <Skeleton count={2} label={t('detail.staysLoading')} />
            ) : lodgingQuery.isError ? (
              <p role='alert'>{t('detail.staysError')} <button type='button' disabled={lodgingQuery.isFetching} onClick={() => lodgingQuery.refetch()}>{t('feedback.retry')}</button></p>
            ) : lodgings.length > 0 ? (
              <div className={styles.restaurantGrid}>
                {lodgings.slice(0, NEARBY_LODGING_LIMIT).map((lodging) => (
                  <LodgingCard
                    key={lodging.contentId ?? lodging.title}
                    lodging={lodging}
                    onDirections={openInternalMap}
                  />
                ))}
              </div>
            ) : (
              <p>{t('detail.noStays')}</p>
            )}
          </div>

          <div id='detail-stamp' tabIndex={-1} className={`${styles.block} ${highlight === 'detail-stamp' ? styles.arrived : ''}`}>
            <strong>{t('detail.visit')}</strong>
            <QuestPlaceActions contentId={contentId} />
          </div>

          <div className={styles.actions}>
            <button
              type='button'
              disabled={!place.mapX || !place.mapY}
              onClick={() => openInternalMap()}
            >{t('detail.directions')}</button>
            <button
              type='button'
              onClick={() => openInternalMap()}
            >{t('detail.map')}</button>
          </div>
        </div>
      </aside>
    </>, document.body
  );
}
