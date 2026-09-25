/**
 * MainPage.jsx — 인천 3D 지도 기반 메인 탐색 화면
 * - 라우트: `/` (공개)
 * - 좌측 LeftExplorePanel(검색·구군·오늘의 추천), 중앙 ThreeCanvasBackground 3D 지도, 우측 RightToolbar와 하단 코스 바를 조합
 * - 오늘의 추천·오늘의 코스·TourAPI 키워드 검색·축제 쿼리 결과를 합쳐 지도 핀과 상세 패널에 반영
 */
import { useTranslation } from 'react-i18next';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TopNavigation } from '../components/organisms/TopNavigation';
import { Skeleton } from '../components/atoms/Skeleton';
import { LeftExplorePanel } from '../components/layout/LeftExplorePanel';
import { RightToolbar } from '../components/layout/RightToolbar';
import { BottomInfoBar } from '../components/layout/BottomInfoBar';
import { WeatherBadge } from '../components/layout/WeatherBadge';
import { PublicFooter } from '../components/layout/PublicFooter';
import { LandmarkDetailPanel } from '../components/place/LandmarkDetailPanel';
import { CourseStopsPanel } from '../components/place/CourseStopsPanel';
import { FavoritesPanel } from '../components/organisms/FavoritesPanel';
import { AiChatWidget } from '../components/ai/AiChatWidget';
import { MobileExploreSheet } from '../components/layout/MobileExploreSheet';
import { MapMonthStrip } from '../components/layout/MapMonthStrip';
import { useAiChatStore } from '../stores/useAiChatStore';
import { useAiCourseStore } from '../stores/useAiCourseStore';
import { AI_GENERATED_COURSE_ID, AI_TODAY_COURSE_ID, toExploreCourse } from '../utils/aiCourseAdapter';
import { navLinks } from '../data/mainMockData';
import { mockDistricts } from '../data/mockDistricts';
import { mockLandmarks } from '../data/mockLandmarks';
import {
  getCourseByDistrictId,
  getCourseById,
} from '../data/recommendedCourses';
import { KTO_SEARCH_RESULT_LIMIT } from '../constants/exploreConstants';
import {
  buildCoursePins,
  buildHeroRecommendations,
} from '../utils/landmarkExplore';
import { useTodayRecommendationsQuery } from '../hooks/queries/useTodayRecommendationsQuery';
import { useTodayCourseQuery } from '../hooks/queries/useTodayCourseQuery';
import { mapTodayRecommendationsToHeroPlaces } from '../utils/todayRecommendations';
import { translateCourse, translatePlaceName } from '../i18n/placeLabel';
import {
  mapCameraResetView,
  mapCameraZoomIn,
  mapCameraZoomOut,
} from '../utils/mapCameraControls';
import { useMainPageExplore } from '../hooks/useMainPageExplore';
import { useKtoSearchQuery } from '../hooks/queries/useKtoSearchQuery';
import { useFestivalsQuery } from '../hooks/queries/useFestivalsQuery';
import { useMapCalendarMonth } from '../hooks/useMapCalendarMonth';
import { toFestivalPlace } from '../utils/festival';
import { pickCourseForCalendarMonth } from '../utils/mapCalendar';
import { seasonIdFromMonth } from '../utils/mapSeasonMood';
import { useWeather } from '../hooks/useWeather';
import { useExploreStore } from '../stores/useExploreStore';
import { useStampRevealStore } from '../stores/useStampRevealStore';
import { useQueryClient } from '@tanstack/react-query';
import { useFavoritesStore } from '../stores/useFavoritesStore';
import { useChromeSession } from '../hooks/useChromeSession';
import { STAT_EVENTS, STAT_SOURCE } from '../constants/statEvents';
import { trackStat } from '../utils/trackStat';
import { useStatPageView } from '../hooks/useStatPageView';
import { PHONE_LAYOUT_MQ } from '../constants/breakpoints';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { toMapPageState } from '../utils/mapNavigation';
import styles from './MainPage.module.scss';

const ThreeCanvasBackground = lazy(() =>
  import('../components/organisms/ThreeCanvasBackground').then((module) => ({
    default: module.ThreeCanvasBackground,
  })),
);

function getPlaceMapId(place) {
  return place?.contentId ?? place?.id ?? null;
}

/** RightToolbar '실제 지도' — 선택 명소가 없어도 현재 맥락으로 Cesium 페이지를 연다. */
function resolveToolbarMapPlace({
  detailLandmark,
  searchedLandmarks,
  selectedDistrictId,
  heroRecommendations,
}) {
  if (getPlaceMapId(detailLandmark)) return detailLandmark;

  const fromDistrictList = searchedLandmarks.find((item) => getPlaceMapId(item));
  if (fromDistrictList) return fromDistrictList;

  if (selectedDistrictId) {
    const fromMock = mockLandmarks.find(
      (item) => item.districtId === selectedDistrictId && getPlaceMapId(item),
    );
    if (fromMock) return fromMock;
  }

  return (
    heroRecommendations[0] ??
    mockLandmarks.find((item) => item.id === 'lm-songdo-park') ??
    mockLandmarks[0] ??
    null
  );
}

/**
 * 메인 화면 — Public Tourism Editorial 3D 탐색
 *
 * P0: 내비 / 코스 / 상세
 * P1: TourAPI searchKeyword2 연관검색 + 콘텐츠 타입 칩
 */
export function MainPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const setReveal = useStampRevealStore((s) => s.setReveal);
  const stampReveal = useStampRevealStore((s) => s.reveal);
  const cameraSettled = useStampRevealStore((s) => s.cameraSettled);
  const [activeNavId, setActiveNavId] = useState('explore');
  const [searchValue, setSearchValue] = useState('');
  /** 장소 유형(TourAPI contentTypeId) — null = 전체. 구·군 목록과 검색에 함께 적용 */
  const [placeTypeId, setPlaceTypeId] = useState(null);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const favoriteItems = useFavoritesStore((s) => s.items);
  const { navAuthProps, goMemberNav } = useChromeSession();
  const isAiOpen = useAiChatStore((s) => s.isOpen);
  const toggleAiChat = useAiChatStore((s) => s.toggle);
  const isPhoneLayout = useMediaQuery(PHONE_LAYOUT_MQ);
  const openCourseTab = useAiChatStore((s) => s.openCourseTab);
  const aiExploreCourse = useAiCourseStore((s) => s.exploreCourse);

  useStatPageView();

  useEffect(() => {
    if (!location.state?.focusSearch) return;
    window.requestAnimationFrame(() => {
      document.getElementById('tour-search')?.focus();
    });
  }, [location.state]);

  useEffect(() => {
    if (location.state?.navId === 'visits') {
      navigate('/visits', { replace: true });
    }
  }, [location.state, navigate]);

  const {
    hoveredDistrictId,
    selectedDistrictId,
    selectedLandmarkId,
    activeTheme,
    activeCourseId,
    isCoursePanelOpen,
    isDetailPanelOpen,
    setHoveredDistrict,
    selectDistrict,
    focusDistrict,
    selectLandmark,
    clearSelection,
    setActiveTheme,
    openCourse,
    closeCoursePanel,
    closeDetailPanel,
  } = useExploreStore();

  useEffect(() => {
    const reveal = location.state?.stampReveal;
    if (!reveal?.landmarkKey) return;
    if (reveal.regionId) focusDistrict(reveal.regionId);
    const current = useStampRevealStore.getState().reveal;
    if (current?.landmarkKey !== reveal.landmarkKey) {
      setReveal(reveal);
    }
    queryClient.invalidateQueries({ queryKey: ['stampLandmarkStates'] });
    navigate(
      { pathname: location.pathname, search: location.search },
      { replace: true, state: {} },
    );
  }, [focusDistrict, location.pathname, location.search, location.state, navigate, queryClient, setReveal]);

  useEffect(() => {
    const districtId = location.state?.focusDistrict;
    if (!districtId) return;
    focusDistrict(districtId);
    navigate(
      { pathname: location.pathname, search: location.search },
      { replace: true, state: {} },
    );
  }, [focusDistrict, location.pathname, location.search, location.state, navigate]);

  const weather = useWeather(selectedDistrictId);
  const calendar = useMapCalendarMonth();

  const {
    selectedDistrict,
    searchedLandmarks,
    searchSuggestions: localSearchSuggestions,
    selectedLandmark,
    districtDetails,
    landmarkPins,
    spotlightPins,
    isAttractionsLoading,
    isAttractionsError,
    isUsingFallback,
    isUsingCuratedFallback,
  } = useMainPageExplore(searchValue, placeTypeId);

  const todayRecommendationsQuery = useTodayRecommendationsQuery();
  const todayCourseQuery = useTodayCourseQuery();
  const fallbackHeroRecommendations = useMemo(
    () => buildHeroRecommendations(mockLandmarks, mockDistricts),
    [],
  );
  const liveHeroRecommendations = useMemo(
    () =>
      mapTodayRecommendationsToHeroPlaces(
        todayRecommendationsQuery.data,
        mockLandmarks,
        mockDistricts,
      ),
    [todayRecommendationsQuery.data],
  );
  const isSpotlightFromServer = liveHeroRecommendations.length > 0;
  const heroRecommendations = isSpotlightFromServer
    ? liveHeroRecommendations
    : todayRecommendationsQuery.isLoading
      ? []
      : fallbackHeroRecommendations;

  const ktoSearchQuery = useKtoSearchQuery(searchValue, {
    contentTypeId: placeTypeId,
    districtId: selectedDistrictId,
    limit: KTO_SEARCH_RESULT_LIMIT,
  });

  const { festivals, festivalsByDistrict } = useFestivalsQuery({
    withinDays: calendar.withinDays,
    year: calendar.year,
    month: calendar.month,
  });

  const visibleFestivals = useMemo(() => {
    if (!selectedDistrictId) return festivals;
    return festivalsByDistrict[selectedDistrictId] ?? [];
  }, [festivals, festivalsByDistrict, selectedDistrictId]);

  const festivalCountByDistrict = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(festivalsByDistrict).map(([id, items]) => [
          id,
          items.length,
        ]),
      ),
    [festivalsByDistrict],
  );

  const mapDistrictDetails = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(districtDetails).map(([id, info]) => [
          id,
          { ...info, festivals: festivalsByDistrict[id] ?? [] },
        ]),
      ),
    [districtDetails, festivalsByDistrict],
  );

  const selectedFestival = useMemo(() => {
    if (!selectedLandmarkId) return null;
    return (
      festivals.find(
        (festival) => String(festival.contentId) === String(selectedLandmarkId),
      ) ?? null
    );
  }, [festivals, selectedLandmarkId]);

  const selectedPlace = useExploreStore((s) => s.selectedPlace);
  const detailLandmark = selectedLandmark ?? toFestivalPlace(selectedFestival)
    ?? (selectedPlace && String(selectedPlace.contentId || selectedPlace.id) === String(selectedLandmarkId) ? selectedPlace : null)
    ?? (selectedLandmarkId ? { contentId: selectedLandmarkId, name: '' } : null);

  /**
   * API 검색 결과가 있으면 우선 사용하고, 구·군 로컬 제안은 앞에 유지.
   * API 실패·빈 배열이면 로컬 연관검색만 사용.
   */
  const searchSuggestions = useMemo(() => {
    const local = localSearchSuggestions ?? [];
    const apiHits = ktoSearchQuery.data ?? [];
    const districtHits = local.filter((item) => item.type === 'district');

    if (apiHits.length > 0) {
      const seen = new Set(districtHits.map((item) => item.id));
      const merged = [...districtHits];
      for (const hit of apiHits) {
        if (seen.has(hit.id)) continue;
        seen.add(hit.id);
        merged.push(hit);
      }
      return merged.slice(0, KTO_SEARCH_RESULT_LIMIT + districtHits.length);
    }

    if (placeTypeId) {
      return local.filter(
        (item) =>
          item.type === 'district' ||
          String(item.landmark?.contentTypeId ?? '') === String(placeTypeId),
      );
    }

    return local;
  }, [localSearchSuggestions, ktoSearchQuery.data, placeTypeId]);

  const districtCourse = useMemo(
    () => getCourseByDistrictId(selectedDistrictId),
    [selectedDistrictId],
  );

  const todayCourse = useMemo(
    () => toExploreCourse(todayCourseQuery.data, AI_TODAY_COURSE_ID),
    [todayCourseQuery.data],
  );

  const activeCourse = useMemo(() => {
    if (activeCourseId === AI_GENERATED_COURSE_ID) {
      return aiExploreCourse;
    }
    if (activeCourseId === AI_TODAY_COURSE_ID) {
      return todayCourse;
    }
    return getCourseById(activeCourseId) ?? (isCoursePanelOpen ? districtCourse : null);
  }, [activeCourseId, aiExploreCourse, todayCourse, isCoursePanelOpen, districtCourse]);

  const monthCourse = useMemo(
    () =>
      pickCourseForCalendarMonth({
        festivalsByDistrict,
        selectedDistrictId,
        getCourseByDistrictId,
      }),
    [festivalsByDistrict, selectedDistrictId],
  );

  const featuredCourse = calendar.isCurrentMonth
    ? (aiExploreCourse ?? todayCourse ?? districtCourse ?? null)
    : (aiExploreCourse ?? monthCourse ?? districtCourse ?? null);

  const localizedFeaturedCourse = useMemo(
    () => translateCourse(t, featuredCourse),
    [t, featuredCourse],
  );
  const localizedActiveCourse = useMemo(
    () => translateCourse(t, activeCourse),
    [t, activeCourse],
  );

  /** 코스 패널 열림 → 정류장 순서 숫자 핀 / 닫힘 → 일반 명소 핀 */
  const mapLandmarkPins = useMemo(() => {
    if (isCoursePanelOpen && activeCourse) {
      return buildCoursePins(activeCourse, [
        ...mockLandmarks,
        ...searchedLandmarks,
      ]);
    }
    return landmarkPins;
  }, [isCoursePanelOpen, activeCourse, landmarkPins, searchedLandmarks]);

  const mapSpotlightPins = isCoursePanelOpen ? [] : spotlightPins;

  const handleToolbarAction = (actionId) => {
    if (actionId === 'reset') {
      clearSelection();
      mapCameraResetView();
      setActiveNavId('explore');
      return;
    }

    if (actionId === 'zoomIn') {
      mapCameraZoomIn();
      return;
    }

    if (actionId === 'zoomOut') {
      mapCameraZoomOut();
      return;
    }

    if (actionId === 'mapView') {
      if (isCoursePanelOpen && activeCourse?.id && !getPlaceMapId(detailLandmark)) {
        navigate(`/course/${activeCourse.id}/map`);
        return;
      }

      const place = resolveToolbarMapPlace({
        detailLandmark,
        searchedLandmarks,
        selectedDistrictId,
        heroRecommendations,
      });
      const targetId = getPlaceMapId(place);
      if (!targetId) return;

      trackStat({
        eventType: STAT_EVENTS.MENU_VIEW,
        menuId: 'mapView',
        contentId: place?.contentId != null ? String(place.contentId) : null,
        districtId: place?.districtId ?? selectedDistrictId,
        source: STAT_SOURCE.MAP,
      });
      navigate(`/map/${targetId}`, {
        state: toMapPageState(place, {
          districtId: place?.districtId ?? selectedDistrictId,
        }),
      });
    }
  };

  const handleSelectLandmark = (landmark, source = STAT_SOURCE.LIST) => {
    selectLandmark(landmark);
    trackStat({
      eventType: STAT_EVENTS.POI_VIEW,
      districtId: landmark?.districtId || selectedDistrictId,
      contentId: landmark?.contentId != null ? String(landmark.contentId) : null,
      source,
    });
  };

  const handleSelectSearchSuggestion = (suggestion) => {
    if (!suggestion) return;

    trackStat({
      eventType: STAT_EVENTS.SEARCH_SUBMIT,
      keyword: suggestion.label,
      districtId: suggestion.districtId || selectedDistrictId,
      contentId: suggestion.landmark?.contentId
        ? String(suggestion.landmark.contentId)
        : null,
      source: STAT_SOURCE.SUGGESTION,
    });

    if (suggestion.type === 'district') {
      focusDistrict(suggestion.districtId);
      setSearchValue(suggestion.label);
      setActiveNavId('explore');
      trackStat({
        eventType: STAT_EVENTS.DISTRICT_SELECT,
        districtId: suggestion.districtId,
        source: STAT_SOURCE.SUGGESTION,
      });
      return;
    }

    if (suggestion.type === 'landmark' && suggestion.landmark) {
      handleSelectLandmark(suggestion.landmark, STAT_SOURCE.SUGGESTION);
      setSearchValue(suggestion.label);
      setActiveNavId('explore');
    }
  };

  const handleSearchSubmit = (keyword) => {
    trackStat({
      eventType: STAT_EVENTS.SEARCH_SUBMIT,
      keyword,
      districtId: selectedDistrictId,
      source: STAT_SOURCE.FORM,
    });
  };

  const handleSelectRealtimeKeyword = (keyword) => {
    setSearchValue(keyword);
    setActiveNavId('explore');
    trackStat({
      eventType: STAT_EVENTS.SEARCH_SUBMIT,
      keyword,
      districtId: selectedDistrictId,
      source: STAT_SOURCE.REALTIME_RANK,
    });
    window.requestAnimationFrame(() => {
      document.getElementById('tour-search')?.focus();
    });
  };

  const handleSelectRecommendation = (place) => {
    trackStat({
      eventType: STAT_EVENTS.RECOMMENDATION_CLICK,
      districtId: place?.districtId || selectedDistrictId,
      contentId: place?.contentId != null ? String(place.contentId) : null,
      source: STAT_SOURCE.RECOMMEND,
    });
    if (place) {
      selectLandmark(place);
    }
  };

  const handleSelectFestival = (festival) => {
    const place = toFestivalPlace(festival);
    if (!place) return;
    trackStat({
      eventType: STAT_EVENTS.FESTIVAL_CLICK,
      districtId: place.districtId || selectedDistrictId,
      contentId: place.contentId != null ? String(place.contentId) : null,
      source: STAT_SOURCE.FESTIVAL,
    });
    handleSelectLandmark(place, STAT_SOURCE.FESTIVAL);
  };

  const handleExploreMap = () => {
    clearSelection();
    if (isPhoneLayout) {
      document.getElementById('district-quick-title')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else {
      mapCameraResetView();
    }
    setActiveNavId('explore');
    trackStat({
      eventType: STAT_EVENTS.MENU_VIEW,
      menuId: 'explore',
      source: 'cta',
    });
  };

  const handleTodayRecommend = () => {
    setActiveTheme(activeTheme === '데이트' ? null : '데이트');
    setActiveNavId('explore');
    trackStat({
      eventType: STAT_EVENTS.MENU_VIEW,
      menuId: 'explore',
      source: 'cta',
    });
  };

  /** 추천 코스 열기: 구 focus + 정류장 패널 + 첫 명소 상세 */
  const handleCourseExpand = () => {
    const target = featuredCourse;
    if (!target?.id || !target.stops?.length) return;

    openCourse(target.id, target.districtId);
    setActiveNavId('explore');
    setActiveTheme(target.theme ?? null);
    trackStat({
      eventType: STAT_EVENTS.COURSE_OPEN,
      districtId: target.districtId,
      courseId: target.id,
      theme: target.theme,
      source: 'panel',
    });

    const firstStop = target.stops[0];
    if (firstStop?.contentId) {
      selectLandmark({
        ...firstStop,
        contentId: String(firstStop.contentId),
        name: firstStop.name || firstStop.title || '',
        title: firstStop.title || firstStop.name || '',
      });
    }
  };

  const handleSelectCourseStop = (stop) => {
    if (!stop?.contentId) return;
    selectLandmark({
      ...stop,
      contentId: String(stop.contentId),
      name: stop.name || stop.title || '',
      title: stop.title || stop.name || '',
    });
    trackStat({
      eventType: STAT_EVENTS.POI_VIEW,
      districtId: selectedDistrictId,
      contentId: String(stop.contentId),
      courseId: activeCourseId,
      source: 'course_stop',
    });
  };

  const handleNavItem = (navId) => {
    setActiveNavId(navId);
    trackStat({
      eventType: STAT_EVENTS.MENU_VIEW,
      menuId: navId,
      districtId: selectedDistrictId,
    });

    if (goMemberNav(navId)) {
      return;
    }

    if (navId === 'explore') {
      closeCoursePanel();
      clearSelection();
      mapCameraResetView();
      return;
    }
  };

  const handleSelectDistrict = (districtId) => {
    trackStat({
      eventType: STAT_EVENTS.DISTRICT_SELECT,
      districtId,
      source: STAT_SOURCE.LIST,
    });
    focusDistrict(districtId);
  };

  const handleDistrictClick = (districtId) => {
    trackStat({
      eventType: STAT_EVENTS.DISTRICT_SELECT,
      districtId,
      source: STAT_SOURCE.MAP,
    });
    selectDistrict(districtId);
  };

  const handleThemeChange = (theme) => {
    setActiveTheme(theme);
    if (theme) {
      trackStat({
        eventType: STAT_EVENTS.THEME_SELECT,
        theme,
        districtId: selectedDistrictId,
      });
    }
  };

  const handlePlaceTypeChange = (nextTypeId) => {
    setPlaceTypeId(nextTypeId);
    trackStat({
      eventType: STAT_EVENTS.PLACE_TYPE_SELECT,
      placeTypeId: nextTypeId || 'all',
      districtId: selectedDistrictId,
    });
  };

  const explorePanel = (
          <LeftExplorePanel
            compact={isPhoneLayout}
            searchValue={searchValue}
            onSearchChange={(e) => setSearchValue(e.target.value)}
            searchSuggestions={searchSuggestions}
            onSelectSearchSuggestion={handleSelectSearchSuggestion}
            onSearchSubmit={handleSearchSubmit}
            onSelectRealtimeKeyword={handleSelectRealtimeKeyword}
            placeTypeId={placeTypeId}
            onPlaceTypeChange={handlePlaceTypeChange}
            isSearchLoading={
              Boolean(searchValue.trim()) && ktoSearchQuery.isFetching
            }
            activeTheme={activeTheme}
            onThemeChange={handleThemeChange}
            selectedDistrict={selectedDistrict}
            landmarks={searchedLandmarks}
            selectedLandmarkId={selectedLandmarkId}
            onSelectLandmark={handleSelectLandmark}
            onViewAll={clearSelection}
            onExploreMap={handleExploreMap}
            onTodayRecommend={handleTodayRecommend}
            heroRecommendations={heroRecommendations}
            spotlightWeather={
              isSpotlightFromServer
                ? todayRecommendationsQuery.data?.weather
                : null
            }
            isSpotlightLoading={todayRecommendationsQuery.isLoading}
            isSpotlightFromServer={isSpotlightFromServer}
            onSelectRecommendation={handleSelectRecommendation}
            districts={mockDistricts}
            onSelectDistrict={handleSelectDistrict}
            festivals={visibleFestivals}
            festivalCountByDistrict={festivalCountByDistrict}
            festivalMonth={calendar.month}
            onSelectFestival={handleSelectFestival}
            isLoading={isAttractionsLoading}
            isError={isAttractionsError}
            isUsingFallback={isUsingFallback}
            isUsingCuratedFallback={isUsingCuratedFallback}
          />
  );

  const courseBar = (
          <BottomInfoBar
            title={
              aiExploreCourse
                ? t('course.recommended')
                : calendar.isCurrentMonth
                  ? t('course.today')
                  : t('course.month', { month: calendar.month })
            }
            courseName={localizedFeaturedCourse?.courseName}
            routeLabel={localizedFeaturedCourse?.routeLabel}
            themeLabel={localizedFeaturedCourse?.themeLabel}
            placeCount={localizedFeaturedCourse?.placeCount}
            duration={localizedFeaturedCourse?.duration}
            loading={
              calendar.isCurrentMonth
              && !localizedFeaturedCourse
              && (todayCourseQuery.isFetching || todayCourseQuery.isGenerating)
            }
            unavailable={
              !localizedFeaturedCourse
              && (calendar.isCurrentMonth
                ? todayCourseQuery.isFetched
                  && !todayCourseQuery.isFetching
                  && !todayCourseQuery.isGenerating
                : true)
            }
            onExpand={() => {
              if (aiExploreCourse || !featuredCourse) {
                openCourseTab();
                return;
              }
              handleCourseExpand();
            }}
          />
  );

  return (
    <div className={styles.page} data-layout={isPhoneLayout ? 'phone' : undefined}>
      <main
        id='main-content'
        className={styles.hero}
        data-layout={isPhoneLayout ? 'phone' : undefined}
        tabIndex='-1'
      >
        <div
          className={styles.bg}
          data-season={seasonIdFromMonth(calendar.month) || undefined}
          aria-hidden
        />

        <div className={styles.nav}>
          <TopNavigation
            navItems={navLinks}
            activeNavId={activeNavId}
            onNavItem={handleNavItem}
            onSearch={() => {
              trackStat({ eventType: STAT_EVENTS.MENU_VIEW, menuId: 'search' });
              document.getElementById('tour-search')?.focus();
            }}
            onFavorites={() => {
              trackStat({ eventType: STAT_EVENTS.MENU_VIEW, menuId: 'favorites' });
              setIsFavoritesOpen(true);
            }}
            onAiAssistant={toggleAiChat}
            aiAssistantOpen={isAiOpen}
            favoriteCount={favoriteItems.length}
            {...navAuthProps}
          />
        </div>

        {isPhoneLayout ? (
          <div className={styles.phoneRibbon}>
            <WeatherBadge
              title={weather.regionLabel}
              temp={weather.temp}
              label={weather.label}
              fineDust={weather.fineDust}
            />
            <MapMonthStrip
              months={calendar.months}
              year={calendar.year}
              month={calendar.month}
              eventCount={festivals.length}
              onSelect={calendar.setMonth}
            />
          </div>
        ) : null}

        <div className={styles.left}>
          {isPhoneLayout ? (
            explorePanel
          ) : (
            <MobileExploreSheet
              key={selectedDistrictId ?? 'all-districts'}
              initialSnap={selectedDistrictId ? 'full' : 'mid'}
            >
              {explorePanel}
            </MobileExploreSheet>
          )}
        </div>

        {isPhoneLayout && isCoursePanelOpen && activeCourse ? (
          <CourseStopsPanel
            course={localizedActiveCourse}
            activeStopId={selectedLandmarkId}
            onSelectStop={handleSelectCourseStop}
            onViewRoute={() => navigate(`/course/${activeCourse.id}/map`)}
            onClose={closeCoursePanel}
          />
        ) : null}

        {isPhoneLayout ? <div className={styles.phoneCourse}>{courseBar}</div> : null}

        {isPhoneLayout ? null : (
          <>
            <div className={styles.mapArea}>
              <div className={styles.map}>
                <Suspense fallback={<Skeleton variant='map' />}>
                  <ThreeCanvasBackground
                    selectedDistrict={selectedDistrictId}
                    hoveredDistrict={hoveredDistrictId}
                    onDistrictClick={handleDistrictClick}
                    onDistrictHover={setHoveredDistrict}
                    landmarkPins={mapLandmarkPins}
                    spotlightPins={mapSpotlightPins}
                    onLandmarkClick={(landmark) =>
                      handleSelectLandmark(landmark, STAT_SOURCE.MAP)
                    }
                    districtDetails={mapDistrictDetails}
                    selectedLandmarkId={selectedLandmarkId}
                    floatAnimation={false}
                    seasonMonth={calendar.month}
                    weatherLabel={weather.label}
                  />
                </Suspense>
              </div>
              {stampReveal ? (
                <p className={styles.revealHint} role='status'>
                  {cameraSettled
                    ? t('stamp.building', {
                        name:
                          translatePlaceName(t, stampReveal, stampReveal.placeName) ||
                          t('stamp.landmarkFallback'),
                      })
                    : t('stamp.moving', {
                        name:
                          translatePlaceName(t, stampReveal, stampReveal.placeName) ||
                          t('stamp.landmarkFallback'),
                      })}
                </p>
              ) : null}

              {isCoursePanelOpen && activeCourse && (
                <CourseStopsPanel
                  course={localizedActiveCourse}
                  activeStopId={selectedLandmarkId}
                  onSelectStop={handleSelectCourseStop}
                  onViewRoute={() => navigate(`/course/${activeCourse.id}/map`)}
                  onClose={closeCoursePanel}
                />
              )}

              <div className={styles.mapHudLeft}>
                <WeatherBadge
                  title={weather.regionLabel}
                  temp={weather.temp}
                  label={weather.label}
                  fineDust={weather.fineDust}
                />
                <MapMonthStrip
                  months={calendar.months}
                  year={calendar.year}
                  month={calendar.month}
                  eventCount={festivals.length}
                  onSelect={calendar.setMonth}
                />
              </div>

              <div className={styles.bottom}>{courseBar}</div>
            </div>

            <div
              className={`${styles.right} ${isDetailPanelOpen ? styles.rightWithDetail : ''}`}
            >
              <RightToolbar onAction={handleToolbarAction} />
            </div>
          </>
        )}

        {isDetailPanelOpen && (
          <LandmarkDetailPanel landmark={detailLandmark} onClose={closeDetailPanel} />
        )}

        {isFavoritesOpen && (
          <FavoritesPanel
            items={favoriteItems}
            onClose={() => setIsFavoritesOpen(false)}
            onSelect={(item) => {
              setIsFavoritesOpen(false);
              handleSelectLandmark(item);
            }}
          />
        )}
      </main>

      <AiChatWidget
        districtId={selectedDistrictId}
        contentId={
          detailLandmark?.contentId
            ? String(detailLandmark.contentId)
            : null
        }
        placeTitle={
          detailLandmark?.name || detailLandmark?.title || null
        }
      />

      <PublicFooter />
    </div>
  );
}

export default MainPage;
