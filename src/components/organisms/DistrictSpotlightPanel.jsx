/**
 * DistrictSpotlightPanel.jsx — 선택한 인천 구·군의 대표 명소 목록을 보여주는 우측 슬라이드 패널
 * - open prop으로 열림 클래스와 aria-hidden을 토글
 * - places를 버튼 목록으로 렌더링하고 selectedPlaceId와 일치하면 활성 스타일 적용
 * - 목록이 비면 안내 문구를 노출하고, 선택은 onSelectPlace로 위임
 */
import { X } from 'lucide-react'
import clsx from 'clsx'
import { IconButton } from '../atoms/IconButton'
import styles from './DistrictSpotlightPanel.module.scss'

/**
 * 선택된 구·군 우측 상세 패널 (목록에서 명소 선택)
 */
export function DistrictSpotlightPanel({
  open,
  title,
  places,
  selectedPlaceId,
  onSelectPlace,
  onClose,
}) {
  return (
    <aside
      className={clsx(styles.root, open && styles.open)}
      aria-hidden={!open}
      aria-labelledby="district-panel-title"
    >
      <div className={styles.inner}>
        <div className={styles.head}>
          <h2 id="district-panel-title" className={styles.title}>
            {title}
          </h2>
          <IconButton
            aria-label="패널 닫기"
            onClick={onClose}
            className={styles.close}
          >
            <X size={18} aria-hidden />
          </IconButton>
        </div>
        <p className={styles.lead}>대표 명소를 선택하면 상세 정보를 볼 수 있어요.</p>
        <ul className={styles.list}>
          {places.length === 0 ? (
            <li className={styles.empty}>
              아직 소개할 장소가 없어요. 지도에서 다른 동네를 둘러보세요.
            </li>
          ) : (
            places.map((p) => {
              const pid = p.id ?? p.contentid
              const active = selectedPlaceId != null && String(selectedPlaceId) === String(pid)
              return (
                <li key={pid}>
                  <button
                    type="button"
                    className={clsx(styles.placeBtn, active && styles.active)}
                    onClick={() => onSelectPlace?.(p)}
                  >
                    <span className={styles.placeName}>{p.title || p.name}</span>
                    <span className={styles.placeCat}>{p.category}</span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </aside>
  )
}
