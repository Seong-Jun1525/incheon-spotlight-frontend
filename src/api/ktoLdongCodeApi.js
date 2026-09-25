/**
 * ktoLdongCodeApi.js — 한국관광공사 법정동 코드(ldongCode2) 조회
 * - GET /api/kto/ldongCode2/ctpvCd 로 시·도 코드 목록 조회
 * - GET /api/kto/ldongCode2/sggCd?ctpvCd= 로 시·군·구 코드 목록 조회
 * - 4초 타임아웃 적용, 빈 응답은 에러로 던져 호출측 DB 폴백을 유도
 */
import { api } from './http';
import { unwrapApiList, unwrapKtoTourApiItems } from '../utils/apiResponse';

/** TourAPI가 멈추면 기본 10초를 다 쓰지 않고 DB 폴백으로 넘깁니다. */
const KTO_LDONG_TIMEOUT_MS = 4000;

function parseLdongCodeItems(data) {
  const ktoItems = unwrapKtoTourApiItems(data);
  if (ktoItems.length > 0) return ktoItems;

  const list = unwrapApiList(data);
  if (list.length > 0) return list;

  return [];
}

/**
 * 한국관광공사 OpenAPI — 법정동 시·도 코드 (ldongCode2)
 *
 * GET /api/kto/ldongCode2/ctpvCd
 *
 * 백엔드에서 ldongCode2(lDongListYn=N) 호출을 캡슐화합니다.
 */
export async function fetchLdongCtpvCdList() {
  const { data } = await api.get('/api/kto/ldongCode2/ctpvCd', {
    timeout: KTO_LDONG_TIMEOUT_MS,
  });
  const items = parseLdongCodeItems(data);

  if (!items.length) {
    throw new Error('ldongCode2 시도 코드 응답이 비어 있습니다.');
  }

  return items;
}

/**
 * 한국관광공사 OpenAPI — 법정동 시·군·구 코드 (ldongCode2)
 *
 * GET /api/kto/ldongCode2/sggCd?ctpvCd={ctpvCd}
 *
 * ctpvCd: 인천 시도 코드 (예: 28 또는 2800000000)
 * 백엔드에서 lDongRegnCd 변환 및 ldongCode2(lDongListYn=Y) 호출을 처리합니다.
 */
export async function fetchLdongSggCdList(ctpvCd) {
  if (!ctpvCd) {
    throw new Error('ctpvCd가 필요합니다.');
  }

  const { data } = await api.get('/api/kto/ldongCode2/sggCd', {
    params: { ctpvCd },
    timeout: KTO_LDONG_TIMEOUT_MS,
  });
  const items = parseLdongCodeItems(data);

  if (!items.length) {
    throw new Error('ldongCode2 시군구 코드 응답이 비어 있습니다.');
  }

  return items;
}
