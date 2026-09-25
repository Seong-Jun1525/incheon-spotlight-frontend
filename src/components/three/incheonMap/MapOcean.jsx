/**
 * MapOcean.jsx — 맵 바닥에 깔리는 반지름 4의 원형 바다
 * - 원판(circleGeometry) + 측면 실린더로 GLB의 사각 보드를 대체
 * - 커스텀 셰이더로 수심 그라데이션과 잔물결 반짝임을 그림
 * - 다크 모드와 계절(여름·겨울)에 따라 물색을 보정하고 raycast는 무시
 */
import { useMemo } from 'react';
import { Color } from 'three';
import { useColorModeStore } from '../../../stores/useColorModeStore';
import { seasonIdFromMonth } from '../../../utils/mapSeasonMood';
import { skipRaycast } from '../landmark/landmarkGlbMap';

// Same local Z as the original water, so boats and coastal shallows still sit on it.
const SEA_LEVEL = 0.011;
const SEA_RADIUS = 4;
const SEA_DEPTH = 0.045;

const vertexShader = `
  varying vec2 waterUv;
  void main() {
    waterUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 shallowColor;
  uniform vec3 deepColor;
  varying vec2 waterUv;
  void main() {
    vec2 p = (waterUv - 0.5) * 2.0;
    float radius = length(p);
    float depth = smoothstep(0.18, 0.98, radius);
    vec3 water = mix(shallowColor, deepColor, depth);

    // Quiet, broken wavelets; static to avoid an extra animation loop.
    float wave = sin(p.y * 110.0 + sin(p.x * 21.0) * 0.65);
    float breaks = smoothstep(0.3, 0.8, sin(p.x * 39.0 + p.y * 12.0));
    float glint = smoothstep(0.96, 1.0, wave) * breaks;
    water = mix(water, vec3(0.83, 0.96, 1.0), glint * 0.13);
    gl_FragColor = vec4(water, 1.0);
    #include <colorspace_fragment>
  }
`;

/** Round sea surface in the map's XY / Z-up coordinates. */
export function MapOcean({ seasonMonth = null }) {
  const isDark = useColorModeStore((state) => state.resolved === 'dark');
  const season = seasonIdFromMonth(seasonMonth);
  const uniforms = useMemo(() => {
    const shallow = new Color(isDark ? '#548eaa' : '#a2dce3');
    const deep = new Color(isDark ? '#225577' : '#589ec2');
    // Preserve the seasonal mood, while keeping the floor recognizably blue.
    if (season === 'winter') shallow.lerp(new Color('#d2eaf5'), 0.12);
    if (season === 'summer') shallow.lerp(new Color('#7ddacb'), 0.12);
    return { shallowColor: { value: shallow }, deepColor: { value: deep } };
  }, [isDark, season]);

  return (
    <group name='round-ocean'>
      <mesh
        name='ocean-edge'
        position={[0, 0, SEA_LEVEL - SEA_DEPTH / 2 - 0.001]}
        rotation={[Math.PI / 2, 0, 0]}
        raycast={skipRaycast}
      >
        <cylinderGeometry args={[SEA_RADIUS, SEA_RADIUS, SEA_DEPTH, 128]} />
        <meshBasicMaterial color={isDark ? '#204963' : '#4a8cac'} toneMapped={false} />
      </mesh>
      <mesh name='ocean-surface' position={[0, 0, SEA_LEVEL]} raycast={skipRaycast}>
        <circleGeometry args={[SEA_RADIUS, 128]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
