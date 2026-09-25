/**
 * LandmarkBuildLayer.jsx — 랜드마크 공사현장 → 완성 건물 전환 레이어
 * - 스탬프 승인 여부에 따라 공사현장/건설중/완성 단계를 정하고 순차 건설을 예약
 * - gsap 타임라인으로 완성 모델을 팝업시키고 공사현장을 축소, 끝나면 markBuildSeen 호출
 * - 줌 단계별로 상세 GLB·간이 마커를 바꾸고 명칭 칩과 클릭 히트 영역을 배치
 */
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useQueryClient } from '@tanstack/react-query';
import gsap from 'gsap';
import { markBuildSeen } from '../../../api/stampApi';
import { useLandmarkStatesQuery } from '../../../hooks/queries/useLandmarkStatesQuery';
import { useStampRevealStore } from '../../../stores/useStampRevealStore';
import { mapSurfaceLocalZ } from '../incheonIcMapConfig';
import {
  LANDMARK_DISPLAY_SCALE,
  landmarkLabelNudge,
  skipRaycast,
} from './landmarkGlbMap';
import { CommonConstructionModel } from './CommonConstructionModel';
import { ConstructionSiteMarker } from './ConstructionSiteMarker';
import { useTranslation } from 'react-i18next';
import { translateLandmarkKey } from '../../../i18n/placeLabel';
import { LandmarkSiteLabel } from './LandmarkSiteLabel';
import { isLandmarkSelected, placeFromLandmarkSite } from '../../../utils/landmarkExplore';
import { MAP_COLORS } from '../mapVisualConstants';

const BUILD_STAGGER_MS = 420;
const LANDMARK_POP_DELAY = 1.05;
const CONSTRUCTION_HIDE_DELAY = 1.75;
const BUILD_DONE_DELAY = 2.25;
const REVEAL_CLEAR_MS = 1600;
const CAMERA_HOLD_FALLBACK_MS = 4000;

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

function landmarkSitePhase(
  landmarkKey,
  stateByKey,
  localComplete,
  buildingKeys,
  forceReplayKey,
) {
  if (buildingKeys.has(landmarkKey)) return 'building';
  if (localComplete.has(landmarkKey)) return 'complete';
  if (forceReplayKey === landmarkKey) return 'construction';
  const row = stateByKey.get(landmarkKey);
  if (row?.buildMotionSeen) return 'complete';
  return 'construction';
}

/**
 * 패드가 거의 겹친 곳만 묶는다.
 * 0.16은 화도진·소래습지처럼 이웃 명소를 한 덩어리로 끌어
 * 명칭이 실제 위치에서 벗어나게 했다.
 */
const CLUSTER_DIST_SQ = 0.09 * 0.09;

function labelClustersBySite(sites = []) {
  const n = sites.length;
  const parent = sites.map((_, index) => index);
  const find = (index) => {
    if (parent[index] === index) return index;
    parent[index] = find(parent[index]);
    return parent[index];
  };
  const unite = (a, b) => {
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) parent[pa] = pb;
  };

  for (let i = 0; i < n; i += 1) {
    const [ax, ay] = sites[i].mapPosition;
    for (let j = i + 1; j < n; j += 1) {
      const dx = sites[j].mapPosition[0] - ax;
      const dy = sites[j].mapPosition[1] - ay;
      if (dx * dx + dy * dy <= CLUSTER_DIST_SQ) unite(i, j);
    }
  }

  const groups = new Map();
  for (let i = 0; i < n; i += 1) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(i);
  }

  const clusters = new Map();
  for (const members of groups.values()) {
    members.forEach((index, order) => {
      clusters.set(sites[index].landmarkKey, {
        index: order,
        count: members.length,
      });
    });
  }
  return clusters;
}

export function useZoomPastThreshold(threshold) {
  const crossedRef = useRef(false);
  const [crossed, setCrossed] = useState(false);

  useFrame(({ camera }) => {
    const next = (camera?.zoom ?? 0) >= threshold;
    if (next === crossedRef.current) return;
    crossedRef.current = next;
    setCrossed(next);
  });

  return crossed;
}

export function LandmarkBuildLayer({
  sites = [],
  districtCenter = null,
  showFullSites = false,
  showNameLabels = false,
  onLandmarkClick,
  selectedLandmarkId = null,
  pinPlaces = [],
}) {
  const queryClient = useQueryClient();
  const { data } = useLandmarkStatesQuery();
  const reveal = useStampRevealStore((state) => state.reveal);
  const cameraSettled = useStampRevealStore((state) => state.cameraSettled);
  const holdForModal = useStampRevealStore((state) => state.holdForModal);
  const completedKeys = useStampRevealStore((state) => state.completedKeys);
  const [localComplete, setLocalComplete] = useState(() => new Set());
  const [buildingKeys, setBuildingKeys] = useState(() => new Set());
  const buildingKeysRef = useRef(buildingKeys);
  buildingKeysRef.current = buildingKeys;

  const stateByKey = useMemo(() => {
    const map = new Map();
    for (const row of data ?? []) {
      if (row?.landmarkKey) map.set(row.landmarkKey, row);
    }
    return map;
  }, [data]);

  const completedSet = useMemo(() => {
    const next = new Set(localComplete);
    for (const key of completedKeys) next.add(key);
    return next;
  }, [completedKeys, localComplete]);

  const holdForReveal = Boolean(reveal?.landmarkKey) && !cameraSettled;

  useEffect(() => {
    const key = reveal?.landmarkKey;
    if (!key) return;
    setLocalComplete((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setBuildingKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, [reveal?.landmarkKey]);

  useEffect(() => {
    if (!holdForReveal) return undefined;
    const timer = window.setTimeout(() => {
      if (!useStampRevealStore.getState().cameraSettled) {
        useStampRevealStore.getState().markCameraSettled();
      }
    }, CAMERA_HOLD_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [holdForReveal, reveal?.landmarkKey]);

  useEffect(() => {
    if (holdForModal) return undefined;

    const pending = sites
      .filter((site) => {
        const row = stateByKey.get(site.landmarkKey);
        const forceReplay = reveal?.landmarkKey === site.landmarkKey;
        const demoReveal =
          import.meta.env.DEV &&
          reveal?.demo &&
          reveal?.landmarkKey === site.landmarkKey;
        const alreadyDone = completedSet.has(site.landmarkKey);
        if (holdForReveal && !forceReplay) return false;
        return (
          (row?.approved || demoReveal || forceReplay) &&
          !alreadyDone &&
          (forceReplay || !row?.buildMotionSeen) &&
          !buildingKeysRef.current.has(site.landmarkKey)
        );
      })
      .sort((left, right) => {
        if (left.landmarkKey === reveal?.landmarkKey) return -1;
        if (right.landmarkKey === reveal?.landmarkKey) return 1;
        return 0;
      });

    let cancelled = false;
    const timers = pending.map((site, index) =>
      window.setTimeout(() => {
        if (cancelled) return;
        setBuildingKeys((prev) => {
          if (prev.has(site.landmarkKey)) return prev;
          const next = new Set(prev);
          next.add(site.landmarkKey);
          return next;
        });
      }, index * BUILD_STAGGER_MS),
    );

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [completedSet, holdForModal, holdForReveal, reveal?.demo, reveal?.landmarkKey, sites, stateByKey]);

  const handleBuilt = useCallback(async (landmarkKey) => {
    setBuildingKeys((prev) => {
      const next = new Set(prev);
      next.delete(landmarkKey);
      return next;
    });
    setLocalComplete((prev) => {
      const next = new Set(prev);
      next.add(landmarkKey);
      return next;
    });
    useStampRevealStore.getState().markComplete(landmarkKey);
    try {
      await markBuildSeen([landmarkKey]);
      await queryClient.invalidateQueries({ queryKey: ['stampLandmarkStates'] });
    } catch {
      // 스탬프는 유지된다. 다음 접속에서 건설 연출을 다시 보여 줄 수 있다.
    }
    const currentReveal = useStampRevealStore.getState().reveal;
    if (currentReveal?.landmarkKey === landmarkKey) {
      useStampRevealStore.getState().scheduleClearReveal(landmarkKey, REVEAL_CLEAR_MS);
    }
  }, [queryClient]);

  const labelClusters = useMemo(() => labelClustersBySite(sites), [sites]);

  return (
    <>
      {sites.map((site) => (
        <LandmarkBuildSite
          key={site.landmarkKey}
          site={site}
          phase={landmarkSitePhase(
            site.landmarkKey,
            stateByKey,
            completedSet,
            buildingKeys,
            reveal?.landmarkKey,
          )}
          districtCenter={districtCenter}
          showDetailedConstruction={showFullSites}
          showNameLabel={showNameLabels}
          labelCluster={
            labelClusters.get(site.landmarkKey) ?? { index: 0, count: 1 }
          }
          onBuilt={handleBuilt}
          onLandmarkClick={onLandmarkClick}
          selectedLandmarkId={selectedLandmarkId}
          pinPlaces={pinPlaces}
        />
      ))}
    </>
  );
}

function LandmarkBuildSite({
  site,
  phase,
  districtCenter = null,
  showDetailedConstruction = false,
  showNameLabel = false,
  labelCluster = { index: 0, count: 1 },
  onBuilt,
  onLandmarkClick,
  selectedLandmarkId = null,
  pinPlaces = [],
}) {
  const { t } = useTranslation();
  const constructionRef = useRef(null);
  const landmarkRef = useRef(null);
  const onBuiltRef = useRef(onBuilt);
  onBuiltRef.current = onBuilt;
  const showConstruction = phase !== 'complete';
  // 완성된 랜드마크는 카메라 줌/공사현장 상세 노출 조건과 무관하게 항상 표시한다.
  const showLandmark = phase !== 'construction';
  const showFullConstruction =
    showConstruction && (phase === 'building' || showDetailedConstruction);
  const originX = districtCenter?.[0] ?? 0;
  const originY = districtCenter?.[1] ?? 0;
  const originZ = districtCenter?.[2] ?? 0;
  const surfaceRelZ = mapSurfaceLocalZ() - originZ;
  const mx = site.mapPosition[0];
  const my = site.mapPosition[1];
  const [nudgeX, nudgeY] = landmarkLabelNudge(site.landmarkKey);
  const hasLabelNudge = nudgeX !== 0 || nudgeY !== 0;
  const displayScale = site.landmarkScale ?? LANDMARK_DISPLAY_SCALE;
  const sitePos = useMemo(
    () => [mx - originX, my - originY, surfaceRelZ],
    [mx, my, originX, originY, surfaceRelZ],
  );
  const place = useMemo(
    () => placeFromLandmarkSite(site, pinPlaces),
    [site, pinPlaces],
  );
  const selected = isLandmarkSelected(place, selectedLandmarkId);
  const courseOrder = place?.order;
  const showCourseOrder = courseOrder != null && courseOrder !== '';
  const labelPos = useMemo(
    () => [
      mx + nudgeX - originX,
      my + nudgeY - originY,
      sitePos[2] + (showFullConstruction || showLandmark ? 0.28 : 0.13),
    ],
    [
      mx,
      my,
      nudgeX,
      nudgeY,
      originX,
      originY,
      showFullConstruction,
      showLandmark,
      sitePos,
    ],
  );
  const baseOffset = useMemo(() => {
    const pos = site.baseGlbPosition;
    if (!pos) return [0, 0, 0];
    return [-pos[0], -pos[1], -pos[2]];
  }, [site.baseGlbPosition]);

  useLayoutEffect(() => {
    if (phase === 'building' || !constructionRef.current) return;
    constructionRef.current.scale.setScalar(site.constructionScale);
  }, [phase, site.constructionScale, showFullConstruction]);

  useLayoutEffect(() => {
    if (phase === 'building' || !landmarkRef.current || !showLandmark) return;
    landmarkRef.current.scale.setScalar(displayScale);
    landmarkRef.current.position.z = 0;
  }, [phase, displayScale, showLandmark]);

  useLayoutEffect(() => {
    if (phase !== 'building') return undefined;

    if (prefersReducedMotion()) {
      const timer = window.setTimeout(() => onBuiltRef.current(site.landmarkKey), 700);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    let finished = false;
    let timeline;
    let raf;
    const safety = window.setTimeout(() => finish(), 3200);

    function finish() {
      if (cancelled || finished) return;
      finished = true;
      onBuiltRef.current(site.landmarkKey);
    }

    function startWhenReady(tries = 0) {
      if (cancelled || finished) return;
      const construction = constructionRef.current;
      const landmark = landmarkRef.current;
      if ((!construction || !landmark) && tries < 20) {
        raf = requestAnimationFrame(() => startWhenReady(tries + 1));
        return;
      }

      const baseScale = site.constructionScale;
      timeline = gsap.timeline({ onComplete: finish });

      if (landmark) {
        gsap.set(landmark.scale, {
          x: displayScale * 0.12,
          y: displayScale * 0.12,
          z: displayScale * 0.12,
        });
        gsap.set(landmark.position, { z: -0.04 });
        timeline.to(
          landmark.scale,
          {
            x: displayScale,
            y: displayScale,
            z: displayScale,
            duration: 1.15,
            ease: 'back.out(1.55)',
          },
          LANDMARK_POP_DELAY,
        );
        timeline.to(
          landmark.position,
          {
            z: 0,
            duration: 1.15,
            ease: 'power2.out',
          },
          LANDMARK_POP_DELAY,
        );
      }

      if (construction) {
        gsap.set(construction.scale, { x: baseScale, y: baseScale, z: baseScale });
        timeline.to(
          construction.scale,
          {
            x: 0.02,
            y: 0.02,
            z: 0.02,
            duration: 0.55,
            ease: 'power2.in',
          },
          CONSTRUCTION_HIDE_DELAY,
        );
      }

      timeline.to({}, { duration: 0.01 }, BUILD_DONE_DELAY);
    }

    startWhenReady();

    return () => {
      cancelled = true;
      window.clearTimeout(safety);
      if (raf) cancelAnimationFrame(raf);
      timeline?.kill();
    };
    // 건설 시작 시점의 높이·스케일을 유지한다. 호버 리프트에 재시작하지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, site.landmarkKey]);

  return (
    <group renderOrder={2}>
      <group
        name={`landmark-site-${site.landmarkKey}`}
        position={sitePos}
      />
      {place && onLandmarkClick ? (
        <LandmarkSiteHitTarget
          position={sitePos}
          selected={selected}
          onPick={() => onLandmarkClick(place)}
        />
      ) : null}
      {showLandmark ? (
        <group
          name={`landmark-built-${site.landmarkKey}`}
          position={sitePos}
          renderOrder={2}
        >
          <group ref={landmarkRef}>
            <group rotation={[-Math.PI / 2, 0, 0]}>
              <group position={baseOffset}>
                {site.meshes.map((mesh) => (
                  <mesh
                    key={mesh.name}
                    name={mesh.name}
                    geometry={mesh.geometry}
                    material={mesh.material}
                    position={mesh.position}
                    quaternion={mesh.quaternion}
                    scale={mesh.scale}
                    raycast={skipRaycast}
                    castShadow={false}
                    receiveShadow={false}
                    renderOrder={2}
                    polygonOffset
                    polygonOffsetFactor={-1}
                    polygonOffsetUnits={-1}
                  />
                ))}
              </group>
            </group>
          </group>
        </group>
      ) : null}

      {showFullConstruction ? (
        <group
          ref={constructionRef}
          name={`landmark-construction-${site.landmarkKey}`}
          position={sitePos}
          renderOrder={2}
        >
          <Suspense fallback={null}>
            <CommonConstructionModel
              playWork={!prefersReducedMotion()}
              workSpeed={phase === 'building' ? 1.15 : 0.9}
            />
          </Suspense>
        </group>
      ) : null}

      {showConstruction && !showFullConstruction ? (
        <group
          name={`landmark-construction-marker-${site.landmarkKey}`}
          position={sitePos}
          renderOrder={2}
        >
          <ConstructionSiteMarker />
        </group>
      ) : null}

      {showNameLabel || showCourseOrder ? (
        <LandmarkSiteLabel
          name={translateLandmarkKey(t, site.landmarkKey, site.displayName)}
          order={showCourseOrder ? courseOrder : null}
          clusterIndex={labelCluster.index}
          clusterCount={hasLabelNudge ? 1 : labelCluster.count}
          position={labelPos}
        />
      ) : null}
    </group>
  );
}

function LandmarkSiteHitTarget({ position, selected, onPick }) {
  return (
    <group position={position} renderOrder={4}>
      {selected ? (
        <mesh renderOrder={3} position={[0, 0, 0.008]}>
          <ringGeometry args={[0.09, 0.13, 24]} />
          <meshBasicMaterial
            color={MAP_COLORS.landmarkActive}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </mesh>
      ) : null}
      <mesh
        position={[0, 0, 0.11]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onPick?.();
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          document.body.style.cursor = '';
        }}
      >
        <cylinderGeometry args={[0.12, 0.12, 0.22, 12]} />
        <meshBasicMaterial transparent opacity={0.01} depthWrite={false} />
      </mesh>
    </group>
  );
}
