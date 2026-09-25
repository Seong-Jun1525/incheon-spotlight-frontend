/**
 * commonApi.js — 시·도/시·군·구 법정동 코드 목록 조회와 폴백
 * - 1순위 KTO ldongCode2, 실패 시 DB 공통코드(/api/common/ctpvcdlist, /sggcdlist)로 폴백
 * - 응답을 normalizeCtpvList·normalizeSggList로 통일된 코드 목록 형태로 변환
 * - fetchIncheonSggCdList는 fetchSggCdList 별칭
 */
import { api } from './http';
import { fetchLdongCtpvCdList, fetchLdongSggCdList } from './ktoLdongCodeApi';
import { unwrapApiList } from '../utils/apiResponse';
import {
  normalizeCtpvList,
  normalizeSggList,
} from '../utils/buildDistrictLegalCodeMap';
import {
  ldongItemsToCtpvList,
  ldongItemsToSggList,
} from '../utils/normalizeLdongCode';

/**
 * 법정동 코드 조회 API
 *
 * 1순위: KTO ldongCode2 분리 엔드포인트
 *   - GET /api/kto/ldongCode2/ctpvCd
 *   - GET /api/kto/ldongCode2/sggCd?ctpvCd=
 * 2순위: DB 공통코드
 *   - GET /api/common/ctpvcdlist
 *   - GET /api/common/sggcdlist?ctpvCd=
 *
 * KTO API 장애 시 DB 조회로 자동 폴백합니다.
 */

async function fetchCtpvCdListFromDb() {
  const { data } = await api.get('/api/common/ctpvcdlist');
  return normalizeCtpvList(unwrapApiList(data));
}

async function fetchSggCdListFromDb(ctpvCd) {
  const { data } = await api.get('/api/common/sggcdlist', {
    params: { ctpvCd },
  });
  return normalizeSggList(unwrapApiList(data));
}

async function fetchCtpvCdListFromKto() {
  const items = await fetchLdongCtpvCdList();
  const normalized = normalizeCtpvList(ldongItemsToCtpvList(items));

  if (!normalized.length) {
    throw new Error('KTO 시도 코드 목록이 비어 있습니다.');
  }

  return normalized;
}

async function fetchSggCdListFromKto(ctpvCd) {
  const items = await fetchLdongSggCdList(ctpvCd);
  const normalized = normalizeSggList(ldongItemsToSggList(items, ctpvCd));

  if (!normalized.length) {
    throw new Error('KTO 시군구 코드 목록이 비어 있습니다.');
  }

  return normalized;
}

export async function fetchCtpvCdList() {
  try {
    return await fetchCtpvCdListFromKto();
  } catch (error) {
    console.warn('[commonApi] KTO 시도 코드 조회 실패 → DB 폴백', error);
    return fetchCtpvCdListFromDb();
  }
}

export async function fetchSggCdList(ctpvCd) {
  if (!ctpvCd) return [];

  try {
    return await fetchSggCdListFromKto(ctpvCd);
  } catch (error) {
    console.warn('[commonApi] KTO 시군구 코드 조회 실패 → DB 폴백', error);
    return fetchSggCdListFromDb(ctpvCd);
  }
}

/** 인천 시·군·구 코드 조회 (fetchSggCdList 별칭) */
export async function fetchIncheonSggCdList(ctpvCd) {
  return fetchSggCdList(ctpvCd);
}
