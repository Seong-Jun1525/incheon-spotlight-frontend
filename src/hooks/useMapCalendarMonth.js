/**
 * useMapCalendarMonth.js — 메인 맵의 조회 대상 월을 URL 쿼리와 동기화하는 훅
 * - URL의 month 파라미터를 읽어 선택 월을 결정하고, 유효 범위를 벗어나면 이번 달로 보정
 * - 선택 월·월 목록·월 라벨·이번 달 여부·조회 일수와 월 변경 함수를 반환
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  formatMonthLabel,
  isSameYearMonth,
  koreaToday,
  parseMonthParam,
  upcomingCalendarMonths,
  withinDaysForMonth,
  writeMonthSearch,
} from '../utils/mapCalendar';

/**
 * 메인 맵 콘텐츠 월. 날씨·AI 오늘 코스 쿼리와 분리합니다.
 * 이번 달은 URL에 month를 남기지 않습니다.
 */
export function useMapCalendarMonth() {
  const location = useLocation();
  const navigate = useNavigate();
  const today = useMemo(() => koreaToday(), []);
  const months = useMemo(() => upcomingCalendarMonths(today, 5), [today]);
  const requested = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return parseMonthParam(params.get('month'), today);
  }, [location.search, today]);
  const selected = useMemo(() => {
    if (!requested) return today;
    return months.some((item) => isSameYearMonth(item, requested))
      ? requested
      : today;
  }, [requested, months, today]);

  useEffect(() => {
    if (!requested) return;
    if (months.some((item) => isSameYearMonth(item, requested))) return;
    const search = writeMonthSearch(
      location.search,
      today.year,
      today.month,
      today,
    );
    navigate(
      { pathname: location.pathname, search },
      { replace: true, state: location.state },
    );
  }, [
    requested,
    months,
    today,
    location.pathname,
    location.search,
    location.state,
    navigate,
  ]);

  const isCurrentMonth = isSameYearMonth(selected, today);
  const withinDays = withinDaysForMonth(selected.year, selected.month, today);

  const setMonth = useCallback(
    (year, month) => {
      const search = writeMonthSearch(location.search, year, month, today);
      if (search === (location.search || '')) return;
      navigate(
        { pathname: location.pathname, search },
        { replace: true, state: location.state },
      );
    },
    [location.pathname, location.search, location.state, navigate, today],
  );

  return {
    today,
    year: selected.year,
    month: selected.month,
    isCurrentMonth,
    withinDays,
    months,
    monthLabel: formatMonthLabel(selected.month),
    setMonth,
  };
}
