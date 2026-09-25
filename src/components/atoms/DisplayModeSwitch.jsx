/**
 * DisplayModeSwitch.jsx — 라이트/다크/시스템 표시 모드 전환 스위치
 * - useColorModeStore의 preference를 radiogroup 버튼으로 바꾸고 현재 적용값(resolved)을 안내
 * - compact면 좁은 레이아웃을 쓰고, 각 옵션은 i18n display.* 라벨·설명을 사용
 */
import { useTranslation } from 'react-i18next';
import { useId } from 'react';
import { Moon, Monitor, Sun } from 'lucide-react';
import { COLOR_MODE_OPTIONS } from '../../constants/colorMode';
import { useColorModeStore } from '../../stores/useColorModeStore';
import styles from './DisplayModeSwitch.module.scss';

const ICONS = {
  light: Sun,
  'high-contrast': Moon,
  system: Monitor,
};

export function DisplayModeSwitch({ compact = false }) {
  const { t } = useTranslation();
  const preference = useColorModeStore((state) => state.preference);
  const setPreference = useColorModeStore((state) => state.setPreference);
  const resolved = useColorModeStore((state) => state.resolved);
  const groupId = useId();

  return (
    <div className={compact ? `${styles.root} ${styles.compact}` : styles.root}>
      <p
        className={styles.legend}
        id={`${groupId}-label`}
      >{t('display.legend')}</p>
      <div
        className={styles.group}
        role='radiogroup'
        aria-labelledby={`${groupId}-label`}
        aria-describedby={`${groupId}-status`}
      >
        {COLOR_MODE_OPTIONS.map((option) => {
          const Icon = ICONS[option.value];
          const checked = preference === option.value;
          const label = t(`display.${option.value}`);
          const description = t(`display.${option.value}Description`);

          return (
            <button
              key={option.value}
              type='button'
              role='radio'
              aria-checked={checked}
              aria-label={`${label} (${description})`}
              title={`${label} · ${description}`}
              className={
                checked ? `${styles.option} ${styles.on}` : styles.option
              }
              onClick={() => setPreference(option.value)}
            >
              <Icon
                size={compact ? 15 : 14}
                aria-hidden='true'
                strokeWidth={2.25}
              />
              <span className={styles.label}>{label}</span>
            </button>
          );
        })}
      </div>
      <span
        className={styles.status}
        id={`${groupId}-status`}
        aria-live='polite'
      >
        {resolved === 'dark'
          ? t('display.darkStatus')
          : t('display.lightStatus')}
      </span>
    </div>
  );
}
