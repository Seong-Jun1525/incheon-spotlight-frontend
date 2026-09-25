/**
 * useMediaQuery.js — 미디어쿼리 일치 여부를 상태로 추적하는 훅
 * - matchMedia 리스너 등록·해제를 캡슐화하고 화면 크기 변화에 맞춰 갱신
 * - 쿼리 일치 여부를 boolean으로 반환
 */

import { useEffect, useState } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
