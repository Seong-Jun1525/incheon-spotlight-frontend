/**
 * incheonTreeScenery.js — 디오라마 나무 군락(TREE_GROVES_*) 후처리
 * - 정점 버퍼를 연결 요소로 나눠 나무 한 그루(줄기+수관 2개) 단위를 식별
 * - 랜드마크 footprint와 겹치는 나무를 우선 솎아내고(15%) 여유 있는 나무는 확대
 * - 원본 GLB는 건드리지 않고 클론된 장식 지오메트리만 수정
 */
import { Box3, Vector3 } from 'three';
import { LANDMARK_DISPLAY_SCALE, LM_PREFIX_TO_LANDMARK_KEY } from './landmark/landmarkGlbMap.js';

export const TREE_REMOVAL_RATIO = 0.15;
export const TREE_DISPLAY_SCALE = 1.1;
export const TREE_LANDMARK_CLEARANCE = 0.035;

/** Completed landmark footprints, including the app's display enlargement. */
export function landmarkTreeClearances(nodes) {
  const mapInverse = nodes.ROOT_INCHEON_DIORAMA.matrixWorld.clone().invert();
  return Object.keys(LM_PREFIX_TO_LANDMARK_KEY).map((prefix) => {
    const root = nodes[`ROOT_${prefix.slice(3)}`];
    const anchor = root.getWorldPosition(new Vector3()).applyMatrix4(mapInverse);
    const bounds = new Box3().setFromObject(root, true).applyMatrix4(mapInverse);
    bounds.min.sub(anchor).multiplyScalar(LANDMARK_DISPLAY_SCALE).add(anchor);
    bounds.max.sub(anchor).multiplyScalar(LANDMARK_DISPLAY_SCALE).add(anchor);
    return bounds;
  });
}

/** v2 groves merge trunks and crowns into material meshes sharing one position buffer. */
export function analyzeTreeGrove(grove) {
  const meshes = [];
  grove.traverse((node) => { if (node.isMesh) meshes.push(node); });
  const positions = meshes[0]?.geometry.attributes.position;
  if (!positions || meshes.some((mesh) => (
    mesh.geometry.attributes.position !== positions || !mesh.geometry.index
  ))) throw new Error(`[IncheonTrees] Unsupported grove: ${grove.name}`);

  const parents = Int32Array.from({ length: positions.count }, (_, index) => index);
  const used = new Set();
  const find = (index) => {
    while (parents[index] !== index) {
      parents[index] = parents[parents[index]];
      index = parents[index];
    }
    return index;
  };
  for (const mesh of meshes) {
    const indices = mesh.geometry.index.array;
    for (let i = 0; i < indices.length; i += 3) {
      const [a, b, c] = indices.subarray(i, i + 3);
      parents[find(b)] = find(a);
      parents[find(c)] = find(a);
      used.add(a); used.add(b); used.add(c);
    }
  }

  const parts = new Map();
  const point = new Vector3();
  for (const index of used) {
    const root = find(index);
    if (!parts.has(root)) parts.set(root, { vertices: [], bounds: new Box3() });
    const part = parts.get(root);
    part.vertices.push(index);
    part.bounds.expandByPoint(point.fromBufferAttribute(positions, index));
  }
  const ground = Math.min(...Array.from(parts.values(), (part) => part.bounds.min.z));
  const trees = Array.from(parts.values())
    .filter((part) => Math.abs(part.bounds.min.z - ground) < 0.00001)
    .map((part) => ({
      anchor: new Vector3(
        (part.bounds.min.x + part.bounds.max.x) / 2,
        (part.bounds.min.y + part.bounds.max.y) / 2,
        part.bounds.min.z,
      ),
      vertices: [],
      parts: 0,
      radius: 0,
    }));

  for (const part of parts.values()) {
    const center = part.bounds.getCenter(new Vector3());
    const distance = (tree) => Math.hypot(center.x - tree.anchor.x, center.y - tree.anchor.y);
    const tree = trees.reduce((nearest, candidate) => distance(candidate) < distance(nearest) ? candidate : nearest);
    tree.vertices.push(...part.vertices);
    tree.parts++;
    for (const index of part.vertices) {
      tree.radius = Math.max(tree.radius, Math.hypot(
        positions.getX(index) - tree.anchor.x, positions.getY(index) - tree.anchor.y,
      ));
    }
  }
  // Every supplied tree consists of one trunk and two crown sections.
  if (trees.length !== grove.userData.treeCount || trees.some((tree) => tree.parts !== 3)) {
    throw new Error(`[IncheonTrees] Incomplete trees: ${grove.name}`);
  }
  return { meshes, positions, trees };
}

function clearanceAt(anchor, bounds) {
  return Math.min(...bounds.map((box) => Math.hypot(
    Math.max(box.min.x - anchor.x, 0, anchor.x - box.max.x),
    Math.max(box.min.y - anchor.y, 0, anchor.y - box.max.y),
  )));
}

function placementRank(anchor) {
  // Deterministic spatial thinning: remounting/hovering never moves the trees.
  const hash = Math.sin(anchor.x * 127.1 + anchor.y * 311.7) * 43758.5453;
  return hash - Math.floor(hash);
}

/** Modify only a cloned decorative grove; landmark geometry and source GLB stay intact. */
export function adjustTreeGrove(grove, landmarkBounds) {
  const { meshes, positions, trees } = analyzeTreeGrove(grove);
  const removalCount = Math.min(trees.length - 1, Math.round(trees.length * TREE_REMOVAL_RATIO));
  for (const tree of trees) {
    tree.clearance = clearanceAt(tree.anchor, landmarkBounds)
      - tree.radius * TREE_DISPLAY_SCALE - TREE_LANDMARK_CLEARANCE;
    tree.scale = tree.clearance > 0 ? TREE_DISPLAY_SCALE : 1;
  }
  const ranked = [...trees].sort((left, right) => {
    const leftNear = left.clearance <= 0;
    const rightNear = right.clearance <= 0;
    if (leftNear !== rightNear) return leftNear ? -1 : 1;
    if (leftNear) return left.clearance - right.clearance;
    return placementRank(left.anchor) - placementRank(right.anchor);
  });
  const removed = new Set(ranked.slice(0, removalCount));
  const keptVertices = new Set();
  const enlargedPositions = positions.clone();
  for (const tree of trees) {
    if (removed.has(tree)) continue;
    for (const index of tree.vertices) {
      keptVertices.add(index);
      enlargedPositions.setXYZ(index,
        tree.anchor.x + (positions.getX(index) - tree.anchor.x) * tree.scale,
        tree.anchor.y + (positions.getY(index) - tree.anchor.y) * tree.scale,
        tree.anchor.z + (positions.getZ(index) - tree.anchor.z) * tree.scale,
      );
    }
  }
  for (const mesh of meshes) {
    const geometry = mesh.geometry.clone();
    geometry.setAttribute('position', enlargedPositions);
    // Complete connected parts are removed together, never individual branches.
    geometry.setIndex(Array.from(geometry.index.array).filter((index) => keptVertices.has(index)));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    mesh.geometry = geometry;
  }
  grove.userData.sourceTreeCount = trees.length;
  grove.userData.treeCount = trees.length - removalCount;
  grove.userData.enlargedTreeCount = trees.filter((tree) => !removed.has(tree) && tree.scale > 1).length;
}
