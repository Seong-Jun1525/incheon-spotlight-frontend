/**
 * mapGroupConfig.js — 통합 맵 그룹의 배치·카메라·줌 상수
 * - 맵 그룹 위치·회전(X=-π/2 로 Z-up → Y-up)·스케일 7.6
 * - ortho 카메라 기본/최소/최대 줌, 구·군 포커스 줌, 랜드마크 건설 연출 줌
 * - 구·군명 3D 라벨용 woff 폰트 경로와 강화 랜드마크 회전값
 */
import { Vector3 } from 'three';

/**
 * incheon_diorama_v2.glb (기존 맵 로컬 좌표로 어댑트)
 * 구·군: XY 평면(Z=두께) → 그룹에서 X=-π/2 로 Y-up 변환.
 * 랜드마크: GLB Y-up 노드를 맵 로컬로 맞춰 같은 그룹에 배치.
 */
export const MAP_CONFIG = {
  position: [0, 0.05, 0],
  /** XY(Z-up 두께) → XZ(Y-up). +Y(북) → -Z */
  rotation: [-Math.PI / 2, 0, 0],
  /** raw span ≈6. 카메라 zoom 은 이 스케일에 맞춰 전체 인천이 들어오게 둔다. */
  scale: 7.6,
};

/** @deprecated 통합 GLB는 간격 배율 불필요 */
export const DISTRICT_GAP = 1;

export const DISTRICT_BASE_SCALE = 1;

/** 이 줌 이상이면 공사현장 상세 GLB가 표시된다. 일반 지도 조작은 이 값 직전에서 멈춘다. */
export const SITE_DETAIL_ZOOM = 34;

/** 휠·툴바로 조작할 수 있는 일반 확대 상한 */
export const MAP_INTERACTIVE_MAX_ZOOM = SITE_DETAIL_ZOOM - 1;

/**
 * Ortho zoom. 반지름 4의 원형 바다 외곽까지 기본 화면에 담는다.
 */
export const MAP_CAMERA = {
  position: [-0.5, 17.5, 18.5],
  zoom: 17,
  minZoom: 9,
  maxZoom: MAP_INTERACTIVE_MAX_ZOOM,
  target: [0, 0, 0],
};

/** 구·군 선택 시 해당 권역이 읽히도록 살짝 당겨 본다 */
export const DISTRICT_FOCUS_ZOOM = 28;

/** 스탬프 후 해당 랜드마크 건설 연출용 ortho zoom */
export const LANDMARK_FOCUS_ZOOM = 40;

export const MAP_CAMERA_REST = new Vector3(
  MAP_CAMERA.target[0],
  MAP_CAMERA.target[1],
  MAP_CAMERA.target[2],
);

export const CAM_LERP_EPS_SQ = 1e-5;

/** 강화 랜드마크 — 통합 맵 로컬(+Z = 화면 위쪽 두께 방향, 회전 전) */
export const GANGHWA_MESH_ROTATION = [0, 0, 0];

/** troika-three-text는 woff2를 지원하지 않아 한글·라틴 서브셋 woff를 씁니다. */
export const DISTRICT_NAME_FONT = '/fonts/D2CodingBold-map.woff';

export { DISTRICT_COLORS } from '../mapVisualConstants';

/** @deprecated 통합 GLB — 개별 transform 미사용 */
export const DISTRICT_TRANSFORMS = {};
