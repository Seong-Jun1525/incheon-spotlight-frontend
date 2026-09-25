/**
 * QuickMenuPanel.jsx — 테마·여행·즐겨찾기·안내 바로가기를 모은 빠른 메뉴 패널
 * - 정적 buttons 배열을 QuickMenuButton 2x2 그리드로 렌더링
 * - 버튼 클릭 시 onAction(id)로 실제 동작을 상위에 위임
 */
import { Briefcase, Compass, Info, Star } from 'lucide-react'
import { QuickMenuButton } from '../molecules/QuickMenuButton'
import styles from './QuickMenuPanel.module.scss'

const buttons = [
  { id: 'theme', label: '테마 추천', Icon: Compass },
  { id: 'trip', label: '나의 여행', Icon: Briefcase },
  { id: 'fav', label: '즐겨찾기', Icon: Star },
  { id: 'guide', label: '인천 안내', Icon: Info },
]

export function QuickMenuPanel({ onAction }) {
  return (
    <section className={styles.root} aria-labelledby="quick-heading">
      <h2 className={styles.heading} id="quick-heading">
        빠른 메뉴
      </h2>
      <div className={styles.grid}>
        {buttons.map((b) => (
          <QuickMenuButton
            key={b.id}
            label={b.label}
            icon={b.Icon}
            onClick={() => onAction?.(b.id)}
          />
        ))}
      </div>
    </section>
  )
}
