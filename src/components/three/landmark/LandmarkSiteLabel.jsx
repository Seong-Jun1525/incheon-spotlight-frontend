/**
 * LandmarkSiteLabel.jsx — 랜드마크 명칭·코스 순번 칩
 * - drei Html 로 맵 위에 HTML 칩을 띄우고 pointer-events 를 꺼 호버를 가로채지 않음
 * - 같은 자리에 겹친 명소는 개수에 따라 부채꼴/원형으로 픽셀 오프셋을 나눠 배치
 */
import { Html } from '@react-three/drei';
import styles from './LandmarkSiteLabel.module.scss';

function clusterChipOffset(clusterIndex, clusterCount) {
  if (clusterCount <= 1) return undefined;

  if (clusterCount === 2) {
    const dx = clusterIndex === 0 ? -24 : 24;
    return { transform: `translate(${dx}px, -14px)` };
  }

  if (clusterCount === 3) {
    const slots = [
      [0, -10],
      [26, 8],
      [-26, 8],
    ];
    const [dx, dy] = slots[clusterIndex] ?? [0, 0];
    return { transform: `translate(${dx}px, ${dy}px)` };
  }

  const angle = (clusterIndex / clusterCount) * Math.PI * 2 - Math.PI / 2;
  const radius = 20 + clusterCount * 4;
  return {
    transform: `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px)`,
  };
}

/**
 * 랜드마크 명칭 칩.
 * 구·군 호버를 가로채지 않도록 pointer-events 없음.
 */
export function LandmarkSiteLabel({
  name,
  order = null,
  clusterIndex = 0,
  clusterCount = 1,
  position = [0, 0, 0.16],
}) {
  const showOrder = order != null && order !== '';
  if (!name && !showOrder) return null;

  const fan = clusterChipOffset(clusterIndex, clusterCount);

  return (
    <Html
      position={position}
      center
      occlude={false}
      style={{ pointerEvents: 'none' }}
      zIndexRange={[14, 0]}
    >
      <div className={styles.chip} style={fan}>
        {showOrder ? <span className={styles.order}>{order}</span> : null}
        {name ? <span className={styles.name}>{name}</span> : null}
      </div>
    </Html>
  );
}
