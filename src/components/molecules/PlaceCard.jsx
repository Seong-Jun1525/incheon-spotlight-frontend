/**
 * PlaceCard.jsx — 관광 장소 한 건을 보여주는 카드형 버튼
 * - place의 이름·카테고리(Badge)·평점(Rating)과 대표 이미지를 표시
 * - 이미지 로드 실패 시 placeholder로 대체하고, isSelected면 선택 스타일을 적용
 * - 카드 클릭 시 onSelect(place)로 선택을 전달
 */
import { useState } from 'react'
import { Badge } from '../atoms/Badge'
import { Rating } from '../atoms/Rating'
import styles from './PlaceCard.module.scss'

function PlaceImage({ src, alt }) {
  const [error, setError] = useState(false)
  if (error || !src) {
    return <div className={styles.placeholder} aria-hidden />
  }
  return <img className={styles.img} src={src} alt={alt} onError={() => setError(true)} loading="lazy" />
}

/**
 * @param {object} props
 * @param {{ id: number, name: string, title?: string, category: string, rating: number, imageUrl: string, firstimage?: string }} props.place
 */
export function PlaceCard({ place, onSelect, isSelected = false }) {
  const name = place.title || place.name
  const imageUrl = place.imageUrl || place.firstimage

  return (
    <button
      type="button"
      className={`${styles.root} ${isSelected ? styles.selected : ''}`}
      onClick={() => onSelect?.(place)}
    >
      <PlaceImage src={imageUrl} alt="" />
      <div className={styles.body}>
        <h3 className={styles.name}>{name}</h3>
        <div className={styles.meta}>
          <Badge>{place.category}</Badge>
          <Rating value={place.rating} />
        </div>
      </div>
    </button>
  )
}
