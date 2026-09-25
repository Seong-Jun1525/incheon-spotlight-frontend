/**
 * WeatherBadge.jsx — 지도 위에 띄우는 미니 날씨 배지
 * - title·temp·label·fineDust props를 받아 온도·하늘상태·미세먼지를 한 줄로 표시
 * - 하늘상태 문구를 정규식으로 판별해 lucide 날씨 아이콘을 선택
 * - role='status'와 aria-label로 날씨 변화를 스크린리더에 알림
 */
import { useTranslation } from 'react-i18next';
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, Sun } from 'lucide-react';
import styles from './WeatherBadge.module.scss';

function WeatherIcon({ label = '' }) {
  const text = String(label);
  const iconProps = { size: 16, strokeWidth: 1.8 };
  if (/천둥|뇌우|번개/.test(text)) return <CloudLightning {...iconProps} />;
  if (/눈|적설/.test(text)) return <CloudSnow {...iconProps} />;
  if (/비|소나기|강수/.test(text)) return <CloudRain {...iconProps} />;
  if (/안개|박무|연무/.test(text)) return <CloudFog {...iconProps} />;
  if (/흐림|구름|구름많|구름조금|흐린/.test(text)) {
    return <Cloud {...iconProps} />;
  }
  return <Sun {...iconProps} />;
}

/**
 * 지도 위 미니 날씨 배지 — 온도 · 하늘상태 · 미세먼지
 */
export function WeatherBadge({
  title = '인천',
  temp,
  label,
  fineDust,
}) {
  const { t } = useTranslation();
  const displayTitle = title === '인천' ? t('weather.incheon') : title;
  const displayLabel = label ? t(`weather.${String(label).replace(/\s+/g, '')}`, { defaultValue: label }) : '';
  const displayDust = fineDust ? t(`weather.${String(fineDust).replace(/\s+/g, '')}`, { defaultValue: fineDust }) : '';
  if (!temp && !label) return null;

  return (
    <div
      className={styles.badge}
      role='status'
      aria-label={[t('weather.label', { name: displayTitle }), temp, displayLabel, displayDust && `${t('weather.dust')} ${displayDust}`].filter(Boolean).join(' ')}
    >
      <span className={styles.icon} aria-hidden>
        <WeatherIcon label={label} />
      </span>
      <span className={styles.body}>
        <strong>{displayTitle}</strong>
        <span className={styles.temp}>{temp}</span>
        {label ? <span className={styles.label}>{displayLabel}</span> : null}
        {fineDust ? (
          <span className={styles.dust}>{t('weather.dust')}<em>{displayDust}</em>
          </span>
        ) : null}
      </span>
    </div>
  );
}
