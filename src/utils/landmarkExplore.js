/**
 * landmarkExplore.js — 탐색 화면의 랜드마크 목록과 3D 씬 데이터를 만드는 순수 함수 모음
 * - resolveListLandmarks·pickSceneLandmarks: API → 큐레이션 → mock/registry 순으로 좌측 목록과 씬 명소를 분리 구성
 * - buildLandmarkPins·buildCoursePins·buildSpotlightPins: contentId로 pinOffset을 복원해 3D 핀 배치
 * - findLandmarkById·resolveSelectedLandmark: id와 contentId 혼용을 흡수하는 선택 상태 동기화
 */
import { MAX_LANDMARK_PINS_PER_DISTRICT } from '../constants/exploreConstants';
import {
  getSceneRegistryEntry,
  getSceneContentIdsForDistrict,
  LANDMARK_SCENE_REGISTRY,
} from '../data/landmarkSceneRegistry';
import {
  normalizeCuratedLandmarks,
  normalizeDistrictAttractionFromApi,
} from './curatedLandmarkNormalize';
import { INITIAL_SPOTLIGHT_LANDMARK_IDS } from '../components/three/mapVisualConstants';
import { landmarkPinOffsets, mockLandmarks } from '../data/mockLandmarks';

const MOCK_LANDMARK_BY_KEY = Object.fromEntries(
  mockLandmarks.map((item) => [item.id, item]),
);

const REGISTRY_CONTENT_ID_BY_KEY = Object.fromEntries(
  Object.entries(LANDMARK_SCENE_REGISTRY).map(([contentId, entry]) => [
    entry.landmarkKey,
    contentId,
  ]),
);

/**
 * ─────────────────────────────────────────────
 * 랜드마크 탐색 유틸 (순수 함수)
 * ─────────────────────────────────────────────
 *
 * 데이터 소스 우선순위:
 * 1. TourAPI + 백엔드 큐레이션 병합 (KTO attractions API)
 * 2. TC_CURATED_LANDMARK API (curated-landmarks)
 * 3. 프론트 mock / landmarkSceneRegistry (오프라인 폴백)
 *
 * 좌측 리스트(list)와 3D 맵(scene) 데이터를 분리합니다.
 */

/** TourAPI / 백엔드 DTO → 좌측 패널용 공통 형태 */
export function normalizeDistrictAttraction(item) {
  return normalizeDistrictAttractionFromApi(item);
}

/** 선택한 구·군에 속한 랜드마크만 반환 */
export function getLandmarksByDistrict(landmarks, districtId) {
  if (!districtId) return [];
  return landmarks.filter((landmark) => landmark.districtId === districtId);
}

/**
 * 좌측 패널용 목록.
 * API가 있으면 전체 API 목록(큐레이션 병합 포함), 없으면 curated/mock 폴백.
 */
export function resolveListLandmarks(apiLandmarks, fallbackLandmarks, curatedLandmarks = []) {
  if (apiLandmarks.length > 0) {
    return apiLandmarks.map(normalizeDistrictAttraction);
  }

  const curated = normalizeCuratedLandmarks(curatedLandmarks);
  if (curated.length > 0) {
    return curated;
  }

  return fallbackLandmarks;
}

/**
 * 3D 맵용 큐레이션 랜드마크.
 * curated API → KTO 병합 데이터 → registry/mock 순으로 scene 명소를 구성합니다.
 */
export function pickSceneLandmarks(
  listLandmarks,
  mockLandmarks,
  districtId,
  curatedSceneLandmarks = [],
) {
  if (!districtId) return [];

  const curatedScene = normalizeCuratedLandmarks(curatedSceneLandmarks);
  if (curatedScene.length > 0) {
    return buildSceneFromCurated(curatedScene, listLandmarks, mockLandmarks, districtId);
  }

  const curatedFromList = listLandmarks.filter((place) => place.isSceneLandmark);
  if (curatedFromList.length > 0) {
    return buildSceneFromList(curatedFromList, mockLandmarks, districtId);
  }

  return buildSceneFromRegistry(listLandmarks, mockLandmarks, districtId);
}

function buildSceneFromCurated(curatedScene, listLandmarks, mockLandmarks, districtId) {
  const mockByKey = Object.fromEntries(mockLandmarks.map((m) => [m.id, m]));

  return curatedScene
    .filter((item) => item.districtId === districtId && item.isSceneLandmark)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((curated) => {
      const fromList = listLandmarks.find(
        (place) => String(place.contentId) === String(curated.contentId),
      );
      const base = mockByKey[curated.landmarkKey] ?? null;

      return {
        ...(base ?? {}),
        ...curated,
        ...(fromList ?? {}),
        id: curated.landmarkKey || curated.id,
        landmarkKey: curated.landmarkKey || fromList?.landmarkKey || base?.id,
        contentId: String(curated.contentId),
        districtId,
        sceneConfig: curated.sceneConfig ?? fromList?.sceneConfig,
        name: fromList?.name || fromList?.title || curated.name || base?.name,
        title: fromList?.title || fromList?.name || curated.title || base?.title,
      };
    })
    .filter((item) => item.contentId)
    .slice(0, MAX_LANDMARK_PINS_PER_DISTRICT);
}

function buildSceneFromList(sceneCandidates, mockLandmarks, districtId) {
  const mockByKey = Object.fromEntries(mockLandmarks.map((m) => [m.id, m]));

  return sceneCandidates
    .filter((place) => place.districtId === districtId || !place.districtId)
    .map((place) => {
      const landmarkKey = place.landmarkKey || place.sceneConfig?.landmarkKey;
      const base = landmarkKey ? mockByKey[landmarkKey] : null;

      return {
        ...(base ?? {}),
        ...place,
        id: landmarkKey || place.id,
        contentId: String(place.contentId),
        districtId,
        sceneConfig: place.sceneConfig,
      };
    })
    .slice(0, MAX_LANDMARK_PINS_PER_DISTRICT);
}

/** registry 폴백 — DB/API 미연동 시 사용 */
function buildSceneFromRegistry(listLandmarks, mockLandmarks, districtId) {
  const contentIds = getSceneContentIdsForDistrict(districtId);
  const mockByKey = Object.fromEntries(mockLandmarks.map((m) => [m.id, m]));

  return contentIds
    .map((contentId) => {
      const registry = getSceneRegistryEntry(contentId);
      if (!registry || registry.districtId !== districtId) return null;

      const fromList = listLandmarks.find(
        (place) => String(place.contentId) === String(contentId),
      );
      const base = mockByKey[registry.landmarkKey] ?? null;

      if (!fromList && !base) return null;

      return {
        ...(base ?? {}),
        ...(fromList ?? {}),
        id: registry.landmarkKey,
        contentId: String(contentId),
        districtId: registry.districtId,
        sceneConfig: registry,
      };
    })
    .filter(Boolean)
    .slice(0, MAX_LANDMARK_PINS_PER_DISTRICT);
}

/**
 * 테마 칩 필터.
 * 선택한 구·군의 themeTags에 활성 테마가 없으면 빈 목록을 반환합니다.
 */
export function filterLandmarksByTheme(landmarks, district, activeTheme) {
  if (!activeTheme) return landmarks;
  if (!district?.themeTags?.includes(activeTheme)) return [];
  return landmarks;
}

/** 검색창 텍스트로 랜드마크명 필터 */
export function filterLandmarksBySearch(landmarks, searchValue) {
  const query = searchValue.trim().toLowerCase();
  if (!query) return landmarks;

  return landmarks.filter((landmark) => {
    const label = (landmark.name ?? landmark.title ?? '').toLowerCase();
    return label.includes(query);
  });
}

function matchesLandmarkSite(place, landmarkKey) {
  return (
    place?.id === landmarkKey ||
    place?.landmarkKey === landmarkKey ||
    place?.sceneConfig?.landmarkKey === landmarkKey
  );
}

/**
 * 3D GLB 사이트 클릭 → 상세 패널용 장소.
 * 코스/스포트라이트 핀을 우선하고, 없으면 mock·레지스트리로 contentId를 채운다.
 */
export function placeFromLandmarkSite(site, pinPlaces = []) {
  const landmarkKey = site?.landmarkKey;
  if (!landmarkKey) return null;

  const fromPin = pinPlaces.find((place) => matchesLandmarkSite(place, landmarkKey));
  const fromMock = MOCK_LANDMARK_BY_KEY[landmarkKey];
  const base = fromPin || fromMock || {};
  const contentId =
    base.contentId != null && String(base.contentId) !== ''
      ? String(base.contentId)
      : REGISTRY_CONTENT_ID_BY_KEY[landmarkKey] || '';
  const name =
    base.name || base.title || site.displayName || landmarkKey;

  return {
    ...base,
    id: base.id || landmarkKey,
    landmarkKey,
    districtId: base.districtId || site.districtId || '',
    name,
    title: base.title || name,
    contentId,
  };
}

/** 목록에서 id / contentId / landmarkKey 로 랜드마크 찾기 */
export function findLandmarkById(candidates, landmarkId) {
  if (!landmarkId) return null;

  return (
    candidates.find(
      (landmark) =>
        landmark.id === landmarkId ||
        landmark.landmarkKey === landmarkId ||
        String(landmark.contentId) === String(landmarkId),
    ) ?? null
  );
}

/**
 * 좌측 리스트·3D 맵 공통 선택 키.
 * contentId가 있으면 API/mock 간 id 형식 차이를 흡수합니다.
 */
export function getLandmarkSelectionId(landmark) {
  if (!landmark) return null;
  if (landmark.contentId) return String(landmark.contentId);
  return landmark.id;
}

/** 좌측 리스트 하이라이트용 — 3D 선택과 동기화 */
export function isLandmarkSelected(landmark, selectedId) {
  if (!landmark || !selectedId) return false;

  return (
    landmark.id === selectedId ||
    String(landmark.contentId) === String(selectedId) ||
    getLandmarkSelectionId(landmark) === String(selectedId)
  );
}

/**
 * 선택된 랜드마크 상세 데이터 해석.
 * 좌측(API) 데이터를 우선하고, 3D 전용 scene 데이터로 보강합니다.
 */
export function resolveSelectedLandmark(listLandmarks, sceneLandmarks, selectedId) {
  if (!selectedId) return null;

  const fromList = findLandmarkById(listLandmarks, selectedId);
  const fromScene = findLandmarkById(sceneLandmarks, selectedId);

  if (fromList && fromScene) {
    return {
      ...fromScene,
      ...fromList,
      id: fromList.id,
      contentId: fromList.contentId || fromScene.contentId,
      sceneConfig: fromScene.sceneConfig ?? fromList.sceneConfig,
    };
  }

  return fromList ?? fromScene ?? null;
}

/**
 * 3D 맵 호버 카드용 구·군 요약 정보.
 * districtId → { name, description, detailDescription, themeTags, previewLandmarks[] }
 */
export function buildDistrictDetailsMap(districts, landmarks) {
  return Object.fromEntries(
    districts.map((district) => [
      district.id,
      {
        name: district.name,
        description: district.description,
        detailDescription: district.detailDescription ?? district.description,
        themeTags: district.themeTags ?? [],
        previewLandmarks: getLandmarksByDistrict(landmarks, district.id)
          .slice(0, MAX_LANDMARK_PINS_PER_DISTRICT)
          .map((landmark) => ({
            id: landmark.id,
            landmarkKey: landmark.landmarkKey || landmark.id,
            contentId: landmark.contentId,
            name: landmark.name,
            title: landmark.title,
          })),
      },
    ]),
  );
}

/** 3D 씬에 배치할 핀 목록 생성 (큐레이션 랜드마크만) */
export function buildLandmarkPins(sceneLandmarks) {
  return sceneLandmarks.map((place) => ({
    place,
    offset: place.sceneConfig?.pinOffset ?? landmarkPinOffsets[place.id] ?? [0, 0.3, 0],
  }));
}

/**
 * 추천 코스 정류장 → 3D 숫자 핀.
 * contentId로 mock/API 풀·씬 레지스트리를 매칭해 pinOffset을 복원합니다.
 */
export function buildCoursePins(course, landmarksPool = []) {
  if (!course?.stops?.length) return [];

  return course.stops
    .map((stop) => {
      const contentId = String(stop.contentId);
      const registry = getSceneRegistryEntry(contentId);
      const fromPool = findLandmarkById(landmarksPool, contentId);
      const landmarkKey =
        registry?.landmarkKey || fromPool?.id || `course-${contentId}`;
      const offset =
        registry?.pinOffset ??
        landmarkPinOffsets[landmarkKey] ??
        [0, 0.35, 0];

      return {
        place: {
          ...(fromPool ?? {}),
          id: landmarkKey,
          contentId,
          name: stop.name || fromPool?.name || fromPool?.title || contentId,
          title: stop.name || fromPool?.title || fromPool?.name || contentId,
          districtId: course.districtId,
          order: stop.order,
          sceneConfig: registry ?? fromPool?.sceneConfig,
        },
        offset,
        order: stop.order,
      };
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * 초기 화면 핵심 랜드마크 핀 (권역당 1개).
 * 구·군 미선택 시에만 사용하며, 선택 후 landmarkPins 와 중복되지 않습니다.
 */
export function buildSpotlightPins(mockLandmarksList) {
  const byId = Object.fromEntries(mockLandmarksList.map((item) => [item.id, item]));

  return INITIAL_SPOTLIGHT_LANDMARK_IDS.map((id) => {
    const place = byId[id];
    if (!place) return null;

    const registry = place.contentId ? getSceneRegistryEntry(place.contentId) : null;

    return {
      place: {
        ...place,
        sceneConfig: registry ?? {
          landmarkKey: place.id,
          districtId: place.districtId,
          renderType: 'pin',
          pinOffset: landmarkPinOffsets[place.id] ?? [0, 0.3, 0],
        },
      },
      offset:
        registry?.pinOffset ??
        landmarkPinOffsets[place.id] ??
        [0, 0.3, 0],
    };
  }).filter(Boolean);
}

/** 좌측 초기 Hero 추천 폴백에 노출할 명소 개수 */
export const HERO_RECOMMENDATION_COUNT = 3;

const CATEGORY_LABEL = {
  tour: '관광지',
  culture: '문화시설',
  history: '역사',
  nature: '자연',
  food: '미식',
};

/** mock 랜드마크에는 테마 태그가 없어 카테고리로 대체합니다. i18n `theme.*` 키만 사용합니다. */
const CATEGORY_HERO_TAGS = {
  tour: ['가족', '데이트'],
  culture: ['데이트', '역사'],
  history: ['역사', '가족'],
  nature: ['자연', '가족'],
  food: ['맛집', '데이트'],
};

function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 구·군이 겹치지 않는 조합을 먼저 채우고, 모자라면 남은 후보로 보충합니다. */
function pickRandomLandmarks(landmarks, count) {
  const pool = shuffled(landmarks.filter((item) => item?.id));
  const picked = [];
  const usedDistricts = new Set();

  for (const place of pool) {
    if (picked.length >= count) break;
    if (place.districtId && usedDistricts.has(place.districtId)) continue;
    usedDistricts.add(place.districtId);
    picked.push(place);
  }

  for (const place of pool) {
    if (picked.length >= count) break;
    if (!picked.includes(place)) picked.push(place);
  }

  return picked;
}

/**
 * 좌측 초기 Hero 추천 폴백 — 오늘 추천 API 실패 시에만 사용.
 * 호출마다 랜드마크 중 무작위로 뽑으므로 매번 다른 명소가 노출됩니다.
 */
export function buildHeroRecommendations(mockLandmarksList, districts = []) {
  const districtById = Object.fromEntries(districts.map((d) => [d.id, d]));

  return pickRandomLandmarks(mockLandmarksList, HERO_RECOMMENDATION_COUNT).map(
    (place) => {
      const district = districtById[place.districtId];
      return {
        ...place,
        heroTags: CATEGORY_HERO_TAGS[place.category] ?? [],
        districtName: district?.name ?? '',
        placeType: CATEGORY_LABEL[place.category] || '관광지',
      };
    },
  );
}

/** @deprecated resolveListLandmarks 사용 */
export function resolveSourceLandmarks(apiLandmarks, mockLandmarks) {
  return resolveListLandmarks(apiLandmarks, mockLandmarks);
}
