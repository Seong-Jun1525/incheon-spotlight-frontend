/**
 * buildDistrictLegalCodeMap.js — 법정 시·군·구 목록(TC_SGG)을 3D 지도의 districtId와 연결
 * - buildDistrictLegalCodeMapFromSggList(sggList, ctpvCd): districtId → { ctpvCd, sggCd } 맵 생성, 영종·검단은 제물포·서해 코드로 폴백
 * - filterIncheonSggList·getIncheonCtpvCd: CTPV_CD 2800000000(또는 lDongRegnCd 28)인 인천 행만 선별
 * - 구 명칭 차이는 별칭(제물포=중구·동구, 서해=서구 등)과 접두·접미 매칭으로 흡수
 */
import { DISTRICT_DISPLAY_NAME } from '../components/three/mapVisualConstants';
import { districtIds, districtLabels } from '../data/incheonDistricts';
import { INCHEON_CTPV_CODE } from '../constants/legalDistrictConstants';
import { toLdongRegnCd } from './normalizeLdongCode';

/** TC_SGG.SGG_NM 매칭용 보조 키워드 (3D districtId → DB 조회) */
const DISTRICT_SGG_NAME_ALIASES = {
  jemulpo: ['제물포구', '중구', '동구'],
  yeongjong: ['영종구', '영종', '영종도'],
  geomdan: ['검단구', '검단'],
  seohae: ['서해구', '서구'],
};

function normalizeCtpvItem(item) {
  if (typeof item === 'string') {
    return { ctpvCd: item, ctpvNm: '' };
  }

  return {
    ctpvCd: String(item?.ctpvCd ?? item?.CTPV_CD ?? '').trim(),
    ctpvNm: String(item?.ctpvNm ?? item?.CTPV_NM ?? '').trim(),
  };
}

/** TC_SGG 행 정규화: SGG_CD, CTPV_CD, SGG_NM */
function normalizeSggItem(item) {
  return {
    sggCd: String(item?.sggCd ?? item?.SGG_CD ?? '').trim(),
    ctpvCd: String(item?.ctpvCd ?? item?.CTPV_CD ?? '').trim(),
    sggNm: String(item?.sggNm ?? item?.SGG_NM ?? '').trim(),
  };
}

/** @param {Array<string | { ctpvCd?: string, ctpvNm?: string }>} ctpvList */
export function normalizeCtpvList(ctpvList) {
  if (!Array.isArray(ctpvList)) return [];
  return ctpvList.map(normalizeCtpvItem).filter((item) => item.ctpvCd);
}

/** @param {Array<{ sggCd?: string, ctpvCd?: string, sggNm?: string }>} sggList */
export function normalizeSggList(sggList) {
  if (!Array.isArray(sggList)) return [];
  return sggList.map(normalizeSggItem).filter((item) => item.sggCd);
}

function isIncheonDistrictCode(ctpvCd) {
  return String(ctpvCd).startsWith('28');
}

/** TC_SGG.SGG_NM 비교용 (공백 제거) */
function normalizeSggName(name) {
  return String(name).replace(/\s+/g, '').trim();
}

function getDistrictLookupLabels(districtId) {
  const labels = [
    DISTRICT_DISPLAY_NAME[districtId],
    districtLabels[districtId],
    ...(DISTRICT_SGG_NAME_ALIASES[districtId] ?? []),
  ].filter(Boolean);

  return [...new Set(labels)];
}

/**
 * TC_SGG.SGG_NM ↔ districtId 매칭 후 해당 행 반환.
 */
function matchSggEntry(entries, labels) {
  const normalizedEntries = entries.map((entry) => ({
    ...entry,
    normalizedNm: normalizeSggName(entry.sggNm),
  }));

  for (const label of labels) {
    const normalizedLabel = normalizeSggName(label);
    if (!normalizedLabel) continue;

    const exact = normalizedEntries.find(
      (entry) => entry.normalizedNm === normalizedLabel,
    );
    if (exact) return exact;

    const suffixMatches = normalizedEntries.filter((entry) =>
      entry.normalizedNm.endsWith(normalizedLabel),
    );
    if (suffixMatches.length >= 1) {
      return suffixMatches.sort(
        (a, b) => a.normalizedNm.length - b.normalizedNm.length,
      )[0];
    }

    const prefixMatches = normalizedEntries.filter((entry) =>
      entry.normalizedNm.startsWith(normalizedLabel),
    );
    if (prefixMatches.length === 1) return prefixMatches[0];
  }

  return null;
}

/** @typedef {{ ctpvCd: string, sggCd: string }} DistrictLegalCode */

function isSameCtpvCode(left, right) {
  if (!left || !right) return true;
  if (String(left) === String(right)) return true;
  return toLdongRegnCd(left) === toLdongRegnCd(right);
}

/** CTPV_CD=2800000000 또는 KTO lDongRegnCd=28 인천 시·군·구만 사용 */
export function filterIncheonSggList(sggList, ctpvCd = INCHEON_CTPV_CODE) {
  const normalized = normalizeSggList(sggList);
  return normalized.filter((entry) => isSameCtpvCode(entry.ctpvCd, ctpvCd));
}

/**
 * selectSggCdList(TC_SGG) 응답으로 districtId → { ctpvCd, sggCd } 맵 생성.
 * @returns {Record<string, DistrictLegalCode | null>}
 */
export function buildDistrictLegalCodeMapFromSggList(
  sggList,
  ctpvCd = INCHEON_CTPV_CODE,
) {
  const incheonEntries = filterIncheonSggList(sggList, ctpvCd);

  /** @type {Record<string, DistrictLegalCode | null>} */
  const map = Object.fromEntries(districtIds.map((id) => [id, null]));

  for (const districtId of districtIds) {
    const labels = getDistrictLookupLabels(districtId);
    const matched = matchSggEntry(incheonEntries, labels);
    map[districtId] = matched
      ? {
          ctpvCd: matched.ctpvCd || ctpvCd,
          sggCd: matched.sggCd,
        }
      : null;
  }

  if (!map.yeongjong && map.jemulpo) {
    map.yeongjong = map.jemulpo;
  }
  if (!map.geomdan && map.seohae) {
    map.geomdan = map.seohae;
  }

  return map;
}

/** districtId에 해당하는 TC_SGG.SGG_CD 반환 */
export function getDistrictSggCd(map, districtId) {
  const entry = map?.[districtId];
  if (!entry) return null;
  return typeof entry === 'string' ? entry : entry.sggCd;
}

/** @deprecated buildDistrictLegalCodeMapFromSggList 사용 */
export function buildDistrictLegalCodeMap(sggList, ctpvCd) {
  return buildDistrictLegalCodeMapFromSggList(sggList, ctpvCd);
}

export function getIncheonCtpvCd(ctpvList) {
  const normalized = normalizeCtpvList(ctpvList);
  return (
    normalized.find((entry) => entry.ctpvCd === INCHEON_CTPV_CODE)?.ctpvCd ??
    normalized.find((entry) => entry.ctpvNm.includes('인천'))?.ctpvCd ??
    normalized.find(
      (entry) =>
        isIncheonDistrictCode(entry.ctpvCd) &&
        (String(entry.ctpvCd).endsWith('0000000') || String(entry.ctpvCd).length <= 2),
    )?.ctpvCd ??
    null
  );
}
