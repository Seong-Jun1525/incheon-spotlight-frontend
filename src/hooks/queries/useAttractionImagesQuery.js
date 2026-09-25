/**
 * useAttractionImagesQuery.js — 명소 이미지 갤러리(TourAPI detailImage2 프록시) 조회 훅
 * - 전달된 embeddedImages가 있으면 그것을 쓰고, 없으면 GET /api/kto/attractions/{contentId}/images 호출
 * - queryKey: ['attractionImages', 언어, contentId, fallbackHeroUrl, 내장 이미지 URL 키], staleTime 10분
 * - 정규화된 이미지 배열을 반환하며, 실패·빈 응답 시 fallbackHeroUrl 단일 슬라이드로 대체
 */
import { useQuery } from '@tanstack/react-query';
import { fetchAttractionImages } from '../../api/kto/imagesApi';
import { normalizeAttractionImages } from '../../utils/placeNormalize';
import { useAppLanguage } from '../useAppLanguage';

/**
 * TourAPI detailImage2 프록시 — 명소 이미지 갤러리.
 *
 * GET /api/kto/attractions/{contentId}/images
 * 실패·빈 응답 시 fallbackHeroUrl 로 단일 슬라이드 구성.
 *
 * @param {string | null | undefined} contentId
 * @param {{ fallbackHeroUrl?: string }} [options]
 */
export function useAttractionImagesQuery(
  contentId,
  { fallbackHeroUrl = '', embeddedImages = [] } = {},
) {
  const language = useAppLanguage();
  const embeddedKey = embeddedImages
    .map((image) => image.originUrl || image.originimgurl || image.imageUrl || '')
    .join('|');

  return useQuery({
    queryKey: ['attractionImages', language, contentId, fallbackHeroUrl, embeddedKey],
    queryFn: async () => {
      const embedded = normalizeAttractionImages(embeddedImages, '');
      if (embedded.length > 0) return embedded;
      const raw = await fetchAttractionImages(contentId);
      return normalizeAttractionImages(raw, fallbackHeroUrl);
    },
    enabled:
      Boolean(contentId) || Boolean(fallbackHeroUrl) || embeddedImages.length > 0,
    staleTime: 1000 * 60 * 10,
    retry: 0,
  });
}
