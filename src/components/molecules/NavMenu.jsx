/**
 * NavMenu.jsx — items 배열을 받아 렌더링하는 가로 내비게이션 메뉴
 * - activeId와 일치하는 항목에 활성 스타일을 주고 클릭 시 onItemClick(id)을 호출
 * - 라벨은 `nav.{id}` 번역 키로 조회하며 없으면 item.label을 사용
 */
import { useTranslation } from 'react-i18next';
import clsx from 'clsx'
import styles from './NavMenu.module.scss'

export function NavMenu({ items, activeId, onItemClick, className }) {
  const { t } = useTranslation();
  return (
    <nav className={clsx(styles.root, className)} aria-label={t('nav.menu')}>
      <ul className={styles.list}>
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <li key={item.id} className={styles.item}>
              <button
                type="button"
                className={clsx(styles.btn, active && styles.active)}
                onClick={() => onItemClick?.(item.id)}
              >
                {t(`nav.${item.id}`, { defaultValue: item.label })}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
