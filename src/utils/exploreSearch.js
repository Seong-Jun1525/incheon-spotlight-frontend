/**
 * exploreSearch.js — 탐색 화면 검색창의 실시간 연관검색 후보 생성
 * - buildExploreSearchSuggestions(searchValue, options): 구·군과 랜드마크를 공백 제거·소문자 기준으로 매칭
 * - 완전일치 100 / 접두 80 / 포함 50 점수에 구·군 가점 10을 더해 정렬한 뒤 limit(기본 8)개 반환
 */
import { districtLabels } from '../data/incheonDistricts';
import { getDistrictSearchAliases } from '../i18n/districts.js';
import { getLandmarkSearchAliases } from '../i18n/placeLabel';
import { getLandmarkSelectionId } from './landmarkExplore';

function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/\s+/g, '');
}

function scoreMatch(label, query) {
  const normalized = normalize(label);
  if (!normalized || !query) return 0;
  if (normalized === query) return 100;
  if (normalized.startsWith(query)) return 80;
  if (normalized.includes(query)) return 50;
  return 0;
}

/**
 * 구·군 / 관광지 실시간 연관검색 후보.
 *
 * @param {string} searchValue
 * @param {{
 *   districts?: Array<{ id: string, name: string, description?: string }>,
 *   landmarks?: Array<object>,
 *   limit?: number,
 * }} [options]
 * @returns {Array<{
 *   type: 'district' | 'landmark',
 *   id: string,
 *   label: string,
 *   meta: string,
 *   districtId: string,
 *   landmark?: object,
 * }>}
 */
export function buildExploreSearchSuggestions(searchValue, options = {}) {
  const query = normalize(searchValue);
  if (!query) return [];

  const {
    districts = [],
    landmarks = [],
    limit = 8,
  } = options;

  const districtHits = districts
    .map((district) => {
      const aliases = [
        district.name,
        districtLabels[district.id],
        ...getDistrictSearchAliases(district.id),
        district.description,
      ].filter(Boolean);

      const bestScore = Math.max(
        ...aliases.map((alias) => scoreMatch(alias, query)),
        0,
      );
      if (bestScore <= 0) return null;

      return {
        type: 'district',
        id: `district:${district.id}`,
        label: district.name,
        metaKey: 'explore.areaType',
        meta: '시·군·구',
        districtId: district.id,
        score: bestScore + 10,
      };
    })
    .filter(Boolean);

  const landmarkHits = landmarks
    .map((landmark) => {
      const name = landmark.name ?? landmark.title ?? '';
      const fields = [
        name,
        ...getLandmarkSearchAliases(landmark.landmarkKey || landmark.id),
        landmark.shortDescription,
        landmark.address,
        landmark.recommendReason,
      ];
      const bestScore = Math.max(
        ...fields.map((field) => scoreMatch(field, query)),
        0,
      );
      if (bestScore <= 0) return null;

      const districtName =
        districtLabels[landmark.districtId] ?? landmark.districtName ?? '관광지';

      return {
        type: 'landmark',
        id: `landmark:${getLandmarkSelectionId(landmark)}`,
        label: name,
        meta: districtName,
        districtId: landmark.districtId,
        landmark,
        score: bestScore,
      };
    })
    .filter(Boolean);

  return [...districtHits, ...landmarkHits]
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, 'ko'))
    .slice(0, limit)
    .map(({ score, ...item }) => {
      void score;
      return item;
    });
}
