/**
 * Badge.jsx — 짧은 라벨을 표시하는 배지 컴포넌트
 * - tone(default/muted/accent)으로 색상 변형을 선택하고 알 수 없는 값은 default로 대체
 * - 외부 className을 함께 합성해 배치만 따로 조정할 수 있게 함
 */
import clsx from 'clsx'
import styles from './Badge.module.scss'

export function Badge({ children, className, tone = 'default' }) {
  return <span className={clsx(styles.badge, styles[tone] ?? styles.default, className)}>{children}</span>
}
