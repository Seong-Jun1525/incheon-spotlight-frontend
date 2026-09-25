/**
 * landmarkDetailHelpers.js — 랜드마크 상세 패널에서 쓰는 표시값 변환 헬퍼
 * - hasDisplayValue로 undefined·null·빈 문자열을 걸러냄
 * - toOperationRows로 TourAPI 운영 정보를 배열·객체·문자열 어떤 형태든 { label, value }[] 로 정규화
 */

/** 빈 값이 아닌지 확인 */
export function hasDisplayValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function formatDisplayValue(value) {
  if (Array.isArray(value)) return value.filter(hasDisplayValue).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

/**
 * TourAPI 운영 정보(operationInfo)를 패널용 { label, value }[] 로 변환.
 * API 응답 형태(배열/객체/문자열)가 달라도 동일하게 렌더링합니다.
 */
export function toOperationRows(operationInfo) {
  if (!operationInfo) return [];

  if (Array.isArray(operationInfo)) {
    return operationInfo
      .filter(hasDisplayValue)
      .map((value, index) => ({
        label: `정보 ${index + 1}`,
        value: formatDisplayValue(value),
      }));
  }

  if (typeof operationInfo === 'object') {
    return Object.entries(operationInfo)
      .filter(([, value]) => hasDisplayValue(value))
      .map(([label, value]) => ({ label, value: formatDisplayValue(value) }));
  }

  return hasDisplayValue(operationInfo)
    ? [{ label: '운영 정보', value: formatDisplayValue(operationInfo) }]
    : [];
}
