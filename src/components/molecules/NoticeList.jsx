/**
 * NoticeList.jsx — 공지사항 목록 카드
 * - items의 text·date를 버튼 행으로 렌더링하고 date는 time 태그로 표기
 * - 행 클릭 시 해당 item을 onItemClick 콜백으로 전달
 */
import styles from './NoticeList.module.scss'

export function NoticeList({ title = '공지사항', items, onItemClick }) {
  return (
    <div className={styles.root}>
      <h3 className={styles.title}>{title}</h3>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.row}>
            <button
              type="button"
              className={styles.btn}
              onClick={() => {
                onItemClick?.(item)
              }}
            >
              <span className={styles.text}>{item.text}</span>
              <time className={styles.date} dateTime={item.date}>
                {item.date}
              </time>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
