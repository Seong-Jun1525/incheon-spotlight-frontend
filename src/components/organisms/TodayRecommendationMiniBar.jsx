/**
 * TodayRecommendationMiniBar.jsx — 하단 고정 미니 바와 확장형 오늘의 추천 시트
 * - expanded 상태로 미니 바와 바텀시트 형태의 확장 뷰를 토글
 * - 접힌 상태에서는 추천 장소 이름을 한 줄 요약으로, 펼치면 PlaceCard 가로 목록으로 표시
 * - 카드 선택 시 onSelectPlace 호출 후 시트를 닫고, 더보기는 onViewMore로 연결
 */
import { useState } from 'react'
import clsx from 'clsx'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { PlaceCard } from '../molecules/PlaceCard'
import styles from './TodayRecommendationMiniBar.module.scss'

/**
 * 오늘의 추천: 기본 미니 바 + 선택적 확장(바텀 시트 스타일)
 */
export function TodayRecommendationMiniBar({
  places,
  selectedPlace,
  onSelectPlace,
  onViewMore,
  title = '오늘의 추천',
}) {
  const [expanded, setExpanded] = useState(false)

  const labels = places
    .map((p) => p.title || p.name)
    .filter(Boolean)

  const headline = labels.join(' · ')

  return (
    <>
      <div
        id="reco-sheet"
        className={clsx(styles.sheet, expanded && styles.sheetExpanded)}
        role="region"
        aria-label={title}
      >
        {expanded ? (
          <div className={styles.expandedInner}>
            <div className={styles.expandedHeader}>
              <h3 className={styles.title}>{title}</h3>
              <div className={styles.sheetActions}>
                <button type="button" className={styles.more} onClick={onViewMore}>
                  더보기
                  <span aria-hidden>›</span>
                </button>
                <button
                  type="button"
                  className={styles.collapseBtn}
                  onClick={() => setExpanded(false)}
                  aria-expanded
                  aria-label="추천 패널 접기"
                >
                  <ChevronDown size={20} aria-hidden />
                </button>
              </div>
            </div>
            <div className={styles.sheetScroll}>
              {places.map((place) => {
                const sid = selectedPlace?.id ?? selectedPlace?.contentid
                const isSelected =
                  sid != null &&
                  (place.id === sid ||
                    String(place.contentid) === String(sid))
                return (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    isSelected={isSelected}
                    onSelect={(p) => {
                      onSelectPlace?.(p)
                      setExpanded(false)
                    }}
                  />
                )
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.miniBarWrap}>
        <button
          type="button"
          className={styles.miniInner}
          onClick={() => setExpanded((x) => !x)}
          aria-expanded={expanded}
          aria-controls="reco-sheet"
        >
          <span className={styles.miniLabel}>{title}</span>
          <span className={styles.miniSep} aria-hidden>
            |
          </span>
          <span className={styles.miniChips}>{headline}</span>
          <span className={styles.miniIcon} aria-hidden>
            {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          </span>
        </button>
      </div>
    </>
  )
}
