/**
 * useFestivalsQuery.js — 인천 전체 축제·행사 조회 훅
 * - fetchIncheonFestivals를 1회 호출해 종료 행사 제외·월별 필터링 후 구·군별로 그룹핑
 * - queryKey: ['ktoFestivals', 언어, withinDays], staleTime 30분 / gcTime 60분, 재시도 없음
 * - 반환: { festivals, festivalsByDistrict, isLoading, isError }
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchIncheonFestivals } from '../../api/kto/festivalApi';
import {
  excludeEndedFestivals,
  festivalsForMapCalendar,
  groupFestivalsByDistrict,
  normalizeFestivalDistrict,
} from '../../utils/festival';
import { koreaTodayDate } from '../../utils/mapCalendar';
import { useAppLanguage } from '../useAppLanguage';

/** 오늘부터 며칠 이내에 시작하는 행사까지 노출할지 */
const DEFAULT_WITHIN_DAYS = 30;

/**
 * 인천 전체 축제·행사 조회 훅.
 *
 * 구·군별로 나눠 호출하지 않고 인천 전체를 한 번에 받아 클라이언트에서 그룹핑합니다.
 * 3D 지도의 11개 구·군 배지를 API 호출 1회로 모두 채우기 위함입니다.
 *
 * @param {{ withinDays?: number, enabled?: boolean, year?: number, month?: number }} [options]
 */
export function useFestivalsQuery({
  withinDays = DEFAULT_WITHIN_DAYS,
  enabled = true,
  year,
  month,
} = {}) {
  const language = useAppLanguage();
  const query = useQuery({
    queryKey: ['ktoFestivals', language, withinDays],
    queryFn: () => fetchIncheonFestivals({ withinDays }),
    enabled,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 0,
  });

  const festivals = useMemo(() => {
    const normalized = (query.data ?? []).map(normalizeFestivalDistrict);
    const live = excludeEndedFestivals(normalized, koreaTodayDate());
    if (!year || !month) return live;
    return festivalsForMapCalendar(live, year, month, koreaTodayDate());
  }, [query.data, year, month]);

  const festivalsByDistrict = useMemo(
    () => groupFestivalsByDistrict(festivals),
    [festivals],
  );

  return {
    festivals,
    festivalsByDistrict,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
