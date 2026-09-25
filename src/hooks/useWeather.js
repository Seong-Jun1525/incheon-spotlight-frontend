/**
 * useWeather.js — 선택한 구·군의 날씨 정보를 조회하는 훅
 * - districtId를 기상청 격자 좌표로 바꿔 캐시 확인 후 필요할 때만 API 호출
 * - 구·군 미선택이나 조회 실패 시 인천 대표 격자와 기본값으로 폴백
 * - 기온·미세먼지 등 날씨 값에 지역 라벨과 격자 좌표를 더해 반환
 */

import { useEffect, useState } from 'react';
import { staticWeather } from '../data/mainMockData';
import { resolveWeatherGrid } from '../data/districtWeatherGrids';
import { fetchWeather } from '../services/weatherApi';
import { readWeatherCache } from '../services/weatherCache';

/**
 * 선택 시·군·구(districtId) 기준 날씨.
 * 미선택 시 인천 대표 격자(시청 인근)를 사용합니다.
 *
 * @param {string | null | undefined} districtId
 */
export function useWeather(districtId) {
  const grid = resolveWeatherGrid(districtId);
  const [weather, setWeather] = useState(
    () => readWeatherCache(grid.nx, grid.ny) ?? staticWeather,
  );

  useEffect(() => {
    const nextGrid = resolveWeatherGrid(districtId);
    const cached = readWeatherCache(nextGrid.nx, nextGrid.ny);
    let cancelled = false;

    const weatherRequest = cached
      ? Promise.resolve(cached)
      : fetchWeather(nextGrid).catch(() => staticWeather);

    weatherRequest
      .then((data) => {
        if (!cancelled) {
          setWeather(data);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [districtId]);

  return {
    ...weather,
    regionLabel: grid.label,
    nx: grid.nx,
    ny: grid.ny,
  };
}
