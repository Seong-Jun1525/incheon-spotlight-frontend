/**
 * districtTourCodeMap.js — 구·군 관광 코드 매핑의 구 이름 호환용 재export 파일
 * - DISTRICT_KTO_CODE_MAP을 DISTRICT_TOUR_CODE_MAP 이름으로 그대로 노출
 * - 기존 import 경로 유지 목적이며 신규 코드에서는 사용하지 않음
 */

import { DISTRICT_KTO_CODE_MAP } from './districtKtoCodeMap';

// @deprecated KTO OpenAPI 백엔드 참고 매핑은 districtKtoCodeMap.js의 DISTRICT_KTO_CODE_MAP을 사용합니다.
// 기존 import 호환만 유지하며, 새 코드는 이 상수를 사용하지 않습니다.
export const DISTRICT_TOUR_CODE_MAP = DISTRICT_KTO_CODE_MAP;
