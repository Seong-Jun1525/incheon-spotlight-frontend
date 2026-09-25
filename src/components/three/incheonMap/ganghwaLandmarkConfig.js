/**
 * ganghwaLandmarkConfig.js — 강화군 랜드마크 모델 배치표
 * - 전등사 1곳, 고인돌 5곳, 마니산 참성단 1곳의 모델 컴포넌트 지정
 * - 각 항목의 position/rotation/scale, 바닥 마커 반지름, 라벨 높이(labelY)
 * - 관광정보 contentId 와 앱 내부 placeId 를 함께 들고 명소 데이터와 연결
 */
import { DolmenModel } from '../landmark/ganghwa/DolmenModel';
import { JeindeungsaModel } from '../landmark/ganghwa/JeindeungsaModel';
import { ManisanModel } from '../landmark/ganghwa/ManisanModel';

/**
 * 강화군 전용 3D 랜드마크 모델 배치 설정
 * (전등사·고인돌·마니산)
 */
export const GANGHWA_LANDMARK_MODELS = [
  {
    id: 'jeondeungsa',
    contentId: '125419',
    placeId: 'lm-jeondeungsa',
    Comp: JeindeungsaModel,
    position: [36, 5.45, -34],
    rotation: [0, 2, 0],
    scale: 2,
    markerRadius: 4.8,
    labelY: 16,
  },
  {
    id: 'dolmen-southeast',
    contentId: '125418',
    placeId: 'lm-goryeo',
    Comp: DolmenModel,
    label: '강화도 고인돌 유적지',
    position: [18, 5.45, -34],
    rotation: [0, 8, 0],
    scale: 2,
    markerRadius: 5.6,
    labelY: 11,
  },
  {
    id: 'dolmen-bugeunri-west',
    contentId: '125418',
    placeId: 'lm-goryeo',
    Comp: DolmenModel,
    label: '강화 부근리 고인돌',
    position: [0, 5.45, -5],
    rotation: [0, 2, 0],
    scale: 1.8,
    markerRadius: 5.2,
    labelY: 10.5,
  },
  {
    id: 'dolmen-osangri-west',
    contentId: '125418',
    placeId: 'lm-goryeo',
    Comp: DolmenModel,
    label: '강화도 오상리 고인돌',
    position: [-4, 5.45, -15],
    rotation: [0, 2, 0],
    scale: 1.8,
    markerRadius: 5.4,
    labelY: 10.8,
  },
  {
    id: 'dolmen-bugeunri-east',
    contentId: '125418',
    placeId: 'lm-goryeo',
    Comp: DolmenModel,
    label: '강화 점골 고인돌',
    position: [-20, 5.45, -18],
    rotation: [0, 2, 0],
    scale: 1.4,
    markerRadius: 5,
    labelY: 10.2,
  },
  {
    id: 'dolmen-osangri-east',
    contentId: '125418',
    placeId: 'lm-goryeo',
    Comp: DolmenModel,
    label: '강화도 고인돌 유적',
    position: [-30, 5.45, -22],
    rotation: [0, 2, 0],
    scale: 1.4,
    markerRadius: 5,
    labelY: 10.4,
  },
  {
    id: 'manisan',
    contentId: '125420',
    placeId: 'lm-manisan',
    Comp: ManisanModel,
    position: [40, 5.45, -18],
    rotation: [0, 2, 0],
    scale: 2.3,
    markerRadius: 5,
    labelY: 13,
  },
];
