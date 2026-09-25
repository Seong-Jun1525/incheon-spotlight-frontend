/**
 * districtWeatherGrids.js — 구·군별 기상청 단기예보 격자 좌표(nx, ny) 매핑
 * - 날씨 조회 시 districtId를 해당 지역 격자 좌표로 변환
 * - 미선택·미등록 지역은 인천 대표 격자로 폴백
 */

export const DEFAULT_WEATHER_GRID = {
  nx: 55,
  ny: 124,
  label: '인천',
};

/** @type {Record<string, { nx: number, ny: number, label: string }>} */
export const DISTRICT_WEATHER_GRIDS = {
  jemulpo: { nx: 54, ny: 125, label: '제물포구' },
  yeongjong: { nx: 53, ny: 125, label: '영종구' },
  geomdan: { nx: 55, ny: 127, label: '검단구' },
  seohae: { nx: 55, ny: 126, label: '서해구' },
  michuhol: { nx: 54, ny: 124, label: '미추홀구' },
  yeonsu: { nx: 55, ny: 123, label: '연수구' },
  namdong: { nx: 56, ny: 124, label: '남동구' },
  bupyeong: { nx: 55, ny: 125, label: '부평구' },
  gyeyang: { nx: 56, ny: 126, label: '계양구' },
  ganghwa: { nx: 51, ny: 130, label: '강화군' },
  ongjin: { nx: 54, ny: 124, label: '옹진군' },
};

export function resolveWeatherGrid(districtId) {
  if (districtId && DISTRICT_WEATHER_GRIDS[districtId]) {
    return DISTRICT_WEATHER_GRIDS[districtId];
  }
  return DEFAULT_WEATHER_GRID;
}
