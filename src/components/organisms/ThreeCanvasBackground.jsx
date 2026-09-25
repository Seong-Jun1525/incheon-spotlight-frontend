/**
 * 3D 캔버스 배경 — Public Tourism Editorial
 *
 * OrthographicCamera + OrbitControls(회전 제한) 구조를 유지합니다.
 */
import { Component, Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  Html,
  OrbitControls,
  OrthographicCamera,
  useProgress,
} from '@react-three/drei';
import { IncheonMapGroup } from '../three/IncheonMapGroup';
import {
  LANDMARK_FOCUS_ZOOM,
  MAP_CAMERA,
} from '../three/incheonMap/mapGroupConfig';
import { useColorModeStore } from '../../stores/useColorModeStore';
import { useStampRevealStore } from '../../stores/useStampRevealStore';
import { registerMapCameraControls } from '../../utils/mapCameraControls';
import { mapSeasonLights, seasonIdFromMonth } from '../../utils/mapSeasonMood';
import { MapSeasonEffects } from '../three/season/MapSeasonEffects';
import styles from './ThreeCanvasBackground.module.scss';
import { useMapWheelActivation } from '../../hooks/useMapWheelActivation';
import { useTranslation } from 'react-i18next';

class ThreeErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={styles.fallback}
          role='img'
          aria-label='지도를 표시할 수 없습니다'
        />
      );
    }
    return this.props.children;
  }
}

function ProgressHud() {
  const { active, progress } = useProgress();

  if (!active) return null;

  return (
    <Html
      fullscreen
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        className={styles.loadingPill}
        aria-live='polite'
        aria-busy
      >
        지도 준비 중 {Math.min(100, Math.round(progress))}%
      </div>
    </Html>
  );
}

function SceneLights({ seasonMonth = null }) {
  const isDark = useColorModeStore((state) => state.resolved === 'dark');
  const mood = mapSeasonLights(seasonIdFromMonth(seasonMonth), isDark);

  if (isDark) {
    return (
      <>
        <hemisphereLight
          intensity={0.42}
          color={mood?.hemi ?? '#c5d4e8'}
          groundColor='#1a2430'
        />
        <ambientLight intensity={0.42} />
        <directionalLight
          position={[5, 16, 8]}
          intensity={0.86}
          color={mood?.dir ?? '#e8eef4'}
          castShadow={false}
        />
        <directionalLight
          position={[-6, 8, -3]}
          intensity={0.16}
          color={mood?.fill ?? '#8aa0b8'}
        />
      </>
    );
  }

  return (
    <>
      <hemisphereLight
        intensity={0.85}
        color={mood?.hemi ?? '#ffffff'}
        groundColor='#ebeae6'
      />
      <ambientLight intensity={0.68} />
      <directionalLight
        position={[5, 16, 8]}
        intensity={1.18}
        color={mood?.dir ?? '#fffaf3'}
        castShadow={false}
      />
      <directionalLight
        position={[-6, 8, -3]}
        intensity={0.22}
        color={mood?.fill ?? '#f3f2ee'}
      />
    </>
  );
}

function MapCameraBridge({ controlsRef, maxZoom }) {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    return registerMapCameraControls({
      zoomIn: () => {
        if (!camera) return;
        camera.zoom = Math.min(maxZoom, camera.zoom * 1.16);
        camera.updateProjectionMatrix();
      },
      zoomOut: () => {
        if (!camera) return;
        camera.zoom = Math.max(MAP_CAMERA.minZoom, camera.zoom / 1.16);
        camera.updateProjectionMatrix();
      },
      resetView: () => {
        if (!camera || !controlsRef.current) return;
        camera.zoom = MAP_CAMERA.zoom;
        camera.position.set(...MAP_CAMERA.position);
        camera.updateProjectionMatrix();
        controlsRef.current.target.set(...MAP_CAMERA.target);
        controlsRef.current.update();
      },
    });
  }, [camera, controlsRef, maxZoom]);

  return null;
}

/**
 * @param {object} props
 * @param {string | null} [props.selectedDistrict]
 * @param {(id: string) => void} [props.onDistrictClick]
 * @param {(id: string | null) => void} [props.onDistrictHover]
 * @param {{ place: object, offset: [number, number, number] }[]} [props.landmarkPins]
 * @param {{ place: object, offset: [number, number, number] }[]} [props.spotlightPins]
 * @param {(place: object) => void} [props.onLandmarkClick]
 * @param {number | null} [props.seasonMonth] 1–12. 없으면 기존 조명 유지.
 * @param {string} [props.weatherLabel] 선택 지역 실황 라벨(비·눈 연출).
 */
export function ThreeCanvasBackground({
  selectedDistrict = null,
  hoveredDistrict = null,
  onDistrictClick,
  onDistrictHover,
  landmarkPins = [],
  spotlightPins = [],
  onLandmarkClick,
  floatAnimation = false,
  districtDetails,
  selectedLandmarkId = null,
  seasonMonth = null,
  weatherLabel = '',
}) {
  const controlsRef = useRef(null);
  const wheel = useMapWheelActivation();
  const { t } = useTranslation();
  const landmarkRevealActive = useStampRevealStore((state) => Boolean(state.reveal?.landmarkKey));
  const maxZoom = landmarkRevealActive ? LANDMARK_FOCUS_ZOOM : MAP_CAMERA.maxZoom;

  return (
    <div
      className={styles.wrap}
      ref={wheel.ref}
    >
      <button type='button' data-map-activate className={styles.wheelHint} aria-pressed={wheel.active}>
        {t(wheel.active ? 'feedback.mapActive' : 'feedback.mapActivate')}
      </button>
      <ThreeErrorBoundary>
        <Canvas
          className={styles.canvas}
          dpr={[
            1,
            typeof window !== 'undefined'
              ? Math.min(window.devicePixelRatio, 1.25)
              : 1,
          ]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          onCreated={({ gl, scene }) => {
            gl.toneMappingExposure = 1.22;
            gl.setClearColor(0x000000, 0);
            scene.background = null;
          }}
        >
          <OrthographicCamera
            makeDefault
            position={MAP_CAMERA.position}
            zoom={MAP_CAMERA.zoom}
            near={0.1}
            far={1000}
          />

          <SceneLights seasonMonth={seasonMonth} />
          <MapSeasonEffects
            seasonMonth={seasonMonth}
            weatherLabel={weatherLabel}
          />

          <ProgressHud />
          <MapCameraBridge controlsRef={controlsRef} maxZoom={maxZoom} />

          <OrbitControls
            ref={controlsRef}
            makeDefault
            enablePan
            enableZoom={wheel.active}
            enableRotate={false}
            minZoom={MAP_CAMERA.minZoom}
            maxZoom={maxZoom}
            target={MAP_CAMERA.target}
          />

          <Suspense fallback={null}>
            <IncheonMapGroup
              selectedDistrict={selectedDistrict}
              hoveredDistrict={hoveredDistrict}
              onDistrictClick={onDistrictClick}
              onDistrictHover={onDistrictHover}
              landmarkPins={landmarkPins}
              spotlightPins={spotlightPins}
              onLandmarkClick={onLandmarkClick}
              floatAnimation={floatAnimation}
              districtDetails={districtDetails}
              selectedLandmarkId={selectedLandmarkId}
              seasonMonth={seasonMonth}
            />
          </Suspense>
        </Canvas>
      </ThreeErrorBoundary>
    </div>
  );
}
