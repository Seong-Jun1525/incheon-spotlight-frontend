/**
 * DolmenModel.jsx — 강화 고인돌 상징 모델
 * - `/models/ganghwa_dolmen_symbolic.glb` 를 로드해 Clone 으로 배치
 * - 부근리·오상리 등 여러 고인돌 지점에서 스케일만 달리해 재사용
 */
import { Clone, useGLTF } from '@react-three/drei';

export function DolmenModel(props) {
  const { scene } = useGLTF('/models/ganghwa_dolmen_symbolic.glb');

  return (
    <Clone
      object={scene}
      {...props}
    />
  );
}

useGLTF.preload('/models/ganghwa_dolmen_symbolic.glb');
