/**
 * Input.jsx — 아이콘을 겹칠 수 있는 텍스트 입력 컴포넌트
 * - icon prop이 있으면 입력창 왼쪽에 아이콘을 띄우고 좌측 패딩을 넓힘
 * - placeholder 외 나머지 props는 그대로 <input>에 전달
 */
import clsx from 'clsx'
import styles from './Input.module.scss'

export function Input({ className, icon, placeholder, ...rest }) {
  return (
    <div className={clsx(styles.wrap, className)}>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <input className={clsx(styles.input, icon && styles.withIcon)} placeholder={placeholder} {...rest} />
    </div>
  )
}
