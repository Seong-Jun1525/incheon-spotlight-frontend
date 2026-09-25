/**
 * districtLegalCodeService.js — districtId → { ctpvCd, sggCd } 코드 맵 캐시
 * - loadDistrictLegalCodeMap: 시·도/시·군·구 코드를 받아 맵을 한 번만 만들고 인메모리 보관
 * - resolveDistrictLegalCode·withDistrictLegalCodes로 구·군 엔트리에 법정동 코드 부착
 * - React Query 훅과 API 레이어가 같은 캐시를 공유
 */
import {
  fetchCtpvCdList,
  fetchSggCdList,
} from '../api/commonApi';
import { INCHEON_CTPV_CODE } from '../constants/legalDistrictConstants';
import {
  buildDistrictLegalCodeMapFromSggList,
  getDistrictSggCd,
  getIncheonCtpvCd,
} from '../utils/buildDistrictLegalCodeMap';

/**
 * districtId → { ctpvCd, sggCd } 법정동 코드 맵 캐시 서비스
 *
 * 코드 목록 조회:
 * 1순위 KTO ldongCode2 (/api/kto/ldongCode2/ctpvCd, /api/kto/ldongCode2/sggCd)
 * 2순위 DB 공통코드 (/api/common/ctpvcdlist, /api/common/sggcdlist)
 *
 * React Query 훅(useDistrictLegalCodeMap)과
 * API 레이어(ktoOpenApi)가 공유하는 인메모리 캐시입니다.
 */

/** @type {Record<string, { ctpvCd: string, sggCd: string } | null> | null} */
let cachedMap = null;

/** @type {Promise<Record<string, { ctpvCd: string, sggCd: string } | null>> | null} */
let loadPromise = null;

export function getDistrictLegalCodeMap() {
  return cachedMap ?? {};
}

export function setDistrictLegalCodeMap(map) {
  cachedMap = map;
}

/** districtId에 해당하는 시·군·구 코드(sggCd) 반환 */
export function resolveDistrictLegalCode(districtId) {
  return getDistrictSggCd(cachedMap, districtId);
}

/**
 * API 없이 훅 밖에서도 코드 맵을 한 번 로드할 때 사용.
 * (ktoOpenApi.fetchDistrictAttractions 등)
 */
export async function loadDistrictLegalCodeMap() {
  if (cachedMap) return cachedMap;

  if (!loadPromise) {
    loadPromise = (async () => {
      const ctpvList = await fetchCtpvCdList();
      const incheonCtpvCd = getIncheonCtpvCd(ctpvList) ?? INCHEON_CTPV_CODE;
      const sggList = await fetchSggCdList(incheonCtpvCd);
      const map = buildDistrictLegalCodeMapFromSggList(sggList, incheonCtpvCd);
      cachedMap = map;
      return map;
    })().finally(() => {
      loadPromise = null;
    });
  }

  return loadPromise;
}

/** 3D 구·군 엔트리 목록에 legalDistrictCode 필드 부착 */
export function withDistrictLegalCodes(
  entries,
  districtLegalCodeMap = getDistrictLegalCodeMap(),
) {
  return entries.map((entry) => ({
    ...entry,
    legalDistrictCode: getDistrictSggCd(districtLegalCodeMap, entry.id),
  }));
}

export function isDistrictLegalCodeMapReady() {
  return cachedMap !== null;
}

export { getDistrictSggCd };
