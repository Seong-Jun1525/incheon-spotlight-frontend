/**
 * FloatingMapControls.jsx — 지도 위에 떠 있는 아이콘 컨트롤 모음
 * - 중앙 정렬·나침반·확대·축소·2D/3D 전환 IconButton을 세로로 쌓아 렌더링
 * - 버튼 클릭 시 해당 액션 id를 onAction 콜백으로 전달
 */
import { Compass, ZoomIn, ZoomOut, Crosshair, Box } from 'lucide-react'
import { IconButton } from '../atoms/IconButton'
import styles from './FloatingMapControls.module.scss'

const actions = [
  { id: 'recenter', label: '뷰 중앙으로', Icon: Crosshair },
  { id: 'compass', label: '방향(나침반)', Icon: Compass },
  { id: 'zoomIn', label: '확대', Icon: ZoomIn },
  { id: 'zoomOut', label: '축소', Icon: ZoomOut },
  { id: 'toggle2d3d', label: '지도 보기 전환', Icon: Box },
]

export function FloatingMapControls({ onAction }) {
  return (
    <div className={styles.root}>
      <div className={styles.stack}>
        {actions.map(({ id, label, Icon }) => (
          <IconButton
            key={id}
            aria-label={label}
            onClick={() => onAction?.(id)}
            className={styles.btn}
          >
            <Icon size={18} />
          </IconButton>
        ))}
      </div>
    </div>
  )
}
