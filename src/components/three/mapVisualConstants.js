/** 3D 맵 시각/UI 상수 — 구·군 파스텔 모자이크 */

export const MAP_COLORS = {
  default: '#D8E8F4',
  side: '#B7D0E4',
  inactive: '#F4F1EA',
  hover: '#F3D7B8',
  selected: '#E8B4C8',
  landmark: '#E0953A',
  landmarkActive: '#D45B70',
  outline: '#FFFFFF',
  outlineHex: '#FFFFFF',
  sideDark: '#C9C5BA',
  label: '#252525',
};

/**
 * 11개 구·군 파스텔. 맞닿은 권역은 색이 겹치지 않게 배치합니다.
 * fill=기본, side=측면 발광, hover/selected=같은 색의 또렷한 톤, inactive=선택 시 나머지.
 */
export const DISTRICT_PALETTE = {
  ganghwa: {
    fill: '#C9F0DC',
    side: '#9FDCC0',
    hover: '#A8E6C8',
    selected: '#86D4B0',
    inactive: '#E8F8F0',
  },
  geomdan: {
    fill: '#FADDC4',
    side: '#E8C09A',
    hover: '#F3CBA8',
    selected: '#E8B086',
    inactive: '#FBEBDD',
  },
  gyeyang: {
    fill: '#F7EEC0',
    side: '#E4D68A',
    hover: '#F0E49A',
    selected: '#E2D074',
    inactive: '#F9F4DC',
  },
  bupyeong: {
    fill: '#F7D0DC',
    side: '#E5A8BC',
    hover: '#F0B8C8',
    selected: '#E498B0',
    inactive: '#FBE8EE',
  },
  seohae: {
    fill: '#DDD0F6',
    side: '#C0AEE4',
    hover: '#CDBEEC',
    selected: '#B8A0DE',
    inactive: '#EEE8F8',
  },
  jemulpo: {
    fill: '#F8D4C0',
    side: '#E6B496',
    hover: '#F0C4A8',
    selected: '#E4AC88',
    inactive: '#FBE8DC',
  },
  michuhol: {
    fill: '#D2D0F6',
    side: '#B0AEE4',
    hover: '#BEBCEC',
    selected: '#A4A0DC',
    inactive: '#EBEAF8',
  },
  namdong: {
    fill: '#DCEFB8',
    side: '#C0D890',
    hover: '#CCE49E',
    selected: '#B4D07E',
    inactive: '#EEF6DC',
  },
  yeonsu: {
    fill: '#C5E2F8',
    side: '#9CC8E8',
    hover: '#ACD4F0',
    selected: '#8CBEE4',
    inactive: '#E4F0F8',
  },
  yeongjong: {
    fill: '#F8DCE8',
    side: '#E8B8CC',
    hover: '#F0C8D8',
    selected: '#E4A8C0',
    inactive: '#FBEAF2',
  },
  ongjin: {
    fill: '#C4EDF2',
    side: '#96D6DE',
    hover: '#A8E0E6',
    selected: '#82CCD6',
    inactive: '#E4F6F8',
  },
};

const FALLBACK_DISTRICT_PALETTE = {
  fill: MAP_COLORS.default,
  side: MAP_COLORS.side,
  hover: MAP_COLORS.hover,
  selected: MAP_COLORS.selected,
  inactive: MAP_COLORS.inactive,
};

export function getDistrictPalette(id) {
  return DISTRICT_PALETTE[id] ?? FALLBACK_DISTRICT_PALETTE;
}

export const DISTRICT_COLORS = Object.fromEntries(
  Object.entries(DISTRICT_PALETTE).map(([id, palette]) => [id, palette.fill]),
);

export const CORE_LABEL_IDS = /** @type {readonly string[]} */ ([
  'jemulpo',
  'yeonsu',
  'ganghwa',
  'namdong',
  'seohae',
  'yeongjong',
]);

export const INITIAL_SPOTLIGHT_LANDMARK_IDS = /** @type {const} */ ([
  'lm-wolmido',
  'lm-songdo-park',
  'lm-jeondeungsa',
  'lm-sorae-wetland',
  'lm-cheongna',
]);

/** 사용자에게 노출할 짧은 구명 (2026) */
export const DISTRICT_DISPLAY_NAME = {
  jemulpo: '제물포구',
  yeonsu: '연수구',
  ganghwa: '강화군',
  namdong: '남동구',
  seohae: '서해구',
  geomdan: '검단구',
  gyeyang: '계양구',
  bupyeong: '부평구',
  michuhol: '미추홀구',
  yeongjong: '영종구',
  ongjin: '옹진군',
};
