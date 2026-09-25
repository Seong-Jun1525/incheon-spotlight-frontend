/**
 * loadCesiumViewer.js — Cesium 뷰어 모듈의 동적 import를 캐싱하는 로더
 * - loadCesiumViewer: import 결과를 모듈 변수에 저장해 재사용하고, 실패 시 캐시를 비워 재시도를 허용
 * - preloadCesiumViewer: 상호작용 전 미리 불러오되 실패는 조용히 무시
 */
let viewerModule;

export function loadCesiumViewer() {
  if (!viewerModule) {
    viewerModule = import('./CesiumPlaceViewer').catch((error) => {
      viewerModule = null;
      throw error;
    });
  }
  return viewerModule;
}

export function preloadCesiumViewer() {
  // A failed speculative preload must not break the detail panel.
  void loadCesiumViewer().catch(() => {});
}
