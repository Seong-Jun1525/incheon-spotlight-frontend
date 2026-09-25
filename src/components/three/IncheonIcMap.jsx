/**
 * IncheonIcMap.jsx — incheon_diorama_v2.glb 디오라마 로더 겸 씬 루트
 * - GLB를 구·군/랜드마크/배경(scenery) 데이터로 변환해 children 렌더 함수에 전달
 * - 바다 배경(WATER_INCHEON 등)을 primitive로 배치
 * - BOATS_CRUISE_LOOP 클립을 AnimationMixer로 재생(동작 최소화 설정 시 일시정지)
 */
import { useEffect, useMemo } from 'react';
import { AnimationMixer, LoopRepeat } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { INCHEON_IC_MAP_GLB } from './incheonIcMapConfig';
import { createDioramaMapData } from './incheonDioramaAdapter';

/**
 * 디오라마 v2를 기존 구·군/랜드마크 형식으로 연결한다.
 * 부모에서 rotation=[-π/2,0,0] 을 주면 구·군이 Y-up 씬에 눕습니다.
 */
export function IncheonIcMap({ children, ...props }) {
  const { scene, nodes, animations } = useGLTF(INCHEON_IC_MAP_GLB);
  const { districts, landmarks, scenery } = useMemo(
    () => createDioramaMapData(scene, nodes),
    [scene, nodes],
  );
  const mixer = useMemo(() => new AnimationMixer(scenery), [scenery]);

  useEffect(() => {
    const clip = animations.find((animation) => animation.name === 'BOATS_CRUISE_LOOP');
    if (!clip) return undefined;
    // Bind to the displayed clone in map-local coordinates, not the cached GLB.
    const action = mixer.clipAction(clip);
    action.setLoop(LoopRepeat, Infinity).reset().play();
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => { action.paused = media.matches; };
    syncMotion();
    media.addEventListener('change', syncMotion);
    return () => {
      media.removeEventListener('change', syncMotion);
      mixer.stopAllAction();
      mixer.uncacheRoot(scenery);
    };
  }, [animations, mixer, scenery]);

  useFrame((_, delta) => {
    // Resume smoothly after a background tab instead of jumping along the route.
    mixer.update(Math.min(delta, 0.1));
  });

  return (
    <group {...props} dispose={null}>
      <primitive object={scenery} />
      {typeof children === 'function'
        ? children({ districts, landmarks })
        : null}
    </group>
  );
}

useGLTF.preload(INCHEON_IC_MAP_GLB);
