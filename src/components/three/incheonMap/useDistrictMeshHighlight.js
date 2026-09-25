/**
 * useDistrictMeshHighlight.js — 구·군 메시 하이라이트 훅
 * - 선택·호버 상태에 맞춰 material의 color/emissive/opacity/roughness를 갱신
 * - GLB 공유 material을 구·군별로 한 번만 clone 해 다른 권역에 색이 번지지 않게 함
 * - 선택된 구가 있으면 나머지 권역을 옅은 색·반투명으로 낮춤
 */
import { useEffect } from 'react';
import { DISTRICT_MESH_ENTRIES } from './districtMeshEntries';
import { getDistrictColor, getDistrictEmissive } from './mapGroupUtils';

/**
 * 선택/호버 상태에 따라 구·군 메시 material 색상·투명도를 갱신합니다.
 * 기본=권역별 파스텔, 호버/선택=같은 색의 또렷한 톤.
 */
export function useDistrictMeshHighlight({
  selectedDistrict,
  hoveredDistrict,
  districtModelRefs,
}) {
  useEffect(() => {
    const hasSelection = Boolean(selectedDistrict);

    DISTRICT_MESH_ENTRIES.forEach(({ id }) => {
      const districtModelGroup = districtModelRefs.current[id];
      if (!districtModelGroup) return;

      const isSelected = selectedDistrict === id;
      const isHovered = hoveredDistrict === id && !isSelected;
      const targetColor = getDistrictColor(id, isSelected, isHovered, hasSelection);
      const emissiveColor = getDistrictEmissive(id, isSelected, isHovered);
      const emissiveIntensity = isSelected ? 0.28 : isHovered ? 0.18 : 0.1;
      const opacity = !hasSelection || isSelected ? 1 : 0.72;

      districtModelGroup.traverse((obj) => {
        if (!obj.isMesh || !obj.material) return;

        if (!obj.userData.__colorizedMaterial) {
          if (Array.isArray(obj.material)) {
            obj.material = obj.material.map((material) =>
              typeof material?.clone === 'function' ? material.clone() : material,
            );
          } else if (typeof obj.material.clone === 'function') {
            obj.material = obj.material.clone();
          }
          obj.userData.__colorizedMaterial = true;
        }

        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];

        materials.forEach((material) => {
          if (!material) return;

          // GLB 버텍스 컬러가 material.color를 가리지 않도록
          if ('vertexColors' in material) {
            material.vertexColors = false;
          }

          if (material.color?.set) {
            material.color.set(targetColor);
          }
          if (material.emissive?.set) {
            material.emissive.set(emissiveColor);
            material.emissiveIntensity = emissiveIntensity;
          }
          material.transparent = opacity < 1;
          material.opacity = opacity;
          if ('roughness' in material) {
            material.roughness = isSelected ? 0.36 : isHovered ? 0.42 : 0.48;
          }
          if ('metalness' in material) {
            material.metalness = isSelected ? 0.08 : 0.04;
          }
          material.needsUpdate = true;
        });
      });
    });
  }, [hoveredDistrict, selectedDistrict, districtModelRefs]);
}
