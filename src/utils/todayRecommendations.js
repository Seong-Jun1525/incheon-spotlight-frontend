/**
 * todayRecommendations.js — '오늘의 추천' API 응답을 Hero·3D 선택 흐름이 쓰는 장소 형태로 변환
 * - mapTodayRecommendationsToHeroPlaces(payload, landmarks, districts): contentId로 기존 랜드마크와 병합해 이미지·주소 등 빈 값을 폴백
 * - 추천 사유(reason)를 shortDescription·recommendReason에 채우고 districtId를 현행 행정구역 ID로 보정
 * - formatRecommendationTemperature(temperature): 기온을 반올림해 '°C' 문자열로 표기
 */
import { districtLabels, resolveDistrictId } from '../data/incheonDistricts';

/**
 * 백엔드 오늘 추천 응답을 기존 Hero/3D 선택 흐름이 쓰는 명소 형태로 변환합니다.
 * 이미지가 비어 있으면 mock 랜드마크의 대표 이미지를 폴백합니다.
 */
export function mapTodayRecommendationsToHeroPlaces(
  payload,
  landmarks = [],
  districts = [],
) {
  const recs = payload?.recommendations;
  if (!Array.isArray(recs) || recs.length === 0) {
    return [];
  }

  const byContentId = Object.fromEntries(
    landmarks
      .filter((item) => item.contentId != null)
      .map((item) => [String(item.contentId), item]),
  );
  const districtById = Object.fromEntries(
    districts.map((district) => [district.id, district]),
  );

  return recs
    .map((item) => {
      const contentId =
        item.contentId != null && String(item.contentId).trim() !== ''
          ? String(item.contentId)
          : '';
      const base = contentId ? (byContentId[contentId] ?? {}) : {};
      const districtId = resolveDistrictId(item.districtId || base.districtId);
      const district = districtId ? districtById[districtId] : null;
      const name = item.title || base.name || base.title || '';

      return {
        ...base,
        id: item.landmarkKey || base.id || contentId,
        landmarkKey: item.landmarkKey || base.landmarkKey || base.id || '',
        contentId,
        contentTypeId: item.contentTypeId || base.contentTypeId || '12',
        name,
        title: name,
        districtId,
        districtName: district?.name || districtLabels[districtId] || '',
        address: item.address || base.address || '',
        mapX: item.mapX || base.mapX || '',
        mapY: item.mapY || base.mapY || '',
        imageUrl: item.imageUrl || base.imageUrl || '',
        shortDescription: item.reason || base.shortDescription || '',
        recommendReason: item.reason || base.recommendReason || '',
        reason: item.reason || '',
        reasons: Array.isArray(item.reasons) ? item.reasons : [],
        heroTags:
          Array.isArray(item.tags) && item.tags.length > 0
            ? item.tags
            : (base.heroTags ?? []),
        score: item.score,
        rank: item.rank,
        source: item.source,
        placeType: '관광지',
      };
    })
    .filter((place) => place.contentId || place.id);
}

export function formatRecommendationTemperature(temperature) {
  if (temperature == null || Number.isNaN(Number(temperature))) {
    return '';
  }
  return `${Math.round(Number(temperature))}°C`;
}
