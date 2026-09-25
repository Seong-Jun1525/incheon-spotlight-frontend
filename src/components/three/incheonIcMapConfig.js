/**
 * incheonIcMapConfig.js — 디오라마 GLB 경로·노드 매핑·두께 상수
 * - `/models/incheon_diorama_v2.glb` 경로와 GLB 한글 노드명 → districtId 매핑(11개 구·군)
 * - 압출 두께(0.08)와 입체감 보정 배율(3.2), 맵 로컬 Z-up 윗면 높이 계산
 * - 구·군 지오메트리 bounding box(중심·크기) 헬퍼 제공
 */
import { Box3, Vector3 } from 'three';
import { districtLabels } from '../../data/incheonDistricts.js';

export const INCHEON_IC_MAP_GLB =
  '/models/incheon_diorama_v2.glb';

/** GLB 노드명(한글) → districtId */
export const IC_MAP_NODE_TO_ID = {
  강화군: 'ganghwa',
  검단구: 'geomdan',
  계양구: 'gyeyang',
  남동구: 'namdong',
  미추홀구: 'michuhol',
  부평구: 'bupyeong',
  서해구: 'seohae',
  연수구: 'yeonsu',
  영종구: 'yeongjong',
  옹진군: 'ongjin',
  제물포구: 'jemulpo',
};

/** GLB 구·군 압출 두께(Z) */
export const IC_MAP_RAW_THICKNESS = 0.08;

/** 두께(Z) 보정 — GLB 기본 0.08 → 입체감 */
export const IC_MAP_HEIGHT_BOOST = 3.2;

/** 맵 로컬 Z-up에서 구·군 윗면 높이 (스케일 부스트 반영) */
export function mapSurfaceLocalZ(epsilon = 0.004) {
  return IC_MAP_HEIGHT_BOOST * IC_MAP_RAW_THICKNESS + epsilon;
}

const box = new Box3();
const size = new Vector3();
const center = new Vector3();

export function getGeometryBounds(geometry) {
  box.setFromBufferAttribute(geometry.attributes.position);
  box.getCenter(center);
  box.getSize(size);
  return {
    center: [center.x, center.y, center.z],
    size: [size.x, size.y, size.z],
  };
}

export const IC_MAP_DISTRICT_ENTRIES = Object.entries(IC_MAP_NODE_TO_ID).map(
  ([nodeName, id]) => ({
    id,
    nodeName,
    label: districtLabels[id] ?? nodeName,
  }),
);
