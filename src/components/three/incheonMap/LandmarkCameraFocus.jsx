/**
 * LandmarkCameraFocus.jsx — 스탬프 건설 연출 전 랜드마크 클로즈업
 * - 씬에서 `landmark-site-<key>`(없으면 `district-<id>`) 노드를 찾아 타깃을 옮기고 줌을 올림
 * - 위치·줌이 충분히 수렴하거나 시간이 초과되면 cameraSettled 를 올려 건설 클립을 시작시킴
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useStampRevealStore } from '../../../stores/useStampRevealStore';
import { LANDMARK_FOCUS_ZOOM } from './mapGroupConfig';

/**
 * 스탬프 건설 연출 전, 해당 랜드마크(없으면 구·군) 월드 좌표로 타깃을 옮기고 ortho zoom 을 올린다.
 * 정착되면 cameraSettled 를 올려 LandmarkBuildLayer 가 건설 클립을 시작한다.
 */
export function LandmarkCameraFocus() {
  const reveal = useStampRevealStore((state) => state.reveal);
  const cameraSettled = useStampRevealStore((state) => state.cameraSettled);
  const markCameraSettled = useStampRevealStore((state) => state.markCameraSettled);
  const controls = useThree((state) => state.controls);
  const desired = useRef(new Vector3());
  const elapsed = useRef(0);

  useEffect(() => {
    elapsed.current = 0;
  }, [reveal?.landmarkKey]);

  useFrame((state, delta) => {
    if (!reveal?.landmarkKey) return;

    const { camera, scene } = state;
    if (!camera) return;

    elapsed.current += delta;

    const site = scene.getObjectByName(`landmark-site-${reveal.landmarkKey}`);
    const district = reveal.regionId
      ? scene.getObjectByName(`district-${reveal.regionId}`)
      : null;
    const focus = site || district;
    if (!focus) {
      if (!cameraSettled && elapsed.current > 3.2) {
        markCameraSettled();
      }
      return;
    }

    focus.getWorldPosition(desired.current);
    if (site) desired.current.y += 0.06;

    const orbit = controls ?? state.controls;
    if (orbit?.target) {
      const distSq = orbit.target.distanceToSquared(desired.current);
      if (distSq > 1e-5) {
        orbit.target.lerp(desired.current, 0.14);
      }
      orbit.update?.();
    }

    const zoomDiff = Math.abs(camera.zoom - LANDMARK_FOCUS_ZOOM);
    if (zoomDiff > 0.12) {
      camera.zoom += (LANDMARK_FOCUS_ZOOM - camera.zoom) * 0.12;
      camera.updateProjectionMatrix();
    }

    const distSq = orbit?.target
      ? orbit.target.distanceToSquared(desired.current)
      : 0;
    const ready = site
      ? distSq < 0.04 && zoomDiff < 0.8
      : distSq < 0.1 && zoomDiff < 1.4;
    if (!cameraSettled && (ready || elapsed.current > 2.6)) {
      markCameraSettled();
    }
  });

  return null;
}
