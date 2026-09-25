/**
 * Button.jsx — 공통 텍스트 버튼 컴포넌트
 * - variant(primary/ghost)에 맞는 스타일 클래스를 고르고, 없는 값은 primary로 대체
 * - type과 나머지 props는 그대로 <button>에 전달
 */
import clsx from 'clsx'
import styles from './Button.module.scss'

export function Button({ children, className, variant = 'primary', type = 'button', ...rest }) {
  return (
    <button
      type={type}
      className={clsx(styles.btn, styles[variant] ?? styles.primary, className)}
      {...rest}
    >
      {children}
    </button>
  )
}
