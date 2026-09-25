/**
 * DistrictCameraSync.jsx — 구·군 선택에 따른 카메라 추적
 * - OrbitControls 타깃을 선택한 구 중심으로, 선택 해제 시 기본 위치로 lerp 이동
 * - ortho zoom 을 구·군 포커스 값과 기본값 사이에서 보간하고 도달하면 사용자 조작에 넘김
 * - 스탬프 건설 연출 중에는 LandmarkCameraFocus 에 양보하고 개입하지 않음
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useStampRevealStore } from '../../../stores/useStampRevealStore';
import {
  CAM_LERP_EPS_SQ,
  DISTRICT_FOCUS_ZOOM,
  MAP_CAMERA,
} from './mapGroupConfig';

/** 구·군 선택 시 OrbitControls 타깃·줌을 해당 구역으로 부드럽게 이동 */
export function DistrictCameraSync({ selectedDistrict, districtRefs, restTarget }) {
  const controls = useThree((s) => s.controls);
  const camera = useThree((s) => s.camera);
  const desired = useRef(new Vector3());
  const revealing = useStampRevealStore((state) => Boolean(state.reveal?.landmarkKey));
  const zoomProgrammatic = useRef(true);

  useEffect(() => {
    zoomProgrammatic.current = true;
  }, [selectedDistrict, revealing]);

  useFrame(() => {
    if (!controls?.target || revealing) return;

    const node = selectedDistrict ? districtRefs.current[selectedDistrict] : null;

    if (node) {
      desired.current.set(0, 0, 0);
      node.localToWorld(desired.current);
      if (controls.target.distanceToSquared(desired.current) > CAM_LERP_EPS_SQ) {
        controls.target.lerp(desired.current, 0.1);
        controls.update();
      }
    } else if (controls.target.distanceToSquared(restTarget) > CAM_LERP_EPS_SQ) {
      controls.target.lerp(restTarget, 0.08);
      controls.update();
    }

    if (!camera || !zoomProgrammatic.current) return;
    const desiredZoom = selectedDistrict ? DISTRICT_FOCUS_ZOOM : MAP_CAMERA.zoom;
    const diff = desiredZoom - camera.zoom;
    if (Math.abs(diff) > 0.2) {
      camera.zoom += diff * 0.1;
      camera.updateProjectionMatrix();
    } else {
      camera.zoom = desiredZoom;
      camera.updateProjectionMatrix();
      zoomProgrammatic.current = false;
    }
  });

  return null;
}
