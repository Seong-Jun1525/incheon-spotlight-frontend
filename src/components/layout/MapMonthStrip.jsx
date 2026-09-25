/**
 * MapMonthStrip.jsx — 지도 상단의 월 선택 스트립
 * - months 배열을 월 칩 listbox로 렌더링하고 onSelect로 연·월을 상위에 전달
 * - 선택된 칩이 스크롤러 가운데로 오도록 scrollLeft를 보정
 * - 연도가 바뀌는 지점에 연도 구분 마크와 해당 월 행사 수를 함께 표시
 */
import { Fragment, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import clsx from 'clsx';
import { formatYearMonth, isSameYearMonth } from '../../utils/mapCalendar';
import styles from './MapMonthStrip.module.scss';

/**
 * 맵 상단 월 선택. 날씨 배지와 한 줄로 두고, 지도·추천 코스를 가리지 않습니다.
 */
export function MapMonthStrip({
  months = [],
  year,
  month,
  eventCount = null,
  onSelect,
}) {
  const { t } = useTranslation();
  const scrollerRef = useRef(null);
  const selected = { year, month };
  const thisMonth = months[0] ?? null;

  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = scroller?.querySelector('[aria-selected="true"]');
    if (!scroller || !active) return;
    const scrollerBox = scroller.getBoundingClientRect();
    const activeBox = active.getBoundingClientRect();
    scroller.scrollLeft += (
      activeBox.left + activeBox.width / 2
      - (scrollerBox.left + scrollerBox.width / 2)
    );
  }, [year, month]);

  return (
    <div className={styles.bar}>
      <p className={styles.label} id='map-month-strip-label'>
        <CalendarDays size={15} strokeWidth={1.8} aria-hidden />
        <span>{t('calendar.stripLabel')}</span>
        {eventCount != null ? (
          <em>{t('explore.eventCount', { count: eventCount })}</em>
        ) : null}
      </p>
      <div
        ref={scrollerRef}
        className={styles.scroller}
        role='listbox'
        aria-labelledby='map-month-strip-label'
      >
        {months.map((item, index) => {
          const active = isSameYearMonth(item, selected);
          const current = thisMonth && isSameYearMonth(item, thisMonth);
          const prev = months[index - 1];
          const yearBreak = Boolean(prev && prev.year !== item.year);
          return (
            <Fragment key={formatYearMonth(item.year, item.month)}>
              {yearBreak ? (
                <span className={styles.yearMark}>{item.year}</span>
              ) : null}
              <button
                type='button'
                role='option'
                aria-selected={active}
                aria-current={current ? 'date' : undefined}
                className={clsx(styles.chip, active && styles.active)}
                onClick={() => onSelect?.(item.year, item.month)}
              >
                {t('calendar.monthChip', { month: item.month })}
              </button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
