/**
 * containElementScroll.js — 특정 요소 안의 스크롤이 페이지로 새어 나가지 않게 가둔다
 * - containElementScroll(node): wheel·touchmove를 캡처해 더 스크롤할 곳이 없을 때만 preventDefault, 해제 함수 반환
 * - 패널 내부에 중첩된 스크롤 영역끼리는 스크롤 체이닝을 허용
 */
function isVerticallyScrollable(el) {
  if (!(el instanceof HTMLElement)) return false;
  const overflowY = window.getComputedStyle(el).overflowY;
  if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') {
    return false;
  }
  return el.scrollHeight - el.clientHeight > 1;
}

function canScrollVertically(el, deltaY) {
  if (!el || deltaY === 0) return false;
  const atTop = el.scrollTop <= 0;
  const atBottom =
    el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
  if (deltaY < 0) return !atTop;
  return !atBottom;
}

function collectScrollables(start, root) {
  const found = [];
  let el =
    start instanceof Element ? start : (start?.parentElement ?? root);

  while (el && root.contains(el)) {
    if (isVerticallyScrollable(el)) found.push(el);
    if (el === root) break;
    el = el.parentElement;
  }

  if (isVerticallyScrollable(root) && !found.includes(root)) {
    found.push(root);
  }

  return found;
}

function shouldBlockPageScroll(start, root, deltaY) {
  if (deltaY === 0) return false;
  const scrollables = collectScrollables(start, root);
  return !scrollables.some((el) => canScrollVertically(el, deltaY));
}

/**
 * 요소 위의 휠/터치 스크롤이 페이지(문서)로 넘어가지 않게 가둡니다.
 * 패널 안 중첩 스크롤 영역끼리는 체이닝을 허용합니다.
 *
 * @param {HTMLElement} node
 * @returns {() => void}
 */
export function containElementScroll(node) {
  let touchY = null;

  const onWheel = (event) => {
    if (shouldBlockPageScroll(event.target, node, event.deltaY)) {
      event.preventDefault();
    }
  };

  const onTouchStart = (event) => {
    touchY = event.touches[0]?.clientY ?? null;
  };

  const onTouchMove = (event) => {
    if (touchY == null || event.touches.length !== 1) return;
    const currentY = event.touches[0].clientY;
    const deltaY = touchY - currentY;
    touchY = currentY;
    if (shouldBlockPageScroll(event.target, node, deltaY)) {
      event.preventDefault();
    }
  };

  const onTouchEnd = () => {
    touchY = null;
  };

  const wheelOpts = { passive: false, capture: true };
  const touchMoveOpts = { passive: false, capture: true };
  node.addEventListener('wheel', onWheel, wheelOpts);
  node.addEventListener('touchstart', onTouchStart, {
    capture: true,
    passive: true,
  });
  node.addEventListener('touchmove', onTouchMove, touchMoveOpts);
  node.addEventListener('touchend', onTouchEnd, { capture: true });
  node.addEventListener('touchcancel', onTouchEnd, { capture: true });

  return () => {
    node.removeEventListener('wheel', onWheel, wheelOpts);
    node.removeEventListener('touchstart', onTouchStart, { capture: true });
    node.removeEventListener('touchmove', onTouchMove, touchMoveOpts);
    node.removeEventListener('touchend', onTouchEnd, { capture: true });
    node.removeEventListener('touchcancel', onTouchEnd, { capture: true });
  };
}
