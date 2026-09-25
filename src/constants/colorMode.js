/**
 * colorMode.js — 라이트/다크/시스템 색상 모드 설정값과 적용 유틸
 * - 색상 모드 선택지 목록과 localStorage 저장 키 제공
 * - 저장된 설정 읽기·쓰기, 시스템 다크 모드 감지 후 실제 모드로 해석
 * - 해석된 모드를 html 속성·theme-color 메타 태그에 반영
 */

export const COLOR_MODE_STORAGE_KEY = 'incheon-spotlight-color-mode';

export const COLOR_MODE_PREFERENCES = /** @type {const} */ ([
  'light',
  'high-contrast',
  'system',
]);

/** @typedef {'light' | 'high-contrast' | 'system'} ColorModePreference */
/** @typedef {'light' | 'dark'} ResolvedColorMode */

export const COLOR_MODE_OPTIONS = [
  {
    value: 'light',
    label: '기본',
    description: '밝은 배경',
  },
  {
    value: 'high-contrast',
    label: '다크',
    description: '어두운 배경',
  },
  {
    value: 'system',
    label: '시스템',
    description: '기기 설정',
  },
];

export function isColorModePreference(value) {
  return value === 'light' || value === 'high-contrast' || value === 'system';
}

export function readStoredColorModePreference() {
  try {
    const stored = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    if (isColorModePreference(stored)) return stored;
  } catch {
    // private mode / blocked storage
  }
  return 'system';
}

export function persistColorModePreference(preference) {
  try {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, preference);
  } catch {
    // ignore quota / private mode
  }
}

export function systemPrefersDark() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/**
 * @param {ColorModePreference} preference
 * @param {boolean} [systemDark]
 * @returns {ResolvedColorMode}
 */
export function resolveColorMode(preference, systemDark = systemPrefersDark()) {
  if (preference === 'light') return 'light';
  if (preference === 'high-contrast') return 'dark';
  return systemDark ? 'dark' : 'light';
}

/**
 * @param {ResolvedColorMode} resolved
 */
export function applyResolvedColorMode(resolved) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const isDark = resolved === 'dark';

  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  root.setAttribute('data-krds-mode', isDark ? 'high-contrast' : 'light');
  root.style.colorScheme = isDark ? 'dark' : 'light';

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute('content', isDark ? '#121a24' : '#1d56a5');
  }
}
