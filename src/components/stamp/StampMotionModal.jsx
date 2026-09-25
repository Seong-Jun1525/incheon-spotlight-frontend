/**
 * StampMotionModal.jsx — 스탬프 획득 시 도장 찍기 연출을 보여주는 모달
 * - StampSealScene을 lazy 로드하고 약 1.6초 후(또는 모션 축소 설정 시 즉시) 안내 문구로 전환
 * - Escape·포커스 트랩을 처리하고 닫으면 onClose로 미확인 모션을 확인 처리
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { districtLabels } from '../../data/incheonDistricts';
import styles from './StampMotionModal.module.scss';

const StampSealScene = lazy(() =>
  import('./StampSealScene').then((module) => ({ default: module.StampSealScene })),
);

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

export function StampMotionModal({ items = [], onClose }) {
  useUiLanguage();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const titleId = useId();
  const [motionDone, setMotionDone] = useState(false);

  useEffect(() => {
    setMotionDone(prefersReducedMotion());
    const id = window.setTimeout(() => setMotionDone(true), 1600);
    return () => window.clearTimeout(id);
  }, [items]);

  useEffect(() => {
    if (!items.length) return undefined;
    const previous = document.activeElement;
    closeRef.current?.focus();

    function onKey(event) {
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll('button, a[href]');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [items, onClose]);

  if (!items.length) return null;

  const regionClears = items.filter((item) => item.regionCompleted);
  const heading =
    items.length === 1
      ? `${items[0].placeName} 건설 준비 완료`
      : `${items.length}개 랜드마크 건설 준비 완료`;

  return (
    <div className={styles.overlay}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
      >
        <p className={styles.eyebrow}>{uiText("스탬프 획득 · 랜드마크 건설")}</p>
        <h2 id={titleId}>{uiText(heading)}</h2>
        <p>{uiText("방문 인증이 완료됐어요. 도장이 찍히면 3D 지도로 이동해 공사현장을 실제 랜드마크로 완성해 보세요.")}</p>
        <div className={styles.stage} aria-hidden='true'>
          <Suspense fallback={null}>
            <StampSealScene
              placeName={items[0]?.placeName}
              reducedMotion={prefersReducedMotion()}
              onPlayed={() => setMotionDone(true)}
            />
          </Suspense>
          <span className={styles.stageCaption}>{uiText("도장 완료 → 3D 랜드마크 건설")}</span>
        </div>
        {items.length > 1 ? (
          <ul className={styles.stamps}>
            {items.map((item) => (
              <li key={item.stampId} className={styles.stamp}>
                <strong>{uiText(item.placeName)}</strong>
                <small>{uiText(districtLabels[item.regionId] || item.regionName)}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.placeHint}>
            {uiText(districtLabels[items[0].regionId] || items[0].regionName)}
          </p>
        )}
        {regionClears.length > 0 ? (
          <p className={styles.clear} role='status'>
            {regionClears.map((item) => item.regionName).join(', ')}{uiText("스탬프북을 완주했습니다.")}</p>
        ) : null}
        <div className={styles.actions}>
          <button
            ref={closeRef}
            type='button'
            onClick={() => onClose({ goToMap: true })}
            disabled={!motionDone}
          >{uiText("3D 지도에서 지금 건설하기")}</button>
          <Link to='/mypage/passport' onClick={() => onClose()}>{uiText("여행 여권 보기")}</Link>
          <button type='button' className={styles.later} onClick={() => onClose()}>{uiText("나중에")}</button>
        </div>
      </div>
    </div>
  );
}
