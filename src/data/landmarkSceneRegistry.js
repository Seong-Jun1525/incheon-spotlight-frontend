/**
 * landmarkSceneRegistry.js — 3D 맵 큐레이션 랜드마크 레지스트리 (API 미연동 시 폴백 데이터)
 * - contentId별 3D 표현 방식(GLB 모델 / 구체 핀)과 핀 위치 오프셋 정의
 * - 구·군별 3D 표시 우선순위와 레지스트리 조회 함수 제공
 */

import { landmarkPinOffsets } from './mockLandmarks';

/**
 * 3D 맵에 표시할 큐레이션 랜드마크 레지스트리 (오프라인 폴백).
 *
 * 운영 환경에서는 TC_CURATED_LANDMARK DB + /api/curated-landmarks API를 사용합니다.
 * API/DB 미연동 시에만 이 레지스트리가 3D 씬 구성에 사용됩니다.
 *
 * - contentId: TourAPI 매칭 키
 * - landmarkKey: 내부 고정 id (lm-*), 3D·상태 연결용
 * - renderType: 'model' (GLB) | 'pin' (구체 핀)
 */
export const LANDMARK_SCENE_REGISTRY = {
  '2752976': {
    landmarkKey: 'lm-wolmido',
    districtId: 'jemulpo',
    renderType: 'pin',
    pinOffset: landmarkPinOffsets['lm-wolmido'],
  },
  '2752978': {
    landmarkKey: 'lm-chinatown',
    districtId: 'jemulpo',
    renderType: 'pin',
    pinOffset: landmarkPinOffsets['lm-chinatown'],
  },
  '2752975': {
    landmarkKey: 'lm-openport',
    districtId: 'jemulpo',
    renderType: 'pin',
    pinOffset: landmarkPinOffsets['lm-openport'],
  },
  '2752974': {
    landmarkKey: 'lm-songdo-park',
    districtId: 'yeonsu',
    renderType: 'pin',
    pinOffset: landmarkPinOffsets['lm-songdo-park'],
  },
  '126510': {
    landmarkKey: 'lm-tribowl',
    districtId: 'yeonsu',
    renderType: 'pin',
    pinOffset: landmarkPinOffsets['lm-tribowl'],
  },
  '250571': {
    landmarkKey: 'lm-gtower',
    districtId: 'yeonsu',
    renderType: 'pin',
    pinOffset: landmarkPinOffsets['lm-gtower'],
  },
  '125419': {
    landmarkKey: 'lm-jeondeungsa',
    districtId: 'ganghwa',
    renderType: 'model',
  },
  '125418': {
    landmarkKey: 'lm-goryeo',
    districtId: 'ganghwa',
    renderType: 'model',
  },
  '125420': {
    landmarkKey: 'lm-manisan',
    districtId: 'ganghwa',
    renderType: 'model',
  },
  '127014': {
    landmarkKey: 'lm-sorae-wetland',
    districtId: 'namdong',
    renderType: 'pin',
    pinOffset: landmarkPinOffsets['lm-sorae-wetland'],
  },
  '127015': {
    landmarkKey: 'lm-sorae-port',
    districtId: 'namdong',
    renderType: 'pin',
    pinOffset: landmarkPinOffsets['lm-sorae-port'],
  },
  '127013': {
    landmarkKey: 'lm-grand-park',
    districtId: 'namdong',
    renderType: 'pin',
    pinOffset: landmarkPinOffsets['lm-grand-park'],
  },
};

/** 구·군별 3D 표시 우선순위 (레지스트리 등록 순) */
const DISTRICT_SCENE_ORDER = {
  jemulpo: ['2752976', '2752978', '2752975'],
  yeonsu: ['2752974', '126510', '250571'],
  ganghwa: ['125419', '125418', '125420'],
  namdong: ['127014', '127015', '127013'],
};

export function getSceneRegistryEntry(contentId) {
  if (!contentId) return null;
  return LANDMARK_SCENE_REGISTRY[String(contentId)] ?? null;
}

export function isSceneLandmark(place) {
  const contentId = place?.contentId ?? place?.contentid;
  return Boolean(getSceneRegistryEntry(contentId));
}

export function getSceneContentIdsForDistrict(districtId) {
  return DISTRICT_SCENE_ORDER[districtId] ?? [];
}
