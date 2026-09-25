/**
 * LazyCesiumPlaceViewer.jsx — 무거운 Cesium 뷰어를 지연 로딩으로 감싸는 래퍼
 * - loadCesiumViewer()로 CesiumPlaceViewer를 lazy import하고 props를 그대로 전달
 * - 로딩 중에는 지도용 Skeleton을 Suspense fallback으로 표시
 */
import { lazy, Suspense } from 'react';
import { Skeleton } from '../atoms/Skeleton';
import { loadCesiumViewer } from './loadCesiumViewer';

const Viewer = lazy(() => loadCesiumViewer().then((module) => ({ default: module.CesiumPlaceViewer })));

export function CesiumPlaceViewer(props) {
  return (
    <Suspense fallback={<Skeleton variant='map' label='지도를 준비하는 중…' />}>
      <Viewer {...props} />
    </Suspense>
  );
}
