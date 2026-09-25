/**
 * useExploreStore.js — 메인 3D 탐색 화면의 전역 UI 상태(zustand)
 * - 선택 상태: hoveredDistrictId, selectedDistrictId, selectedLandmarkId, selectedPlace, activeTheme
 * - 패널 상태: isDetailPanelOpen, isCoursePanelOpen, activeCourseId
 * - 구·군 id는 resolveDistrictId로 정규화하고, 구 변경 시 랜드마크 선택을 초기화
 */
import { create } from 'zustand';
import { resolveDistrictId } from '../data/incheonDistricts';

/**
 * 메인 3D 탐색 화면의 전역 UI 상태.
 *
 * 상태 흐름:
 * 1. 구·군 클릭 (selectDistrict) → selectedDistrictId 갱신, 랜드마크 선택 초기화
 * 2. 랜드마크 클릭 (selectLandmark) → contentId 기준 선택 + 상세 패널 오픈
 * 3. 전체 보기 (clearSelection) → 모든 선택·패널 초기화
 * 4. 테마 칩 (setActiveTheme) → 좌측 패널 목록 필터
 */
export const useExploreStore = create((set) => ({
  hoveredDistrictId: null,
  selectedDistrictId: null,
  selectedLandmarkId: null,
  selectedPlace: null,
  activeTheme: null,
  activeCourseId: null,
  isCoursePanelOpen: false,
  isDetailPanelOpen: false,

  setHoveredDistrict: (id) =>
    set({ hoveredDistrictId: resolveDistrictId(id) }),

  selectDistrict: (id) =>
    set((state) => {
      const nextId = resolveDistrictId(id);
      return {
        selectedDistrictId: state.selectedDistrictId === nextId ? null : nextId,
        selectedLandmarkId: null,
        selectedPlace: null,
        isDetailPanelOpen: false,
        isCoursePanelOpen: false,
        activeCourseId: null,
      };
    }),

  focusDistrict: (id) =>
    set({
      selectedDistrictId: resolveDistrictId(id),
      selectedLandmarkId: null,
      selectedPlace: null,
      isDetailPanelOpen: false,
    }),

  selectLandmark: (value) =>
    set((state) => {
      if (value && typeof value === 'object') {
        const selectedLandmarkId = String(value.contentId || value.id || '');
        if (!selectedLandmarkId) return state;
        const districtId = value.districtId
          ? resolveDistrictId(value.districtId)
          : state.selectedDistrictId;
        return {
          selectedDistrictId: districtId ?? state.selectedDistrictId,
          selectedLandmarkId,
          selectedPlace: value,
          isDetailPanelOpen: true,
        };
      }
      const id = value == null || value === '' ? null : String(value);
      const keep =
        id &&
        state.selectedPlace &&
        (String(state.selectedPlace.contentId || '') === id ||
          String(state.selectedPlace.id || '') === id)
          ? state.selectedPlace
          : null;
      return {
        selectedLandmarkId: id,
        selectedPlace: keep,
        isDetailPanelOpen: Boolean(id),
      };
    }),

  clearSelection: () =>
    set({
      selectedDistrictId: null,
      hoveredDistrictId: null,
      selectedLandmarkId: null,
      selectedPlace: null,
      activeCourseId: null,
      isCoursePanelOpen: false,
      isDetailPanelOpen: false,
    }),

  setActiveTheme: (theme) => set({ activeTheme: theme }),

  openCourse: (courseId, districtId) =>
    set({
      activeCourseId: courseId,
      selectedDistrictId: resolveDistrictId(districtId),
      isCoursePanelOpen: true,
      isDetailPanelOpen: false,
      selectedLandmarkId: null,
      selectedPlace: null,
    }),

  closeCoursePanel: () =>
    set({ isCoursePanelOpen: false, activeCourseId: null }),

  openDetailPanel: () => set({ isDetailPanelOpen: true }),

  closeDetailPanel: () =>
    set({ isDetailPanelOpen: false, selectedLandmarkId: null, selectedPlace: null }),
}));
