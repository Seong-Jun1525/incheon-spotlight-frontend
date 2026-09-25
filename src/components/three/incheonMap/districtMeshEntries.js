/**
 * districtMeshEntries.js — 구·군 id·라벨 등록표
 * - 디오라마 GLB 매핑에서 id와 표시 라벨만 추려 공유(메시는 IncheonIcMap이 로드)
 * - 하이라이트 훅·폰트 글자 집합 생성 등에서 구·군 순회 목록으로 사용
 */
import { districtLabels } from '../../../data/incheonDistricts';
import { IC_MAP_DISTRICT_ENTRIES } from '../incheonIcMapConfig';

/**
 * 2026 행정구역 등록표 (incheon_diorama_v2.glb)
 * 메시는 IncheonIcMap에서 로드하고, 여기선 id·라벨만 공유합니다.
 */
export const DISTRICT_MESH_ENTRIES = IC_MAP_DISTRICT_ENTRIES.map(
  ({ id, label }) => ({
    id,
    label: label ?? districtLabels[id],
  }),
);
