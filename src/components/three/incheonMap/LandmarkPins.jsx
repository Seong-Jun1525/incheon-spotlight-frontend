/**
 * LandmarkPins.jsx — 일반 구·군용 3D 명소 핀
 * - 골드 구체 메시 + 빌보드 명소명, 코스 모드에서는 순번 배지 핀으로 전환
 * - 핀이 순차적으로 튀어오르는 등장 애니메이션(동작 최소화 시 즉시 표시)
 * - 클릭·호버로 명소 선택을 전달하고 선택 시 색·크기를 강조
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import { isLandmarkSelected } from '../../../utils/landmarkExplore';
import { translatePlaceName } from '../../../i18n/placeLabel';
import { DISTRICT_NAME_FONT } from './mapGroupConfig';
import { MAP_COLORS } from '../mapVisualConstants';

/**
 * 일반 구·군용 3D 랜드마크 핀.
 * - 기본: 골드 구체 + 명소명
 * - 코스 모드(order): 숫자 배지 + 명소명 (패널 순서와 동기화)
 */
export function LandmarkPins({ pins, onPick, selectedLandmarkId = null }) {
  const { t } = useTranslation();
  const pinRefs = useRef([]);
  const animationKey = pins?.map(({ place }) => place.id).join('|') ?? '';
  const prevAnimationKey = useRef('');
  const animationStart = useRef(null);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useFrame(({ clock }) => {
    if (prevAnimationKey.current !== animationKey) {
      prevAnimationKey.current = animationKey;
      animationStart.current = clock.elapsedTime;
    }

    const startedAt = animationStart.current ?? clock.elapsedTime;
    const elapsed = clock.elapsedTime - startedAt;

    pinRefs.current.forEach((pin, index) => {
      if (!pin) return;

      if (prefersReducedMotion) {
        pin.visible = true;
        pin.scale.setScalar(1);
        pin.position.y = pin.userData.baseY ?? 0;
        return;
      }

      const localProgress = Math.min(
        Math.max((elapsed - index * 0.1) / 0.28, 0),
        1,
      );
      const eased = 1 - Math.pow(1 - localProgress, 3);
      const baseY = pin.userData.baseY ?? 0;
      pin.visible = localProgress > 0;
      pin.scale.setScalar(0.85 + eased * 0.15);
      pin.position.y = baseY - (1 - eased) * 0.18;
    });
  });

  if (!pins?.length) return null;

  return (
    <>
      {pins.map(({ place, offset, order: pinOrder }, index) => {
        const selected = isLandmarkSelected(place, selectedLandmarkId);
        const order = pinOrder ?? place.order;
        const isCoursePin = order != null && order !== '';
        const label = translatePlaceName(t, place, place.title || place.name || '');
        const [ox, oy, oz] = offset;

        return (
          <group
            key={`${place.id}-${order ?? 'pin'}`}
            ref={(node) => {
              pinRefs.current[index] = node;
              if (node) node.userData.baseY = oy;
            }}
            position={[ox, oy, oz]}
          >
            {isCoursePin ? (
              <CourseOrderMarker
                order={order}
                label={label}
                selected={selected}
                place={place}
                onPick={onPick}
              />
            ) : (
              <DefaultPinMarker
                label={label}
                selected={selected}
                place={place}
                onPick={onPick}
              />
            )}
          </group>
        );
      })}
    </>
  );
}

function DefaultPinMarker({ label, selected, place, onPick }) {
  return (
    <>
      <mesh
        userData={{ placeId: place.id }}
        onClick={(e) => {
          e.stopPropagation();
          onPick?.(place);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = '';
        }}
      >
              <sphereGeometry args={[selected ? 0.18 : 0.15, 14, 14]} />
              <meshStandardMaterial
                color={selected ? MAP_COLORS.landmarkActive : MAP_COLORS.landmark}
                emissive={selected ? MAP_COLORS.landmarkActive : MAP_COLORS.landmark}
                emissiveIntensity={selected ? 0.35 : 0.26}
                roughness={0.45}
                metalness={0.14}
              />
            </mesh>
            <Billboard follow position={[0, selected ? 0.48 : 0.42, 0]}>
              <Text
                font={DISTRICT_NAME_FONT}
                fontSize={selected ? 0.14 : 0.12}
                anchorX='center'
                anchorY='middle'
                color='#FFFFFF'
                outlineWidth={0.028}
                outlineColor='#25333A'
                maxWidth={1.8}
                textAlign='center'
              >
                {label}
              </Text>
            </Billboard>
    </>
  );
}

/** 코스 정류장 번호 핀 — CourseStopsPanel.order 와 동일 숫자 */
function CourseOrderMarker({ order, label, selected, place, onPick }) {
  const radius = selected ? 0.16 : 0.14;

  return (
    <>
      <mesh
        userData={{ placeId: place.id, order }}
        onClick={(e) => {
          e.stopPropagation();
          onPick?.(place);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = '';
        }}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color={selected ? MAP_COLORS.landmarkActive : MAP_COLORS.landmark}
          emissive={selected ? MAP_COLORS.landmarkActive : MAP_COLORS.landmark}
          emissiveIntensity={selected ? 0.4 : 0.28}
          roughness={0.42}
          metalness={0.18}
        />
      </mesh>
      <Billboard follow position={[0, 0.02, 0.01]}>
        <Text
          font={DISTRICT_NAME_FONT}
          fontSize={selected ? 0.16 : 0.14}
          anchorX='center'
          anchorY='middle'
          color='#FFFFFF'
          outlineWidth={0.018}
          outlineColor='#1a2429'
          textAlign='center'
        >
          {String(order)}
        </Text>
      </Billboard>
      <Billboard follow position={[0, selected ? 0.42 : 0.38, 0]}>
        <Text
          font={DISTRICT_NAME_FONT}
          fontSize={selected ? 0.11 : 0.095}
          anchorX='center'
          anchorY='middle'
          color='#FFFFFF'
          outlineWidth={0.022}
          outlineColor='#25333A'
          maxWidth={1.6}
          textAlign='center'
        >
          {label}
        </Text>
      </Billboard>
    </>
  );
}
