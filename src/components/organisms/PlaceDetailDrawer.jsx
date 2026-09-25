/**
 * PlaceDetailDrawer.jsx — 선택한 명소 정보를 보여주는 바텀시트형 상세 패널
 * - place가 없으면 렌더링하지 않고, 배경·닫기 버튼으로 onClose 호출
 * - 대표 이미지, 요약, 주소, 추천 이유, 주변 맛집 목록을 조건부로 표시
 * - 길찾기 버튼으로 onDirections(place)를 실행
 */
import { MapPin, X } from 'lucide-react'
import { IconButton } from '../atoms/IconButton'
import styles from './PlaceDetailDrawer.module.scss'

/**
 * 선택된 명소 상세 패널
 */
export function PlaceDetailDrawer({ place, onClose, onDirections }) {
  if (!place) return null

  const name = place.title || place.name
  const img = place.imageUrl || place.firstimage

  return (
    <>
      <button type="button" className={styles.backdrop} onClick={onClose} aria-label="상세 패널 닫기" />
      <aside
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-drawer-title"
      >
        <div className={styles.sheetHead}>
          <h2 id="place-drawer-title" className={styles.sheetTitle}>
            명소 정보
          </h2>
          <IconButton aria-label="닫기" onClick={onClose} className={styles.close}>
            <X size={18} aria-hidden />
          </IconButton>
        </div>
        <div className={styles.body}>
          {img ? (
            <img src={img} alt="" className={styles.cover} loading="lazy" />
          ) : (
            <div className={styles.coverPh} aria-hidden />
          )}
          <div className={styles.pad}>
            <h3 className={styles.placeName}>{name}</h3>
            {place.summary ? <p className={styles.summary}>{place.summary}</p> : null}
            {place.address ? (
              <div className={styles.row}>
                <MapPin size={16} className={styles.rowIcon} aria-hidden />
                <span className={styles.addr}>{place.address}</span>
              </div>
            ) : null}
            {place.recommendReason ? (
              <div className={styles.section}>
                <p className={styles.secTitle}>추천 이유</p>
                <p className={styles.secBody}>{place.recommendReason}</p>
              </div>
            ) : null}
            {place.nearbyFood?.length ? (
              <div className={styles.section}>
                <p className={styles.secTitle}>주변 맛집</p>
                <ul className={styles.ul}>
                  {place.nearbyFood.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <button
              type="button"
              className={styles.directions}
              onClick={() =>
                onDirections?.(place)}
            >
              길찾기
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
