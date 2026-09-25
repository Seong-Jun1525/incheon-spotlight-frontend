/**
 * MapSeasonEffects.jsx — 맵 위 계절·날씨 3D 연출
 * - 벚꽃잎·비·눈은 instancedMesh 파티클로, 단풍은 `/models/fallen_leaf_3d.glb` 인스턴스로 낙하
 * - 맑은 날에는 회전하는 태양 모델(구체+광선+pointLight)을 배치
 * - 모든 메시의 raycast 를 비워 구·군 클릭을 가리지 않고, 동작 최소화 설정 시 낙하를 멈춤
 */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, Color, DoubleSide, Matrix4, Object3D, Vector3 } from 'three';
import { resolveMapSeasonTheme } from '../../../utils/mapSeasonTheme';

const LEAF_GLB = '/models/fallen_leaf_3d.glb';
const composed = new Matrix4();
const sizeHelper = new Vector3();

const dummy = new Object3D();
const RANGE_X = 22;
const RANGE_Z = 20;
const SUN_RAYS = Array.from({ length: 12 }, (_, index) => (index / 12) * Math.PI * 2);

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return reduced;
}

function makeFallers(count, speed) {
  const items = [];
  for (let index = 0; index < count; index += 1) {
    items.push({
      x: rand(-RANGE_X, RANGE_X),
      y: rand(1.2, 16),
      z: rand(-RANGE_Z, RANGE_Z),
      vx: rand(-0.55, 0.55),
      vy: -rand(speed * 0.65, speed),
      rot: rand(0, Math.PI * 2),
      spin: rand(-1.8, 1.8),
      scale: rand(0.72, 1.28),
      phase: rand(0, Math.PI * 2),
    });
  }
  return items;
}

function collectLeafParts(scene) {
  const parts = [];
  scene.updateMatrixWorld(true);
  const rootInverse = new Matrix4().copy(scene.matrixWorld).invert();
  scene.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry) return;
    const source = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    const material = source.clone();
    material.side = DoubleSide;
    material.vertexColors = true;
    material.color?.set('#ffffff');
    if ('metalness' in material) material.metalness = 0;
    if ('roughness' in material) material.roughness = 0.62;
    parts.push({
      geometry: obj.geometry,
      material,
      local: new Matrix4().copy(obj.matrixWorld).premultiply(rootInverse),
    });
  });
  const box = new Box3().setFromObject(scene);
  box.getSize(sizeHelper);
  const longest = Math.max(sizeHelper.x, sizeHelper.y, sizeHelper.z, 0.001);
  return { parts, baseScale: 0.92 / longest };
}

function FallingLeaves({ count, speed, reduced }) {
  const { scene } = useGLTF(LEAF_GLB);
  const meshRefs = useRef([]);
  const items = useMemo(() => {
    const list = [];
    for (let index = 0; index < count; index += 1) {
      list.push({
        x: rand(-12, 12),
        y: rand(2.2, 13),
        z: rand(-11, 11),
        vx: rand(-0.28, 0.28),
        vy: -rand(speed * 0.55, speed * 0.85),
        rot: rand(0, Math.PI * 2),
        spin: rand(-0.55, 0.55),
        scale: rand(0.9, 1.08),
        phase: rand(0, Math.PI * 2),
      });
    }
    return list;
  }, [count, speed]);
  const { parts, baseScale } = useMemo(
    () => collectLeafParts(scene),
    [scene],
  );

  useFrame(({ clock }, delta) => {
    const step = reduced ? 0 : Math.min(delta, 0.05);
    const time = clock.elapsedTime;

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (step > 0) {
        item.y += item.vy * step;
        item.x += item.vx * step + Math.sin(time * 0.55 + item.phase) * 0.22 * step;
        item.rot += item.spin * step;
        if (item.y < -1.4) {
          item.y = 13;
          item.x = rand(-12, 12);
          item.z = rand(-11, 11);
        }
      }
      dummy.position.set(item.x, item.y, item.z);
      dummy.rotation.set(item.rot * 0.35, item.rot, item.rot * 0.22);
      const scale = baseScale * item.scale;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
        const field = meshRefs.current[partIndex];
        if (!field) continue;
        composed.multiplyMatrices(dummy.matrix, parts[partIndex].local);
        field.setMatrixAt(index, composed);
      }
    }

    for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
      const field = meshRefs.current[partIndex];
      if (field) field.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {parts.map((part, partIndex) => (
        <instancedMesh
          key={part.geometry.uuid}
          ref={(node) => {
            meshRefs.current[partIndex] = node;
          }}
          args={[part.geometry, part.material, count]}
          frustumCulled={false}
          raycast={() => {}}
        />
      ))}
    </group>
  );
}

function ParticleGeometry({ kind }) {
  if (kind === 'snow') return <sphereGeometry args={[0.5, 10, 10]} />;
  if (kind === 'rain') return <boxGeometry args={[1, 1, 1]} />;
  if (kind === 'petal') return <circleGeometry args={[0.5, 12]} />;
  return <planeGeometry args={[1, 1]} />;
}

function FallingField({
  count,
  color,
  speed,
  width,
  height,
  opacity,
  reduced,
  kind = 'leaf',
}) {
  const mesh = useRef(null);
  const items = useMemo(
    () => makeFallers(count, speed),
    [count, speed],
  );
  const depth = kind === 'snow' || kind === 'rain' ? width : 1;

  useFrame(({ clock }, delta) => {
    const field = mesh.current;
    if (!field) return;
    const step = reduced ? 0 : Math.min(delta, 0.05);
    const time = clock.elapsedTime;

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (step > 0) {
        item.y += item.vy * step;
        if (kind === 'rain') {
          item.x += item.vx * 0.12 * step;
        } else if (kind === 'snow') {
          item.x += item.vx * step + Math.sin(time * 0.9 + item.phase) * 0.55 * step;
          item.rot += item.spin * 0.35 * step;
        } else {
          item.x += item.vx * step + Math.sin(time * 0.7 + item.phase) * 0.55 * step;
          item.rot += item.spin * step;
        }
        if (item.y < -1.4) {
          item.y = 16;
          item.x = rand(-RANGE_X, RANGE_X);
          item.z = rand(-RANGE_Z, RANGE_Z);
        }
      }
      dummy.position.set(item.x, item.y, item.z);
      if (kind === 'rain') {
        dummy.rotation.set(0.22, 0, 0.08);
      } else {
        dummy.rotation.set(item.rot, item.rot * 0.45, item.rot * 0.8);
      }
      dummy.scale.set(width * item.scale, height * item.scale, depth * item.scale);
      dummy.updateMatrix();
      field.setMatrixAt(index, dummy.matrix);
    }
    field.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, count]}
      frustumCulled={false}
      raycast={() => {}}
    >
      <ParticleGeometry kind={kind} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={DoubleSide}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

function SunModel({ reduced }) {
  const group = useRef(null);
  const glow = useMemo(() => new Color('#ffe08a'), []);

  useFrame((_, delta) => {
    if (!group.current || reduced) return;
    group.current.rotation.z += delta * 0.18;
    group.current.rotation.y += delta * 0.06;
  });

  return (
    <group position={[12.4, 12.2, -10.5]}>
      <pointLight color='#fff16e' intensity={1.15} distance={48} />
      <group ref={group}>
        <mesh raycast={() => {}}>
          <sphereGeometry args={[1.28, 32, 32]} />
          <meshStandardMaterial
            color='#fff16e'
            emissive={glow}
            emissiveIntensity={1.35}
            roughness={0.28}
            metalness={0.08}
          />
        </mesh>
        {SUN_RAYS.map((angle) => (
          <mesh
            key={angle}
            rotation={[0, 0, angle]}
            position={[Math.cos(angle) * 1.92, Math.sin(angle) * 1.92, 0]}
            raycast={() => {}}
          >
            <boxGeometry args={[0.22, 0.9, 0.14]} />
            <meshStandardMaterial
              color='#ffd45c'
              emissive='#f8c44c'
              emissiveIntensity={0.85}
              roughness={0.4}
            />
          </mesh>
        ))}
        <mesh raycast={() => {}}>
          <sphereGeometry args={[1.82, 24, 24]} />
          <meshBasicMaterial
            color='#ffe9a8'
            transparent
            opacity={0.26}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} raycast={() => {}}>
          <torusGeometry args={[2.15, 0.05, 8, 48]} />
          <meshBasicMaterial color='#f8c44c' transparent opacity={0.55} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * 맵 위 계절·날씨 3D 연출. 구 클릭 raycast를 가리지 않습니다.
 */
export function MapSeasonEffects({ seasonMonth = null, weatherLabel = '' }) {
  const reduced = usePrefersReducedMotion();
  const theme = useMemo(
    () => resolveMapSeasonTheme(seasonMonth, weatherLabel),
    [seasonMonth, weatherLabel],
  );

  if (!theme.sun && !theme.petals && !theme.leaves && !theme.rain && !theme.snow) {
    return null;
  }

  return (
    <group>
      {theme.sun ? <SunModel reduced={reduced} /> : null}
      {theme.petals ? (
        <FallingField
          count={88}
          color='#f4b6c8'
          speed={1.15}
          width={0.28}
          height={0.18}
          opacity={0.86}
          reduced={reduced}
          kind='petal'
        />
      ) : null}
      {theme.leaves ? (
        <Suspense fallback={null}>
          <FallingLeaves
            count={22}
            speed={0.72}
            reduced={reduced}
          />
        </Suspense>
      ) : null}
      {theme.rain ? (
        <FallingField
          count={210}
          color='#8eb6d9'
          speed={9.5}
          width={0.03}
          height={0.55}
          opacity={0.42}
          reduced={reduced}
          kind='rain'
        />
      ) : null}
      {theme.snow ? (
        <FallingField
          count={130}
          color='#f4f8fc'
          speed={1.35}
          width={0.16}
          height={0.16}
          opacity={0.92}
          reduced={reduced}
          kind='snow'
        />
      ) : null}
    </group>
  );
}

useGLTF.preload(LEAF_GLB);
