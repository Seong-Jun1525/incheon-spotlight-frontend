/**
 * mapPoiMarkers.js — Cesium 빌보드용 POI 핀 마커를 캔버스로 그려 주는 모듈
 * - resolvePoiMarkerKind: KTO 콘텐츠 타입·코스 순번을 보고 관광지/음식점/숙박/코스 마커 종류를 판별
 * - getPoiMarkerImage: 종류별 핀 도형과 lucide 아이콘(또는 순번 숫자)을 그린 캔버스를 캐싱해 반환
 * - POI_MARKER_KIND·POI_MARKER_COLORS로 마커 종류와 색상 팔레트를 함께 내보냄
 */
import { KTO_CONTENT_TYPE } from '../../constants/ktoContentTypes';

export const POI_MARKER_KIND = {
  ATTRACTION: 'attraction',
  RESTAURANT: 'restaurant',
  LODGING: 'lodging',
  COURSE: 'course',
  DEFAULT: 'default',
};

export const POI_MARKER_COLORS = {
  attraction: '#e51937',
  restaurant: '#ea580c',
  lodging: '#1d4ed8',
  course: '#e51937',
  default: '#475569',
};

const ICON_PATHS = {
  attraction: [
    'M10 18v-7',
    'M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z',
    'M14 18v-7',
    'M18 18v-7',
    'M3 22h18',
    'M6 18v-7',
  ],
  restaurant: [
    'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2',
    'M7 2v20',
    'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z',
    'M21 15v7',
  ],
  lodging: [
    'M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8',
    'M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4',
    'M12 4v6',
    'M2 18h20',
  ],
  default: ['M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0'],
};

const PIN_PATH_D =
  'M24 2C12.4 2 4 11.2 4 22.5C4 36 24 60 24 60S44 36 44 22.5C44 11.2 35.6 2 24 2Z';

const MARKER_CACHE = new Map();

function cssSize(primary) {
  return primary
    ? { width: 46, height: 60 }
    : { width: 38, height: 50 };
}

/**
 * @param {object} place
 * @param {{ primary?: boolean, order?: number | null }} [options]
 */
export function resolvePoiMarkerKind(place, { primary = false, order = null } = {}) {
  if (primary) return POI_MARKER_KIND.ATTRACTION;
  if (place?.markerKind) return place.markerKind;
  if (order) return POI_MARKER_KIND.COURSE;

  const type = String(place?.contentTypeId ?? '');
  if (type === KTO_CONTENT_TYPE.FOOD) return POI_MARKER_KIND.RESTAURANT;
  if (type === KTO_CONTENT_TYPE.LODGING) return POI_MARKER_KIND.LODGING;
  if (type === 'course') return POI_MARKER_KIND.COURSE;
  return POI_MARKER_KIND.DEFAULT;
}

function drawLucideIcon(ctx, paths, { cx, cy, size, color, extraCircles = [] }) {
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.45;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const d of paths) {
    ctx.stroke(new Path2D(d));
  }
  for (const circle of extraCircles) {
    ctx.beginPath();
    ctx.arc(circle.cx, circle.cy, circle.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMarkerCanvas(kind, { primary, order }) {
  const { width, height } = cssSize(primary);
  const dpr = Math.min(2, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const fill = POI_MARKER_COLORS[kind] ?? POI_MARKER_COLORS.default;

  ctx.save();
  ctx.scale(width / 48, height / 62);
  ctx.shadowColor = 'rgba(15, 23, 42, 0.38)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  const pinPath = new Path2D(PIN_PATH_D);
  ctx.fillStyle = fill;
  ctx.fill(pinPath);
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = '#fff';
  ctx.stroke(pinPath);

  if (order) {
    ctx.fillStyle = '#fff';
    ctx.font = '800 17px "Pretendard", "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(order), 24, 22.5);
  } else {
    drawLucideIcon(ctx, ICON_PATHS[kind] ?? ICON_PATHS.default, {
      cx: 24,
      cy: 21.5,
      size: kind === POI_MARKER_KIND.ATTRACTION ? 20 : 19,
      color: '#fff',
      extraCircles:
        kind === POI_MARKER_KIND.DEFAULT ? [{ cx: 12, cy: 10, r: 3 }] : [],
    });
  }
  ctx.restore();

  return { image: canvas, width, height };
}

/**
 * Cesium billboard 용 핀 이미지. 같은 종류는 캔버스를 재사용합니다.
 * @returns {{ image: HTMLCanvasElement, width: number, height: number }}
 */
export function getPoiMarkerImage(kind, { primary = false, order = null } = {}) {
  const key = `${kind}-${primary ? 'p' : 'n'}-${order ?? ''}`;
  const cached = MARKER_CACHE.get(key);
  if (cached) return cached;

  const marker = drawMarkerCanvas(kind, { primary, order });
  MARKER_CACHE.set(key, marker);
  return marker;
}
