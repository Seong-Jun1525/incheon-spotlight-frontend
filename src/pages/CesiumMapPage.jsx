/**
 * CesiumMapPage.jsx — 관광지 상세 정보와 Cesium 3D 지도 화면
 * - 라우트: `/map/:contentId` (공개)
 * - usePlaceDetailQuery·useAttractionImagesQuery 로 상세와 사진을 채우고, 좌표는 TourAPI → 넘겨받은 state → 큐레이션 순으로 결정
 * - RoutePlanner 길찾기 결과와 주변 음식점·숙박 쿼리를 CesiumPlaceViewer 마커로 표시
 */
import { Skeleton } from '../components/atoms/Skeleton';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  BedDouble,
  ChevronRight,
  ExternalLink,
  MapPinned,
  Navigation,
  Utensils,
} from 'lucide-react';
import { TopNavigation } from '../components/organisms/TopNavigation';
import { FavoritesPanel } from '../components/organisms/FavoritesPanel';
import { PublicFooter } from '../components/layout/PublicFooter';
import { AiChatWidget } from '../components/ai/AiChatWidget';
import { CesiumPlaceViewer } from '../components/map/LazyCesiumPlaceViewer';
import { RoutePlanner } from '../components/map/RoutePlanner';
import { LodgingCard } from '../components/place/LodgingCard';
import { PlaceImageGallery } from '../components/place/PlaceImageGallery';
import { RestaurantCard } from '../components/place/RestaurantCard';
import { navLinks } from '../data/mainMockData';
import { useAttractionImagesQuery } from '../hooks/queries/useAttractionImagesQuery';
import { useNearbyLodgingsQuery } from '../hooks/queries/useNearbyLodgingsQuery';
import { useNearbyRestaurantsQuery } from '../hooks/queries/useNearbyRestaurantsQuery';
import { usePlaceDetailQuery } from '../hooks/queries/usePlaceDetailQuery';
import { useRouteQuery } from '../hooks/queries/useRouteQuery';
import { useFavoritesStore } from '../stores/useFavoritesStore';
import { useChromeSession } from '../hooks/useChromeSession';
import { useAiChatStore } from '../stores/useAiChatStore';
import { createKakaoMapPlaceUrl } from '../utils/mapLinks';
import { QuestPlaceActions } from '../components/stamp/QuestPlaceActions';
import { STAT_EVENTS, STAT_SOURCE } from '../constants/statEvents';
import { trackStat } from '../utils/trackStat';
import { useStatPageView } from '../hooks/useStatPageView';
import { toOperationRows } from '../components/place/landmarkDetailHelpers';
import { isIncheonAddress } from '../utils/incheonAddress';
import { normalizePlaceDetail } from '../utils/placeNormalize';
import {
  hasCoordinate,
  isIncheonArea,
  parseLonLat,
  resolveBestMapCoords,
} from '../utils/mapCoords';
import { KTO_CONTENT_TYPE } from '../constants/ktoContentTypes';
import { POI_MARKER_KIND } from '../components/map/mapPoiMarkers';
import { toMapPageState } from '../utils/mapNavigation';
import { mockLandmarks } from '../data/mockLandmarks';
import styles from './CesiumMapPage.module.scss';

/**
 * 실제 지도 상세 페이지 — Cesium 3D + 메인 Bright Pop UI.
 *
 * 좌표 우선순위:
 * 1. TourAPI 상세 좌표 (인천 범위 검증 통과 시)
 * 2. 메인에서 넘긴 location.state / 목록 좌표
 */
export default function CesiumMapPage() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = useMemo(() => location.state ?? {}, [location.state]);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [routeMode, setRouteMode] = useState('PEDESTRIAN');
  const [routePrediction, setRoutePrediction] = useState({
    enabled: false,
    type: 'departure',
    time: '',
  });
  const [routeEndpoints, setRouteEndpoints] = useState(undefined);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [showRestaurants, setShowRestaurants] = useState(true);
  const [showLodgings, setShowLodgings] = useState(true);
  const favoriteItems = useFavoritesStore((s) => s.items);
  const { navAuthProps, goMemberNav } = useChromeSession();
  const isAiOpen = useAiChatStore((s) => s.isOpen);
  const toggleAiChat = useAiChatStore((s) => s.toggle);

  useStatPageView({ contentId });

  useEffect(() => {
    if (!contentId) return;
    trackStat({
      eventType: STAT_EVENTS.POI_VIEW,
      contentId: String(contentId),
      districtId: navState.districtId || null,
      source: STAT_SOURCE.MAP,
    });
  }, [contentId, navState.districtId]);

  const placeQuery = usePlaceDetailQuery(contentId);
  const curatedFallback = useMemo(
    () =>
      mockLandmarks.find(
        (item) => String(item.contentId) === String(contentId),
      ) ?? null,
    [contentId],
  );

  const placeFallback = useMemo(
    () => ({
      contentId,
      name: navState.title || curatedFallback?.name,
      title: navState.title || curatedFallback?.title || curatedFallback?.name,
      mapX: navState.mapX ?? curatedFallback?.mapX,
      mapY: navState.mapY ?? curatedFallback?.mapY,
      imageUrl: navState.imageUrl || curatedFallback?.imageUrl,
      heroImageFileId:
        navState.heroImageFileId ?? curatedFallback?.heroImageFileId,
      address: navState.address || curatedFallback?.address,
      overview: navState.overview || curatedFallback?.shortDescription,
      shortDescription: navState.overview || curatedFallback?.shortDescription,
      recommendReason:
        navState.recommendReason || curatedFallback?.recommendReason,
      districtId: navState.districtId || curatedFallback?.districtId,
    }),
    [contentId, curatedFallback, navState],
  );

  const apiCoords = parseLonLat(
    placeQuery.data?.mapX ?? placeQuery.data?.mapx,
    placeQuery.data?.mapY ?? placeQuery.data?.mapy,
  );
  const apiAddress = [
    placeQuery.data?.address,
    placeQuery.data?.addr1,
    placeQuery.data?.addr2,
  ]
    .filter(Boolean)
    .join(' ');
  const apiAddressIsIncheon =
    apiAddress.trim() === '' || isIncheonAddress(apiAddress);
  const hasTrustedApiCoords = Boolean(
    apiCoords &&
      isIncheonArea(apiCoords.lng, apiCoords.lat) &&
      apiAddressIsIncheon,
  );
  // 재사용된 과거 contentId가 타 지역 상세를 반환하면 인천 큐레이션을 정본으로 사용합니다.
  const place = normalizePlaceDetail(
    curatedFallback && !hasTrustedApiCoords ? null : placeQuery.data,
    placeFallback,
  );

  const imagesQuery = useAttractionImagesQuery(contentId, {
    fallbackHeroUrl: place.imageUrl || navState.imageUrl || '',
    embeddedImages: place.images,
  });

  const resolvedCoords = useMemo(() => {
    const api = apiAddressIsIncheon ? placeQuery.data : null;
    return resolveBestMapCoords({
      apiMapX: api?.mapX ?? api?.mapx ?? null,
      apiMapY: api?.mapY ?? api?.mapy ?? null,
      stateMapX: navState.mapX ?? navState.mapx ?? navState.lng,
      stateMapY: navState.mapY ?? navState.mapy ?? navState.lat,
      fallbackMapX: curatedFallback?.mapX,
      fallbackMapY: curatedFallback?.mapY,
    });
  }, [
    apiAddressIsIncheon,
    curatedFallback?.mapX,
    curatedFallback?.mapY,
    placeQuery.data,
    navState.lat,
    navState.lng,
    navState.mapX,
    navState.mapY,
    navState.mapx,
    navState.mapy,
  ]);

  const mapX = resolvedCoords.mapX;
  const mapY = resolvedCoords.mapY;
  const nearbyRestaurantsQuery = useNearbyRestaurantsQuery(contentId, {
    mapX,
    mapY,
    enabled:
      (hasCoordinate(mapX) && hasCoordinate(mapY)) || !placeQuery.isPending,
  });
  const nearbyLodgingsQuery = useNearbyLodgingsQuery(contentId, {
    mapX,
    mapY,
    enabled:
      (hasCoordinate(mapX) && hasCoordinate(mapY)) || !placeQuery.isPending,
  });

  const title = place.title || navState.title || '명소';
  const hasPlaceDetail = Boolean(
    place.title ||
      place.overview ||
      place.address ||
      place.imageUrl ||
      navState.title,
  );
  const hasCoords = hasCoordinate(mapX) && hasCoordinate(mapY);

  const kakaoMapUrl = createKakaoMapPlaceUrl({
    name: title,
    mapX,
    mapY,
  });
  const operationRows = toOperationRows(place.operationInfo);
  const restaurants = useMemo(
    () => nearbyRestaurantsQuery.data ?? [],
    [nearbyRestaurantsQuery.data],
  );
  const lodgings = useMemo(
    () => nearbyLodgingsQuery.data ?? [],
    [nearbyLodgingsQuery.data],
  );
  const visiblePois = useMemo(
    () => [
      ...(showRestaurants
        ? restaurants.map((poi) => ({
            ...poi,
            markerKind: POI_MARKER_KIND.RESTAURANT,
            contentTypeId: poi.contentTypeId ?? KTO_CONTENT_TYPE.FOOD,
          }))
        : []),
      ...(showLodgings
        ? lodgings.map((poi) => ({
            ...poi,
            markerKind: POI_MARKER_KIND.LODGING,
            contentTypeId: poi.contentTypeId ?? KTO_CONTENT_TYPE.LODGING,
          }))
        : []),
    ],
    [showRestaurants, restaurants, showLodgings, lodgings],
  );

  const selectedPlaceForRoute = {
    contentId,
    title,
    mapX,
    mapY,
  };
  const initialRouteDestination = navState.routeDestination;
  const effectiveRouteEndpoints =
    routeEndpoints === undefined &&
    initialRouteDestination &&
    hasCoords &&
    hasCoordinate(initialRouteDestination.mapX) &&
    hasCoordinate(initialRouteDestination.mapY)
      ? { origin: selectedPlaceForRoute, destination: initialRouteDestination }
      : routeEndpoints;

  const routeQuery = useRouteQuery({
    origin: effectiveRouteEndpoints?.origin,
    destination: effectiveRouteEndpoints?.destination,
    mode: routeMode,
    predictionType:
      routeMode === 'CAR' && routePrediction.enabled
        ? routePrediction.type
        : undefined,
    predictionTime:
      routeMode === 'CAR' && routePrediction.enabled
        ? routePrediction.time
        : undefined,
    enabled:
      Boolean(effectiveRouteEndpoints) &&
      (!routePrediction.enabled ||
        routeMode !== 'CAR' ||
        Boolean(routePrediction.time)),
  });

  useEffect(() => {
    if (!routeQuery.isSuccess || !routeQuery.data) return;
    trackStat({
      eventType: STAT_EVENTS.ROUTE_REQUEST,
      contentId: contentId ? String(contentId) : null,
      source: routeMode,
    });
  }, [
    routeQuery.dataUpdatedAt,
    routeQuery.isSuccess,
    routeQuery.data,
    contentId,
    routeMode,
  ]);

  const beginNearbyRoute = (poi) => {
    if (!hasCoords || !hasCoordinate(poi?.mapX) || !hasCoordinate(poi?.mapY))
      return;
    trackStat({
      eventType: STAT_EVENTS.NEARBY_CLICK,
      contentId: poi?.contentId != null ? String(poi.contentId) : null,
      source: poi?.contentTypeId === '32' ? 'lodging' : 'restaurant',
    });
    setRouteEndpoints({
      origin: selectedPlaceForRoute,
      destination: poi,
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation || !hasCoords) {
      setLocationStatus('error');
      return;
    }

    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRouteEndpoints({
          origin: {
            title: '현재 위치',
            mapX: position.coords.longitude,
            mapY: position.coords.latitude,
          },
          destination: selectedPlaceForRoute,
        });
        setLocationStatus('ready');
      },
      () => setLocationStatus('error'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 },
    );
  };

  const handleNavItem = (navId) => {
    trackStat({
      eventType: STAT_EVENTS.MENU_VIEW,
      menuId: navId,
      contentId: contentId ? String(contentId) : null,
      source: 'map_page',
    });
    if (goMemberNav(navId)) return;
    navigate('/', { state: { navId } });
  };

  return (
    <div className={styles.pageShell}>
      <main
        id='main-content'
        className={styles.page}
        tabIndex='-1'
      >
        <div
          className={styles.bg}
          aria-hidden
        />

        <div className={styles.nav}>
          <TopNavigation
            navItems={navLinks}
            activeNavId='explore'
            onNavItem={handleNavItem}
            onSearch={() => {
              trackStat({ eventType: STAT_EVENTS.MENU_VIEW, menuId: 'search' });
              navigate('/', { state: { focusSearch: true } });
            }}
            onFavorites={() => {
              trackStat({
                eventType: STAT_EVENTS.MENU_VIEW,
                menuId: 'favorites',
              });
              setIsFavoritesOpen(true);
            }}
            onAiAssistant={toggleAiChat}
            aiAssistantOpen={isAiOpen}
            favoriteCount={favoriteItems.length}
            {...navAuthProps}
          />
        </div>

        <aside className={styles.side}>
          <nav
            className={styles.breadcrumb}
            aria-label='현재 경로'
          >
            <Link to='/'>홈</Link>
            <ChevronRight
              size={13}
              aria-hidden='true'
            />
            <Link to='/'>관광지 탐색</Link>
            <ChevronRight
              size={13}
              aria-hidden='true'
            />
            <span>관광지 상세</span>
          </nav>

          {placeQuery.isLoading && !hasPlaceDetail ? (
            <Skeleton variant='detail' />
          ) : placeQuery.isError && !hasPlaceDetail ? (
            <div className={styles.empty}>
              <h2>명소 정보를 불러오지 못했습니다</h2>
              <p>잠시 후 다시 시도해 주세요.</p>
              <Link
                to='/'
                className={styles.primaryBtn}
              >
                메인으로 돌아가기
              </Link>
            </div>
          ) : hasPlaceDetail ? (
            <div className={styles.sideBody}>
              <PlaceImageGallery
                className={styles.heroGallery}
                slides={imagesQuery.data ?? []}
                isLoading={imagesQuery.isLoading}
                alt={title}
                placeholderChar={title?.[0] || 'I'}
              />

              <div className={styles.titleMeta}>
                <span>관광지</span>
              </div>
              <h1>{title}</h1>
              <p className={styles.overview}>
                {place.overview || place.recommendReason || '개요 정보 준비 중'}
              </p>
              <QuestPlaceActions
                contentId={contentId}
                primaryClassName={styles.primaryBtn}
                secondaryClassName={styles.secondaryBtn}
              />

              <nav
                className={styles.sectionNav}
                aria-label='이 페이지의 구성'
              >
                <strong>이 페이지의 구성</strong>
                <a href='#place-basic'>기본 정보</a>
                <a href='#place-route'>길찾기</a>
                <a href='#place-nearby'>주변 정보</a>
              </nav>

              <section
                id='place-basic'
                className={styles.detailSection}
              >
                <div className={styles.sectionTitle}>
                  <MapPinned
                    size={16}
                    aria-hidden='true'
                  />
                  <h2>기본 정보</h2>
                </div>
                <dl className={styles.meta}>
                  <div>
                    <dt>주소</dt>
                    <dd>{place.address || '주소 정보 준비 중'}</dd>
                  </div>
                  <div>
                    <dt>위치 좌표</dt>
                    <dd>
                      {hasCoords ? `${mapY}, ${mapX}` : '좌표 정보가 없습니다.'}
                    </dd>
                  </div>
                  {operationRows.map(({ label, value }) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section
                id='place-route'
                className={styles.detailSection}
              >
                <div className={styles.sectionTitle}>
                  <Navigation
                    size={16}
                    aria-hidden='true'
                  />
                  <h2>길찾기</h2>
                </div>
                <div className={styles.actions}>
                  <button
                    type='button'
                    className={styles.primaryBtn}
                    disabled={!hasCoords}
                    onClick={useCurrentLocation}
                  >
                    <Navigation size={16} />
                    현재 위치에서 길찾기
                  </button>
                  {/* <button
                    type='button'
                    className={styles.secondaryBtn}
                    disabled={!kakaoMapUrl}
                    onClick={() => {
                      trackStat({
                        eventType: STAT_EVENTS.KAKAO_MAP_OPEN,
                        contentId: contentId ? String(contentId) : null,
                      });
                      window.open(kakaoMapUrl, '_blank', 'noopener');
                    }}
                  >
                    <ExternalLink size={16} />
                    카카오맵 새 창
                  </button> */}
                </div>

                <RoutePlanner
                  mode={routeMode}
                  onModeChange={setRouteMode}
                  prediction={routePrediction}
                  onPredictionChange={setRoutePrediction}
                  onUseCurrentLocation={useCurrentLocation}
                  locationStatus={locationStatus}
                  routeEndpoints={effectiveRouteEndpoints}
                  routeQuery={routeQuery}
                  onClear={() => setRouteEndpoints(null)}
                />
              </section>

              <section
                id='place-nearby'
                className={styles.nearbySection}
              >
                <div className={styles.sectionHead}>
                  <div>
                    <span>가까운 곳도 함께</span>
                    <h2>주변 먹거리와 숙박</h2>
                  </div>
                  <div
                    className={styles.poiFilters}
                    aria-label='주변 장소 필터'
                  >
                    <button
                      type='button'
                      aria-pressed={showRestaurants}
                      onClick={() => setShowRestaurants((value) => !value)}
                    >
                      <Utensils
                        size={13}
                        strokeWidth={2.4}
                        aria-hidden
                      />
                      음식점 {restaurants.length}
                    </button>
                    <button
                      type='button'
                      aria-pressed={showLodgings}
                      onClick={() => setShowLodgings((value) => !value)}
                    >
                      <BedDouble
                        size={13}
                        strokeWidth={2.4}
                        aria-hidden
                      />
                      숙박 {lodgings.length}
                    </button>
                  </div>
                </div>

                {nearbyRestaurantsQuery.isPending ? (
                  <Skeleton
                    count={2}
                    label='주변 음식점을 불러오는 중…'
                  />
                ) : nearbyRestaurantsQuery.isError ? (
                  <p className={styles.sectionError}>
                    주변 음식점을 불러오지 못했습니다.
                    <button
                      type='button'
                      disabled={nearbyRestaurantsQuery.isFetching}
                      onClick={() => nearbyRestaurantsQuery.refetch()}
                    >
                      {nearbyRestaurantsQuery.isFetching
                        ? '다시 불러오는 중…'
                        : '다시 시도'}
                    </button>
                  </p>
                ) : showRestaurants && restaurants.length > 0 ? (
                  <div className={styles.nearbyList}>
                    {restaurants.map((restaurant) => (
                      <RestaurantCard
                        key={restaurant.contentId ?? restaurant.title}
                        restaurant={restaurant}
                        onDirections={beginNearbyRoute}
                      />
                    ))}
                  </div>
                ) : showRestaurants ? (
                  <p className={styles.sectionMessage}>
                    가까운 음식점을 찾지 못했어요.
                  </p>
                ) : null}

                {nearbyLodgingsQuery.isPending ? (
                  <Skeleton
                    count={2}
                    label='주변 숙소를 불러오는 중…'
                  />
                ) : nearbyLodgingsQuery.isError ? (
                  <p className={styles.sectionError}>
                    주변 숙박을 불러오지 못했습니다.
                    <button
                      type='button'
                      disabled={nearbyLodgingsQuery.isFetching}
                      onClick={() => nearbyLodgingsQuery.refetch()}
                    >
                      {nearbyLodgingsQuery.isFetching
                        ? '다시 불러오는 중…'
                        : '다시 시도'}
                    </button>
                  </p>
                ) : showLodgings && lodgings.length > 0 ? (
                  <div className={styles.nearbyList}>
                    {lodgings.map((lodging) => (
                      <LodgingCard
                        key={lodging.contentId ?? lodging.title}
                        lodging={lodging}
                        onDirections={beginNearbyRoute}
                      />
                    ))}
                  </div>
                ) : showLodgings ? (
                  <p className={styles.sectionMessage}>
                    가까운 숙소를 찾지 못했어요.
                  </p>
                ) : null}
              </section>
            </div>
          ) : (
            <div className={styles.empty}>
              <h2>명소 정보를 찾을 수 없습니다</h2>
              <p>메인에서 다른 명소를 선택해 보세요.</p>
              <Link
                to='/'
                className={styles.primaryBtn}
              >
                메인으로 돌아가기
              </Link>
            </div>
          )}
        </aside>

        <section
          className={styles.mapArea}
          aria-label='주변 지도'
        >
          {placeQuery.isLoading && !hasCoords ? (
            <Skeleton
              variant='map'
              label='지도를 준비하는 중…'
            />
          ) : (
            <CesiumPlaceViewer
              key={contentId}
              mapX={mapX}
              mapY={mapY}
              title={title}
              nearbyPois={visiblePois}
              route={routeQuery.data ?? null}
            />
          )}
        </section>

        {isFavoritesOpen && (
          <FavoritesPanel
            items={favoriteItems}
            onClose={() => setIsFavoritesOpen(false)}
            onSelect={(item) => {
              setIsFavoritesOpen(false);
              const id = item.contentId || item.id;
              if (id) {
                navigate(`/map/${id}`, {
                  state: toMapPageState(item),
                });
              }
            }}
          />
        )}
      </main>

      <AiChatWidget
        districtId={place.districtId || null}
        contentId={contentId || null}
        placeTitle={title}
      />

      <PublicFooter />
    </div>
  );
}
