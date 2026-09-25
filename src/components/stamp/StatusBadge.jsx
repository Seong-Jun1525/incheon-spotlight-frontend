/**
 * StatusBadge.jsx — 방문 인증·스탬프 상태를 색으로 구분하는 뱃지
 * - status 코드를 visitStatusLabel로 한글 라벨화하고 approvedPublic이면 '방문 인증' 톤 사용
 * - 톤별 CSS 클래스로 확인 중/완료/반려 상태를 구분
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { visitStatusLabel } from '../../utils/stampStatus';
import styles from './StatusBadge.module.scss';

export function StatusBadge({ status, approvedPublic = false, label: customLabel }) {
  useUiLanguage();
  const label = customLabel || (approvedPublic ? '방문 인증' : visitStatusLabel(status) || status);
  const tone = approvedPublic ? 'approved' : (status || '').toLowerCase();
  return (
    <span className={`${styles.badge} ${styles[tone] || styles.none}`}>
      <span className={styles.mark} aria-hidden='true' />
      {uiText(label)}
    </span>
  );
}
