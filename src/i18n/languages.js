/**
 * languages.js — 지원 언어 목록과 언어 코드 정규화 유틸
 * - LANGUAGES: ko / en / ja / zh-CN의 코드·표시 이름·Intl 로케일 정의, 기본값은 ko
 * - normalizeLanguage: zh 계열 변형이나 'ko-KR' 같은 값을 지원 코드로 변환
 * - readSavedLanguage / getLocale: localStorage에 저장된 선택 언어 읽기와 로케일 조회
 */
export const LANGUAGE_STORAGE_KEY = 'incheon-spotlight-language';
export const DEFAULT_LANGUAGE = 'ko';

export const LANGUAGES = [
  { code: 'ko', label: '한국어', locale: 'ko-KR' },
  { code: 'en', label: 'English', locale: 'en-US' },
  { code: 'ja', label: '日本語', locale: 'ja-JP' },
  { code: 'zh-CN', label: '简体中文', locale: 'zh-CN' },
];

export function normalizeLanguage(value) {
  if (typeof value !== 'string') return DEFAULT_LANGUAGE;
  const code = value.trim().replaceAll('_', '-').toLowerCase();
  if (code === 'zh' || code === 'zh-cn' || code === 'zh-sg' || code.startsWith('zh-hans')) {
    return 'zh-CN';
  }
  return LANGUAGES.find((item) => code === item.code || code.startsWith(`${item.code}-`))?.code
    ?? DEFAULT_LANGUAGE;
}

export function readSavedLanguage() {
  try {
    return normalizeLanguage(globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function getLocale(language) {
  const code = normalizeLanguage(language);
  return LANGUAGES.find((item) => item.code === code).locale;
}
