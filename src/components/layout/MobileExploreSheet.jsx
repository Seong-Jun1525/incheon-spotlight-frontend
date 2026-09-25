/**
 * MobileExploreSheet.jsx — 모바일(≤900px)에서 탐색 패널을 감싸는 드래그 바텀 시트
 * - peek/mid/full 스냅 높이를 계산하고 포인터 드래그·방향키로 높이를 전환
 * - visualViewport 리사이즈를 추적해 시트 높이를 다시 계산
 * - 데스크톱 화면에서는 children을 그대로 반환해 시트를 끼우지 않음
 */
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './MobileExploreSheet.module.scss';

const MOBILE_MQ = '(max-width: 900px)';
const SNAPS = {
  peek: 96,
  mid: 0.42,
  full: 0.78,
};

function resolveSnapHeight(snap, vh) {
  if (snap === 'peek') return SNAPS.peek;
  if (snap === 'full') return Math.round(vh * SNAPS.full);
  return Math.round(vh * SNAPS.mid);
}

function readViewportHeight() {
  if (typeof window === 'undefined') return 800;
  return Math.round(window.visualViewport?.height ?? window.innerHeight);
}

/**
 * 모바일(≤900px)에서 좌측 탐색 패널을 드래그 가능한 바텀 시트로 감쌉니다.
 * 데스크톱에서는 children만 그대로 렌더합니다.
 */
export function MobileExploreSheet({ children, initialSnap = 'mid' }) {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false,
  );
  const [viewportHeight, setViewportHeight] = useState(readViewportHeight);
  const [snap, setSnap] = useState(initialSnap);
  const [dragOffset, setDragOffset] = useState(0);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const dragging = useRef(false);
  const sheetRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setViewportHeight(readViewportHeight());
      });
    };
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, []);

  const heightPx = (() => {
    if (!isMobile) return null;
    return Math.max(72, resolveSnapHeight(snap, viewportHeight) - dragOffset);
  })();

  const commitSnap = useCallback((deltaY, currentHeight) => {
    const vh = readViewportHeight();
    const peek = resolveSnapHeight('peek', vh);
    const mid = resolveSnapHeight('mid', vh);
    const full = resolveSnapHeight('full', vh);
    const next = currentHeight - deltaY;

    if (deltaY > 40) {
      // 아래로 드래그 → 축소
      if (currentHeight > mid + 20) setSnap('mid');
      else setSnap('peek');
    } else if (deltaY < -40) {
      // 위로 드래그 → 확대
      if (currentHeight < mid - 20) setSnap('mid');
      else setSnap('full');
    } else {
      // 가장 가까운 snap
      const dists = [
        { id: 'peek', d: Math.abs(next - peek) },
        { id: 'mid', d: Math.abs(next - mid) },
        { id: 'full', d: Math.abs(next - full) },
      ];
      dists.sort((a, b) => a.d - b.d);
      setSnap(dists[0].id);
    }
    setDragOffset(0);
  }, []);

  const onPointerDown = (e) => {
    if (!isMobile) return;
    dragging.current = true;
    startY.current = e.clientY;
    startHeight.current = heightPx ?? resolveSnapHeight(snap, window.innerHeight);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const delta = e.clientY - startY.current;
    setDragOffset(delta);
  };

  const onPointerUp = (e) => {
    if (!dragging.current) return;
    dragging.current = false;
    const delta = e.clientY - startY.current;
    commitSnap(delta, startHeight.current);
  };

  if (!isMobile) {
    return children;
  }

  return (
    <div
      ref={sheetRef}
      className={clsx(styles.sheet, styles[`snap_${snap}`])}
      style={{ height: `${heightPx}px` }}
      data-snap={snap}
    >
      <div
        className={styles.handleArea}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role='slider'
        aria-label={t('mobile.height')}
        aria-valuemin={0}
        aria-valuemax={2}
        aria-valuenow={snap === 'peek' ? 0 : snap === 'mid' ? 1 : 2}
        aria-valuetext={
          t(`mobile.${snap}`)
        }
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSnap((s) => (s === 'peek' ? 'mid' : 'full'));
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSnap((s) => (s === 'full' ? 'mid' : 'peek'));
          }
        }}
      >
        <span className={styles.handle} aria-hidden />
        <span className={styles.handleHint}>
          {snap === 'peek' ? t('mobile.open') : t('mobile.drag')}
        </span>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
