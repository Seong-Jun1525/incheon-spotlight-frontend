/**
 * useMapWheelActivation.js — 지도 영역의 휠 확대/축소 활성 여부를 제어하는 훅
 * - 사용자가 지도를 직접 클릭해 진입하기 전까지 휠 이벤트를 막아 페이지 스크롤을 유지
 * - 영역 밖 클릭·Esc·포인터 이탈 시 비활성으로 되돌림
 * - 지도 컨테이너에 연결할 ref와 현재 활성 상태를 반환
 */

import { useEffect, useRef, useState } from 'react';

/** Wheel gestures belong to the page until the user explicitly enters the map. */
export function useMapWheelActivation() {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let enabled = false;
    const update = (value) => { enabled = value; setActive(value); };
    const pointer = (event) => update(root.contains(event.target));
    const key = (event) => { if (event.key === 'Escape') update(false); };
    const leave = () => update(false);
    const wheel = (event) => {
      if (!enabled) event.stopPropagation();
    };
    window.addEventListener('pointerdown', pointer, true);
    window.addEventListener('keydown', key);
    root.addEventListener('pointerleave', leave);
    root.addEventListener('wheel', wheel, { capture: true, passive: true });
    return () => {
      window.removeEventListener('pointerdown', pointer, true);
      window.removeEventListener('keydown', key);
      root.removeEventListener('pointerleave', leave);
      root.removeEventListener('wheel', wheel, true);
    };
  }, []);
  return { ref, active };
}
