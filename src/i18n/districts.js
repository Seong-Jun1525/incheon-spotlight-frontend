/**
 * districts.js — 구·군 검색용 다국어 별칭 제공
 * - getDistrictSearchAliases: 4개 언어 사전에서 `district.<id>` 이름을 모아 중복 없이 반환
 * - 현재 UI 언어와 무관하게 동작해, 어떤 언어로 입력해도 같은 지역이 검색되게 함
 */
import ko from './locales/ko.js';
import en from './locales/en.js';
import ja from './locales/ja.js';
import zhCN from './locales/zh-CN.js';

// Search aliases are independent of the selected UI language and preserve district IDs.
export function getDistrictSearchAliases(districtId) {
  const key = `district.${districtId}`;
  return [...new Set([ko[key], en[key], ja[key], zhCN[key]].filter(Boolean))];
}
