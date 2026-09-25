/**
 * mapGroupUtils.js — 구·군 표시명·상태별 색상 계산 유틸
 * - 표시명 해석 순서: 짧은 구명 상수 → 라벨 데이터 → id
 * - 선택/호버/비활성 상태에 맞는 fill·emissive 색을 권역 파스텔에서 고름
 * - troika SDF 폰트에 넣을 한글 글자 집합(TROIKA_CHAR_SET) 생성
 */
import { DISTRICT_DISPLAY_NAME, getDistrictPalette } from '../mapVisualConstants';
import { DISTRICT_MESH_ENTRIES } from './districtMeshEntries';
import { districtLabels } from '../../../data/incheonDistricts';

/** 구·군 표시명 (상수 → 라벨 → id 순) */
export function labelText(id) {
  return DISTRICT_DISPLAY_NAME[id] ?? districtLabels[id] ?? id;
}

/**
 * 선택/호버/비활성 상태에 따른 구·군 메시 색상.
 * 각 권역은 고유 파스텔을 유지하고, 선택 시 나머지 구역만 옅게 합니다.
 */
export function getDistrictColor(id, isSelected, isHovered, hasSelection = false) {
  const palette = getDistrictPalette(id);
  if (isSelected) return palette.selected;
  if (isHovered) return palette.hover;
  if (hasSelection) return palette.inactive;
  return palette.fill;
}

/** 메시 emissive — 같은 권역 파스텔의 측면 톤 */
export function getDistrictEmissive(id, isSelected, isHovered) {
  const palette = getDistrictPalette(id);
  if (isSelected) return palette.selected;
  if (isHovered) return palette.hover;
  return palette.side;
}

/** troika SDF 폰트에 포함할 한글 글자 집합 */
export const TROIKA_CHAR_SET = [
  ...new Set(DISTRICT_MESH_ENTRIES.map(({ id }) => labelText(id)).join('')),
].join('');
