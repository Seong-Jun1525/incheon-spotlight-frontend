/**
 * FloatingQuickMenu.jsx — 화면에 떠 있는 원형 아이콘 빠른 메뉴
 * - 테마·여행·즐겨찾기·안내 4개 항목을 IconButton 원형 버튼으로 렌더링
 * - 호버 시 항목 라벨을 툴팁처럼 노출하고, 클릭하면 onAction(id)로 전달
 */
import { Briefcase, Compass, Info, Star } from 'lucide-react'
import clsx from 'clsx'
import { IconButton } from '../atoms/IconButton'
import styles from './FloatingQuickMenu.module.scss'

const items = [
  { id: 'theme', title: '테마', aria: '테마 추천', Icon: Compass },
  { id: 'trip', title: '여행', aria: '나의 여행', Icon: Briefcase },
  { id: 'fav', title: '즐겨찾기', aria: '즐겨찾기', Icon: Star },
  { id: 'guide', title: '안내', aria: '인천 안내', Icon: Info },
]

export function FloatingQuickMenu({ onAction }) {
  return (
    <nav className={styles.root} aria-label="빠른 메뉴">
      {items.map(({ id, title, aria, Icon }) => (
        <IconButton
          key={id}
          aria-label={aria}
          title={title}
          onClick={() => onAction?.(id)}
          className={clsx(styles.circle)}
        >
          <span className={styles.ring}>
            <Icon size={17} strokeWidth={2} />
            <span className={styles.label}>{title}</span>
          </span>
        </IconButton>
      ))}
    </nav>
  )
}
