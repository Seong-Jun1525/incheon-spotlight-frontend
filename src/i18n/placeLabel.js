/**
 * placeLabel.js — 장소·지역·코스 이름을 번역 키로 이어 주는 헬퍼 모음
 * - resolveLandmarkKey: place의 landmarkKey·id·contentId로 `lm-` 랜드마크 키를 역추적
 * - translatePlaceName / translateDistrictBlurb / translateDistrictIntro: 키가 없으면 원문을 defaultValue로 사용
 * - translateCourse: 코스의 이름·경로·테마·요약·경유지 이름을 한 번에 번역해 새 객체로 반환
 * - getLandmarkSearchAliases: 검색용으로 랜드마크 이름의 4개 언어 표기를 모두 반환
 */
import { mockLandmarks } from '../data/mockLandmarks';
import copyKo from './locales/copy-ko.js';
import copyEn from './locales/copy-en.js';
import copyJa from './locales/copy-ja.js';
import copyZh from './locales/copy-zh-CN.js';

const CONTENT_ID_TO_LANDMARK_KEY = Object.fromEntries(
  mockLandmarks
    .filter((item) => item.contentId && item.id)
    .map((item) => [String(item.contentId), item.id]),
);

function isLandmarkKey(value) {
  return typeof value === 'string' && value.startsWith('lm-');
}

export function resolveLandmarkKey(place) {
  if (!place || typeof place !== 'object') return null;
  const candidates = [
    place.landmarkKey,
    place.sceneConfig?.landmarkKey,
    place.id,
    CONTENT_ID_TO_LANDMARK_KEY[String(place.contentId ?? '')],
  ];
  return candidates.find(isLandmarkKey) ?? null;
}

export function translateLandmarkKey(t, landmarkKey, fallback = '') {
  if (!landmarkKey) return fallback;
  return t(`landmark.${landmarkKey}`, { defaultValue: fallback || landmarkKey });
}

export function translatePlaceName(t, place, fallback = '') {
  const raw =
    (place && (place.name || place.title || place.label)) || fallback || '';
  const key = resolveLandmarkKey(place);
  if (!key) return raw;
  return t(`landmark.${key}`, { defaultValue: raw });
}

export function translateDistrictBlurb(t, district) {
  if (!district) return '';
  return t(`districtBlurb.${district.id}`, {
    defaultValue: district.description ?? '',
  });
}

export function translateDistrictIntro(t, districtOrId, fallback = '') {
  const id = typeof districtOrId === 'string' ? districtOrId : districtOrId?.id;
  if (!id) return fallback;
  const fromDistrict =
    typeof districtOrId === 'object'
      ? (districtOrId.detailDescription ?? districtOrId.description ?? '')
      : '';
  return t(`districtIntro.${id}`, { defaultValue: fallback || fromDistrict });
}

export function translateCourse(t, course) {
  if (!course) return course;
  const prefix = `recCourse.${course.id}`;
  return {
    ...course,
    courseName: t(`${prefix}.name`, { defaultValue: course.courseName || '' }),
    routeLabel: t(`${prefix}.route`, { defaultValue: course.routeLabel || '' }),
    themeLabel: t(`${prefix}.theme`, { defaultValue: course.themeLabel || '' }),
    duration: t(`${prefix}.duration`, { defaultValue: course.duration || '' }),
    placeCount: Number.isFinite(Number(course.stopCount ?? course.placeCount))
      ? t('course.placeCount', { count: Number(course.stopCount ?? course.placeCount) })
      : t(`${prefix}.places`, { defaultValue: course.placeCount || '' }),
    summary: t(`${prefix}.summary`, { defaultValue: course.summary || '' }),
    stops: Array.isArray(course.stops)
      ? course.stops.map((stop) => ({
          ...stop,
          name: translatePlaceName(t, stop, stop.name || stop.title || ''),
        }))
      : course.stops,
  };
}

export function getLandmarkSearchAliases(landmarkKey) {
  if (!isLandmarkKey(landmarkKey)) return [];
  const key = `landmark.${landmarkKey}`;
  return [...new Set([copyKo[key], copyEn[key], copyJa[key], copyZh[key]].filter(Boolean))];
}
