/**
 * index.js — i18next 초기화 엔트리(앱 전역 번역 인스턴스)
 * - locales의 기본 사전·copy 사전·feedback·screens를 언어별로 하나의 translation 네임스페이스로 병합
 * - 지원 언어 ko / en / ja / zh-CN, 시작 언어는 localStorage 저장값, 실패 시 ko로 폴백
 * - keySeparator: false라 'nav.explore' 같은 점 포함 키를 통째로 조회
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from './locales/ko.js';
import en from './locales/en.js';
import ja from './locales/ja.js';
import zhCN from './locales/zh-CN.js';
import copyKo from './locales/copy-ko.js';
import copyEn from './locales/copy-en.js';
import copyJa from './locales/copy-ja.js';
import copyZhCN from './locales/copy-zh-CN.js';
import { DEFAULT_LANGUAGE, LANGUAGES, readSavedLanguage } from './languages.js';
import feedback from './feedback.js';
import screens from './screens.js';

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: { ...ko, ...copyKo, ...feedback.ko, ...screens.ko } },
    en: { translation: { ...en, ...copyEn, ...feedback.en, ...screens.en } },
    ja: { translation: { ...ja, ...copyJa, ...feedback.ja, ...screens.ja } },
    'zh-CN': { translation: { ...zhCN, ...copyZhCN, ...feedback['zh-CN'], ...screens['zh-CN'] } },
  },
  lng: readSavedLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGES.map(({ code }) => code),
  load: 'currentOnly',
  keySeparator: false,
  initAsync: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
