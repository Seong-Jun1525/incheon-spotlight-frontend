/**
 * ColorModeSync.jsx — 저장된 표시 모드를 html 테마 속성에 동기화
 * - resolved 값이 바뀌면 applyResolvedColorMode로 토큰을 적용
 * - preference가 system이면 OS 다크/라이트 변경을 구독해 store를 갱신
 */
import { useEffect } from 'react';
import { applyResolvedColorMode } from '../../constants/colorMode';
import { useColorModeStore } from '../../stores/useColorModeStore';

/**
 * Applies the stored KRDS-style display mode and follows OS color scheme
 * when the user chose "시스템 설정".
 */
export function ColorModeSync() {
  const preference = useColorModeStore((state) => state.preference);
  const resolved = useColorModeStore((state) => state.resolved);
  const syncFromSystem = useColorModeStore((state) => state.syncFromSystem);

  useEffect(() => {
    applyResolvedColorMode(resolved);
  }, [resolved]);

  useEffect(() => {
    if (preference !== 'system' || typeof window === 'undefined') return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => syncFromSystem();

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preference, syncFromSystem]);

  return null;
}
