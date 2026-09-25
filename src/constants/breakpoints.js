/**
 * breakpoints.js — 반응형 레이아웃 분기 기준값과 미디어쿼리 문자열 상수
 * - 폰(767px)·태블릿 상한(1099px) 픽셀 경계값 제공
 * - 짧은 가로 화면 폰까지 포함하는 PHONE_LAYOUT_MQ 쿼리 문자열 제공
 */

/** Desktop / laptop layouts stay as authored above 1099px. */

export const BP_PHONE = 767;
export const BP_TABLET_MAX = 1099;

/**
 * Phone portrait, or a short landscape phone.
 * Tablets with a usable aspect ratio do not match this query.
 */
export const PHONE_LAYOUT_MQ = `(max-width: ${BP_PHONE}px), (max-width: ${BP_TABLET_MAX}px) and (max-height: 540px)`;
