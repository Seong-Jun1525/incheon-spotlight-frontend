/**
 * formatDate.js — i18n 언어 설정을 따르는 날짜·진행률 표기
 * - formatDateTime·formatDate: 날짜 값을 현재 로케일의 medium 형식으로 변환하고, 파싱에 실패하면 원본 문자열 반환
 * - progressPercent(current, total): 0~100 사이 정수 퍼센트 계산
 */
import i18n from '../i18n/index.js';
import { getLocale } from '../i18n/languages.js';

export function getDisplayLocale() {
  return getLocale(i18n.resolvedLanguage);
}

export function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(getDisplayLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(getDisplayLocale(), { dateStyle: 'medium' }).format(date);
}

export function progressPercent(current, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}
