/**
 * useKtoSearchQuery.js — TourAPI searchKeyword2 프록시 키워드 검색 훅
 * - 입력 키워드를 디바운스한 뒤 GET /api/kto/search 호출, 결과를 정규화해 limit개 반환
 * - queryKey: ['ktoSearch', 언어, 디바운스 키워드, contentTypeId, sggCd, limit], staleTime 3분, 재시도 없음
 * - 인천(ctpvCd) 범위로 고정하고 districtId는 sggCd로 변환, 키워드가 비면 비활성
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchKtoSearch } from '../../api/kto/searchApi';
import {
  KTO_SEARCH_DEBOUNCE_MS,
  KTO_SEARCH_RESULT_LIMIT,
} from '../../constants/exploreConstants';
import { INCHEON_CTPV_CODE } from '../../constants/legalDistrictConstants';
import { getDistrictSggCd } from '../../services/districtLegalCodeService';
import { useDistrictLegalCodeMap } from '../useDistrictLegalCodeMap';
import { normalizeSearchResults } from '../../utils/placeNormalize';
import { useAppLanguage } from '../useAppLanguage';

/**
 * TourAPI searchKeyword2 프록시 검색 훅.
 *
 * - keyword debounce 후 GET /api/kto/search
 * - 백엔드 미구현 시 빈 배열 (호출측에서 로컬 폴백)
 *
 * @param {string} keyword
 * @param {{
 *   contentTypeId?: string | null,
 *   districtId?: string | null,
 *   enabled?: boolean,
 *   limit?: number,
 * }} [options]
 */
export function useKtoSearchQuery(
  keyword,
  {
    contentTypeId = null,
    districtId = null,
    enabled = true,
    limit = KTO_SEARCH_RESULT_LIMIT,
  } = {},
) {
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword.trim());
  const { districtLegalCodeMap, isReady } = useDistrictLegalCodeMap();
  const language = useAppLanguage();

  useEffect(() => {
    const next = keyword.trim();
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(next);
    }, KTO_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [keyword]);

  const sggCd =
    districtId && isReady
      ? getDistrictSggCd(districtLegalCodeMap, districtId)
      : null;

  const canSearch = enabled && debouncedKeyword.length >= 1;

  return useQuery({
    queryKey: [
      'ktoSearch',
      language,
      debouncedKeyword,
      contentTypeId ?? 'all',
      sggCd ?? 'incheon',
      limit,
    ],
    queryFn: async () => {
      const raw = await fetchKtoSearch({
        keyword: debouncedKeyword,
        contentTypeId,
        ctpvCd: INCHEON_CTPV_CODE,
        sggCd: sggCd || undefined,
        numOfRows: limit,
      });
      return normalizeSearchResults(raw).slice(0, limit);
    },
    enabled: canSearch,
    staleTime: 1000 * 60 * 3,
    retry: 0,
  });
}
