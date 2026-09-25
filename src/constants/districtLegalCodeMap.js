/**
 * @deprecated districtLegalCodeMap.js 대신 hooks/useDistrictLegalCodeMap.js 를 사용하세요.
 * 기존 import 호환을 위해 re-export만 유지합니다.
 */
export {
  getDistrictLegalCodeMap,
  getDistrictSggCd,
  loadDistrictLegalCodeMap,
  resolveDistrictLegalCode,
  withDistrictLegalCodes,
  isDistrictLegalCodeMapReady,
} from '../services/districtLegalCodeService';

export { useDistrictLegalCodeMap } from '../hooks/useDistrictLegalCodeMap';
