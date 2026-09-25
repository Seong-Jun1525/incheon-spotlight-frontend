/**
 * useCtpvCdListQuery.js — 전국 시도(ctpvCd) 법정코드 목록 조회 훅
 * - fetchCtpvCdList 호출, queryKey: ['common', 'ctpvCdList']
 * - 거의 변하지 않는 공통 코드라 staleTime 1일 / gcTime 7일, 재시도 1회
 */
import { useQuery } from '@tanstack/react-query';
import { fetchCtpvCdList } from '../../api/commonApi';

export function useCtpvCdListQuery(options = {}) {
  return useQuery({
    queryKey: ['common', 'ctpvCdList'],
    queryFn: fetchCtpvCdList,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    retry: 1,
    ...options,
  });
}
