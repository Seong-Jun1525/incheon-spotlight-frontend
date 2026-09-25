/**
 * incheonDistricts.js — 인천 2026 행정구역 11개 구·군의 ID·한글명 기준 데이터
 * - districtIds / districtLabels: 앱 전반의 구·군 식별자와 표시명 원천
 * - 통합·분구 이전 구 ID를 2026 ID로 바꿔주는 매핑과 변환 함수 제공
 * - 방문 인증·스탬프 지역 선택용 옵션 목록 생성
 */

/** @typedef {'bupyeong' | 'ganghwa' | 'geomdan' | 'gyeyang' | 'jemulpo' | 'michuhol' | 'namdong' | 'ongjin' | 'seohae' | 'yeongjong' | 'yeonsu'} DistrictId */

/**
 * 인천 2026 행정구역 (11개)
 * - 서구 → 서해구(seohae) + 검단구(geomdan)
 * - 중구(육지)+동구 → 제물포구(jemulpo)
 * - 중구(영종) → 영종구(yeongjong)
 */
export const districtIds = [
  'bupyeong',
  'ganghwa',
  'geomdan',
  'gyeyang',
  'jemulpo',
  'michuhol',
  'namdong',
  'ongjin',
  'seohae',
  'yeongjong',
  'yeonsu',
];

export const districtLabels = {
  bupyeong: '부평구',
  ganghwa: '강화군',
  geomdan: '검단구',
  gyeyang: '계양구',
  jemulpo: '제물포구',
  michuhol: '미추홀구',
  namdong: '남동구',
  ongjin: '옹진군',
  seohae: '서해구',
  yeongjong: '영종구',
  yeonsu: '연수구',
};

/** 구 행정구역 ID → 2026 ID */
export const LEGACY_DISTRICT_ID_MAP = {
  seo: 'seohae',
  dong: 'jemulpo',
  jung_mainland: 'jemulpo',
  jung_yeongjong: 'yeongjong',
};

export function resolveDistrictId(districtId) {
  if (!districtId) return null;
  return LEGACY_DISTRICT_ID_MAP[districtId] ?? districtId;
}

/** 방문 인증·스탬프 지역 선택 폴백 (TC_QUEST_REGION과 같은 regionId) */
export function districtRegionOptions() {
  return districtIds.map((id) => ({
    regionId: id,
    regionName: districtLabels[id],
  }));
}
