/**
 * RecommendedPlacePanel.jsx — 추천 명소를 가로 스크롤 카드로 나열하는 섹션
 * - places를 PlaceCard로 렌더링하고 selectedPlace와 id/contentid를 비교해 선택 상태 표시
 * - 카드 선택은 onSelectPlace, 헤더의 더보기 버튼은 onViewMore로 연결
 */
import { PlaceCard } from '../molecules/PlaceCard'
import styles from './RecommendedPlacePanel.module.scss'

export function RecommendedPlacePanel({ title = "오늘의 추천 명소", places, selectedPlace, onSelectPlace, onViewMore }) {
  return (
    <section className={styles.root} aria-labelledby="rec-heading">
      <div className={styles.header}>
        <h2 className={styles.heading} id="rec-heading">
          {title}
        </h2>
        <button type="button" className={styles.more} onClick={onViewMore}>
          더보기 <span aria-hidden>&gt;</span>
        </button>
      </div>
      <div className={styles.scroll}>
        {places.map((place) => {
          const selectedId = selectedPlace?.id ?? selectedPlace?.contentid
          const isSelected = selectedId != null && (place.id === selectedId || String(place.contentid) === String(selectedId))
          return <PlaceCard key={place.id} place={place} isSelected={isSelected} onSelect={onSelectPlace} />
        })}
      </div>
    </section>
  )
}
