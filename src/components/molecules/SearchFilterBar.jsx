/**
 * SearchFilterBar.jsx — 검색 입력과 카테고리 선택을 한 알약에 묶은 필터 바
 * - atoms의 Input·SelectBox를 조합해 검색어/카테고리 변경을 상위 콜백으로 전달
 * - layout='floating'이면 지도 위에 띄우는 플로팅 변형 스타일을 적용
 */
import clsx from 'clsx';
import { Search } from 'lucide-react';
import { Input } from '../atoms/Input';
import { SelectBox } from '../atoms/SelectBox';
import styles from './SearchFilterBar.module.scss';

export function SearchFilterBar({
  searchValue,
  onSearchChange,
  categoryValue,
  onCategoryChange,
  options,
  placeholder = '명소 검색…',
  layout = 'toolbar',
}) {
  const floating = layout === 'floating';

  return (
    <div className={clsx(styles.root, floating && styles.rootFloating)}>
      <div className={clsx(styles.pill, floating && styles.pillFloating)}>
        <Input
          className={styles.search}
          value={searchValue}
          onChange={onSearchChange}
          icon={
            <Search
              size={16}
              strokeWidth={2.25}
            />
          }
          placeholder={placeholder}
          type='search'
          autoComplete='off'
          name='place-search'
        />
        <div
          className={styles.divider}
          aria-hidden
        />
        <SelectBox
          className={clsx(styles.select, floating && styles.selectFloating)}
          options={options}
          value={categoryValue}
          onChange={onCategoryChange}
          name='place-category'
        />
      </div>
    </div>
  );
}
