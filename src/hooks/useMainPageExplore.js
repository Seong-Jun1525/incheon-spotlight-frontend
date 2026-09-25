/**
 * useMainPageExplore.js — 메인 3D 탐색 화면에 필요한 장소 데이터를 모아 가공하는 훅
 * - TourAPI·큐레이션·목업 결과를 우선순위대로 합쳐 목록/3D 씬/초기 핀용 데이터 생성
 * - 선택 구·군, 테마, 검색어, 장소 유형 조건으로 필터링하고 검색 자동완성 목록 구성
 * - 로딩·오류 상태와 폴백 데이터 사용 여부를 함께 반환
 */

import { useMemo } from 'react';
import { mockDistricts } from '../data/mockDistricts';
import { mockLandmarks } from '../data/mockLandmarks';
import {
  buildDistrictDetailsMap,
  buildLandmarkPins,
  buildSpotlightPins,
  filterLandmarksBySearch,
  filterLandmarksByTheme,
  getLandmarksByDistrict,
  pickSceneLandmarks,
  resolveListLandmarks,
  resolveSelectedLandmark,
} from '../utils/landmarkExplore';
import { buildExploreSearchSuggestions } from '../utils/exploreSearch';
import { normalizeCuratedLandmarks } from '../utils/curatedLandmarkNormalize';
import { useDistrictAttractions } from './useDistrictAttractions';
import {
  useCuratedLandmarksQuery,
  useSceneLandmarksQuery,
} from './queries/useCuratedLandmarksQuery';
import { useExploreStore } from '../stores/useExploreStore';

/**
 * 메인 페이지(3D 탐색) 데이터 가공 훅.
 *
 * listLandmarks   → 좌측 패널
 * sceneLandmarks  → 선택 구·군 3D 핀/모델
 * spotlightPins   → 초기 핵심 핀 4개 (구·군 미선택 시)
 *
 * @param {string} searchValue
 * @param {string | null} [placeTypeId] 장소 유형(contentTypeId). null이면 기존 전체 동작
 */
export function useMainPageExplore(searchValue, placeTypeId = null) {
  const { selectedDistrictId, selectedLandmarkId, activeTheme } = useExploreStore();

  const selectedDistrict = useMemo(
    () => mockDistricts.find((district) => district.id === selectedDistrictId) ?? null,
    [selectedDistrictId],
  );

  const {
    data: apiAttractions = [],
    isLoading: isAttractionsLoading,
    isError: isAttractionsError,
  } = useDistrictAttractions(selectedDistrictId, placeTypeId);

  const {
    data: curatedLandmarks = [],
    isLoading: isCuratedLoading,
    isError: isCuratedError,
  } = useCuratedLandmarksQuery(selectedDistrictId);

  const { data: sceneLandmarksFromApi = [] } = useSceneLandmarksQuery(selectedDistrictId);

  const fallbackLandmarks = useMemo(
    () => getLandmarksByDistrict(mockLandmarks, selectedDistrictId),
    [selectedDistrictId],
  );

  /**
   * 특정 장소 유형을 고른 상태에서는 TourAPI 결과만 사용합니다.
   * 관광지 기준인 큐레이션·mock 폴백이 문화시설/숙박/음식 목록으로 오인되면 안 됩니다.
   */
  const isPlaceTypeFiltered = Boolean(placeTypeId);

  const listLandmarks = useMemo(
    () =>
      resolveListLandmarks(
        apiAttractions,
        isPlaceTypeFiltered ? [] : fallbackLandmarks,
        isPlaceTypeFiltered ? [] : curatedLandmarks,
      ),
    [apiAttractions, fallbackLandmarks, curatedLandmarks, isPlaceTypeFiltered],
  );

  const sceneLandmarks = useMemo(
    () =>
      pickSceneLandmarks(
        listLandmarks,
        mockLandmarks,
        selectedDistrictId,
        sceneLandmarksFromApi,
      ),
    [listLandmarks, selectedDistrictId, sceneLandmarksFromApi],
  );

  const isUsingFallback =
    !isPlaceTypeFiltered &&
    Boolean(selectedDistrictId) &&
    (isAttractionsError || apiAttractions.length === 0) &&
    curatedLandmarks.length === 0;

  const isUsingCuratedFallback =
    !isPlaceTypeFiltered &&
    Boolean(selectedDistrictId) &&
    apiAttractions.length === 0 &&
    curatedLandmarks.length > 0;

  const districtLandmarks = useMemo(() => {
    if (!selectedDistrictId) return [];
    return filterLandmarksByTheme(listLandmarks, selectedDistrict, activeTheme);
  }, [selectedDistrictId, listLandmarks, activeTheme, selectedDistrict]);

  const searchedLandmarks = useMemo(
    () => filterLandmarksBySearch(districtLandmarks, searchValue),
    [districtLandmarks, searchValue],
  );

  /** 전역 검색 인덱스: mock + 현재 구 목록 API 결과 */
  const searchableLandmarks = useMemo(() => {
    const byKey = new Map();
    for (const landmark of [...mockLandmarks, ...listLandmarks]) {
      const key =
        landmark.contentId != null
          ? `c:${landmark.contentId}`
          : `i:${landmark.id}`;
      if (!byKey.has(key)) {
        byKey.set(key, landmark);
      }
    }
    return [...byKey.values()];
  }, [listLandmarks]);

  const searchSuggestions = useMemo(
    () =>
      buildExploreSearchSuggestions(searchValue, {
        districts: mockDistricts,
        landmarks: searchableLandmarks,
        limit: 8,
      }),
    [searchValue, searchableLandmarks],
  );

  const selectedLandmark = useMemo(
    () =>
      resolveSelectedLandmark(
        listLandmarks,
        [...sceneLandmarks, ...mockLandmarks],
        selectedLandmarkId,
      ),
    [listLandmarks, sceneLandmarks, selectedLandmarkId],
  );

  const districtPreviewLandmarks = useMemo(() => {
    const curated = normalizeCuratedLandmarks(curatedLandmarks);
    if (curated.length > 0) return curated;
    return mockLandmarks;
  }, [curatedLandmarks]);

  const districtDetails = useMemo(
    () => buildDistrictDetailsMap(mockDistricts, districtPreviewLandmarks),
    [districtPreviewLandmarks],
  );

  const landmarkPins = useMemo(
    () => (selectedDistrictId ? buildLandmarkPins(sceneLandmarks) : []),
    [sceneLandmarks, selectedDistrictId],
  );

  const spotlightPins = useMemo(
    () => (selectedDistrictId ? [] : buildSpotlightPins(mockLandmarks)),
    [selectedDistrictId],
  );

  return {
    selectedDistrict,
    searchedLandmarks,
    searchSuggestions,
    selectedLandmark,
    districtDetails,
    landmarkPins,
    spotlightPins,
    isAttractionsLoading: isAttractionsLoading || isCuratedLoading,
    isAttractionsError: isPlaceTypeFiltered
      ? isAttractionsError
      : isAttractionsError && isCuratedError,
    isUsingFallback,
    isUsingCuratedFallback,
  };
}
