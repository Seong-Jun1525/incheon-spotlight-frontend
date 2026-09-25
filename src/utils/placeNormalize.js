/**
 * TourAPI / 백엔드 DTO → 프론트 UI 공통 형태로 정규화.
 * camelCase / snake_case 필드명 차이를 흡수합니다.
 */
import { getKtoContentTypeLabel } from '../constants/ktoContentTypes';
import { isIncheonAddress } from './incheonAddress';
import { resolveAssetUrl } from './resolveAssetUrl';

function isPresent(value) {
  return value !== undefined && value !== null && value !== '';
}

function pick(source, keys, fallback = null) {
  if (!source) return fallback;

  const key = keys.find((name) => isPresent(source[name]));
  return key ? source[key] : fallback;
}

function joinAddress(addr1, addr2, fallbackAddress) {
  const address = [addr1, addr2].filter(isPresent).join(' ').trim();
  return address || fallbackAddress || '';
}

/** 백엔드 usageTime/restDate/parking → 패널용 operationInfo 객체 */
export function buildOperationInfo(source) {
  if (!source) return null;

  if (source.operationInfo && typeof source.operationInfo === 'object') {
    return source.operationInfo;
  }

  const rows = {
    이용시간: pick(source, ['usageTime', 'usetime'], ''),
    휴무일: pick(source, ['restDate', 'restdate'], ''),
    주차: pick(source, ['parking'], ''),
  };

  const filled = Object.fromEntries(
    Object.entries(rows).filter(([, value]) => isPresent(value)),
  );

  return Object.keys(filled).length > 0 ? filled : null;
}

/** 이미지 URL 우선순위: imageUrl → firstImage → heroImageFileId → fallback */
export function resolvePlaceImageUrl(apiData, fallbackLandmark = null) {
  const fromApi = pick(apiData, ['imageUrl', 'firstImage', 'firstimage'], '');
  const fromFileId =
    apiData?.heroImageFileId != null
      ? `/api/files/${apiData.heroImageFileId}`
      : fallbackLandmark?.heroImageFileId != null
        ? `/api/files/${fallbackLandmark.heroImageFileId}`
        : '';
  const fromFallback = fallbackLandmark?.imageUrl ?? '';

  return resolveAssetUrl(fromApi || fromFileId || fromFallback || '');
}

export function normalizePlaceDetail(apiData, fallbackLandmark = null) {
  const addr1 = pick(apiData, ['addr1'], '');
  const addr2 = pick(apiData, ['addr2'], '');
  const firstImage = pick(
    apiData,
    ['firstImage', 'firstimage'],
    fallbackLandmark?.imageUrl ?? '',
  );
  const mapX = pick(apiData, ['mapX', 'mapx'], fallbackLandmark?.mapX ?? null);
  const mapY = pick(apiData, ['mapY', 'mapy'], fallbackLandmark?.mapY ?? null);
  const imageUrl = resolvePlaceImageUrl(apiData, fallbackLandmark);
  const fallbackAddress = pick(
    apiData,
    ['address'],
    fallbackLandmark?.address ?? '',
  );

  return {
    contentId: pick(apiData, ['contentId', 'contentid'], fallbackLandmark?.contentId ?? null),
    contentTypeId: pick(
      apiData,
      ['contentTypeId', 'contenttypeid'],
      fallbackLandmark?.contentTypeId ?? null,
    ),
    title: pick(apiData, ['title', 'name'], fallbackLandmark?.name ?? ''),
    overview: pick(apiData, ['overview', 'shortDescription', 'shortDesc'], fallbackLandmark?.shortDescription ?? ''),
    homepage: pick(apiData, ['homepage'], ''),
    tel: pick(apiData, ['tel'], ''),
    addr1,
    addr2,
    address: joinAddress(addr1, addr2, fallbackAddress),
    mapX,
    mapY,
    firstImage,
    firstImage2: pick(apiData, ['firstImage2', 'firstimage2'], ''),
    imageUrl,
    recommendReason: pick(
      apiData,
      ['recommendReason'],
      fallbackLandmark?.recommendReason ?? '',
    ),
    operationInfo: buildOperationInfo(apiData ?? fallbackLandmark),
    usageTime: pick(apiData, ['usageTime', 'usetime'], ''),
    restDate: pick(apiData, ['restDate', 'restdate'], ''),
    parking: pick(apiData, ['parking'], ''),
    images: Array.isArray(apiData?.images) ? apiData.images : [],
    districtId: pick(apiData, ['districtId'], fallbackLandmark?.districtId ?? null),
  };
}

/**
 * searchKeyword2 / 목록 요약 → 검색 제안·카드 공통 형태
 * @param {object[]} apiData
 */
export function normalizeSearchResults(apiData = []) {
  const items = Array.isArray(apiData) ? apiData : [];

  return items
    .map((item) => {
      const contentId = pick(item, ['contentId', 'contentid'], '');
      const contentTypeId = pick(item, ['contentTypeId', 'contenttypeid'], '');
      const name = pick(item, ['title', 'name'], '');
      const firstImage = pick(item, ['firstImage', 'firstimage', 'imageUrl'], '');
      const addr1 = pick(item, ['addr1'], '');
      const addr2 = pick(item, ['addr2'], '');

      if (!name && !contentId) return null;

      const landmark = {
        id: contentId ? `place-${contentId}` : `search-${name}`,
        contentId: contentId ? String(contentId) : '',
        contentTypeId: contentTypeId ? String(contentTypeId) : '',
        name,
        title: name,
        shortDescription: pick(item, ['overview', 'shortDescription'], ''),
        address: joinAddress(addr1, addr2, pick(item, ['address'], '')),
        mapX: pick(item, ['mapX', 'mapx'], null),
        mapY: pick(item, ['mapY', 'mapy'], null),
        imageUrl: resolveAssetUrl(firstImage),
        districtId: pick(item, ['districtId'], null),
        category: pick(item, ['category'], ''),
      };

      return {
        type: 'landmark',
        id: `kto:${contentId || landmark.id}`,
        label: name,
        meta: getKtoContentTypeLabel(contentTypeId),
        districtId: landmark.districtId,
        contentTypeId: landmark.contentTypeId,
        landmark,
        source: 'api',
      };
    })
    .filter(Boolean);
}

/**
 * detailImage2 → 갤러리 슬라이드
 * @param {object[]} apiData
 * @param {string} [fallbackHeroUrl]
 */
export function normalizeAttractionImages(apiData = [], fallbackHeroUrl = '') {
  const items = Array.isArray(apiData) ? apiData : [];

  const fromApi = items
    .map((item, index) => {
      const originUrl = resolveAssetUrl(
        pick(item, ['originUrl', 'originimgurl', 'imageUrl'], ''),
      );
      const smallUrl = resolveAssetUrl(
        pick(item, ['smallUrl', 'smallimageurl'], originUrl),
      );
      if (!originUrl && !smallUrl) return null;

      return {
        id: pick(item, ['serialnum', 'serialNum'], String(index)),
        originUrl: originUrl || smallUrl,
        smallUrl: smallUrl || originUrl,
      };
    })
    .filter(Boolean);

  if (fromApi.length > 0) return fromApi;

  const hero = resolveAssetUrl(fallbackHeroUrl);
  if (!hero) return [];
  return [{ id: 'hero', originUrl: hero, smallUrl: hero }];
}

/**
 * locationBasedList2 주변 POI (맛집·숙박 공용)
 * @param {object[]} apiData
 */
export function normalizeNearbyPois(apiData = []) {
  const items = Array.isArray(apiData) ? apiData : [];

  return items
    .map((item) => {
      const addr1 = pick(item, ['addr1'], '');
      const addr2 = pick(item, ['addr2'], '');
      const firstImage = pick(item, ['firstImage', 'firstimage'], '');
      const contentTypeId = pick(item, ['contentTypeId', 'contenttypeid'], null);
      const address = joinAddress(addr1, addr2, pick(item, ['address'], ''));

      return {
        contentId: pick(item, ['contentId', 'contentid'], null),
        contentTypeId,
        contentTypeLabel: getKtoContentTypeLabel(contentTypeId),
        title: pick(item, ['title', 'name'], ''),
        addr1,
        address,
        mapX: pick(item, ['mapX', 'mapx'], null),
        mapY: pick(item, ['mapY', 'mapy'], null),
        dist: pick(item, ['dist'], null),
        firstImage,
        imageUrl: resolveAssetUrl(pick(item, ['imageUrl'], firstImage)),
        tel: pick(item, ['tel'], ''),
        localCurrency: pick(item, ['localCurrency'], null),
      };
    })
    .filter((item) => isIncheonAddress(item.address));
}

/** @deprecated normalizeNearbyPois 사용 권장 — 동일 스키마 */
export function normalizeNearbyRestaurants(apiData) {
  return normalizeNearbyPois(apiData);
}
