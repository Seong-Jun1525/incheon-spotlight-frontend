/**
 * SelectBox.jsx — options 배열을 받는 기본 셀렉트 박스
 * - { value, label } 목록을 <select>로 렌더하고 onChange를 그대로 전달
 * - 외부 className을 wrap에 합쳐 검색 필터 등에서 재사용
 */
import clsx from 'clsx';
import styles from './SelectBox.module.scss';

export function SelectBox({ className, options, value, onChange, name }) {
  return (
    <div className={clsx(styles.wrap, className)}>
      <select
        className={styles.select}
        name={name}
        value={value}
        onChange={onChange}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
