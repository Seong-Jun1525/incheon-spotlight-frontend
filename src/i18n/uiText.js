/**
 * uiText.js — 한국어 원문을 그대로 넘겨 현재 언어 문구를 얻는 번역 헬퍼
 * - uiText: 번역 키 형태면 i18n.t로, 아니면 uiTranslations.json → 한국어 원문 역인덱스 순으로 조회
 * - 현재 언어가 ko이거나 대응 문구가 없으면 입력값을 그대로 반환
 * - useUiLanguage: 언어 변경 시 컴포넌트가 다시 렌더되도록 구독만 하는 훅
 */
import { useTranslation } from 'react-i18next';
import i18n from './index';
import ko from './locales/ko';
import copyKo from './locales/copy-ko';
import translations from './uiTranslations.json';
import feedback from './feedback';
import screens from './screens';
const keys = new Map(Object.entries({ ...ko, ...copyKo, ...feedback.ko, ...screens.ko }).map(([key,value]) => [value,key]));
export function useUiLanguage() { useTranslation(); }
export function uiText(value) {
  if(typeof value !== 'string') return value;
  if (/^(feedback|ai|auth|member|visit|course|favorites)\.[A-Za-z0-9.]+$/.test(value)) return i18n.t(value);
  const language=i18n.resolvedLanguage || 'ko';
  if(language==='ko')return value;
  const text=value.replace(/\s+/g,' ').trim();
  const row=translations[text];
  if(row)return row[language] || value;
  if(keys.has(text))return i18n.t(keys.get(text));
  return value;
}
