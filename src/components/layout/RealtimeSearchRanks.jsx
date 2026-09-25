/**
 * RealtimeSearchRanks.jsx — 실시간 인기 검색어 순위 위젯
 * - useRealtimeSearchesQuery로 순위 목록을 받아 오고, 오류이거나 항목이 없으면 렌더하지 않음
 * - layout='pills'는 상위 6개 칩, 'list'는 순위 번호가 붙은 전체 목록으로 표시
 * - 키워드 클릭 시 onSelectKeyword로 검색어를 전달
 */
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { useRealtimeSearchesQuery } from '../../hooks/queries/useRealtimeSearchesQuery';
import styles from './RealtimeSearchRanks.module.scss';

export function RealtimeSearchRanks({ onSelectKeyword, layout = 'list' }) {
  const { t } = useTranslation();
  const query = useRealtimeSearchesQuery();
  const items = Array.isArray(query.data?.items) ? query.data.items : [];

  if (query.isError || items.length === 0) {
    return null;
  }

  const windowLabel = t('ranks.window', { count: query.data?.windowHours === 1 ? 1 : 24 });
  const pills = layout === 'pills';

  return (
    <div
      className={clsx(styles.root, pills && styles.rootPills)}
      aria-live='polite'
    >
      <div className={styles.head}>
        <p>
          <TrendingUp size={13} aria-hidden />{t('ranks.title')}</p>
        <span>{windowLabel}</span>
      </div>
      {pills ? (
        <div className={styles.pills} role='list'>
          {items.slice(0, 6).map((item) => (
            <button
              key={`${item.rank}-${item.keyword}`}
              type='button'
              className={styles.pill}
              onClick={() => onSelectKeyword?.(item.keyword)}
            >
              <em>{item.rank}</em>
              {item.keyword}
            </button>
          ))}
        </div>
      ) : (
        <ol className={styles.list}>
          {items.map((item) => (
            <li key={`${item.rank}-${item.keyword}`}>
              <button
                type='button'
                className={styles.item}
                onClick={() => onSelectKeyword?.(item.keyword)}
              >
                <em className={styles[`rank${item.rank}`] ?? styles.rank}>{item.rank}</em>
                <span>{item.keyword}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
