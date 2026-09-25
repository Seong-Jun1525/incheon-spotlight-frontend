/**
 * LanguageSync.jsx — 화면 언어 변경을 document·캐시·다른 탭과 맞추는 동기화 컴포넌트
 * - html lang, document.title, localStorage 언어 키를 갱신
 * - 언어가 바뀌면 TourAPI·오늘 코스 등 언어 의존 쿼리를 invalidate하고 storage 이벤트로 탭 간 동기화
 */
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY, normalizeLanguage } from '../../i18n/languages';

const TOUR_API_QUERY_KEYS = [
  'ktoSearch',
  'ktoDistrictAttractions',
  'ktoFestivals',
  'placeDetail',
  'nearbyRestaurants',
  'nearbyLodgings',
  'attractionImages',
  'districtLandmarks',
  'travel-place-search',
];

const LANGUAGE_SCOPED_QUERY_KEYS = [
  ['ai', 'courses', 'today'],
];

export function LanguageSync() {
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const language = normalizeLanguage(i18n.resolvedLanguage);
  const previousLanguage = useRef(language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t('app.title');
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Language switching also works when browser storage is unavailable.
    }
  }, [language, t]);

  useEffect(() => {
    if (previousLanguage.current === language) return;
    previousLanguage.current = language;
    TOUR_API_QUERY_KEYS.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    });
    LANGUAGE_SCOPED_QUERY_KEYS.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    });
  }, [language, queryClient]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === LANGUAGE_STORAGE_KEY || event.key === null) {
        void i18n.changeLanguage(normalizeLanguage(event.newValue));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [i18n]);

  return null;
}
