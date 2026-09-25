/**
 * MainPageTemplate.jsx — 초기 메인 페이지 조립용 템플릿
 * - 내비·검색 필터·3D 배경·플로팅 컨트롤·추천 바·하단 패널·상세 드로어를 props로 조합
 * - 현재 MainPage는 자체 레이아웃을 쓰며, 이 파일은 이전 조합 구조를 보관
 */
import { TopNavigation } from '../organisms/TopNavigation';
import { SearchFilterBar } from '../molecules/SearchFilterBar';
import { FloatingMapControls } from '../molecules/FloatingMapControls';
import { FloatingQuickMenu } from '../organisms/FloatingQuickMenu';
import { TodayRecommendationMiniBar } from '../organisms/TodayRecommendationMiniBar';
import { BottomInfoPanel } from '../organisms/BottomInfoPanel';
import { DistrictSpotlightPanel } from '../organisms/DistrictSpotlightPanel';
import { PlaceDetailDrawer } from '../organisms/PlaceDetailDrawer';
import { ThreeCanvasBackground } from '../organisms/ThreeCanvasBackground';
import styles from './MainPageTemplate.module.scss';

export function MainPageTemplate({
  navItems,
  activeNavId,
  onNavItem,
  onFavorites,
  onLogin,
  searchValue,
  onSearchChange,
  categoryValue,
  onCategoryChange,
  categoryOptions,
  mapControlAction,
  places,
  selectedPlace,
  onSelectPlace,
  onMorePlaces,
  onQuickMenu,
  tourismNews,
  noticeItems,
  weather,
  onNoticeClick,
  onNewsClick,
  selectedDistrict,
  hoveredDistrict,
  onDistrictClick,
  onDistrictHover,
  landmarkPins,
  onLandmarkClick,
  districtPlaces,
  districtPanelTitle,
  onCloseDistrictPanel,
  onClearPlace,
  onDirections,
}) {
  const showDistrictPanel = Boolean(selectedDistrict && !selectedPlace);

  return (
    <div className={styles.root}>
      <div
        className={styles.bgWash}
        aria-hidden
      />

      <div className={styles.mapStage}>
        <ThreeCanvasBackground
          selectedDistrict={selectedDistrict}
          hoveredDistrict={hoveredDistrict}
          onDistrictClick={onDistrictClick}
          onDistrictHover={onDistrictHover}
          landmarkPins={landmarkPins}
          onLandmarkClick={onLandmarkClick}
        />
      </div>

      <div className={styles.navBar}>
        <TopNavigation
          navItems={navItems}
          activeNavId={activeNavId}
          onNavItem={onNavItem}
          onSearch={() => document.querySelector('input[type="search"], input')?.focus()}
          onFavorites={onFavorites}
          onLogin={onLogin}
        />
      </div>

      <div className={styles.floatCluster}>
        <div className={styles.floatSearch}>
          <SearchFilterBar
            layout='floating'
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            categoryValue={categoryValue}
            onCategoryChange={onCategoryChange}
            options={categoryOptions}
          />
        </div>

        <div className={styles.floatControls}>
          <FloatingMapControls onAction={mapControlAction} />
        </div>
      </div>

      <div className={styles.floatQuickWrap}>
        <FloatingQuickMenu onAction={onQuickMenu} />
      </div>

      <DistrictSpotlightPanel
        open={showDistrictPanel}
        title={districtPanelTitle}
        places={districtPlaces}
        selectedPlaceId={selectedPlace?.id ?? selectedPlace?.contentid}
        onSelectPlace={onSelectPlace}
        onClose={onCloseDistrictPanel}
      />

      <PlaceDetailDrawer
        place={selectedPlace}
        onClose={() => onClearPlace?.()}
        onDirections={onDirections}
      />

      <div className={styles.bottomArea}>
        <BottomInfoPanel
          tourismNews={tourismNews}
          noticeItems={noticeItems}
          weather={weather}
          onNoticeClick={onNoticeClick}
          onNewsClick={onNewsClick}
          defaultCollapsed
        />
        <TodayRecommendationMiniBar
          places={places}
          selectedPlace={selectedPlace}
          onSelectPlace={onSelectPlace}
          onViewMore={onMorePlaces}
        />
      </div>
    </div>
  );
}
