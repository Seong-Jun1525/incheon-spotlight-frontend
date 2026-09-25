/**
 * GanghwaLandmarkModels.jsx — 강화군 전용 랜드마크 GLB 모델 그룹
 * - ganghwaLandmarkConfig의 배치값대로 전등사·고인돌·마니산 모델을 놓음
 * - 모델 아래 노란 원형 마커와 빌보드 명소명 라벨을 함께 렌더
 * - 그룹 전체가 0에서 튀어오르는 등장 애니메이션을 담당
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import { GANGHWA_LANDMARK_MODELS } from './ganghwaLandmarkConfig';
import { translateLandmarkKey, translatePlaceName } from '../../../i18n/placeLabel';
import { DISTRICT_NAME_FONT, GANGHWA_MESH_ROTATION } from './mapGroupConfig';

/** 강화군 전용 3D 랜드마크 GLB 모델 그룹 (전등사·고인돌·마니산). renderType=model 인 큐레이션 명소만 표시합니다. */
export function GanghwaLandmarkModels({ pins, onPick }) {
  const { t } = useTranslation();
  const groupRef = useRef(null);
  const startedAt = useRef(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (startedAt.current === null) {
      startedAt.current = clock.elapsedTime;
    }

    const progress = Math.min((clock.elapsedTime - startedAt.current) / 0.5, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const pop = progress < 1 ? Math.sin(progress * Math.PI) * 0.22 : 0;
    const scale = eased + pop;

    groupRef.current.scale.setScalar(scale);
    groupRef.current.position.y = Math.sin(progress * Math.PI) * 0.08;
  });

  const resolvePlace = (config) =>
    pins.find(
      ({ place }) =>
        place.id === config.placeId ||
        String(place.contentId) === String(config.contentId),
    )?.place ?? null;

  return (
    <group ref={groupRef} rotation={GANGHWA_MESH_ROTATION} scale={0}>
      {GANGHWA_LANDMARK_MODELS.map(
        ({
          id,
          contentId,
          placeId,
          Comp,
          label,
          position,
          rotation,
          scale,
          markerRadius,
          labelY,
        }) => {
          const place = resolvePlace({ placeId, contentId });
          const title = t(`landmark.label.${id}`, {
            defaultValue: translatePlaceName(
              t,
              place || { id: placeId, landmarkKey: placeId, contentId },
              translateLandmarkKey(t, placeId, label || ''),
            ),
          });

          return (
            <group
              key={id}
              position={position}
              rotation={rotation}
              onClick={(e) => {
                e.stopPropagation();
                if (place) onPick?.(place);
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
              <mesh position={[0, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[markerRadius, 32]} />
                <meshStandardMaterial
                  color='#fef3a6'
                  emissive='#fff59d'
                  emissiveIntensity={0.35}
                  transparent
                  opacity={0.72}
                />
              </mesh>
              <Comp scale={scale} />
              {title && (
                <Billboard follow position={[0, labelY, 0]}>
                  <Text
                    font={DISTRICT_NAME_FONT}
                    fontSize={0.09}
                    anchorX='center'
                    anchorY='middle'
                    color='#0f172a'
                    outlineWidth={0.02}
                    outlineColor='#ffffff'
                    maxWidth={1.2}
                    textAlign='center'
                  >
                    {title}
                  </Text>
                </Billboard>
              )}
            </group>
          );
        },
      )}
    </group>
  );
}
