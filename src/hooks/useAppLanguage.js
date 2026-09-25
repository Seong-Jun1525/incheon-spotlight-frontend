/**
 * useAppLanguage.js — 현재 화면 언어 코드를 정규화해 반환하는 훅
 * - i18next가 해석한 언어를 서비스 지원 코드로 변환
 * - TourAPI 쿼리 키와 Accept-Language 헤더 구성에 사용
 */

import { useTranslation } from 'react-i18next';
import { normalizeLanguage } from '../i18n/languages';

/** 화면 언어. TourAPI 쿼리 키와 Accept-Language 헤더에 씁니다. */
export function useAppLanguage() {
  const { i18n } = useTranslation();
  return normalizeLanguage(i18n.resolvedLanguage);
}
