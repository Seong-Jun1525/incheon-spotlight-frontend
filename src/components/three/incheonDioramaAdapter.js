/**
 * incheonDioramaAdapter.js — 디오라마 GLB를 기존 구·군/랜드마크 계약으로 변환
 * - 구·군별 메시·중심 좌표와 해안선·나무 등 장식(SCENERY_*) 클론을 묶어 반환
 * - LM_* 노드를 랜드마크 단위로 모아 맵 로컬 좌표·표시 배율·공사현장 배율 산출
 * - 바다 배경에서 사각 보드를 제거하고 얕은 물 색·북측 여객선 항로를 보정
 */
import { Group, Quaternion, Vector3 } from 'three';
import { adjustTreeGrove, landmarkTreeClearances } from './incheonTreeScenery.js';
import {
  getGeometryBounds,
  IC_MAP_DISTRICT_ENTRIES,
  IC_MAP_HEIGHT_BOOST,
  IC_MAP_RAW_THICKNESS,
} from './incheonIcMapConfig.js';
import {
  CONSTRUCTION_NATIVE_WIDTH,
  LANDMARK_DISPLAY_SCALE,
  LANDMARK_KEY_TO_DISTRICT,
  LM_PREFIX_TO_LANDMARK_KEY,
  glbYUpToMapLocal,
  landmarkDisplayName,
  skipRaycast,
} from './landmark/landmarkGlbMap.js';

// Raise surface decorations without stretching their trees/buildings vertically.
export const DIORAMA_SURFACE_OFFSET =
  IC_MAP_RAW_THICKNESS * (IC_MAP_HEIGHT_BOOST - 1);

function meshEntry(node) {
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  // v2 meshes are nested under ROOT_<slug> and ROOT_INCHEON_DIORAMA.
  // World transforms include the same +90° X conversion as the legacy GLB.
  node.matrixWorld.decompose(position, quaternion, scale);
  return {
    name: node.name,
    geometry: node.geometry,
    material: node.material,
    position: position.toArray(),
    quaternion: quaternion.toArray(),
    scale: scale.toArray(),
  };
}

function cloneScenery(nodes, names, surfaceOffset = 0) {
  const group = new Group();
  const rootInverse = nodes.ROOT_INCHEON_DIORAMA.matrixWorld.clone().invert();
  for (const name of names) {
    const source = nodes[name];
    if (!source) throw new Error(`[IncheonDiorama] Missing scenery: ${name}`);
    const copy = source.clone(true);
    const localMatrix = rootInverse.clone().multiply(source.matrixWorld);
    localMatrix.decompose(copy.position, copy.quaternion, copy.scale);
    copy.position.z += surfaceOffset;
    copy.traverse((node) => {
      if (!node.isMesh) return;
      // Visual decorations must not intercept district or landmark clicks.
      node.raycast = skipRaycast;
      node.castShadow = false;
      node.receiveShadow = false;
    });
    group.add(copy);
  }
  return group;
}

/** Convert v2 assets to the existing district/build-site contract. */
export function createDioramaMapData(scene, nodes) {
  scene.updateMatrixWorld(true);
  if (!nodes.ROOT_INCHEON_DIORAMA) {
    throw new Error('[IncheonDiorama] Missing diorama root');
  }
  const treeClearances = landmarkTreeClearances(nodes);

  const districts = IC_MAP_DISTRICT_ENTRIES.map((entry) => {
    const node = nodes[entry.nodeName];
    if (!node?.isMesh || !node.geometry) {
      throw new Error(`[IncheonDiorama] Missing district: ${entry.nodeName}`);
    }
    const scenery = cloneScenery(
      nodes,
      [`COAST_TRIM_${entry.id}`, `SCENERY_${entry.id}`],
      DIORAMA_SURFACE_OFFSET,
    );
    adjustTreeGrove(scenery.getObjectByName(`TREE_GROVES_${entry.id}`), treeClearances);
    return {
      ...entry,
      geometry: node.geometry,
      material: node.material,
      center: getGeometryBounds(node.geometry).center,
      scenery,
    };
  });

  const landmarks = Object.entries(LM_PREFIX_TO_LANDMARK_KEY).map(
    ([prefix, landmarkKey]) => {
      const slug = prefix.slice(3);
      const root = nodes[`ROOT_${slug}`];
      if (!root) throw new Error(`[IncheonDiorama] Missing landmark: ${slug}`);
      const meshes = [];
      root.traverse((node) => {
        if (node.isMesh && node.geometry) meshes.push(meshEntry(node));
      });
      if (!meshes.length) {
        throw new Error(`[IncheonDiorama] Empty landmark: ${slug}`);
      }
      const base = root.getWorldPosition(new Vector3()).toArray();
      // Legacy pads are 2 authoring units wide. A roof/overhang in v2 must
      // not change the size of the existing construction-site animation.
      const padWidth = 2 * (root.userData.illustrativeIconScale ?? 0.055);
      return {
        prefix,
        landmarkKey,
        // Keep quest IDs even where the model's geographic host differs.
        districtId: LANDMARK_KEY_TO_DISTRICT[landmarkKey],
        displayName: landmarkDisplayName(landmarkKey),
        meshes,
        mapPosition: glbYUpToMapLocal(...base),
        baseGlbPosition: base,
        landmarkScale: LANDMARK_DISPLAY_SCALE,
        constructionScale: Math.max(0.2, (padWidth / CONSTRUCTION_NATIVE_WIDTH) * 3.4),
      };
    },
  );

  // Deliberately exclude LANDMARKS_* and ROOT_* from static scenery:
  // completed_static in the asset is authoring metadata, not earned stamps.
  const scenery = cloneScenery(nodes, ['WATER_INCHEON']);
  // The round MapOcean replaces the GLB's rectangular board. Keep its boats,
  // coastal shallows and ripples, without mutating the cached GLB materials.
  for (const name of ['SEA_SURFACE', 'SEA_BOARD_EDGE']) {
    scenery.getObjectByName(name)?.removeFromParent();
  }
  // Move the whole northern ferry route away from Yeongjong. A parent offset
  // survives the clip's position keyframes, preserving its cruise and turns.
  const northernFerry = scenery.getObjectByName('BOAT_02');
  if (northernFerry) {
    const route = new Group();
    route.name = 'BOAT_02_ROUTE_OFFSET';
    route.position.y = 0.3; // Map-local +Y is north; keep the boat at sea level.
    northernFerry.parent.add(route);
    route.add(northernFerry);
  }
  const shallows = scenery.getObjectByName('SHALLOW_COAST_0');
  if (shallows?.material) {
    shallows.material = shallows.material.clone();
    shallows.material.color.set('#b7edf0');
    shallows.material.transparent = true;
    shallows.material.opacity = 0.28;
    shallows.material.depthWrite = false;
  }
  scenery.add(cloneScenery(nodes, ['MAINLAND_PUZZLE_SEAMS'], DIORAMA_SURFACE_OFFSET));
  return { districts, landmarks, scenery };
}
