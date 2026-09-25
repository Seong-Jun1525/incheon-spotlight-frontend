/**
 * QuickMenuButton.jsx — 아이콘과 라벨을 세로로 쌓은 퀵메뉴 버튼
 * - icon으로 받은 컴포넌트를 렌더링하고 아이콘 영역은 aria-hidden으로 감춤
 * - 클릭 시 onClick 콜백을 실행
 */
import styles from './QuickMenuButton.module.scss'

export function QuickMenuButton({ icon: Icon, label, onClick }) {
  return (
    <button type="button" className={styles.root} onClick={onClick}>
      <span className={styles.icon} aria-hidden>
        <Icon size={24} strokeWidth={2} />
      </span>
      <span className={styles.label}>{label}</span>
    </button>
  )
}
