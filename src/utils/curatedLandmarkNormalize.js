/**
 * TC_CURATED_LANDMARK API 응답 → 프론트 공통 랜드마크 형태로 정규화.
 */
import { resolveAssetUrl } from './resolveAssetUrl';

function pickField(source, keys, fallback = '') {
  if (!source) return fallback;
  const key = keys.find((name) => {
    const value = source[name];
    return value !== undefined && value !== null && value !== '';
  });
  return key ? source[key] : fallback;
}

function buildPinOffset(item) {
  const x = item?.pinOffsetX ?? item?.pinOffset?.[0];
  const y = item?.pinOffsetY ?? item?.pinOffset?.[1];
  const z = item?.pinOffsetZ ?? item?.pinOffset?.[2];

  if (x == null && y == null && z == null) return null;
  return [Number(x ?? 0), Number(y ?? 0.3), Number(z ?? 0)];
}

/** 백엔드 CuratedLandmarkResponse → sceneConfig 객체 */
export function toSceneConfig(item) {
  if (!item) return null;

  const pinOffset = buildPinOffset(item);
  const renderType = pickField(item, ['renderType'], 'pin');

  return {
    landmarkKey: pickField(item, ['landmarkKey'], ''),
    districtId: pickField(item, ['districtId'], ''),
    renderType,
    pinOffset,
  };
}

/** 백엔드 CuratedLandmarkResponse → 좌측 패널/3D 공통 랜드마크 객체 */
export function normalizeCuratedLandmark(item) {
  if (!item) return null;

  const contentId = pickField(item, ['contentId', 'contentid'], '');
  const landmarkKey = pickField(item, ['landmarkKey'], '');
  const name = pickField(item, ['landmarkNm', 'name', 'title'], '');

  return {
    id: landmarkKey || (contentId ? `place-${contentId}` : ''),
    contentId: contentId ? String(contentId) : '',
    districtId: pickField(item, ['districtId'], ''),
    landmarkKey,
    name,
    shortDescription: pickField(item, ['shortDesc', 'shortDescription'], ''),
    recommendReason: pickField(item, ['recommendReason'], ''),
    address: pickField(item, ['address'], ''),
    mapX: pickField(item, ['mapX', 'mapx'], null),
    mapY: pickField(item, ['mapY', 'mapy'], null),
    imageUrl: resolveAssetUrl(pickField(item, ['heroImageUrl', 'imageUrl'], '')),
    heroImageFileId: item.heroImageFileId ?? null,
    category: pickField(item, ['category'], ''),
    isSceneLandmark: Boolean(item.isSceneLandmark),
    isCurated: true,
    displayOrder: item.displayOrder ?? 0,
    sceneConfig: toSceneConfig(item),
  };
}

/** 큐레이션 배열 정규화 */
export function normalizeCuratedLandmarks(items = []) {
  return items.map(normalizeCuratedLandmark).filter(Boolean);
}

/** KTO 목록 항목에 큐레이션 필드 병합 (백엔드 미병합 폴백용) */
export function mergeCuratedIntoAttraction(attraction, curated) {
  const normalized = normalizeDistrictAttractionFromApi(attraction);
  if (!curated) return normalized;

  const curatedNorm = normalizeCuratedLandmark(curated);

  return {
    ...normalized,
    ...curatedNorm,
    id: normalized.id,
    contentId: normalized.contentId || curatedNorm.contentId,
    name: curatedNorm.name || normalized.name,
    imageUrl: curatedNorm.imageUrl || normalized.imageUrl,
    recommendReason: curatedNorm.recommendReason || normalized.recommendReason,
    shortDescription: curatedNorm.shortDescription || normalized.shortDescription,
    isCurated: true,
    sceneConfig: curatedNorm.sceneConfig,
  };
}

/** TourAPI/KTO DTO 최소 정규화 (클라이언트 병합용) */
export function normalizeDistrictAttractionFromApi(item) {
  const contentId = pickField(item, ['contentId', 'contentid'], '');
  const name = pickField(item, ['name', 'title'], '');

  return {
    ...item,
    id: item.id ?? (contentId ? `place-${contentId}` : `place-${name}`),
    contentId: contentId ? String(contentId) : '',
    name,
    shortDescription: pickField(item, ['shortDescription', 'overview'], ''),
    recommendReason: pickField(item, ['recommendReason'], ''),
    mapX: pickField(item, ['mapX', 'mapx'], null),
    mapY: pickField(item, ['mapY', 'mapy'], null),
    imageUrl: resolveAssetUrl(pickField(item, ['imageUrl', 'firstImage', 'firstimage'], '')),
    landmarkKey: pickField(item, ['landmarkKey'], ''),
    isSceneLandmark: Boolean(item.isSceneLandmark),
    isCurated: Boolean(item.isCurated),
    sceneConfig: item.sceneConfig ?? buildSceneConfigFromApiFields(item),
  };
}

function buildSceneConfigFromApiFields(item) {
  if (!item?.landmarkKey && !item?.renderType) return null;

  const pinOffset = buildPinOffset(item);
  return {
    landmarkKey: item.landmarkKey ?? '',
    districtId: item.districtId ?? '',
    renderType: item.renderType ?? 'pin',
    pinOffset,
  };
}
