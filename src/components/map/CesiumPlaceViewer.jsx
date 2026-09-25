/**
 * CesiumPlaceViewer.jsx — CesiumJS 3D 지도로 선택 장소·주변 POI·이동 경로를 함께 보여주는 뷰어
 * - Viewer를 생성하며 OSM 타일을 기본 레이어로 쓰고, Ion 토큰이 있을 때만 월드 지형·OSM Buildings를 추가
 * - mapX/mapY, nearbyPois, routeWaypoints를 빌보드 엔티티로, route를 코리더·폴리라인 오버레이로 렌더링
 * - 마커 클릭을 onSelectPoi로 전달하고, 확대·축소 버튼과 useMapWheelActivation 기반 휠 잠금을 제공
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BedDouble, Landmark, Utensils, ZoomIn, ZoomOut } from 'lucide-react';
import {
  CameraEventType,
  BoundingSphere,
  Cartesian2,
  Cartesian3,
  ClassificationType,
  Color,
  CornerType,
  createOsmBuildingsAsync,
  DistanceDisplayCondition,
  HeadingPitchRange,
  HeightReference,
  HorizontalOrigin,
  ImageryLayer,
  Ion,
  LabelStyle,
  Math as CesiumMath,
  NearFarScalar,
  OpenStreetMapImageryProvider,
  PolylineDashMaterialProperty,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Terrain,
  VerticalOrigin,
  Viewer,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { getPoiMarkerImage, resolvePoiMarkerKind } from './mapPoiMarkers';
import styles from './CesiumPlaceViewer.module.scss';
import { useMapWheelActivation } from '../../hooks/useMapWheelActivation';
import { useTranslation } from 'react-i18next';

const INCHEON_DEFAULT = { lng: 126.7052, lat: 37.4563 };
const OSM_TILE_URL = 'https://tile.openstreetmap.org/';
const MARKER_VIEW_RANGE_M = 3200;
const MARKER_VIEW_PITCH = CesiumMath.toRadians(-30);
const ROUTE_COLOR = Color.fromCssColorString('#e51937');
const ROUTE_APPROX_COLOR = Color.fromCssColorString('#f59e0b');
const ROUTE_CASING_COLOR = Color.WHITE;
const ROUTE_LINE_WIDTH = 18;
const ROUTE_CASING_WIDTH = 26;
const ROUTE_APPROX_WIDTH = 16;
const ROUTE_BAND_WIDTH_M = 24;
const EMPTY_PLACES = [];
const MIN_CAMERA_HEIGHT_M = 150;

function numberCoordinate(value) {
  if (value == null || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeRoutePath(route) {
  return (route?.path ?? [])
    .map((point) => ({
      lng: numberCoordinate(point.lng ?? point.mapX ?? point[0]),
      lat: numberCoordinate(point.lat ?? point.mapY ?? point[1]),
    }))
    .filter((point) => point.lng !== null && point.lat !== null);
}

function addRouteOverlay(viewer, routePath, { approximate = false } = {}) {
  const positions = routePath.map((point) =>
    Cartesian3.fromDegrees(point.lng, point.lat),
  );
  const color = approximate ? ROUTE_APPROX_COLOR : ROUTE_COLOR;

  // 폴리곤 띠: WebGL lineWidth가 1px로 막혀도 경로가 굵게 남습니다.
  viewer.entities.add({
    id: 'active-route-band',
    corridor: {
      positions,
      width: ROUTE_BAND_WIDTH_M,
      material: color.withAlpha(0.88),
      cornerType: CornerType.ROUNDED,
      classificationType: ClassificationType.TERRAIN,
      zIndex: 1,
    },
  });

  viewer.entities.add({
    id: 'active-route-casing',
    polyline: {
      positions,
      width: approximate ? ROUTE_APPROX_WIDTH + 6 : ROUTE_CASING_WIDTH,
      clampToGround: true,
      zIndex: 2,
      classificationType: ClassificationType.TERRAIN,
      material: ROUTE_CASING_COLOR.clone(),
    },
  });

  viewer.entities.add({
    id: 'active-route',
    polyline: {
      positions,
      width: approximate ? ROUTE_APPROX_WIDTH : ROUTE_LINE_WIDTH,
      clampToGround: true,
      zIndex: 3,
      classificationType: ClassificationType.TERRAIN,
      material: approximate
        ? new PolylineDashMaterialProperty({
            color: color.clone(),
            dashLength: 16,
          })
        : color.clone(),
    },
  });
}

function addPlaceEntity(viewer, place, { primary = false, order = null } = {}) {
  const lng = numberCoordinate(place.mapX ?? place.lng);
  const lat = numberCoordinate(place.mapY ?? place.lat);
  if (lng === null || lat === null) return null;

  const title = place.title || place.name || '관광 장소';
  const kind = resolvePoiMarkerKind(place, { primary, order });
  const marker = getPoiMarkerImage(kind, { primary, order });
  const entity = viewer.entities.add({
    id: `${primary ? 'primary' : 'poi'}-${
      place.contentId ?? place.id ?? `${lng}-${lat}`
    }`,
    name: title,
    position: Cartesian3.fromDegrees(lng, lat, primary ? 4 : 3),
    properties: {
      poiContentId: String(place.contentId ?? place.id ?? ''),
      isNearbyPoi: !primary,
    },
    billboard: {
      image: marker.image,
      width: marker.width,
      height: marker.height,
      verticalOrigin: VerticalOrigin.BOTTOM,
      horizontalOrigin: HorizontalOrigin.CENTER,
      heightReference: HeightReference.RELATIVE_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      scaleByDistance: new NearFarScalar(400, 1.08, 12000, 0.62),
    },
    label: {
      text: order ? `${order}. ${title}` : title,
      font: primary
        ? '700 15px "Pretendard", "Noto Sans KR", sans-serif'
        : '700 12px "Pretendard", "Noto Sans KR", sans-serif',
      fillColor: Color.fromCssColorString('#1f2937'),
      outlineColor: Color.WHITE,
      outlineWidth: 4,
      style: LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: VerticalOrigin.BOTTOM,
      pixelOffset: new Cartesian2(0, -(marker.height + 4)),
      heightReference: HeightReference.RELATIVE_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      showBackground: true,
      backgroundColor: Color.WHITE.withAlpha(0.94),
      backgroundPadding: new Cartesian2(primary ? 12 : 8, primary ? 7 : 5),
      distanceDisplayCondition: new DistanceDisplayCondition(
        0,
        primary ? 18000 : 7000,
      ),
    },
  });

  return entity;
}

/**
 * TourAPI 좌표, 주변 POI, 내부 길찾기를 한 장면에 합치는 CesiumJS 관광 지도.
 */
export function CesiumPlaceViewer({
  mapX,
  mapY,
  title = '인천 명소',
  nearbyPois = EMPTY_PLACES,
  route = null,
  routeWaypoints = EMPTY_PLACES,
  onSelectPoi,
}) {
  useUiLanguage();
  const containerRef = useRef(null);
  const { ref: wheelRef, active: wheelActive } = useMapWheelActivation();
  const { t } = useTranslation();
  const viewerRef = useRef(null);
  const framedTargetRef = useRef(null);
  const clickHandlerRef = useRef(null);
  const onSelectPoiRef = useRef(onSelectPoi);
  const [viewerReady, setViewerReady] = useState(false);
  const [buildingsStatus, setBuildingsStatus] = useState('loading');

  useEffect(() => {
    onSelectPoiRef.current = onSelectPoi;
  }, [onSelectPoi]);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return undefined;

    const token = import.meta.env.VITE_CESIUM_ION_TOKEN;
    if (token) Ion.defaultAccessToken = token;

    let viewer;
    let disposed = false;

    try {
      viewer = new Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: true,
        infoBox: false,
        selectionIndicator: false,
        // 기본 World Imagery(Bing)는 HTTP virtualearth 호출이라 운영 HTTPS·CSP에서 막힙니다.
        baseLayer: new ImageryLayer(
          new OpenStreetMapImageryProvider({
            url: OSM_TILE_URL,
            maximumLevel: 19,
          }),
        ),
        terrain: token ? Terrain.fromWorldTerrain() : undefined,
        requestRenderMode: true,
        maximumRenderTimeChange: 30,
      });
    } catch (error) {
      console.error('[CesiumPlaceViewer] Viewer 생성 실패:', error);
      queueMicrotask(() => setBuildingsStatus('unavailable'));
      return undefined;
    }

    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.globe.enableLighting = true;
    viewer.scene.fog.enabled = true;
    viewer.scene.highDynamicRange = true;
    viewer.scene.screenSpaceCameraController.enableZoom = false;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = MIN_CAMERA_HEIGHT_M;
    viewer.scene.screenSpaceCameraController.zoomEventTypes = [
      CameraEventType.WHEEL,
      CameraEventType.PINCH,
    ];
    viewer.resolutionScale = window.matchMedia('(max-width: 900px)').matches
      ? 0.85
      : 1;
    viewer.scene.renderError.addEventListener((_scene, error) => {
      console.error('[CesiumPlaceViewer] renderError:', error);
    });

    viewerRef.current = viewer;

    const preventPageScroll = (event) => event.preventDefault();
    viewer.scene.canvas.addEventListener('wheel', preventPageScroll, {
      passive: false,
    });

    queueMicrotask(() => {
      if (!disposed) setViewerReady(true);
    });

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement) => {
      const picked = viewer.scene.pick(movement.position);
      const contentId = picked?.id?.properties?.poiContentId?.getValue?.();
      const isNearby = picked?.id?.properties?.isNearbyPoi?.getValue?.();
      if (isNearby && contentId) onSelectPoiRef.current?.(String(contentId));
    }, ScreenSpaceEventType.LEFT_CLICK);
    clickHandlerRef.current = handler;

    const addBuildings = async () => {
      if (!token) {
        setBuildingsStatus('unavailable');
        return;
      }
      try {
        const buildings = await createOsmBuildingsAsync();
        if (disposed || viewer.isDestroyed()) return;
        buildings.maximumScreenSpaceError = window.matchMedia(
          '(max-width: 900px)',
        ).matches
          ? 32
          : 16;
        viewer.scene.primitives.add(buildings);
        setBuildingsStatus('ready');
        viewer.scene.requestRender();
      } catch (error) {
        if (disposed || viewer.isDestroyed()) return;
        console.warn('[CesiumPlaceViewer] OSM Buildings 로드 실패:', error);
        setBuildingsStatus('unavailable');
      }
    };
    addBuildings();

    return () => {
      disposed = true;
      clickHandlerRef.current?.destroy();
      clickHandlerRef.current = null;
      viewer.scene.canvas.removeEventListener('wheel', preventPageScroll);
      setViewerReady(false);
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
      viewerRef.current = null;
      framedTargetRef.current = null;
    };
  }, []);

  const validNearbyPois = useMemo(
    () =>
      nearbyPois.filter(
        (poi) =>
          numberCoordinate(poi.mapX ?? poi.lng) !== null &&
          numberCoordinate(poi.mapY ?? poi.lat) !== null,
      ),
    [nearbyPois],
  );

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewerReady || !viewer || viewer.isDestroyed()) return undefined;

    viewer.entities.removeAll();

    const lng = numberCoordinate(mapX);
    const lat = numberCoordinate(mapY);
    const hasCoords = lng !== null && lat !== null;
    const targetLng = hasCoords ? lng : INCHEON_DEFAULT.lng;
    const targetLat = hasCoords ? lat : INCHEON_DEFAULT.lat;
    if (hasCoords) addPlaceEntity(
          viewer,
          { mapX: lng, mapY: lat, title, contentId: 'selected' },
          { primary: true },
        );

    for (const poi of validNearbyPois) addPlaceEntity(viewer, poi);
    routeWaypoints.forEach((waypoint, index) => {
      addPlaceEntity(
        viewer,
        { ...waypoint, contentTypeId: 'course' },
        { primary: false, order: waypoint.order ?? index + 1 },
      );
    });

    const routePath = normalizeRoutePath(route);
    if (routePath.length >= 2) {
      addRouteOverlay(viewer, routePath, {
        approximate: Boolean(route?.approximate),
      });
    }

    // Nearby data and filter changes must not reset a camera the visitor moved.
    // Frame known coordinates directly, without waiting for terrain/entity loading.
    const frameKey = JSON.stringify([targetLng, targetLat, routePath, routeWaypoints.map((point) => [point.mapX ?? point.lng, point.mapY ?? point.lat])]);
    if (framedTargetRef.current !== frameKey) {
      framedTargetRef.current = frameKey;
      try {
        const points = [Cartesian3.fromDegrees(targetLng, targetLat)];
        for (const point of [...routePath, ...routeWaypoints]) {
          const pointLng = numberCoordinate(point.mapX ?? point.lng);
          const pointLat = numberCoordinate(point.mapY ?? point.lat);
          if (pointLng !== null && pointLat !== null) points.push(Cartesian3.fromDegrees(pointLng, pointLat));
        }
        const bounds = BoundingSphere.fromPoints(points);
        viewer.camera.flyToBoundingSphere(bounds, {
          duration: 0.65,
          offset: new HeadingPitchRange(0, MARKER_VIEW_PITCH, Math.max(MARKER_VIEW_RANGE_M, bounds.radius * 3)),
        });
      } catch (error) {
        console.warn('[CesiumPlaceViewer] 카메라 프레이밍 실패:', error);
      }
    }
    viewer.scene.requestRender();

    return undefined;
  }, [viewerReady, mapX, mapY, title, validNearbyPois, route, routeWaypoints]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewerReady || !viewer || viewer.isDestroyed()) return undefined;
    viewer.scene.screenSpaceCameraController.enableZoom = wheelActive;
    return undefined;
  }, [viewerReady, wheelActive]);

  const hasCoords =
    numberCoordinate(mapX) !== null && numberCoordinate(mapY) !== null;

  const changeZoom = (direction) => {
    const viewer = viewerRef.current;
    if (!viewerReady || !viewer || viewer.isDestroyed()) return;

    const height = viewer.camera.positionCartographic.height;
    const amount = Math.max(80, Math.min(height * 0.35, 2_000_000));
    if (direction === 'in') viewer.camera.zoomIn(Math.max(0, Math.min(amount, height - MIN_CAMERA_HEIGHT_M)));
    else viewer.camera.zoomOut(amount);
    viewer.scene.requestRender();
  };

  return (
    <div
      className={styles.wrap}
      ref={wheelRef}
    >
      <button
        type='button'
        data-map-activate
        className={styles.wheelHint}
        aria-pressed={wheelActive}
      >
        {t(wheelActive ? 'feedback.mapActive' : 'feedback.mapActivate')}
      </button>
      <div
        ref={containerRef}
        className={styles.canvas}
        aria-label={uiText(`${title} 여행 지도`)}
      />
      <div
        className={styles.zoomControls}
        role='group'
        aria-label={uiText('지도 확대 및 축소')}
      >
        <button
          type='button'
          onClick={() => changeZoom('in')}
          disabled={!viewerReady}
          aria-label={uiText('지도 확대')}
          title={uiText('확대')}
        >
          <ZoomIn
            size={19}
            aria-hidden
          />
        </button>
        <button
          type='button'
          onClick={() => changeZoom('out')}
          disabled={!viewerReady}
          aria-label={uiText('지도 축소')}
          title={uiText('축소')}
        >
          <ZoomOut
            size={19}
            aria-hidden
          />
        </button>
      </div>
      <div
        className={styles.legend}
        aria-label={uiText('지도 범례')}
      >
        <span>
          <span className={`${styles.legendIcon} ${styles.attractionIcon}`}>
            <Landmark
              size={13}
              strokeWidth={2.4}
              aria-hidden
            />
          </span>
          {uiText('선택 명소')}
        </span>
        <span>
          <span className={`${styles.legendIcon} ${styles.foodIcon}`}>
            <Utensils
              size={13}
              strokeWidth={2.4}
              aria-hidden
            />
          </span>
          {uiText('음식점')}
        </span>
        <span>
          <span className={`${styles.legendIcon} ${styles.lodgingIcon}`}>
            <BedDouble
              size={13}
              strokeWidth={2.4}
              aria-hidden
            />
          </span>
          {uiText('숙박')}
        </span>
        {route && (
          <span>
            <i className={styles.routeLine} />
            {uiText('이동 경로')}
          </span>
        )}
      </div>
      {buildingsStatus === 'loading' && (
        <div className={styles.status}>
          {uiText('지도 풍경을 불러오는 중…')}
        </div>
      )}
      {buildingsStatus === 'unavailable' && (
        <div className={styles.status}>
          {uiText('일부 지도 정보를 불러오지 못했어요.')}
        </div>
      )}
      {!hasCoords && (
        <div className={styles.overlay}>
          <p>{uiText('정확한 위치가 없어 인천 전체를 보여드려요.')}</p>
        </div>
      )}
    </div>
  );
}
