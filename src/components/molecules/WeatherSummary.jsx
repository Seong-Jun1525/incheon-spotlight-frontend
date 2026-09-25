/**
 * WeatherSummary.jsx — 날씨 요약 카드
 * - title·temp·label·fineDust props를 받아 제목, 온도, 하늘상태, 미세먼지를 표시
 * - 좌측에 태양 아이콘, 우측에 텍스트 데이터를 두는 2단 레이아웃
 */
import { Sun } from 'lucide-react'
import styles from './WeatherSummary.module.scss'

export function WeatherSummary({ title = '인천 날씨', temp, label, fineDust }) {
  return (
    <div className={styles.root}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden>
          <Sun size={36} strokeWidth={1.5} className={styles.sun} />
        </div>
        <div className={styles.data}>
          <div className={styles.temp}>{temp}</div>
          <div className={styles.sub}>{label}</div>
          <div className={styles.fine}>
            <span>미세먼지</span> <strong>{fineDust}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
