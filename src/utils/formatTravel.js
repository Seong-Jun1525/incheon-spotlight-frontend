/**
 * formatTravel.js — 여행 경로의 소요 시간·비용을 현재 언어에 맞춰 표기
 * - formatTravelDuration(seconds): 초를 분/시간으로 반올림해 i18n duration 키로 변환, 값이 없거나 음수면 '-'
 * - formatWon(value): 현재 로케일의 Intl.NumberFormat으로 원화(KRW) 금액 표기
 */
import i18n from '../i18n/index.js';
import { getLocale } from '../i18n/languages.js';

export function formatTravelDuration(seconds) {
  if (seconds == null || seconds === '' || !Number.isFinite(Number(seconds)) || Number(seconds) < 0) return '-';
  const minutes = Math.max(1, Math.round(Number(seconds) / 60));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return i18n.t('duration.minutes', { count: minutes });
  return rest
    ? i18n.t('duration.hoursMinutes', { hours, minutes: rest })
    : i18n.t('duration.hours', { count: hours });
}

export function formatWon(value) {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return i18n.t('money.unknown');
  return new Intl.NumberFormat(getLocale(i18n.resolvedLanguage), {
    style: 'currency', currency: 'KRW', maximumFractionDigits: 0,
  }).format(Number(value));
}
