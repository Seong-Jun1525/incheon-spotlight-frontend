/**
 * NicknameAvatar.jsx — 닉네임 이니셜 아바타와 기능 제한 안내 배너
 * - NicknameAvatar: nickname 첫 글자를 size에 맞춰 폰트 크기를 계산해 원형으로 렌더링
 * - SchemaNotice: 기능을 쓸 수 없는 상태를 알리는 role='alert' 박스(compact면 본문 생략)
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import styles from './NicknameAvatar.module.scss';
export function NicknameAvatar({ nickname = '', size = 40 }) {
  useUiLanguage();
  const initial = (nickname || '?').trim().slice(0, 1) || '?';
  return <span className={styles.root} style={{ width: size, height: size, fontSize: Math.max(12, size * 0.42) }} aria-hidden='true'>{uiText(initial)}</span>;
}
export function SchemaNotice({ compact = false }) {
  useUiLanguage();
  return <div className={styles.schema} role='alert'>
    <strong>{uiText("지금은 이 기능을 이용할 수 없어요.")}</strong>
    {!compact && <p>{uiText("잠시 후 다시 시도해 주세요.")}</p>}
  </div>;
}
