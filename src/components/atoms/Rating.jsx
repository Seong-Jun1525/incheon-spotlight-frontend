/**
 * Rating.jsx — 별점 수치를 한 줄로 보여주는 컴포넌트
 * - value를 소수 첫째 자리로 포맷하고 max 기준 "n/m점" 툴팁을 제공
 * - 별 문자는 aria-hidden으로 감춰 스크린리더 중복 낭독을 막음
 */
import styles from './Rating.module.scss'

export function Rating({ value, className, max = 5 }) {
  return (
    <span className={`${styles.root} ${className ?? ''}`} title={`${value}/${max}점`}>
      <span className={styles.star} aria-hidden>
        ★
      </span>
      <span className={styles.value}>{value.toFixed(1)}</span>
    </span>
  )
}
