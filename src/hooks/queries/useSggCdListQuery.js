/**
 * useSggCdListQuery.js — 시도코드(ctpvCd) 하위 시군구 법정코드 목록 조회 훅
 * - fetchSggCdList(ctpvCd) 호출, queryKey: ['common', 'sggCdList', ctpvCd]
 * - 거의 변하지 않는 공통 코드라 staleTime 1일 / gcTime 7일, ctpvCd 없으면 비활성
 */
import { useQuery } from '@tanstack/react-query';
import { fetchSggCdList } from '../../api/commonApi';

export function useSggCdListQuery(ctpvCd, options = {}) {
  return useQuery({
    queryKey: ['common', 'sggCdList', ctpvCd],
    queryFn: () => fetchSggCdList(ctpvCd),
    enabled: Boolean(ctpvCd),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    retry: 1,
    ...options,
  });
}
