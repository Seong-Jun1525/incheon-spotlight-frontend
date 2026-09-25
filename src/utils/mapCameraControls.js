/**
 * 3D 맵 카메라 줌/리셋 컨트롤 브릿지.
 * RightToolbar ↔ ThreeCanvasBackground 간 상태 없이 연결합니다.
 */
let controls = {
  zoomIn: null,
  zoomOut: null,
  resetView: null,
};

export function registerMapCameraControls(next) {
  controls = { ...controls, ...next };
  return () => {
    controls = {
      zoomIn: null,
      zoomOut: null,
      resetView: null,
    };
  };
}

export function mapCameraZoomIn() {
  controls.zoomIn?.();
}

export function mapCameraZoomOut() {
  controls.zoomOut?.();
}

export function mapCameraResetView() {
  controls.resetView?.();
}
