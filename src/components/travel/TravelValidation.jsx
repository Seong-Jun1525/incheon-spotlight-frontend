/**
 * TravelValidation.jsx — 여행계획 입력 오류를 화면 전체에 전달하는 컨텍스트
 * - 검증 결과 목록을 Provider 로 내려보냄
 * - useFieldError 로 특정 입력 항목에 해당하는 첫 오류 메시지를 꺼내 씀
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { createContext, useContext } from 'react';
const ValidationContext = createContext([]);
export const TravelValidationProvider = ValidationContext.Provider;
export function useFieldError(field) {
  const issues = useContext(ValidationContext);
  return issues.find((issue) => issue.fields?.includes(field))?.message || '';
}
