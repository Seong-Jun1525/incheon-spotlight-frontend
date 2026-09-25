/**
 * useStampRevealStore.js — 스탬프 획득 후 랜드마크 건설 연출 상태(zustand)
 * - 상태: reveal(landmarkKey·regionId·placeName·demo), cameraSettled, holdForModal, completedKeys
 * - holdForModal로 모달 표시 중 연출 조기 종료를 막고, completedKeys로 재마운트 시 되돌림 방지
 * - scheduleClearReveal·clearReveal이 타이머로 연출 상태를 정리
 */
import { create } from 'zustand';

let revealClearTimer = 0;

/**
 * 스탬프 획득 후 메인 맵에서 해당 랜드마크를 포커스하고 건설 연출을 재생하기 위한 상태.
 * 스탬프 모션(TH_STAMP.MOTION_SEEN_YN)과 건설 확인(TH_LANDMARK_BUILD_SEEN)은 별개다.
 *
 * holdForModal: 스탬프 모달이 떠 있는 동안 맵이 뒤에서 건설을 끝내 버리지 않도록 막는다.
 * completedKeys: 맵 레이어가 다시 마운트되어도 방금 지은 랜드마크가 공사현장으로 돌아가지 않게 한다.
 */
export const useStampRevealStore = create((set, get) => ({
  reveal: null,
  cameraSettled: false,
  holdForModal: false,
  completedKeys: [],

  setReveal: (reveal) =>
    set((state) => {
      const landmarkKey = reveal?.landmarkKey || null;
      return {
        reveal: landmarkKey
          ? {
              landmarkKey,
              regionId: reveal.regionId ?? null,
              placeName: reveal.placeName ?? '',
              demo: Boolean(reveal.demo),
            }
          : null,
        cameraSettled: false,
        completedKeys: landmarkKey
          ? state.completedKeys.filter((key) => key !== landmarkKey)
          : state.completedKeys,
      };
    }),

  markCameraSettled: () => {
    if (!get().cameraSettled) set({ cameraSettled: true });
  },

  setHoldForModal: (holdForModal) => set({ holdForModal: Boolean(holdForModal) }),

  markComplete: (landmarkKey) => {
    if (!landmarkKey) return;
    set((state) => (
      state.completedKeys.includes(landmarkKey)
        ? state
        : { completedKeys: [...state.completedKeys, landmarkKey] }
    ));
  },

  scheduleClearReveal: (landmarkKey, delayMs = 1600) => {
    window.clearTimeout(revealClearTimer);
    revealClearTimer = window.setTimeout(() => {
      if (get().reveal?.landmarkKey === landmarkKey) {
        set({ reveal: null, cameraSettled: false });
      }
    }, delayMs);
  },

  clearReveal: () => {
    window.clearTimeout(revealClearTimer);
    set({ reveal: null, cameraSettled: false });
  },
}));
