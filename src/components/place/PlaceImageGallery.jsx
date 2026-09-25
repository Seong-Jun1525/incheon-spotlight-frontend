/**
 * PlaceImageGallery.jsx — TourAPI 이미지 슬라이드 갤러리
 * - slides가 바뀌면 key로 내부 상태를 초기화하고, 로딩 중에는 Skeleton을 노출
 * - 이전/다음 버튼과 ← → 키로 순환 이동하며 하단 썸네일로 직접 선택 가능
 * - 로드 실패한 이미지 id를 모아 플레이스홀더 문자로 대체
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { Skeleton } from '../atoms/Skeleton';
import { useState } from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './PlaceImageGallery.module.scss';

/**
 * TourAPI detailImage2 기반 이미지 갤러리.
 *
 * - slides: { id, originUrl, smallUrl }[]
 * - 비어 있으면 placeholder 문자 표시
 * - 키보드 ← → 지원
 */
export function PlaceImageGallery({
  slides = [],
  alt = '',
  placeholderChar = 'I',
  className,
  isLoading = false,
}) {
  useUiLanguage();
  const galleryKey = slides.map((slide) => slide.id).join('|');
  if (isLoading && slides.length === 0) return <Skeleton variant='media' className={className} />;

  return (
    <PlaceImageGalleryContent
      key={galleryKey}
      slides={slides}
      alt={uiText(alt)}
      placeholderChar={placeholderChar}
      className={className}
    />
  );
}

function PlaceImageGalleryContent({ slides, alt, placeholderChar, className }) {
  useUiLanguage();
  const [index, setIndex] = useState(0);
  const [brokenIds, setBrokenIds] = useState(() => new Set());

  const safeIndex = slides.length === 0 ? 0 : Math.min(index, slides.length - 1);
  const current = slides[safeIndex] ?? null;
  const currentBroken = current ? brokenIds.has(current.id) : true;
  const showImage = Boolean(current?.originUrl) && !currentBroken;
  const hasMultiple = slides.length > 1;

  const go = (delta) => {
    if (!hasMultiple) return;
    setIndex((prev) => (prev + delta + slides.length) % slides.length);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
    }
  };

  return (
    <div
      className={clsx(styles.root, className)}
      tabIndex={hasMultiple ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-roledescription='carousel'
      aria-label={uiText(`${alt || '명소'} 이미지 갤러리`)}
    >
      {showImage ? (
        <img
          className={styles.hero}
          src={current.originUrl}
          alt={uiText(alt)}
          onError={() =>
            setBrokenIds((prev) => {
              const next = new Set(prev);
              next.add(current.id);
              return next;
            })
          }
        />
      ) : (
        <div className={styles.placeholder} aria-hidden>
          {uiText(placeholderChar)}
        </div>
      )}

      {hasMultiple && (
        <>
          <button
            type='button'
            className={clsx(styles.navBtn, styles.prev)}
            onClick={() => go(-1)}
            aria-label={uiText("이전 이미지")}
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <button
            type='button'
            className={clsx(styles.navBtn, styles.next)}
            onClick={() => go(1)}
            aria-label={uiText("다음 이미지")}
          >
            <ChevronRight size={18} aria-hidden />
          </button>

          <div className={styles.thumbs} role='tablist' aria-label={uiText("이미지 썸네일")}>
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type='button'
                role='tab'
                aria-selected={i === safeIndex}
                className={clsx(styles.thumb, i === safeIndex && styles.thumbActive)}
                onClick={() => setIndex(i)}
              >
                {slide.smallUrl && !brokenIds.has(slide.id) ? (
                  <img src={slide.smallUrl} alt='' loading='lazy' />
                ) : (
                  <span aria-hidden>{i + 1}</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
