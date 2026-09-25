/**
 * RightToolbar.jsx — 지도 우측 세로 컨트롤 툴바
 * - 전체 보기·확대·축소·실제 지도 버튼을 렌더링하고 클릭 시 onAction(id)을 호출
 * - role='toolbar'와 버튼별 aria-label/title을 i18n 문구로 제공
 */
import { useTranslation } from 'react-i18next';
import { Expand, Map, Minus, Plus } from 'lucide-react';
import styles from './RightToolbar.module.scss';

const controls = [
  { id: 'reset', label: '전체 보기', Icon: Expand },
  { id: 'zoomIn', label: '확대', Icon: Plus },
  { id: 'zoomOut', label: '축소', Icon: Minus },
  { id: 'mapView', label: '실제 지도', Icon: Map },
];

export function RightToolbar({ onAction }) {
  const { t } = useTranslation();
  return (
    <div className={styles.toolbar} role='toolbar' aria-label={t('map.controls')}>
      {controls.map(({ id, label, Icon }) => (
        <button
          key={id}
          type='button'
          aria-label={t(`map.${id}`, { defaultValue: label })}
          title={t(`map.${id}`, { defaultValue: label })}
          onClick={() => onAction(id)}
        >
          <Icon size={18} aria-hidden />
        </button>
      ))}
    </div>
  );
}
