/**
 * 구·군 선택 시 3D 맵에 표시할 대표 명소
 * @typedef {{ placeId: number, offset: [number, number, number] }} LandmarkPin
 */

/** @type {Record<string, LandmarkPin[]>} */
export const districtLandmarkPins = {
  yeonsu: [{ placeId: 1, offset: [0.15, 0.28, -0.12] }],
  jemulpo: [
    { placeId: 2, offset: [-0.1, 0.32, 0.05] },
    { placeId: 4, offset: [0.12, 0.3, -0.08] },
  ],
  ganghwa: [],
  namdong: [],
  michuhol: [{ placeId: 3, offset: [0, 0.34, 0.05] }],
  yeongjong: [{ placeId: 5, offset: [0, 0.3, -0.05] }],
  seohae: [],
  geomdan: [],
};
