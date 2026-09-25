/**
 * BottomInfoPanel.jsx — 화면 하단의 관광 소식·공지·날씨 접이식 정보 패널
 * - 미니 스트립 클릭으로 펼치고 접는 open 상태를 내부에서 관리
 * - tourismNews 썸네일(로드 실패 시 플레이스홀더 대체), NoticeList, WeatherSummary를 3열로 배치
 * - 소식/공지 클릭을 onNewsClick·onNoticeClick으로 상위에 전달
 */
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { NoticeList } from '../molecules/NoticeList'
import { WeatherSummary } from '../molecules/WeatherSummary'
import styles from './BottomInfoPanel.module.scss'

function NewsBlock({ item }) {
  const [err, setErr] = useState(false)
  return (
    <div className={styles.news}>
      <h3 className={styles.subTitle}>인천 관광 소식</h3>
      <div className={styles.newsRow}>
        {err || !item.imageUrl ? (
          <div className={styles.thumbPlaceholder} aria-hidden />
        ) : (
          <img
            className={styles.thumb}
            src={item.imageUrl}
            alt=""
            onError={() => setErr(true)}
            loading="lazy"
          />
        )}
        <div className={styles.newsText}>
          <p className={styles.headline}>{item.title}</p>
          <p className={styles.lead}>{item.desc}</p>
        </div>
      </div>
    </div>
  )
}

export function BottomInfoPanel({
  tourismNews,
  noticeItems,
  weather,
  onNoticeClick,
  onNewsClick,
  defaultCollapsed = true,
}) {
  const [open, setOpen] = useState(!defaultCollapsed)

  return (
    <footer className={styles.shell}>
      {!open ? (
        <button
          type="button"
          className={styles.miniStrip}
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="bottom-info-expand"
          aria-label="관광 소식, 공지, 날씨 정보 펼치기"
        >
          <span>관광 소식 · 공지 · 날씨</span>
          <ChevronDown size={16} className={styles.miniIcon} aria-hidden />
        </button>
      ) : null}
      <div
        id="bottom-info-expand"
        aria-hidden={!open}
        role="region"
        aria-labelledby="bottom-info-heading"
      >
        {open ? (
          <>
            <div className={styles.stripHead}>
              <span id="bottom-info-heading" className={styles.stripTitle}>알림 &amp; 정보</span>
              <button
                type="button"
                className={styles.miniStripShrink}
                onClick={() => setOpen(false)}
                aria-label="패널 접기"
              >
                접기 <ChevronUp size={16} aria-hidden />
              </button>
            </div>
            <div className={styles.root}>
              <div className={styles.col}>
                <button type="button" className={styles.newsButton} onClick={onNewsClick}>
                  <NewsBlock item={tourismNews} />
                </button>
              </div>
              <div className={styles.col}>
                <NoticeList items={noticeItems} onItemClick={onNoticeClick} />
              </div>
              <div className={styles.col}>
                <WeatherSummary
                  title="인천 날씨"
                  temp={weather.temp}
                  label={weather.label}
                  fineDust={weather.fineDust}
                />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </footer>
  )
}
