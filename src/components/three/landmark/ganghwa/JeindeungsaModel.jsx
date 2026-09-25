/**
 * JeindeungsaModel.jsx — 전등사 상징 모델
 * - `/models/jeondeungsa_landmark_symbolic.glb` 를 로드해 Clone 으로 배치
 * - 여러 곳에 재사용할 수 있도록 preload 하고 props 로 스케일을 받음
 */
import { Clone, useGLTF } from '@react-three/drei';

export function JeindeungsaModel(props) {
  const { scene } = useGLTF('/models/jeondeungsa_landmark_symbolic.glb');

  return (
    <Clone
      object={scene}
      {...props}
    />
  );
}

useGLTF.preload('/models/jeondeungsa_landmark_symbolic.glb');
