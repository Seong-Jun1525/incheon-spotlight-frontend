/**
 * ConstructionSiteMarker.jsx — 전체 조망용 공사 예고 마커
 * - 흙색 원형 패드 + 짧은 기둥 + 주황 원뿔만으로 "아직 건설 전" 상태를 표시
 * - 40여 곳에 상세 GLB를 띄우지 않기 위한 경량 대체물이며 raycast 는 무시
 */
import { useLayoutEffect, useRef } from 'react';
import { skipRaycast } from './landmarkGlbMap';
import { MAP_COLORS } from '../mapVisualConstants';

/**
 * 전체 조망용 공사 예고 마커.
 * 40곳 full GLB 대신 작은 원뿔+패드로 "아직 건설 전"만 표시한다.
 * 맵 로컬은 Z-up.
 */
export function ConstructionSiteMarker() {
  const groupRef = useRef(null);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.frustumCulled = false;
      obj.raycast = skipRaycast;
    });
  }, []);

  return (
    <group ref={groupRef}>
      <mesh
        position={[0, 0, 0.003]}
        renderOrder={2}
      >
        <circleGeometry args={[0.068, 14]} />
        <meshStandardMaterial
          color='#E8C48A'
          roughness={0.82}
          metalness={0.04}
        />
      </mesh>
      <mesh
        position={[0, 0, 0.016]}
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={2}
      >
        <cylinderGeometry args={[0.02, 0.02, 0.01, 10]} />
        <meshStandardMaterial
          color={MAP_COLORS.landmarkActive}
          emissive={MAP_COLORS.landmarkActive}
          emissiveIntensity={0.18}
          roughness={0.42}
          metalness={0.08}
        />
      </mesh>
      <mesh
        position={[0, 0, 0.048]}
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={2}
      >
        <coneGeometry args={[0.02, 0.062, 8]} />
        <meshStandardMaterial
          color={MAP_COLORS.landmark}
          emissive={MAP_COLORS.landmark}
          emissiveIntensity={0.22}
          roughness={0.46}
          metalness={0.06}
        />
      </mesh>
    </group>
  );
}
