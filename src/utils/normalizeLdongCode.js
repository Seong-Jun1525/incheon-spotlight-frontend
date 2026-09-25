/**
 * TourAPI ldongCode2 응답 → 내부 ctpv/sgg 형식 변환
 */

function pickField(item, ...keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== '') {
      return String(value).trim();
    }
  }
  return '';
}

/** DB/내부용 시도 코드 → TourAPI lDongRegnCd (예: 2800000000 → 28) */
export function toLdongRegnCd(ctpvCd) {
  const code = String(ctpvCd ?? '').trim();
  if (!code) return '';
  if (code.length >= 10) return code.slice(0, 2);
  return code;
}

/** ldongCode2 시도 목록 → normalizeCtpvList 입력 형식 */
export function ldongItemsToCtpvList(items) {
  const list = Array.isArray(items) ? items : [];
  const seen = new Set();
  const result = [];

  for (const item of list) {
    const ctpvCd = pickField(item, 'lDongRegnCd', 'ldongRegnCd', 'ctpvCd', 'CTPV_CD');
    const ctpvNm = pickField(item, 'lDongRegnNm', 'ldongRegnNm', 'ctpvNm', 'CTPV_NM');
    if (!ctpvCd || seen.has(ctpvCd)) continue;

    seen.add(ctpvCd);
    result.push({ ctpvCd, ctpvNm });
  }

  return result;
}

/** ldongCode2 시군구 목록 → normalizeSggList 입력 형식 */
export function ldongItemsToSggList(items, fallbackCtpvCd = '') {
  const list = Array.isArray(items) ? items : [];

  return list
    .map((item) => ({
      sggCd: pickField(item, 'lDongSignguCd', 'ldongSignguCd', 'sggCd', 'SGG_CD'),
      sggNm: pickField(item, 'lDongSignguNm', 'ldongSignguNm', 'sggNm', 'SGG_NM'),
      ctpvCd: pickField(item, 'lDongRegnCd', 'ldongRegnCd', 'ctpvCd', 'CTPV_CD') || fallbackCtpvCd,
    }))
    .filter((item) => item.sggCd);
}
