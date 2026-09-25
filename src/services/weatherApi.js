/**
 * weatherApi.js — 기상청 격자(nx, ny) 기준 날씨 요약 조회
 * - GET /api/weather?nx=&ny= 응답을 temp·label·fineDust 형태로 정리
 * - 세션 캐시를 우선 사용하고 같은 격자 동시 요청은 Promise를 공유해 중복 호출 방지
 * - 204·실패 응답은 staticWeather 목업 값으로 대체
 */
import { apiUrl } from '../config/api';
import { staticWeather } from '../data/mainMockData';
import { DEFAULT_WEATHER_GRID } from '../data/districtWeatherGrids';
import { readWeatherCache, writeWeatherCache } from './weatherCache';

/** @type {Map<string, Promise<object>>} */
const inFlightByGrid = new Map();

function gridKey(nx, ny) {
  return `${nx},${ny}`;
}

/**
 * 기상청 격자(nx, ny) 기준 날씨 요약 조회
 * @param {{ nx?: number, ny?: number }} [grid]
 */
export async function fetchWeather(grid = DEFAULT_WEATHER_GRID) {
  const nx = grid.nx ?? DEFAULT_WEATHER_GRID.nx;
  const ny = grid.ny ?? DEFAULT_WEATHER_GRID.ny;

  const cached = readWeatherCache(nx, ny);
  if (cached) {
    return cached;
  }

  const key = gridKey(nx, ny);
  const existing = inFlightByGrid.get(key);
  if (existing) {
    return existing;
  }

  const request = loadWeatherFromApi(nx, ny).finally(() => {
    inFlightByGrid.delete(key);
  });
  inFlightByGrid.set(key, request);
  return request;
}

async function loadWeatherFromApi(nx, ny) {
  const response = await fetch(
    apiUrl(`/api/weather?nx=${encodeURIComponent(nx)}&ny=${encodeURIComponent(ny)}`),
  );

  if (response.status === 204 || !response.ok) {
    return staticWeather;
  }

  const data = await response.json();
  const weather = {
    temp: data.temp ?? staticWeather.temp,
    label: data.label ?? staticWeather.label,
    fineDust: data.fineDust ?? staticWeather.fineDust,
  };

  writeWeatherCache(nx, ny, weather);
  return weather;
}
