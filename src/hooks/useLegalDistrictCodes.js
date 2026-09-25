/**
 * useLegalDistrictCodes.js — 시·도 법정동 코드 목록을 조회하는 훅
 * - 코드 목록 쿼리 결과에서 인천 시·도 코드를 찾아내고 없으면 상수값으로 폴백
 * - 쿼리 상태에 코드 목록·인천 코드·코드 확보 여부를 더해 반환
 */

import { useMemo } from 'react';
import { INCHEON_CTPV_CODE } from '../constants/legalDistrictConstants';
import { getIncheonCtpvCd } from '../utils/buildDistrictLegalCodeMap';
import { useCtpvCdListQuery } from './queries/useCtpvCdListQuery';

/**
 * 시·도 법정동 코드 목록 조회 (selectCtpvCdList / TC_CTPV).
 */
export function useLegalDistrictCodes() {
  const query = useCtpvCdListQuery();

  const incheonCtpvCd = useMemo(() => {
    if (!query.data?.length) return null;
    return getIncheonCtpvCd(query.data) ?? INCHEON_CTPV_CODE;
  }, [query.data]);

  return {
    ...query,
    ctpvCdList: query.data ?? [],
    incheonCtpvCd,
    hasIncheonCode: Boolean(incheonCtpvCd),
  };
}
