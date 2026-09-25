/**
 * 구·군명 라벨 — 핵심 권역은 기본 표시, 호버/선택 시 상세 칩
 * position 기본값은 Y-up. 통합 맵(XY→XZ 회전)에서는 Z-up 좌표를 넘기세요.
 */
import { useTranslation } from 'react-i18next';
import { useLayoutEffect, useRef } from 'react';
import { Billboard, Html, Text } from '@react-three/drei';
import { CORE_LABEL_IDS, getDistrictPalette } from '../mapVisualConstants';
import { DISTRICT_NAME_FONT } from './mapGroupConfig';
import { labelText, TROIKA_CHAR_SET } from './mapGroupUtils';

export function DistrictName3D({
  id,
  isSelected,
  isHovered = false,
  festivalCount = 0,
  showFestivals = true,
  chipPosition = [0, 0.72, 0],
  labelPosition = [0, 0.52, 0],
}) {
  const meshRef = useRef(null);
  const { t, i18n } = useTranslation();
  const title = t(`district.${id}`, { defaultValue: labelText(id) });
  const isCore = CORE_LABEL_IDS.includes(id);
  const hasFestival = showFestivals && festivalCount > 0;
  // 축제는 전체 조망에서만 표시한다. 구·군 포커스 시 랜드마크를 가리지 않는다.
  const visible = isSelected || isHovered || isCore || hasFestival;

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.raycast = () => {};
  }, []);

  if (!visible) return null;

  // Use browser CJK fonts for translated labels; the bundled 3D font is Korean.
  if (isSelected || isHovered || hasFestival || i18n.resolvedLanguage !== 'ko') {
    const palette = getDistrictPalette(id);
    const borderColor = isSelected
      ? palette.selected
      : hasFestival
        ? palette.hover
        : '#E8E8E3';

    return (
      <Html position={chipPosition} center style={{ pointerEvents: 'none' }} zIndexRange={[12, 0]}>
        <div
          style={{
            padding: '5px 10px',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.95)',
            border: `1px solid ${borderColor}`,
            color: '#252525',
            fontSize: isSelected ? 13 : 12,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 18px rgba(30,30,30,0.08)',
            textAlign: 'center',
            lineHeight: 1.3,
          }}
        >
          <div>{title}</div>
          {hasFestival && (
            <div
              style={{
                marginTop: 3,
                display: 'inline-block',
                padding: '2px 7px',
                borderRadius: '999px',
                background: '#FFF2DD',
                color: '#9A5300',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {t('explore.festivalCount', { count: festivalCount })}
            </div>
          )}
        </div>
      </Html>
    );
  }

  return (
    <Billboard follow position={labelPosition}>
      <Text
        ref={meshRef}
        font={DISTRICT_NAME_FONT}
        characters={TROIKA_CHAR_SET}
        fontSize={0.045}
        sdfGlyphSize={48}
        anchorX='center'
        anchorY='middle'
        color='#252525'
        outlineWidth={0.008}
        outlineColor='#FFFFFF'
        maxWidth={0.55}
        textAlign='center'
      >
        {title}
      </Text>
    </Billboard>
  );
}
