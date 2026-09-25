/**
 * legalDistrictConstants.js — 인천광역시 법정동 코드 조회용 고정 상수
 * - 시·도 법정동코드(2800000000) 폴백값 제공
 * - 시·도 코드 조회 API에 넘길 시도명 문자열 제공
 */

/** 인천광역시 시도 법정동코드 (TC_CTPV / DB 폴백 또는 KTO ldongCode2) */
export const INCHEON_CTPV_CODE = '2800000000';

/** CommonService.selectCtpvCd(ctpvNm) 조회용 시도명 */
export const INCHEON_PROVINCE_NAME = '인천광역시';
