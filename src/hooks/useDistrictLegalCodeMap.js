/**
 * useDistrictLegalCodeMap.js — 구·군 ID와 법정동 코드(sggCd)를 잇는 매핑을 준비하는 훅
 * - 시·도 코드와 시·군·구 코드 목록을 순차 조회해 districtId 기준 코드 맵을 생성
 * - 완성된 맵을 전역 서비스 캐시에 저장하고 로딩·오류·준비 완료 상태와 함께 반환
 * - 코드 맵 조회용 서비스 함수들을 재export
 */

import { useMemo } from 'react';
import { INCHEON_CTPV_CODE } from '../constants/legalDistrictConstants';
import {
  buildDistrictLegalCodeMapFromSggList,
  getIncheonCtpvCd,
} from '../utils/buildDistrictLegalCodeMap';
import { setDistrictLegalCodeMap } from '../services/districtLegalCodeService';
import { useCtpvCdListQuery } from './queries/useCtpvCdListQuery';
import { useSggCdListQuery } from './queries/useSggCdListQuery';

/**
 * 3D districtId ↔ KTO sggCd 매핑 훅
 *
 * 1단계: 시·도 코드 (KTO /ldongCode2/ctpvCd → 실패 시 DB ctpvcdlist)
 * 2단계: 시·군·구 코드 (KTO /ldongCode2/sggCd → 실패 시 DB sggcdlist)
 * 3단계: districtId → { ctpvCd, sggCd } 맵 생성 후 전역 캐시에 저장
 */
export function useDistrictLegalCodeMap() {
  const ctpvQuery = useCtpvCdListQuery();

  const incheonCtpvCd = useMemo(() => {
    if (!ctpvQuery.data?.length) return INCHEON_CTPV_CODE;
    return getIncheonCtpvCd(ctpvQuery.data) ?? INCHEON_CTPV_CODE;
  }, [ctpvQuery.data]);

  const sggQuery = useSggCdListQuery(incheonCtpvCd, {
    enabled: ctpvQuery.isSuccess,
  });

  const districtLegalCodeMap = useMemo(() => {
    if (!sggQuery.data?.length) return {};
    const map = buildDistrictLegalCodeMapFromSggList(
      sggQuery.data,
      incheonCtpvCd,
    );
    setDistrictLegalCodeMap(map);
    return map;
  }, [sggQuery.data, incheonCtpvCd]);

  return {
    isLoading: ctpvQuery.isLoading || sggQuery.isLoading,
    isError: ctpvQuery.isError || sggQuery.isError,
    isSuccess: ctpvQuery.isSuccess && sggQuery.isSuccess,
    isReady: sggQuery.isSuccess && Boolean(sggQuery.data?.length),
    ctpvCdList: ctpvQuery.data ?? [],
    sggCdList: sggQuery.data ?? [],
    incheonCtpvCd,
    districtLegalCodeMap,
  };
}

export {
  getDistrictLegalCodeMap,
  getDistrictSggCd,
  loadDistrictLegalCodeMap,
  resolveDistrictLegalCode,
  withDistrictLegalCodes,
  isDistrictLegalCodeMapReady,
} from '../services/districtLegalCodeService';
